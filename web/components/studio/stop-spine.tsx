"use client";

// Left column of the workspace: the numbered stops list with status pips.
// Keyboard navigable: Tab to enter the list, arrow-up/down to move selection,
// Enter/Space to activate.

import { useRef } from "react";

import type { Stop } from "@/stores/types";

export interface StopSpineProps {
  stops: readonly Stop[];
  selectedId: string;
  onSelect: (id: string) => void;
  summary: { total: number; ready: number };
}

export function StopSpine({ stops, selectedId, onSelect, summary }: StopSpineProps) {
  const listRef = useRef<HTMLUListElement>(null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLLIElement>, index: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = e.key === "ArrowDown" ? index + 1 : index - 1;
      const clamped = Math.max(0, Math.min(stops.length - 1, next));
      const target = stops[clamped];
      if (target) {
        onSelect(target.n);
        // Focus moves to next list item.
        const items = listRef.current?.querySelectorAll<HTMLLIElement>(
          "[data-stop-row]",
        );
        items?.[clamped]?.focus();
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(stops[index].n);
    }
  };

  return (
    <aside
      style={{
        borderRight: "1px solid var(--rule)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        background: "var(--paper)",
      }}
      aria-label="Stops in this project"
    >
      <header
        style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div className="eyebrow">{stops.length} stops</div>
        <div
          className="mono-sm"
          style={{ opacity: 0.55, marginTop: 6 }}
        >
          {summary.ready}/{summary.total} ready
        </div>
      </header>
      <ul
        ref={listRef}
        role="listbox"
        aria-label="Stop list"
        aria-activedescendant={`spine-row-${selectedId}`}
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          flex: 1,
        }}
      >
        {stops.map((stop, index) => (
          <SpineRow
            key={stop.n}
            stop={stop}
            selected={stop.n === selectedId}
            onSelect={() => onSelect(stop.n)}
            onKeyDown={(e) => onKeyDown(e, index)}
          />
        ))}
      </ul>
    </aside>
  );
}

interface SpineRowProps {
  stop: Stop;
  selected: boolean;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLLIElement>) => void;
}

function SpineRow({ stop, selected, onSelect, onKeyDown }: SpineRowProps) {
  return (
    <li
      id={`spine-row-${stop.n}`}
      data-stop-row
      role="option"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 20px",
        borderBottom: "1px solid var(--rule)",
        background: selected ? "var(--paper-3)" : "transparent",
        cursor: "pointer",
        outline: "none",
      }}
    >
      <span
        className="mono-sm"
        style={{ opacity: 0.55, width: 28, flexShrink: 0 }}
      >
        {stop.n}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
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
      <StatusPips status={stop.status} />
    </li>
  );
}

function StatusPips({ status }: { status: Stop["status"] }) {
  const pipStyle: React.CSSProperties = {
    display: "inline-block",
    width: 6,
    height: 6,
    borderRadius: 999,
    border: "1px solid currentColor",
  };
  return (
    <span
      className="pip-group"
      style={{ display: "inline-flex", gap: 3 }}
      aria-label="stop progress"
    >
      <span
        className="pip"
        style={{
          ...pipStyle,
          background: status.upload ? "currentColor" : "transparent",
        }}
        title="upload"
      />
      <span
        className="pip"
        style={{
          ...pipStyle,
          background: status.hero ? "currentColor" : "transparent",
        }}
        title="hero"
      />
      <span
        className="pip"
        style={{
          ...pipStyle,
          background: status.body ? "currentColor" : "transparent",
        }}
        title="body"
      />
      <span
        className="pip"
        style={{
          ...pipStyle,
          background:
            status.media === "done" ? "currentColor" : "transparent",
          animation:
            status.media === "running" ? "lc-pip-pulse 900ms infinite" : undefined,
        }}
        title="media"
      />
    </span>
  );
}
