"use client";

// M2 auth callback — handles the Supabase magic-link shapes we have used:
//
//  1. token_hash flow (current production email templates): Supabase
//     sends users straight to /auth/callback?next=...&token_hash=...&type=...
//     and we call verifyOtp to create the session cookie.
//
//  2. PKCE flow (kept for old links / local experiments): Supabase
//     redirects us to /auth/callback?code=XYZ. We exchange the code
//     for a session via the browser client.
//
//  3. Implicit / hash flow (admin-generated links via
//     auth.admin.generateLink): Supabase redirects us with
//     the session tokens in the URL FRAGMENT —
//     /auth/callback#access_token=...&refresh_token=...
//     The fragment never reaches the server, so this page parses it
//     in the browser and stores it with setSession.
//
// Either way, once we have a session we check whether the user has a
// profile row (first-time? → /onboarding; returning user? → /studio,
// or whatever ?next= asks for).

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EmailOtpType } from "@supabase/supabase-js";

import { getBrowserClient } from "@/lib/supabase";

type State =
  | { kind: "checking" }
  | { kind: "error"; message: string };

export default function AuthCallbackPage() {
  const [state, setState] = useState<State>({ kind: "checking" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = getBrowserClient();
        const url = new URL(window.location.href);

        // Flow A — token_hash. This is the preferred production email
        // template shape for SSR/cookie auth:
        // /auth/callback?token_hash=...&type=email|signup|magiclink
        // It avoids relying on a PKCE code verifier stored in the
        // browser that requested the email.
        const tokenHash = url.searchParams.get("token_hash");
        const otpType = url.searchParams.get("type");
        if (tokenHash && otpType) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType as EmailOtpType,
          });
          if (error) {
            if (!cancelled) {
              setState({ kind: "error", message: error.message });
            }
            return;
          }
        }

        // Flow B — PKCE. Kept for old links and local experiments.
        const code = url.searchParams.get("code");
        if (!tokenHash && code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            if (!cancelled) {
              setState({
                kind: "error",
                message: error.message.includes("code verifier")
                  ? "This older sign-in link cannot be completed in this browser. Please request a new magic link and open the newest email."
                  : error.message,
              });
            }
            return;
          }
        }

        // Flow C — implicit / hash. Admin-generated magic links
        // (auth.admin.generateLink) return the session in the URL
        // FRAGMENT: `#access_token=...&refresh_token=...`. The
        // `@supabase/ssr` browser client does NOT auto-parse this
        // shape (it targets PKCE), so we pull the tokens out of the
        // hash ourselves and hand them to setSession, which persists
        // into the same cookie store the server reads.
        if (!tokenHash && !code && window.location.hash) {
          const hash = new URLSearchParams(window.location.hash.slice(1));
          const accessToken = hash.get("access_token");
          const refreshToken = hash.get("refresh_token");
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              if (!cancelled) {
                setState({ kind: "error", message: error.message });
              }
              return;
            }
          }
        }

        // Poll briefly for the session to settle into local state.
        let session = null;
        for (let i = 0; i < 10; i++) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            session = data.session;
            break;
          }
          await new Promise((r) => setTimeout(r, 200));
        }

        if (!session) {
          if (!cancelled) {
            setState({
              kind: "error",
              message:
                "Could not establish a session from this link. The code may have expired — try sending a new magic link.",
            });
          }
          return;
        }

        // Has this user got a profile?
        const { data: profile } = await supabase
          .from("users")
          .select("id")
          .eq("auth_user_id", session.user.id)
          .maybeSingle();

        // Whitelist the `next` query param — only allow same-origin
        // paths starting with "/" and not "//" (which would let an
        // attacker redirect off-site).
        const requestedNext = url.searchParams.get("next") ?? "";
        const safeNext =
          requestedNext.startsWith("/") && !requestedNext.startsWith("//")
            ? requestedNext
            : null;

        const destination = profile ? safeNext ?? "/studio" : "/onboarding";

        // Hard-navigate so server components re-read the new session
        // cookie from scratch.
        window.location.href = destination;
      } catch (err) {
        if (!cancelled) {
          setState({
            kind: "error",
            message: err instanceof Error ? err.message : "Callback failed.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
          textAlign: "center",
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          London Cuts · Signing you in
        </div>
        {state.kind === "checking" && (
          <p
            className="mono-sm"
            style={{
              fontSize: 12,
              opacity: 0.72,
              textTransform: "none",
              letterSpacing: "0",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Verifying your link…
          </p>
        )}
        {state.kind === "error" && (
          <>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.55,
                margin: 0,
                marginBottom: 14,
              }}
            >
              {state.message}
            </p>
            <Link
              href="/sign-in"
              className="btn btn-solid"
              style={{
                display: "inline-flex",
                padding: "10px 16px",
                fontSize: 11,
                letterSpacing: "0.14em",
              }}
            >
              Try again
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
