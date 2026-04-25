"use client";

// M2 onboarding page.
//
// User arrives here after clicking the magic link in their email (the
// auth callback routes first-time sign-ins to /onboarding). They pick
// a page-URL, enter their name, and paste their invite code. On submit
// we POST to /api/invites/redeem which creates their public.users row,
// records the redemption, and decrements the invite counter.
//
// Copy + UX designed for non-technical readers. "Handle" / "Display
// name" renamed to "Your page address" / "Your name". Page address
// gets a live URL preview so the user sees exactly what the share link
// will look like. Both fields auto-fill from the signed-in email on
// mount (editable before submit).

import { useEffect, useState } from "react";
import Link from "next/link";

const HANDLE_RE = /^[a-z0-9-]{2,32}$/;
const DISPLAY_MIN = 2;
const DISPLAY_MAX = 60;

type AuthState =
  | { kind: "checking" }
  | { kind: "signed-out" }
  | { kind: "signed-in"; email: string }
  | { kind: "already-onboarded"; handle: string };

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

interface MeResponse {
  user: {
    authUserId: string;
    email: string;
    profile: { id: string; handle: string; displayName: string | null } | null;
  } | null;
}

/** Email → suggested handle. Strips +tags, keeps [a-z0-9-] only,
 *  trims to 32 chars. */
function suggestHandle(email: string): string {
  const local = email.split("@")[0] ?? "";
  const clean = local
    .split("+")[0]
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return clean.length >= 2 ? clean : "";
}

/** Email → suggested display name (Title Case from local part). */
function suggestDisplayName(email: string): string {
  const local = email.split("@")[0] ?? "";
  const clean = local.split("+")[0].replace(/[._-]+/g, " ").trim();
  return clean
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ")
    .slice(0, DISPLAY_MAX);
}

