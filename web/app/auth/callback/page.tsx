"use client";

// M2 auth callback — handles BOTH Supabase magic-link flow shapes:
//
//  1. PKCE flow (default for signInWithOtp from the client): Supabase
//     redirects us to /auth/callback?code=XYZ. We exchange the code
//     for a session via the browser client.
//
//  2. Implicit / hash flow (admin-generated links via
//     auth.admin.generateLink): Supabase redirects us with the
//     session tokens in the URL FRAGMENT —
//     /auth/callback#access_token=...&refresh_token=...
//     The fragment never reaches the server, so this page must be a
//     client component. The Supabase browser client, initialised with
//     `detectSessionInUrl: true`, consumes the hash automatically
//     when it boots. We just wait for the session and then redirect.
//
// Either way, once we have a session we check whether the user has a
// profile row (first-time? → /onboarding; returning user? → /studio,
// or whatever ?next= asks for).

import { useEffect, useState } from "react";

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

        // For the PKCE flow the URL has `?code=...`. The browser
        // client's `detectSessionInUrl` + auto-exchange handles it on
        // init, but for belt + braces we explicitly exchange if the
        // code is present.
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            if (!cancelled) {
              setState({ kind: "error", message: error.message });
            }
            return;
          }
        }

        // For the implicit/hash flow the browser client has already
        // parsed the fragment during its init (detectSessionInUrl).
        // Either way, give it a beat to settle, then fetch the
        // current session. If still nothing, we failed.
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
            <a
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
            </a>
          </>
        )}
      </section>
    </main>
  );
}
