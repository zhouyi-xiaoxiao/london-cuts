// POST /api/invites/redeem — invite-gated onboarding.
//
// Called once per user, from /onboarding. Body:
//   { handle: string; displayName: string; code: string }
//
// On success: creates a public.users profile row, inserts an
// invite_redemptions audit row, decrements the invite's uses_remaining,
// returns { ok: true, profile }. On any validation failure: returns a
// 4xx with a human-readable error the onboarding form surfaces inline.
//
// Auth: the caller must already be signed in (magic link completed →
// session cookie set). We resolve the auth.uid() via `requireUser()`
// and use it as the FK back to auth.users.
//
// Transactional note: Supabase JS has no native transaction helper, so
// steps 6-8 (insert profile, insert redemption, decrement invite) run
// sequentially. If the process crashes between step 6 and step 8 the
// user ends up with a profile but the invite still counts as unused
// (uses_remaining high). Acceptable for the 30-user beta — owner can
// reconcile manually. See tasks/deferred/M2-auth-and-invites.md §7 PR 3.
//
// All DB writes go through getServerClient() (service_role) because the
// invites + invite_redemptions tables have NO write RLS policy — only
// service_role can mutate them. The profile insert also uses service
// role for consistency so the whole flow is one client.

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { sendOwnerNewSignupEmail } from "@/lib/email";
import { AuthRequiredError } from "@/lib/errors";
import { getServerClient } from "@/lib/supabase";

const HANDLE_RE = /^[a-z0-9-]{2,32}$/;
const DISPLAY_MIN = 2;
const DISPLAY_MAX = 60;

interface RedeemBody {
  handle?: unknown;
  displayName?: unknown;
  code?: unknown;
}