export default function OnboardingPage() {
  const [auth, setAuth] = useState<AuthState>({ kind: "checking" });
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [handleTouched, setHandleTouched] = useState(false);
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  // Check auth + pre-fill from email on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const body = (await res.json()) as MeResponse;
        if (cancelled) return;
        if (!body.user) {
          setAuth({ kind: "signed-out" });
          return;
        }
        if (body.user.profile) {
          setAuth({
            kind: "already-onboarded",
            handle: body.user.profile.handle,
          });
          return;
        }
        setAuth({ kind: "signed-in", email: body.user.email });
        // Pre-fill both fields from email — user can edit.
        setHandle(suggestHandle(body.user.email));
        setDisplayName(suggestDisplayName(body.user.email));
      } catch {
        if (!cancelled) setAuth({ kind: "signed-out" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const h = handle.trim().toLowerCase();
    const d = displayName.trim();
    const c = code.trim();

    if (!HANDLE_RE.test(h)) {
      setState({
        kind: "error",
        message:
          "Your page address can only use lowercase letters, digits, and hyphens (2–32 chars). Try again.",
      });
      return;
    }
    if (d.length < DISPLAY_MIN || d.length > DISPLAY_MAX) {
      setState({
        kind: "error",
        message: `Your name should be ${DISPLAY_MIN}–${DISPLAY_MAX} characters.`,
      });
      return;
    }
    if (!c) {
      setState({
        kind: "error",
        message:
          "Paste the invite code you received. If you don't have one, ask the person who invited you.",
      });
      return;
    }

    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/invites/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle: h, displayName: d, code: c }),
      });
      const body = (await res.json()) as { ok?: true; error?: string };
      if (!res.ok || !body.ok) {
        const raw = body.error ?? "Could not complete setup.";
        // Friendlier remaps for the common 409s from the server.
        const friendly = raw.includes("handle")
          ? "That page address is taken. Try another, or add a number."
          : raw.includes("invite") || raw.includes("code")
            ? "That invite code doesn't work — it might be wrong, used up, or expired."
            : raw;
        setState({ kind: "error", message: friendly });
        return;
      }
      window.location.href = "/studio";
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Request failed.",
      });
    }
  }

  const handleValid = handle ? HANDLE_RE.test(handle) : null;
  const previewUrl =
    handle && handleValid
      ? `london-cuts.vercel.app/@${handle}/…`
      : handle
        ? "(only lowercase letters, digits, hyphens)"
        : "";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        background: "var(--mode-bg, var(--paper))",
        color: "var(--mode-ink, var(--ink))",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 480,
          padding: 36,
          border: "1px solid var(--rule)",
          background: "var(--paper)",
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          London Cuts · Welcome
        </div>
        <h1
          style={{
            fontFamily: "var(--mode-display-font, var(--f-serif))",
            fontSize: "clamp(28px, 5vw, 40px)",
            lineHeight: 1.08,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Set up your travel journal.
        </h1>

        {auth.kind === "checking" && (
          <p
            className="mono-sm"
            style={{
              marginTop: 18,
              fontSize: 11,
              opacity: 0.6,
              textTransform: "none",
              letterSpacing: "0",
            }}
          >
            Checking your session…
          </p>
        )}

        {auth.kind === "signed-out" && (
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>
              Sign in first. We&apos;ll bounce you back here after.
            </p>
            <Link
              href="/sign-in?next=/onboarding"
              className="btn btn-solid"
              style={{
                marginTop: 20,
                display: "inline-flex",
                padding: "12px 18px",
                fontSize: 12,
                letterSpacing: "0.14em",
                justifyContent: "center",
              }}
            >
              Go to sign-in
            </Link>
          </div>
        )}

        {auth.kind === "already-onboarded" && (
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>
              You&apos;re already set up as{" "}
              <strong>@{auth.handle}</strong>.
            </p>
            <Link
              href="/studio"
              className="btn btn-solid"
              style={{
                marginTop: 20,
                display: "inline-flex",
                padding: "12px 18px",
                fontSize: 12,
                letterSpacing: "0.14em",
                justifyContent: "center",
              }}
            >
              Open your studio
            </Link>
          </div>
        )}

        {auth.kind === "signed-in" && (
          <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
            <p
              style={{
                marginTop: 0,
                marginBottom: 22,
                fontSize: 14,
                lineHeight: 1.55,
                opacity: 0.82,
              }}
            >
              Signed in as <strong>{auth.email}</strong>. Just three quick
              things before you start writing.
            </p>

            {/* Field 1 — Your name */}
            <label style={{ display: "block", marginBottom: 22 }}>
              <span
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Your name
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  opacity: 0.62,
                  marginBottom: 8,
                  lineHeight: 1.45,
                }}
              >
                Shown on your published pages, like a byline. Can be
                changed later.
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ana Ishii"
                required
                autoComplete="name"
                disabled={state.kind === "submitting"}
                maxLength={DISPLAY_MAX}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  fontSize: 16,
                  borderBottom: "1px solid var(--rule)",
                  background: "transparent",
                  fontFamily: "var(--f-sans)",
                }}
              />
            </label>

            {/* Field 2 — Your page address */}
            <label style={{ display: "block", marginBottom: 22 }}>
              <span
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Your page address
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  opacity: 0.62,
                  marginBottom: 8,
                  lineHeight: 1.45,
                }}
              >
                The short name that goes in the link when you share a
                trip. Lowercase letters, digits, or hyphens.
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 4,
                  borderBottom: "1px solid var(--rule)",
                  padding: "10px 0",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--f-mono, monospace)",
                    fontSize: 14,
                    opacity: 0.5,
                    whiteSpace: "nowrap",
                  }}
                >
                  @
                </span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => {
                    setHandleTouched(true);
                    setHandle(
                      e.target.value.toLowerCase().replace(/\s+/g, ""),
                    );
                  }}
                  placeholder="ana"
                  required
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  disabled={state.kind === "submitting"}
                  maxLength={32}
                  style={{
                    flex: 1,
                    padding: 0,
                    fontSize: 16,
                    borderBottom: "none",
                    background: "transparent",
                    fontFamily: "var(--f-mono, monospace)",
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  opacity: handleValid === false && handleTouched ? 0.9 : 0.55,
                  color:
                    handleValid === false && handleTouched
                      ? "var(--mode-accent, #b8360a)"
                      : undefined,
                  fontFamily: "var(--f-mono, monospace)",
                  lineHeight: 1.5,
                }}
              >
                {handle
                  ? handleValid
                    ? `Your link: ${previewUrl}`
                    : previewUrl
                  : "Pre-filled from your email — edit if you like."}
              </div>
            </label>

            {/* Field 3 — Invite code */}
            <label style={{ display: "block" }}>
              <span
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Invite code
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  opacity: 0.62,
                  marginBottom: 8,
                  lineHeight: 1.45,
                }}
              >
                The code from whoever invited you. Each code is for one
                person — enter it here to activate your account.
              </span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                placeholder="e.g. ana-beta-001"
                required
                autoComplete="off"
                spellCheck={false}
                disabled={state.kind === "submitting"}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  fontSize: 16,
                  borderBottom: "1px solid var(--rule)",
                  background: "transparent",
                  fontFamily: "var(--f-mono, monospace)",
                }}
              />
            </label>

            <button
              type="submit"
              className="btn btn-solid"
              disabled={
                state.kind === "submitting" || !handle || !displayName || !code
              }
              style={{
                marginTop: 28,
                width: "100%",
                padding: "14px 18px",
                fontSize: 12,
                letterSpacing: "0.14em",
                justifyContent: "center",
              }}
            >
              {state.kind === "submitting" ? "Setting up…" : "Start writing"}
            </button>

            {state.kind === "error" && (
              <div
                role="alert"
                style={{
                  marginTop: 16,
                  padding: "10px 12px",
                  background: "var(--mode-accent, #b8360a)",
                  color: "var(--paper)",
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                {state.message}
              </div>
            )}

            <p
              style={{
                marginTop: 20,
                fontSize: 11,
                opacity: 0.5,
                lineHeight: 1.5,
              }}
            >
              None of this is public yet. You control what gets shared
              when you publish a trip.
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
