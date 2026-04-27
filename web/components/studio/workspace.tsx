"use client";

// Workspace shell — port of legacy workspace.jsx (~2557 lines).
// This file is intentionally the SHELL only. The rich feature work
// (hero slot, variants row, story editor) lives in F-T005 and F-T006.
// Layout: top bar + three-column grid (spine | canvas | drawers).
// At narrow widths the drawer collapses to an overlay.

import { useEffect, useState } from "react";
import Link from "next/link";

import { LanguageSwitcher, useT } from "@/components/i18n-provider";
import { useProject, useProjectActions } from "@/stores/project";
import { useActiveStop, useActiveStopId, useStops, useStopActions } from "@/stores/stop";
import { useMode, useSetMode, NARRATIVE_MODES } from "@/stores/mode";
import { useUi, useUiActions } from "@/stores/ui";
import type { NarrativeMode } from "@/stores/types";

import { StopSpine } from "./stop-spine";
import { StopCanvas } from "./stop-canvas";
import { Drawers } from "./drawers/drawers";
import { PublishDialog } from "./publish-dialog";
import { MobileStopSwitcher } from "./mobile-stop-switcher";

// ─── Hook: viewport-width detection with threshold ─────────────────────
// We track two thresholds:
//   - isNarrow  (< 1200px): drawer collapses to overlay, matches legacy behaviour
//   - isMobile  (<  900px): spine column hides entirely; stop selection moves
//                           to a top-bar chip + fullscreen overlay
// Dogfood 2026-04-23: on an iPhone 14 (390px) the 288px spine ate 74% of the
// viewport. Hide it below 900px and surface the MobileStopSwitcher instead.

function useViewportWidth(threshold: number): boolean {
  const [below, setBelow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => setBelow(window.innerWidth < threshold);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [threshold]);
  return below;
}

// ─── Main workspace ────────────────────────────────────────────────────