export async function POST(req: Request) {
  // ─── Auth gate ───────────────────────────────────────────────────
  let session;
  try {
    session = await requireUser();
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return NextResponse.json(
        { error: "Sign in first — no active session." },
        { status: 401 },
      );
    }
    throw err;
  }

  // ─── Body parse + normalize ──────────────────────────────────────
  let body: RedeemBody;
  try {
    body = (await req.json()) as RedeemBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const handle =
    typeof body.handle === "string" ? body.handle.trim().toLowerCase() : "";
  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";

  // ─── Shape validation (belt + braces — client also validates) ─────
  if (!HANDLE_RE.test(handle)) {
    return NextResponse.json(
      {
        error:
          "Handle must be 2–32 characters using lowercase letters, digits, or hyphens.",
      },
      { status: 400 },
    );
  }
  if (displayName.length < DISPLAY_MIN || displayName.length > DISPLAY_MAX) {
    return NextResponse.json(
      {
        error: `Display name must be ${DISPLAY_MIN}–${DISPLAY_MAX} characters.`,
      },
      { status: 400 },
    );
  }
  if (!code) {
    return NextResponse.json(
      { error: "Invite code is required." },
      { status: 400 },
    );
  }

  // ─── DB work ─────────────────────────────────────────────────────
  const db = getServerClient();

  // 2. Already onboarded? A user can only redeem one invite (the table
  // has `unique (redeemed_by)`), and we also don't want to re-insert
  // a profile for them.
  const { data: existing, error: existingErr } = await db
    .from("users")
    .select("id, handle, display_name")
    .eq("auth_user_id", session.authUserId)
    .maybeSingle();
  if (existingErr) {
    return NextResponse.json(
      { error: `profile lookup failed: ${existingErr.message}` },
      { status: 500 },
    );
  }
  if (existing) {
    return NextResponse.json(
      {
        error: "You've already completed onboarding.",
        profile: {
          id: existing.id,
          handle: existing.handle,
          displayName: existing.display_name,
        },
      },
      { status: 409 },
    );
  }

  // 4. Look up the invite. Service role bypasses RLS.
  const { data: invite, error: inviteErr } = await db
    .from("invites")
    .select("code, uses_remaining, expires_at")
    .eq("code", code)
    .maybeSingle();
  if (inviteErr) {
    return NextResponse.json(
      { error: `invite lookup failed: ${inviteErr.message}` },
      { status: 500 },
    );
  }
  if (!invite) {
    return NextResponse.json(
      { error: "Invite code not found." },
      { status: 400 },
    );
  }
  if ((invite.uses_remaining as number) <= 0) {
    return NextResponse.json(
      { error: "Invite code has no uses remaining." },
      { status: 400 },
    );
  }
  if (
    invite.expires_at &&
    new Date(invite.expires_at as string).getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: "Invite code has expired." },
      { status: 400 },
    );
  }

  // 5. Handle uniqueness pre-check. There's a race between this SELECT
  // and the INSERT below; the users.handle unique constraint is the
  // real guard — we catch that as 409 "taken" below. The pre-check is
  // just to return a nicer error for the common case.
  const { data: handleTaken, error: handleErr } = await db
    .from("users")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();
  if (handleErr) {
    return NextResponse.json(
      { error: `handle check failed: ${handleErr.message}` },
      { status: 500 },
    );
  }
  if (handleTaken) {
    return NextResponse.json(
      { error: `Handle @${handle} is already taken.` },
      { status: 409 },
    );
  }

  // 6. Insert profile. If two concurrent requests race past the
  // pre-check, one will fail the unique constraint with Postgres
  // error 23505 — we map that back to "taken".
  const { data: inserted, error: insertErr } = await db
    .from("users")
    .insert({
      auth_user_id: session.authUserId,
      handle,
      display_name: displayName,
    })
    .select("id, handle, display_name")
    .single();
  if (insertErr || !inserted) {
    const msg = insertErr?.message ?? "insert failed";
    if (insertErr?.code === "23505") {
      // Unique-violation: either handle collided or the auth_user_id
      // already has a row (concurrent request from the same tab).
      if (msg.includes("handle")) {
        return NextResponse.json(
          { error: `Handle @${handle} is already taken.` },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "You've already completed onboarding." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: `profile create failed: ${msg}` },
      { status: 500 },
    );
  }
  const newUserId = inserted.id as string;

  // 7. Audit-log the redemption. Unique (redeemed_by) — a re-post gets
  // a 23505 we surface as 409.
  const { error: redemptionErr } = await db.from("invite_redemptions").insert({
    code,
    redeemed_by: newUserId,
  });
  if (redemptionErr) {
    if (redemptionErr.code === "23505") {
      return NextResponse.json(
        { error: "You've already redeemed an invite code." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: `redemption log failed: ${redemptionErr.message}` },
      { status: 500 },
    );
  }

  // 8. Decrement uses_remaining. Soft-best-effort: if this fails we
  // still return success (the user is onboarded and has a redemption
  // row). Owner can reconcile the invite counter later.
  const { error: decrementErr } = await db
    .from("invites")
    .update({ uses_remaining: (invite.uses_remaining as number) - 1 })
    .eq("code", code);
  if (decrementErr) {
    // Log-only. Onboarding succeeds either way.
    console.warn(
      `[invites/redeem] decrement failed for code=${code}: ${decrementErr.message}`,
    );
  }

  try {
    const result = await sendOwnerNewSignupEmail({
      email: session.email,
      handle: inserted.handle as string,
      displayName: inserted.display_name as string | null,
      inviteCode: code,
      profileId: newUserId,
    });
    if (result === "skipped") {
      console.warn(
        "[invites/redeem] owner signup notification skipped; set OWNER_NOTIFY_EMAIL and RESEND_API_KEY to enable it",
      );
    }
  } catch (err) {
    // Never fail onboarding because owner notification email failed.
    console.warn(
      `[invites/redeem] owner signup notification failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  return NextResponse.json({
    ok: true,
    profile: {
      id: newUserId,
      handle: inserted.handle as string,
      displayName: inserted.display_name as string | null,
    },
  });
}
