"use client";

// Small styled empty-state for public URLs that don't resolve to a
// project in the current browser's store. We intentionally avoid
// Next's `notFound()` — in M-fast every user's data lives in their
// own localStorage, so a "not found" is more often a "you're viewing
// from a different device" than a true 404. See F-T009 HANDOFF.

import Link from "next/link";

export interface NotFoundCardProps {
  /** Human-readable description of what we were looking for. */
  what: string;
  /** Full slug (or stop segment) we tried to match, for debugging. */
  hint?: string;
}

export function NotFoundCard({ what, hint }: NotFoundCardProps) {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "80px 40px",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 18,
      }}
    >
      <div className="eyebrow">Nothing here — yet</div>
      <h1
        style={{
          fontFamily: "var(--mode-display-font, var(--f-serif, serif))",
          fontSize: "clamp(40px, 6vw, 68px)",
          lineHeight: 1.0,
          margin: 0,
        }}
      >
        {what} isn't in this browser.
      </h1>
      <p style={{ lineHeight: 1.7, opacity: 0.8, maxWidth: "46ch" }}>
        London Cuts is in its early public-beta phase — every reader's
        projects live in their own browser until we switch on the cloud
        backend. If someone shared this link with you, ask them to
        publish (or re-publish) from their device.
      </p>
      {hint && (
        <p
          className="mono-sm"
          style={{ opacity: 0.5, fontSize: 11, letterSpacing: "0.08em" }}
        >
          {hint}
        </p>
      )}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 16,
        }}
      >
        <Link href="/atlas" className="btn btn-solid">
          Open the atlas
        </Link>
        <Link href="/studio" className="btn">
          Enter your studio
        </Link>
      </div>
    </main>
  );
}
