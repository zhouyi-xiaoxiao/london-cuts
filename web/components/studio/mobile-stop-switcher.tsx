"use client";

// Mobile stop switcher — renders a compact top-bar chip showing the current
// stop plus a caret. Tapping opens a full-screen overlay listing all stops so
// the owner can jump between them; the overlay also exposes the "+ NEW STOP"
// affordance that lives in the spine footer on desktop.
//
// Background (dogfood, 2026-04-23): on iPhone 14 (390px wide) the desktop
// three-column grid forced a 288px spine into the viewport, leaving ~100px of
// canvas. We hide the spine column entirely at <900px and surface this
// switcher in its place.

import { useEffect, useRef, useState } from "react";

import { useStopActions } from "@/stores/stop";
import type { Stop } from "@/stores/types";

export interface MobileStopSwitcherProps {
  stops: readonly Stop[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function MobileStopSwitcher({
  stops,
  selectedId,
  onSelect,
}: MobileStopSwitcherProps) {
  const [open, setOpen] = useState(false);
  const { addStop } = useStopActions();
  const panelRef = useRef<HTMLDivElement>(null);

  const current = stops.find((s) => s.n === selectedId);
  const currentIndex = stops.findIndex((s) => s.n === selectedId);
  const currentNumber =
    currentIndex >= 0 ? String(currentIndex + 1).padStart(2, "0") : "--";
  const currentTitle = current?.title?.trim() || "(untitled)";
  const chipLabel = `STOP ${currentNumber}`;
  const chipSubtitle =
    currentTitle.length > 24 ? `${currentTitle.slice(0, 24)}…` : currentTitle;

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll while overlay is open so the background doesn't slide
  // underneath when the user flicks the list.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Autofocus the panel on open so Escape reliably reaches the handler on
  // touch keyboards that don't auto-focus the first interactive element.
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => panelRef.current?.focus());
    }
  }, [open]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  const handleAdd = () => {
    const newN = addStop(selectedId);
    onSelect(newN);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-testid="mobile-stop-switcher-chip"
        className="mono-sm"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          minHeight: 40,
          padding: "6px 12px",
          maxWidth: "100%",
          border: "1px solid var(--rule)",
          background: "var(--paper-2)",
          color: "var(--ink)",
          cursor: "pointer",
          fontSize: 10,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={`Stop ${currentNumber} · ${currentTitle}`}
      >
        <span style={{ flexShrink: 0, opacity: 0.7 }}>{chipLabel}</span>
        <span
          style={{
            flexShrink: 0,
            opacity: 0.35,
            textTransform: "none",
            letterSpacing: 0,
          }}
        >
          ·
        </span>
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textTransform: "none",
            letterSpacing: 0,
            fontFamily: "var(--f-sans)",
            fontSize: 12,
          }}
        >
          {chipSubtitle}
        </span>
        <span aria-hidden style={{ flexShrink: 0, opacity: 0.55, fontSize: 9 }}>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Select a stop"
          data-testid="mobile-stop-switcher-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            background: "rgba(0,0,0,0.35)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={panelRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: "auto",
              background: "var(--paper)",
              color: "var(--ink)",
              borderTop: "1px solid var(--rule)",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              outline: "none",
            }}
          >
            <header
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                borderBottom: "1px solid var(--rule)",
                gap: 12,
                flexShrink: 0,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div className="eyebrow">{stops.length} stops</div>
                <div
                  className="mono-sm"
                  style={{ opacity: 0.55, marginTop: 4 }}
                >
                  Tap to jump
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close stop switcher"
                className="mono-sm"
                style={{
                  minHeight: 40,
                  padding: "8px 14px",
                  border: "1px solid var(--rule)",
                  background: "transparent",
                  color: "var(--ink)",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </header>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                minHeight: 0,
              }}
            >
              <button
                type="button"
                onClick={handleAdd}
                data-testid="mobile-stop-switcher-add"
                className="mono-sm"
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--rule)",
                  background: "var(--paper-2)",
                  color: "var(--ink)",
                  cursor: "pointer",
                  textAlign: "left",
                  letterSpacing: "0.12em",
                }}
              >
                <span
                  aria-hidden
                  style={{ fontSize: 16, lineHeight: 1, width: 28 }}
                >
                  +
                </span>
                <span>New stop</span>
              </button>

              <ul
                role="listbox"
                aria-label="Stops"
                aria-activedescendant={`mobile-stop-row-${selectedId}`}
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                }}
              >
                {stops.map((stop, index) => (
                  <MobileStopRow
                    key={stop.n}
                    stop={stop}
                    index={index}
                    selected={stop.n === selectedId}
                    onSelect={() => handleSelect(stop.n)}
                  />
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Row (minimal reimpl, independent of the spine's drag-drop chrome) ──

interface MobileStopRowProps {
  stop: Stop;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

function MobileStopRow({ stop, index, selected, onSelect }: MobileStopRowProps) {
  const background = selected ? "var(--paper-3)" : "transparent";
  return (
    <li
      id={`mobile-stop-row-${stop.n}`}
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 20px",
        borderBottom: "1px solid var(--rule)",
        background,
        cursor: "pointer",
        minHeight: 56,
      }}
    >
      <span
        className="mono-sm"
        style={{ opacity: 0.55, width: 28, flexShrink: 0 }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {stop.title || "(untitled)"}
        </div>
        <div
          className="mono-sm"
          style={{ opacity: 0.5, fontSize: 10, marginTop: 2 }}
        >
          {stop.code} · {stop.time}
        </div>
      </div>
      <MobileStatusPips status={stop.status} />
    </li>
  );
}

function MobileStatusPips({ status }: { status: Stop["status"] }) {
  const pipStyle: React.CSSProperties = {
    display: "inline-block",
    width: 6,
    height: 6,
    borderRadius: 999,
    border: "1px solid currentColor",
  };
  return (
    <span
      style={{ display: "inline-flex", gap: 3, flexShrink: 0 }}
      aria-label="stop progress"
    >
      <span
        style={{
          ...pipStyle,
          background: status.upload ? "currentColor" : "transparent",
        }}
        title="upload"
      />
      <span
        style={{
          ...pipStyle,
          background: status.hero ? "currentColor" : "transparent",
        }}
        title="hero"
      />
      <span
        style={{
          ...pipStyle,
          background: status.body ? "currentColor" : "transparent",
        }}
        title="body"
      />
      <span
        style={{
          ...pipStyle,
          background: status.media === "done" ? "currentColor" : "transparent",
        }}
        title="media"
      />
    </span>
  );
}
