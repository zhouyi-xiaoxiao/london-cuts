"use client";

// F-T008 — Publish flow slideover.
// Right-side slideover over a scrim. Opens on ui.publishOpen, closes via
// backdrop click, Escape, or header Back button.
//
// Pre-flight (per stop) = 4 checks:
//   1. upload         — stop.status.upload
//   2. hero           — stop.status.hero
//   3. body paragraph — at least one { type: "paragraph" } block with non-empty content
//   4. postcard msg   — stop.postcard.message (after trim) is non-empty
//
// Publish button is disabled unless every stop passes all four checks.
//
// Handle is hardcoded to "yx" per HANDOFF.md (real profiles come in M2).

import { useEffect, useMemo, useState } from "react";

import { useProject, useProjectActions } from "@/stores/project";
import { useStops, useStopActions } from "@/stores/stop";
import { useUi, useUiActions } from "@/stores/ui";
import type { Stop } from "@/stores/types";

// ─── Constants ─────────────────────────────────────────────────────────

const HANDLE = "yx";
const PUBLIC_BASE = "https://zhouyixiaoxiao.org";

// ─── Utilities ─────────────────────────────────────────────────────────

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}

interface StopCheck {
  upload: boolean;
  hero: boolean;
  bodyParagraph: boolean;
  postcardMessage: boolean;
}

function checkStop(s: Stop): StopCheck {
  const bodyParagraph = s.body.some(
    (b) => b.type === "paragraph" && b.content.trim().length > 0,
  );
  const postcardMessage = (s.postcard?.message ?? "").trim().length > 0;
  return {
    upload: Boolean(s.status.upload),
    hero: Boolean(s.status.hero),
    bodyParagraph,
    postcardMessage,
  };
}

function checkPasses(c: StopCheck): boolean {
  return c.upload && c.hero && c.bodyParagraph && c.postcardMessage;
}

function issueLabels(c: StopCheck): string[] {
  const out: string[] = [];
  if (!c.upload) out.push("needs uploads");
  if (!c.hero) out.push("no hero");
  if (!c.bodyParagraph) out.push("body has no paragraph");
  if (!c.postcardMessage) out.push("postcard message empty");
  return out;
}

// ─── Component ─────────────────────────────────────────────────────────

