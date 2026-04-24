"use client";

// M2 sign-in page. Magic-link only — no password, no OAuth.
//
// User enters email → POST /api/auth/send-magic-link → "Check your
// email" confirmation. Click the link in email → /auth/callback →
// /onboarding or /studio depending on whether this is first login.
//
// This page is PUBLIC so invitees can reach it from their welcome
// message. M2 auth is the studio gate; the old preview-password gate
// has been retired.

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, next: "/studio" }),
      });
      const body = (await res.json()) as {
        ok?: true;
        error?: string;
        code?: string;
      };
      if (!res.ok || !body.ok) {
        setState({
          kind: "error",
          message:
            body.code === "email_rate_limited"
              ? "Email sending is temporarily limited. Wait a little, then request a new magic link."
              : (body.error ?? "could not send magic link"),
        });
        return;
      }
      setState({ kind: "sent", email });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "request failed",
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
          maxWidth: 420,
          padding: 36,
          border: "1px solid var(--rule)",
          background: "var(--paper)",
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          London Cuts · Sign in
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
          {state.kind === "sent" ? "Check your email." : "Sign in with email."}
        </h1>

        {state.kind === "sent" ? (
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>
              We sent a one-time link to{" "}
              <strong>{state.email}</strong>. Click the link in your inbox
              to finish signing in.
            </p>
            <p
              className="mono-sm"
              style={{
                marginTop: 16,
                opacity: 0.62,
                fontSize: 11,
                lineHeight: 1.6,
                textTransform: "none",
                letterSpacing: "0",
              }}
            >
              Nothing in your inbox after a minute? Check spam, or try a
              different address below.
            </p>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setState({ kind: "idle" })}
              style={{ marginTop: 16 }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ marginTop: 18 }}>
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
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                autoComplete="email"
                disabled={state.kind === "sending"}
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
            <button
              type="submit"
              className="btn btn-solid"
              disabled={state.kind === "sending" || !email}
              style={{
                marginTop: 20,
                width: "100%",
                padding: "12px 18px",
                fontSize: 12,
                letterSpacing: "0.14em",
                justifyContent: "center",
              }}
            >
              {state.kind === "sending" ? "Sending…" : "Send magic link"}
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
            <p
              className="mono-sm"
              style={{
                marginTop: 18,
                opacity: 0.55,
                fontSize: 10,
                lineHeight: 1.6,
                letterSpacing: "0.04em",
                textTransform: "none",
              }}
            >
              No password to remember. We&apos;ll email you a link to sign
              in. First-time sign-ins need an invite code from the project
              owner.
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
