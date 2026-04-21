"use client";

// Preview gate — password form. Visited automatically by middleware when
// the visitor doesn't carry the auth cookie. Posts to /api/gate which sets
// the cookie + redirects back to the originally-requested path.

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function GateForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password, next }),
      });
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
      const body = (await res.json()) as { ok?: boolean; redirect?: string; error?: string };
      if (body.ok && body.redirect) {
        window.location.href = body.redirect;
        return;
      }
      setError(body.error || "Wrong password.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        width: "100%",
        maxWidth: 360,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <label style={{ display: "block" }}>
        <span
          className="mono-sm"
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.55,
          }}
        >
          Preview password
        </span>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="enter the shared password"
          style={{
            marginTop: 8,
            width: "100%",
            padding: "10px 12px",
            border: "1px solid var(--rule)",
            background: "var(--paper)",
            fontSize: 16,
            fontFamily: "var(--f-sans)",
          }}
        />
      </label>
      <button
        type="submit"
        disabled={busy || !password}
        className="btn btn-solid"
        style={{ padding: "10px 16px" }}
      >
        {busy ? "Checking…" : "Enter preview"}
      </button>
      {error && (
        <div
          role="alert"
          className="mono-sm"
          style={{
            padding: "8px 12px",
            border: "1px solid var(--mode-accent)",
            color: "var(--mode-accent)",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}
    </form>
  );
}

export default function GatePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        gap: 32,
        background: "var(--paper)",
        color: "var(--ink)",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <p
          className="mono-sm"
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.55,
            margin: 0,
          }}
        >
          London Cuts · Preview
        </p>
        <h1
          style={{
            fontFamily:
              "var(--f-serif, 'Instrument Serif', serif)",
            fontStyle: "italic",
            fontSize: "clamp(40px, 7vw, 64px)",
            lineHeight: 1,
            margin: "12px 0 0",
            letterSpacing: "-0.01em",
          }}
        >
          Preview is gated.
        </h1>
        <p style={{ marginTop: 16, opacity: 0.7, fontSize: 14, lineHeight: 1.6 }}>
          This build is a closed preview. Enter the password the owner shared
          with you to continue. You&apos;ll be let in for the next 7 days on
          this browser.
        </p>
      </div>

      <Suspense fallback={null}>
        <GateForm />
      </Suspense>

      <footer
        className="mono-sm"
        style={{ opacity: 0.4, fontSize: 10, letterSpacing: "0.12em" }}
      >
        Not real auth. Invite-only beta launches after M2.
      </footer>
    </main>
  );
}
