"use client";

// Story body editor — port of legacy stop-canvas paragraph / pullQuote /
// metaRow block editor. For M-fast we only support 3 block types
// (paragraph, pullQuote, metaRow). Image blocks (heroImage, inlineImage)
// come with F-T006's richer editor, and mediaEmbed comes with F-T007.

import { useCallback } from "react";

import { useStopActions } from "@/stores/stop";
import type { BodyBlock, Stop } from "@/stores/types";

type SupportedKind = "paragraph" | "pullQuote" | "metaRow";

export interface StopBodyEditorProps {
  stop: Stop;
}

export function StopBodyEditor({ stop }: StopBodyEditorProps) {
  const { updateStop } = useStopActions();

  const mutate = useCallback(
    (next: BodyBlock[]) => {
      const hasAny = next.some(
        (b) => b.type === "paragraph" || b.type === "pullQuote",
      );
      updateStop(stop.n, {
        body: next,
        status: { ...stop.status, body: hasAny },
      });
    },
    [updateStop, stop.n, stop.status],
  );

  const add = (kind: SupportedKind, index: number) => {
    const next = [...stop.body];
    const block: BodyBlock =
      kind === "paragraph"
        ? { type: "paragraph", content: "" }
        : kind === "pullQuote"
          ? { type: "pullQuote", content: "" }
          : {
              type: "metaRow",
              content: [stop.time, stop.mood.toUpperCase()],
            };
    next.splice(index, 0, block);
    mutate(next);
  };

  const update = (index: number, patch: Partial<BodyBlock>) => {
    const next = [...stop.body];
    next[index] = { ...next[index], ...patch } as BodyBlock;
    mutate(next);
  };

  const remove = (index: number) => {
    const next = stop.body.filter((_, i) => i !== index);
    mutate(next);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= stop.body.length) return;
    const next = [...stop.body];
    [next[index], next[target]] = [next[target], next[index]];
    mutate(next);
  };

  return (
    <section
      aria-label="Story body"
      style={{ marginTop: 40 }}
    >
      <div className="eyebrow" style={{ marginBottom: 12 }}>
        Body ({stop.body.length} blocks)
      </div>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 720,
        }}
      >
        {stop.body.map((block, index) => (
          <li key={index}>
            <BlockEditor
              block={block}
              onUpdate={(patch) => update(index, patch)}
              onRemove={() => remove(index)}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
            />
          </li>
        ))}
      </ul>

      <AddBlockBar onAdd={(k) => add(k, stop.body.length)} />
    </section>
  );
}

// ─── Block editor per type ─────────────────────────────────────────────

interface BlockEditorProps {
  block: BodyBlock;
  onUpdate: (patch: Partial<BodyBlock>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function BlockEditor({
  block,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: BlockEditorProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <div>
        {block.type === "paragraph" ? (
          <textarea
            value={block.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Write a paragraph…"
            rows={3}
            style={textareaStyle}
            aria-label="Paragraph"
          />
        ) : block.type === "pullQuote" ? (
          <textarea
            value={block.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="A short, quotable line…"
            rows={2}
            style={{
              ...textareaStyle,
              fontFamily: "var(--f-fashion, var(--mode-display-font))",
              fontStyle: "italic",
              fontSize: 22,
              lineHeight: 1.3,
              borderLeft: "3px solid var(--mode-accent)",
              paddingLeft: 14,
            }}
            aria-label="Pull quote"
          />
        ) : block.type === "metaRow" ? (
          <MetaRowEditor
            content={block.content}
            onChange={(next) =>
              onUpdate({ content: next } as Partial<BodyBlock>)
            }
          />
        ) : (
          <div
            className="mono-sm"
            style={{ opacity: 0.45, fontStyle: "italic", padding: 8 }}
          >
            [{block.type}] — advanced block, edit via F-T006/T007
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          paddingTop: 2,
        }}
      >
        <BlockButton onClick={onMoveUp} label="Move up" title="Move up">↑</BlockButton>
        <BlockButton onClick={onMoveDown} label="Move down" title="Move down">↓</BlockButton>
        <BlockButton onClick={onRemove} label="Remove block" title="Remove">×</BlockButton>
      </div>
    </div>
  );
}

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  border: "1px solid var(--rule)",
  background: "var(--paper)",
  fontFamily: "var(--f-sans)",
  fontSize: 15,
  lineHeight: 1.6,
  resize: "vertical",
  minHeight: 60,
};

function MetaRowEditor({
  content,
  onChange,
}: {
  content: readonly string[];
  onChange: (next: readonly string[]) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {content.map((piece, i) => (
        <input
          key={i}
          type="text"
          value={piece}
          onChange={(e) => {
            const next = [...content];
            next[i] = e.target.value;
            onChange(next);
          }}
          className="mono-sm"
          style={{
            padding: "6px 10px",
            border: "1px solid var(--rule)",
            background: "var(--paper)",
            fontSize: 11,
            letterSpacing: "0.06em",
          }}
        />
      ))}
      <button
        type="button"
        className="mono-sm"
        onClick={() => onChange([...content, ""])}
        style={{
          padding: "6px 10px",
          border: "1px dashed var(--rule)",
          background: "transparent",
          fontSize: 11,
          letterSpacing: "0.06em",
          cursor: "pointer",
        }}
      >
        + add cell
      </button>
    </div>
  );
}

function BlockButton({
  onClick,
  children,
  label,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={title}
      className="mono-sm"
      style={{
        width: 28,
        height: 28,
        border: "1px solid var(--rule)",
        background: "var(--paper)",
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ─── Add-block bar ────────────────────────────────────────────────────

function AddBlockBar({ onAdd }: { onAdd: (k: SupportedKind) => void }) {
  return (
    <div
      style={{
        marginTop: 18,
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        maxWidth: 720,
      }}
    >
      {(["paragraph", "pullQuote", "metaRow"] as const).map((kind) => (
        <button
          key={kind}
          type="button"
          className="btn btn-sm"
          onClick={() => onAdd(kind)}
        >
          + {labelFor(kind)}
        </button>
      ))}
    </div>
  );
}

function labelFor(kind: SupportedKind): string {
  if (kind === "paragraph") return "Paragraph";
  if (kind === "pullQuote") return "Pull quote";
  return "Meta row";
}