export function Workspace() {
  const project = useProject();
  const stops = useStops();
  const mode = useMode();
  const setMode = useSetMode();
  const ui = useUi();
  const { setDrawerOpen, setDrawerTab, setPublishOpen } = useUiActions();
  const { archiveCurrentProject, resetToSeed } = useProjectActions();
  const t = useT();
  const activeStop = useActiveStop();
  const activeId = useActiveStopId();
  const { setActiveStop } = useStopActions();
  const isNarrow = useViewportWidth(1200);
  const isMobile = useViewportWidth(900);

  // On narrow viewport, auto-close drawer once per session so canvas is visible.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isNarrow) return;
    try {
      const flag = sessionStorage.getItem("lc_autoclose_drawer");
      if (!flag) {
        sessionStorage.setItem("lc_autoclose_drawer", "1");
        setDrawerOpen(false);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNarrow]);

  // Escape-to-close drawer in overlay mode.
  useEffect(() => {
    if (!isNarrow || !ui.drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isNarrow, ui.drawerOpen, setDrawerOpen]);

  const toggleDrawer = () => setDrawerOpen(!ui.drawerOpen);

  const summary = {
    total: stops.length,
    ready: stops.filter((s) => s.status.upload && s.status.hero && s.status.body)
      .length,
  };

  return (
    <div
      className="page"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Overlay scrim when drawer is floating on narrow viewport */}
      {isNarrow && ui.drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 40,
          }}
          aria-hidden
        />
      )}

      {/* ─── Top bar ──────────────────────────────────────────────
          Mobile (<900px): condense. Drop the status/ready eyebrow (it's shown
          inside the MobileStopSwitcher modal and the drawer "Progress" tab),
          drop the project title as a separate line (it's already on the
          /studio landing + still accessible via ← Projects), and surface the
          stop switcher chip in its place. */}
      <header
        className="ws-topbar"
        data-mobile={isMobile ? "true" : "false"}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: isMobile ? "10px 14px" : "12px 20px",
          borderBottom: "1px solid var(--rule)",
          gap: isMobile ? 10 : 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 10 : 14,
            minWidth: 0,
            flex: isMobile ? 1 : undefined,
          }}
        >
          <Link
            href="/studio"
            className="mono-sm"
            style={{ opacity: 0.6, textDecoration: "none", flexShrink: 0 }}
            aria-label="Back to projects"
          >
            {isMobile ? "←" : `← ${t("studio.backProjects")}`}
          </Link>
          <span
            className="roundel"
            style={{
              width: 20,
              height: 20,
              display: "inline-block",
              flexShrink: 0,
            }}
            aria-hidden
          />
          {!isMobile && (
            <span
              style={{
                fontFamily: "var(--mode-display-font, var(--f-fashion))",
                fontStyle: "var(--mode-italic, italic)",
                fontSize: 17,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 280,
              }}
              title={project.title}
            >
              {project.title}
            </span>
          )}
          {!isMobile && (
            <span className="mono-sm" style={{ opacity: 0.45, fontSize: 10 }}>
              {project.status === "published" ? "PUBLISHED" : "DRAFT"} · ED.01 ·{" "}
              {summary.ready}/{summary.total} STOPS READY
            </span>
          )}
          {isMobile && (
            <MobileStopSwitcher
              stops={stops}
              selectedId={activeId}
              onSelect={setActiveStop}
            />
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 6 : 12,
            flexShrink: 0,
          }}
        >
          <ModePill mode={mode} onChange={setMode} />
          {!isMobile && <LanguageSwitcher compact />}
          {!isMobile && (
            <button
              className="btn btn-sm"
              onClick={toggleDrawer}
              title={ui.drawerOpen ? "Hide right panels" : "Show right panels"}
            >
              {ui.drawerOpen ? `${t("studio.hidePanels")} →` : `← ${t("studio.showPanels")}`}
            </button>
          )}
          {isMobile && (
            <button
              type="button"
              onClick={toggleDrawer}
              aria-label={ui.drawerOpen ? t("studio.hidePanels") : t("studio.showPanels")}
              title={ui.drawerOpen ? t("studio.hidePanels") : t("studio.showPanels")}
              className="mono-sm"
              style={{
                minHeight: 40,
                minWidth: 40,
                padding: "6px 10px",
                border: "1px solid var(--rule)",
                background: ui.drawerOpen ? "var(--paper-3)" : "var(--paper-2)",
                color: "var(--ink)",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              ☰
            </button>
          )}
          <button
            className="btn btn-solid"
            onClick={() => setPublishOpen(true)}
            title={
              summary.ready === summary.total
                ? "Publish to public URL"
                : `${summary.total - summary.ready} stop(s) still missing hero/body/postcard`
            }
          >
            {isMobile ? t("studio.publish") : `${t("studio.publish")} →`}
          </button>
        </div>
      </header>

      {/* ─── Shell ───────────────────────────────────────────────
          Mobile (<900px): single full-width canvas column. Spine is hidden
          entirely; its functions move to the top-bar MobileStopSwitcher.
          Tablet/laptop (900-1199px): spine + canvas, drawer overlays.
          Desktop (≥1200px): spine + canvas + drawer. */}
      <div
        className="ws-shell"
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : isNarrow
              ? "var(--spine-w) 1fr"
              : ui.drawerOpen
                ? "var(--spine-w) 1fr var(--drawer-w)"
                : "var(--spine-w) 1fr",
          gap: 0,
          flex: 1,
          minHeight: 0,
        }}
      >
        {!isMobile && (
          <StopSpine
            stops={stops}
            selectedId={activeId}
            onSelect={setActiveStop}
            summary={summary}
          />
        )}
        <StopCanvas stop={activeStop} />
        {ui.drawerOpen && (
          <Drawers
            isOverlay={isNarrow}
            tab={ui.drawerTab}
            onTabChange={setDrawerTab}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </div>

      {/* ─── Publish slideover (F-T008) ───────────────────────── */}
      {ui.publishOpen && <PublishDialog />}
    </div>
  );
}

// ─── ModePill (local to workspace top bar) ────────────────────────────

interface ModePillProps {
  mode: NarrativeMode;
  onChange: (m: NarrativeMode) => void;
}

function ModePill({ mode, onChange }: ModePillProps) {
  const t = useT();
  return (
    <div
      className="mode-pill"
      role="radiogroup"
      aria-label={t("mode.label")}
    >
      {NARRATIVE_MODES.map((m) => (
        <button
          key={m}
          role="radio"
          aria-checked={mode === m}
          data-active={mode === m}
          onClick={() => onChange(m)}
          type="button"
        >
          {t(`mode.${m}` as Parameters<typeof t>[0])}
        </button>
      ))}
    </div>
  );
}
