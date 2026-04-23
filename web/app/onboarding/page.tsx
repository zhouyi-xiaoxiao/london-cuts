"use client";

// M2 onboarding page.
//
// User arrives here after clicking the magic link in their email (the
// auth callback routes first-time sign-ins to /onboarding). They pick
// a handle, enter a display name, and paste their invite code. On
// submit we POST to /api/invites/redeem which:
//   1. creates their public.users row
//   2. records the redemption
//   3. decrements the invite counter
//
// On success we hard-redirect to /studio. Soft client-side router
// navigation would race the fresh session cookie; a full reload lets
// the middleware + studio-level requireUser re-read the session cleanly.
//
// If the visitor is NOT signed in we show a sign-in CTA instead of the
// form — we detect this via GET /api/me on mount.
//
// Visual: mirrors /sign-in — centered card, eyebrow, big serif h1,
// labeled inputs stacked, solid submit button.

import { useEffect, useState } from "react";

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

export default function OnboardingPage() {
  const [auth, setAuth] = useState<AuthState>({ kind: "checking" });
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  // Check auth on mount.
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
    // Normalize client-side (server re-normalizes — belt + braces).
    const h = handle.trim().toLowerCase();
    const d = displayName.trim();
    const c = code.trim();

    if (!HANDLE_RE.test(h)) {
      setState({
        kind: "error",
        message:
          "Handle must be 2–32 characters using lowercase letters, digits, or hyphens.",
      });
      return;
    }
    if (d.length < DISPLAY_MIN || d.length > DISPLAY_MAX) {
      setState({
        kind: "error",
        message: `Display name must be ${DISPLAY_MIN}–${DISPLAY_MAX} characters.`,
      });
      return;
    }
    if (!c) {
      setState({ kind: "error", message: "Invite code is required." });
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
        setState({
          kind: "error",
          message: body.error ?? "Could not complete onboarding.",
        });
        return;
      }
      // Success — hard reload so the session + new profile propagate.
      window.location.href = "/studio";
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Request failed.",
      });
    }
  }

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
          maxWidth: 460,
          padding: 36,
          border: "1px solid var(--rule)",
          background: "var(--paper)",
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          London Cuts · Finish signing in
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
          Pick a handle.
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
              Sign in first. You&apos;ll be bounced back here after the magic
              link completes.
            </p>
            <a
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
            </a>
          </div>
        )}

        {auth.kind === "already-onboarded" && (
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>
              You&apos;re already signed in as{" "}
              <strong>@{auth.handle}</strong>.
            </p>
            <a
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
              Go to the studio
            </a>
          </div>
        )}

        {auth.kind === "signed-in" && (
          <form onSubmit={onSubmit} style={{ marginTop: 18 }}>
            <p
              className="mono-sm"
              style={{
                marginTop: 0,
                marginBottom: 20,
                fontSize: 11,
                lineHeight: 1.6,
                opacity: 0.62,
                textTransform: "none",
                letterSpacing: "0",
              }}
            >
              Signed in as <strong>{auth.email}</strong>. Pick a public handle
              (appears in your share URLs, e.g. <code>/@you/trip-slug</code>)
              and paste your invite code.
            </p>

            <label style={{ display: "block", marginBottom: 18 }}>
              <span
                className="mono-sm"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  opacity: 0.62,
                }}
              >
                Handle
              </span>
              <input
                type="text"
                value={handle}
                onChange={(e) =>
                  setHandle(e.target.value.toLowerCase().replace(/\s+/g, ""))
                }
                placeholder="your-handle"
                required
                autoFocus
                autoComplete="off"
                spellCheck={false}
                disabled={state.kind === "submitting"}
                maxLength={32}
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "10px 0",
                  fontSize: 16,
                  borderBottom: "1px solid var(--rule)",
                  background: "transparent",
                  fontFamily: "var(--f-mono, monospace)",
                }}
              />
            </label>

            <label style={{ display: "block", marginBottom: 18 }}>
              <span
                className="mono-sm"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  opacity: 0.62,
                }}
              >
                Display name
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                required
                autoComplete="name"
                disabled={state.kind === "submitting"}
                maxLength={DISPLAY_MAX}
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "10px 0",
                  fontSize: 16,
                  borderBottom: "1px solid var(--rule)",
                  background: "transparent",
                  fontFamily: "var(--f-sans)",
                }}
              />
            </label>

            <label style={{ display: "block" }}>
              <span
                className="mono-sm"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  opacity: 0.62,
                }}
              >
                Invite code
              </span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="paste-your-code"
                required
                autoComplete="off"
                spellCheck={false}
                disabled={state.kind === "submitting"}
                style={{
                  marginTop: 8,
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
                marginTop: 24,
                width: "100%",
                padding: "12px 18px",
                fontSize: 12,
                letterSpacing: "0.14em",
                justifyContent: "center",
              }}
            >
              {state.kind === "submitting" ? "Creating…" : "Create my studio"}
            </button>

            {state.kind === "error" && (
              <div
                role="alert"
                className="mono-sm"
                style={{
                  marginTop: 14,
                  padding: "8px 12px",
                  background: "var(--mode-accent, #b8360a)",
                  color: "var(--paper)",
                  fontSize: 11,
                }}
              >
                {state.message}
              </div>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
