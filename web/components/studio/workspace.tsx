"use client";

// Workspace shell — port of legacy workspace.jsx (~2557 lines).
// This file is intentionally the SHELL only. The rich feature work
// (hero slot, variants row, story editor) lives in F-T005 and F-T006.
// Layout: top bar + three-column grid (spine | canvas | drawers).
// At narrow widths the drawer collapses to an overlay.

import { useEffect, useState } from "react";

import { useProject, useProjectActions } from "@/stores/project";
import { useActiveStop, useActiveStopId, useStops, useStopActions } from "@/stores/stop";
import { useMode, useSetMode, NARRATIVE_MODES } from "@/stores/mode";
import { useUi, useUiActions } from "@/stores/ui";
import type { NarrativeMode } from "@/stores/types";

import { StopSpine } from "./stop-spine";
import { StopCanvas } from "./stop-canvas";
import { Drawers } from "./drawers/drawers";
import { PublishDialog } from "./publish-dialog";

// ─── Hook: narrow-viewport detection with auto-close on first mount ────

function useNarrowViewport(threshold = 1200): boolean {
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => setIsNarrow(window.innerWidth < threshold);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [threshold]);
  return isNarrow;
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
  const activeStop = useActiveStop();
  const activeId = useActiveStopId();
  const { setActiveStop } = useStopActions();
  const isNarrow = useNarrowViewport(1200);

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

      {/* ─── Top bar ────────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          borderBottom: "1px solid var(--rule)",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            minWidth: 0,
          }}
        >
          <a
            href="/studio"
            className="mono-sm"
            style={{ opacity: 0.6, textDecoration: "none" }}
          >
            ← Projects
          </a>
          <span
            className="roundel"
            style={{ width: 20, height: 20, display: "inline-block" }}
            aria-hidden
          />
          <span
            style={{
              fontFamily: "var(--f-fashion, var(--mode-display-font))",
              fontStyle: "italic",
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
          <span className="mono-sm" style={{ opacity: 0.45, fontSize: 10 }}>
            {project.status === "published" ? "PUBLISHED" : "DRAFT"} · ED.01 ·{" "}
            {summary.ready}/{summary.total} STOPS READY
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ModePill mode={mode} onChange={setMode} />
          <button
            className="btn btn-sm"
            onClick={toggleDrawer}
            title={ui.drawerOpen ? "Hide right panels" : "Show right panels"}
          >
            {ui.drawerOpen ? "Hide panels →" : "← Show panels"}
          </button>
          <button
            className="btn btn-solid"
            onClick={() => setPublishOpen(true)}
            title={
              summary.ready === summary.total
                ? "Publish to public URL"
                : `${summary.total - summary.ready} stop(s) still missing hero/body/postcard`
            }
          >
            Publish →
          </button>
        </div>
      </header>

      {/* ─── Three-column shell ─────────────────────────────────── */}
      <div
        className="ws-shell"
        style={{
          display: "grid",
          gridTemplateColumns: isNarrow
            ? "var(--spine-w) 1fr"
            : ui.drawerOpen
              ? "var(--spine-w) 1fr var(--drawer-w)"
              : "var(--spine-w) 1fr",
          gap: 0,
          flex: 1,
          minHeight: 0,
        }}
      >
        <StopSpine
          stops={stops}
          selectedId={activeId}
          onSelect={setActiveStop}
          summary={summary}
        />
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
  return (
    <div
      className="mode-pill"
      role="radiogroup"
      aria-label="Narrative mode"
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
          {m[0].toUpperCase() + m.slice(1)}
        </button>
      ))}
    </div>
  );
}
