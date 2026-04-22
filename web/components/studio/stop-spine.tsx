"use client";

// Left column of the workspace: the numbered stops list with status pips.
// Keyboard navigable: Tab to enter the list, arrow-up/down to move selection,
// Enter/Space to activate.
//
// M-iter F-I009 (2026-04-22): added per-row move-up / move-down / delete
// affordances + a footer "+ ADD STOP" button. Without these, the legacy
// workspace's spine UX was completely missing — see tasks/AUDIT-WORKSPACE.md.

import { useRef } from "react";

import { useStopActions } from "@/stores/stop";
import type { Stop } from "@/stores/types";

export interface StopSpineProps {
  stops: readonly Stop[];
  selectedId: string;
  onSelect: (id: string) => void;
  summary: { total: number; ready: number };
}

export function StopSpine({ stops, selectedId, onSelect, summary }: StopSpineProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const { addStop, removeStop, moveStop } = useStopActions();

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

  const handleAdd = () => {
    // Insert after the current selection so it lands somewhere predictable.
    const newN = addStop(selectedId);
    // addStop already updates ui.activeStopId; mirror the selection prop.
    onSelect(newN);
  };

  const handleMove = (stopId: string, direction: "up" | "down") => {
    moveStop(stopId, direction);
  };

  const handleDelete = (stopId: string, title: string) => {
    if (stops.length <= 1) return;
    if (
      confirm(
        `Delete "${title || "(untitled)"}"? This removes the stop and its body, but its photos stay in the assets pool.`,
      )
    ) {
      removeStop(stopId);
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
            isFirst={index === 0}
            isLast={index === stops.length - 1}
            isOnlyStop={stops.length <= 1}
            onSelect={() => onSelect(stop.n)}
            onKeyDown={(e) => onKeyDown(e, index)}
            onMoveUp={() => handleMove(stop.n, "up")}
            onMoveDown={() => handleMove(stop.n, "down")}
            onDelete={() => handleDelete(stop.n, stop.title)}
          />
        ))}
      </ul>
      <footer
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--rule)",
          background: "var(--paper)",
        }}
      >
        <button
          type="button"
          onClick={handleAdd}
          className="btn btn-sm"
          style={{
            width: "100%",
            padding: "8px 12px",
            fontFamily: "var(--f-mono)",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            border: "1px dashed var(--rule)",
            background: "transparent",
            color: "var(--ink)",
            cursor: "pointer",
          }}
          data-testid="spine-add-stop"
          aria-label="Add a new stop after the current one"
        >
          + Add stop
        </button>
      </footer>
    </aside>
  );
}

interface SpineRowProps {
  stop: Stop;
  selected: boolean;
  isFirst: boolean;
  isLast: boolean;
  isOnlyStop: boolean;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLLIElement>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

function SpineRow({
  stop,
  selected,
  isFirst,
  isLast,
  isOnlyStop,
  onSelect,
  onKeyDown,
  onMoveUp,
  onMoveDown,
  onDelete,
}: SpineRowProps) {
  // Per-row chrome (move + delete) only shows on the active row to avoid
  // visual noise on every list item. Mirrors legacy behaviour.
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
      {selected && (
        <span
          style={{
            display: "inline-flex",
            gap: 4,
            marginLeft: 4,
            flexShrink: 0,
          }}
          // Stop click bubbling so clicking these doesn't re-trigger row select.
          onClick={(e) => e.stopPropagation()}
        >
          <RowIconButton
            disabled={isFirst}
            onClick={onMoveUp}
            title="Move stop up"
            label="↑"
            data-testid={`spine-up-${stop.n}`}
          />
          <RowIconButton
            disabled={isLast}
            onClick={onMoveDown}
            title="Move stop down"
            label="↓"
            data-testid={`spine-down-${stop.n}`}
          />
          <RowIconButton
            disabled={isOnlyStop}
            onClick={onDelete}
            title={
              isOnlyStop
                ? "Can't delete the last stop"
                : "Delete this stop"
            }
            label="×"
            data-testid={`spine-delete-${stop.n}`}
            destructive
          />
        </span>
      )}
      <StatusPips status={stop.status} />
    </li>
  );
}

interface RowIconButtonProps {
  label: string;
  title: string;
  disabled?: boolean;
  destructive?: boolean;
  onClick: () => void;
  "data-testid"?: string;
}

function RowIconButton({
  label,
  title,
  disabled,
  destructive,
  onClick,
  ...rest
}: RowIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      data-testid={rest["data-testid"]}
      style={{
        width: 22,
        height: 22,
        padding: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid var(--rule)",
        background: "var(--paper)",
        color: destructive ? "var(--mode-accent, var(--accent))" : "var(--ink)",
        fontSize: 13,
        lineHeight: 1,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {label}
    </button>
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