export function PublishDialog() {
  const ui = useUi();
  const { setPublishOpen } = useUiActions();
  const project = useProject();
  const { setProject } = useProjectActions();
  const stops = useStops();
  const { setActiveStop } = useStopActions();

  const derivedSlug = useMemo(() => slugify(project.title || "untitled"), [project.title]);
  const [slug, setSlug] = useState<string>(project.slug || derivedSlug);
  const [visibility, setVisibility] = useState(project.visibility ?? "public");
  const [toast, setToast] = useState<string | null>(null);

  const open = ui.publishOpen;

  // Reset form state when the dialog re-opens so edits from other sessions
  // don't leak stale slug/visibility values.
  useEffect(() => {
    if (open) {
      setSlug(project.slug || derivedSlug);
      setVisibility(project.visibility ?? "public");
    }
  }, [open, project.slug, project.visibility, derivedSlug]);

  // Escape-to-close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPublishOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setPublishOpen]);

  // Per-stop results (stable per render without expensive recalc).
  const perStop = useMemo(
    () => stops.map((s) => ({ stop: s, check: checkStop(s) })),
    [stops],
  );
  const readyCount = perStop.filter((x) => checkPasses(x.check)).length;
  const needAttention = perStop.length - readyCount;
  const allPass = perStop.length > 0 && needAttention === 0;

  const publicUrl = `${PUBLIC_BASE}/${HANDLE}/${slug}`;
  const isPublished = project.status === "published";

  function handleSlugChange(v: string) {
    // Kebab-sanitise as the user types.
    setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
  }

  function jumpToStop(n: string) {
    setActiveStop(n);
    setPublishOpen(false);
  }

  function handlePublish() {
    if (!allPass) return;
    setProject({
      slug,
      visibility,
      status: "published",
      publishedAt: new Date().toISOString(),
    });
    setToast("Published");
    window.setTimeout(() => setToast(null), 1500);
  }

  function handleUnpublish() {
    setProject({
      status: "draft",
      publishedAt: null,
    });
    setToast("Unpublished");
    window.setTimeout(() => setToast(null), 1500);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setToast("Link copied");
    } catch {
      setToast(`Copy failed — ${publicUrl}`);
    }
    window.setTimeout(() => setToast(null), 1500);
  }

  function handleOpenPublic() {
    if (typeof window !== "undefined") {
      window.open(publicUrl, "_blank", "noopener");
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Scrim */}
      <div
        data-testid="publish-scrim"
        onClick={() => setPublishOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.42)",
          zIndex: 60,
          transition: "opacity 260ms ease",
        }}
        aria-hidden
      />

      {/* Slideover */}
      <aside
        role="dialog"
        aria-label="Publish project"
        aria-modal="true"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(560px, 96vw)",
          background: "var(--paper, #f7f1e6)",
          borderLeft: "1px solid var(--rule, rgba(0,0,0,0.12))",
          zIndex: 61,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-16px 0 36px rgba(0,0,0,0.18)",
          transition: "transform 260ms ease",
          transform: "translateX(0)",
          overflow: "hidden",
        }}
      >
        {/* ─── Header ─────────────────────────────────────────── */}
        <header
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--rule, rgba(0,0,0,0.12))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              className="mono-sm"
              style={{ opacity: 0.55, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}
            >
              Publish · Ed.01
            </div>
            <div
              style={{
                fontFamily: "var(--mode-display-font, var(--f-fashion))",
                fontStyle: "italic",
                fontSize: 22,
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={project.title}
            >
              {project.title}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setPublishOpen(false)}
            aria-label="Close publish dialog"
          >
            Back to workspace
          </button>
        </header>

        {/* ─── Body (scrollable) ──────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px 28px" }}>
          {/* Pre-flight counter */}
          <div
            className="eyebrow"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              opacity: 0.7,
            }}
            data-testid="publish-counter"
          >
            Pre-flight · {readyCount}/{perStop.length} ready ·{" "}
            {needAttention === 0 ? "all clear" : `${needAttention} need attention`}
          </div>

          {/* Per-stop checklist */}
          <ul
            aria-label="Pre-flight checklist"
            style={{
              listStyle: "none",
              padding: 0,
              margin: "10px 0 0",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {perStop.map(({ stop, check }) => {
              const ok = checkPasses(check);
              return (
                <li
                  key={stop.n}
                  data-testid={`publish-row-${stop.n}`}
                  data-ok={ok}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 10,
                    alignItems: "center",
                    padding: "8px 10px",
                    border: "1px solid var(--rule, rgba(0,0,0,0.1))",
                    borderRadius: 4,
                    background: ok ? "transparent" : "rgba(184, 54, 10, 0.06)",
                  }}
                >
                  <PreflightDots check={check} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14 }}>
                      <span
                        className="mono-sm"
                        style={{ opacity: 0.55, marginRight: 6 }}
                      >
                        {stop.n}
                      </span>
                      {stop.title}
                    </div>
                    {!ok && (
                      <div
                        className="mono-sm"
                        style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}
                      >
                        {issueLabels(check).join(" · ")}
                      </div>
                    )}
                  </div>
                  {!ok && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => jumpToStop(stop.n)}
                      data-testid={`publish-jump-${stop.n}`}
                    >
                      Jump →
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {/* ─── URL preview ─────────────────────────────────── */}
          <div
            className="eyebrow"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              opacity: 0.7,
              marginTop: 20,
            }}
          >
            Public URL
          </div>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--f-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
              fontSize: 12,
              flexWrap: "wrap",
            }}
          >
            <span style={{ opacity: 0.65 }}>
              {PUBLIC_BASE}/{HANDLE}/
            </span>
            <input
              aria-label="Project slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              style={{
                borderBottom: "1px solid currentColor",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
                background: "transparent",
                padding: "2px 4px",
                minWidth: 180,
                fontFamily: "inherit",
                fontSize: "inherit",
                color: "inherit",
              }}
            />
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleCopyLink}
              data-testid="publish-copy-url"
            >
              Copy URL
            </button>
          </div>

          {/* ─── Visibility ──────────────────────────────────── */}
          <div
            className="eyebrow"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              opacity: 0.7,
              marginTop: 20,
            }}
          >
            Visibility
          </div>
          <div
            role="radiogroup"
            aria-label="Visibility"
            style={{ display: "flex", gap: 10, marginTop: 8 }}
          >
            {(["public", "unlisted", "private"] as const).map((v) => (
              <label
                key={v}
                data-testid={`visibility-${v}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  padding: "6px 10px",
                  border: "1px solid var(--rule, rgba(0,0,0,0.15))",
                  borderRadius: 999,
                  background:
                    visibility === v ? "currentColor" : "transparent",
                  color: visibility === v ? "var(--paper, #f7f1e6)" : "inherit",
                  fontSize: 12,
                  textTransform: "capitalize",
                }}
              >
                <input
                  type="radio"
                  name="publish-visibility"
                  value={v}
                  checked={visibility === v}
                  onChange={() => {
                    setVisibility(v);
                    setProject({ visibility: v });
                  }}
                  style={{ margin: 0 }}
                />
                {v}
              </label>
            ))}
          </div>

          {/* ─── Actions ─────────────────────────────────────── */}
          <div
            style={{
              marginTop: 24,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {isPublished ? (
              <>
                <button
                  type="button"
                  className="btn btn-solid"
                  onClick={handleUnpublish}
                  data-testid="publish-unpublish-btn"
                >
                  Unpublish ×
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={handleCopyLink}
                    data-testid="publish-copy-link-btn"
                    style={{ flex: 1 }}
                  >
                    Copy public link
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={handleOpenPublic}
                    data-testid="publish-open-public-btn"
                    style={{ flex: 1 }}
                  >
                    Open public project ↗
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-solid"
                onClick={handlePublish}
                disabled={!allPass}
                data-testid="publish-submit-btn"
                style={{ opacity: allPass ? 1 : 0.5, cursor: allPass ? "pointer" : "not-allowed" }}
                title={
                  allPass
                    ? "Publish to public URL"
                    : `${needAttention} stop(s) still need attention`
                }
              >
                {allPass ? "Publish →" : `${needAttention} issue(s) block publish`}
              </button>
            )}
          </div>

          {/* ─── Toast ─────────────────────────────────────── */}
          {toast && (
            <div
              className="mono-sm"
              data-testid="publish-toast"
              style={{
                marginTop: 14,
                padding: "6px 10px",
                border: "1px solid currentColor",
                display: "inline-block",
                fontSize: 11,
                opacity: 0.85,
              }}
            >
              {toast}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// ─── Per-check dot row (4 mini-dots, one per check) ───────────────────

function PreflightDots({ check }: { check: StopCheck }) {
  const items: Array<{ key: keyof StopCheck; label: string }> = [
    { key: "upload", label: "upload" },
    { key: "hero", label: "hero" },
    { key: "bodyParagraph", label: "body paragraph" },
    { key: "postcardMessage", label: "postcard message" },
  ];
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }} aria-hidden>
      {items.map((it) => (
        <span
          key={it.key}
          title={`${it.label}: ${check[it.key] ? "ok" : "missing"}`}
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: check[it.key] ? "var(--accent, #2e8b57)" : "rgba(184, 54, 10, 0.75)",
            display: "inline-block",
          }}
        />
      ))}
    </div>
  );
}
