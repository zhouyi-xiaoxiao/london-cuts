"use client";

// Story body editor — ports the legacy StoryEditor/NodeBody
// (archive/app-html-prototype-2026-04-20/src/workspace.jsx L1432-2014).
// Supports all 6 BodyBlock types:
//   - paragraph / pullQuote / metaRow  (text blocks — unchanged from F-T005)
//   - heroImage / inlineImage          (image blocks — use AssetPicker)
//   - mediaEmbed                       (read-only until media tasks ship)
// Slash-command menu is intentionally NOT ported — button-driven add-bar
// is plenty for M-fast.

import { useCallback, useEffect, useRef, useState } from "react";

import { applySkeleton } from "@/lib/layout/skeleton";
import { useAssets } from "@/stores/asset";
import { useStopActions } from "@/stores/stop";
import type { BodyBlock, Stop } from "@/stores/types";

import { AssetPicker } from "./asset-picker";

type SupportedKind =
  | "paragraph"
  | "pullQuote"
  | "metaRow"
  | "heroImage"
  | "inlineImage"
  | "mediaEmbed";

export interface StopBodyEditorProps {
  stop: Stop;
}

export function StopBodyEditor({ stop }: StopBodyEditorProps) {
  const { updateStop } = useStopActions();

  // Which block (by index) currently owns the open AssetPicker. `null`
  // means the picker is closed.
  const [pickerForIndex, setPickerForIndex] = useState<number | null>(null);

  // Rationale message surfaced after a successful AUTO-LAYOUT click.
  // `null` when no message is active. Auto-dismisses after 4s.
  const [autoLayoutMsg, setAutoLayoutMsg] = useState<string | null>(null);
  const autoLayoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (autoLayoutTimer.current) clearTimeout(autoLayoutTimer.current);
    },
    [],
  );

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
    const block = newBlock(kind, stop);
    next.splice(index, 0, block);
    mutate(next);
    // Image blocks default to empty assetId — immediately open the picker
    // so the user lands where they need to go.
    if (kind === "heroImage" || kind === "inlineImage") {
      setPickerForIndex(index);
    }
  };

  const update = (index: number, patch: Partial<BodyBlock>) => {
    const next = [...stop.body];
    next[index] = { ...next[index], ...patch } as BodyBlock;
    mutate(next);
  };

  const remove = (index: number) => {
    const next = stop.body.filter((_, i) => i !== index);
    mutate(next);
    // If the removed block had a picker open, close it.
    if (pickerForIndex === index) setPickerForIndex(null);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= stop.body.length) return;
    const next = [...stop.body];
    [next[index], next[target]] = [next[target], next[index]];
    mutate(next);
  };

  const onAutoLayout = () => {
    const result = applySkeleton(stop.body, {
      mood: stop.mood,
      time: stop.time,
      // Hero lives in a separate slot — don't duplicate it into the body.
      hasExplicitHero: Boolean(stop.heroAssetId),
    });
    mutate(result.blocks);
    setAutoLayoutMsg(result.rationale);
    if (autoLayoutTimer.current) clearTimeout(autoLayoutTimer.current);
    autoLayoutTimer.current = setTimeout(() => setAutoLayoutMsg(null), 4000);
  };

  const activePickerBlock =
    pickerForIndex != null ? stop.body[pickerForIndex] : null;
  const pickerCurrentAssetId =
    activePickerBlock &&
    (activePickerBlock.type === "heroImage" ||
      activePickerBlock.type === "inlineImage")
      ? activePickerBlock.assetId || null
      : null;

  return (
    <section aria-label="Story body" style={{ marginTop: 40 }}>
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
              onOpenPicker={() => setPickerForIndex(index)}
            />
          </li>
        ))}
      </ul>

      <AutoLayoutBar
        disabled={stop.body.length === 0}
        onClick={onAutoLayout}
        rationale={autoLayoutMsg}
        onDismiss={() => setAutoLayoutMsg(null)}
      />

      <AddBlockBar onAdd={(k) => add(k, stop.body.length)} />

      {pickerForIndex != null && (
        <AssetPicker
          stop={stop}
          currentAssetId={pickerCurrentAssetId}
          onPick={(assetId) => {
            update(pickerForIndex, { assetId } as Partial<BodyBlock>);
            setPickerForIndex(null);
          }}
          onClose={() => setPickerForIndex(null)}
        />
      )}
    </section>
  );
}

// ─── Sensible defaults when inserting a new block ──────────────────────

function newBlock(kind: SupportedKind, stop: Stop): BodyBlock {
  switch (kind) {
    case "paragraph":
      return { type: "paragraph", content: "" };
    case "pullQuote":
      return { type: "pullQuote", content: "" };
    case "metaRow":
      return {
        type: "metaRow",
        content: [stop.time, stop.mood.toUpperCase()],
      };
    case "heroImage":
      return { type: "heroImage", assetId: "", caption: "" };
    case "inlineImage":
      return {
        type: "inlineImage",
        assetId: "",
        caption: "",
        align: "left",
      };
    case "mediaEmbed":
      return { type: "mediaEmbed", taskId: "", caption: "" };
  }
}

// ─── Block editor per type ─────────────────────────────────────────────

interface BlockEditorProps {
  block: BodyBlock;
  onUpdate: (patch: Partial<BodyBlock>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onOpenPicker: () => void;
}

function BlockEditor({
  block,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onOpenPicker,
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
              fontFamily: "var(--mode-display-font, var(--f-fashion))",
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
        ) : block.type === "heroImage" ? (
          <HeroImageEditor
            assetId={block.assetId}
            caption={block.caption}
            onChangeCaption={(caption) => onUpdate({ caption })}
            onOpenPicker={onOpenPicker}
          />
        ) : block.type === "inlineImage" ? (
          <InlineImageEditor
            assetId={block.assetId}
            caption={block.caption}
            align={block.align}
            onChangeCaption={(caption) => onUpdate({ caption })}
            onChangeAlign={(align) =>
              onUpdate({ align } as Partial<BodyBlock>)
            }
            onOpenPicker={onOpenPicker}
          />
        ) : (
          <MediaEmbedEditor
            taskId={block.taskId}
            caption={block.caption}
            onChangeCaption={(caption) => onUpdate({ caption })}
          />
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
        <BlockButton onClick={onMoveUp} label="Move up" title="Move up">
          ↑
        </BlockButton>
        <BlockButton onClick={onMoveDown} label="Move down" title="Move down">
          ↓
        </BlockButton>
        <BlockButton onClick={onRemove} label="Remove block" title="Remove">
          ×
        </BlockButton>
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

// ─── Image editors ─────────────────────────────────────────────────────

function AssetThumbnail({
  assetId,
  emptyLabel,
}: {
  assetId: string;
  emptyLabel: string;
}) {
  const assets = useAssets();
  const asset = assetId ? assets.find((a) => a.id === assetId) : undefined;
  if (!asset || !asset.imageUrl) {
    return (
      <div
        style={{
          width: "100%",
          aspectRatio: "7 / 5",
          border: "1px dashed var(--rule)",
          background: "var(--paper-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          className="mono-sm"
          style={{ opacity: 0.45, letterSpacing: "0.2em", fontSize: 11 }}
        >
          {emptyLabel}
        </div>
        <div
          className="mono-sm"
          style={{ opacity: 0.35, fontSize: 10 }}
        >
          (no photo yet — click “Change photo”)
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "7 / 5",
        border: "1px solid var(--rule)",
        background: "var(--paper-2)",
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.imageUrl}
        alt={asset.id}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );
}

function HeroImageEditor({
  assetId,
  caption,
  onChangeCaption,
  onOpenPicker,
}: {
  assetId: string;
  caption: string;
  onChangeCaption: (v: string) => void;
  onOpenPicker: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <AssetThumbnail assetId={assetId} emptyLabel="HERO IMAGE" />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn btn-sm"
          onClick={onOpenPicker}
        >
          {assetId ? "Change photo" : "Pick a photo"}
        </button>
      </div>
      <textarea
        value={caption}
        onChange={(e) => onChangeCaption(e.target.value)}
        placeholder="Caption…"
        rows={2}
        style={textareaStyle}
        aria-label="Hero image caption"
      />
    </div>
  );
}

function InlineImageEditor({
  assetId,
  caption,
  align,
  onChangeCaption,
  onChangeAlign,
  onOpenPicker,
}: {
  assetId: string;
  caption: string;
  align: "left" | "right" | "center";
  onChangeCaption: (v: string) => void;
  onChangeAlign: (v: "left" | "right" | "center") => void;
  onOpenPicker: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <AssetThumbnail assetId={assetId} emptyLabel="INLINE IMAGE" />
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="btn btn-sm"
          onClick={onOpenPicker}
        >
          {assetId ? "Change photo" : "Pick a photo"}
        </button>
        <AlignToggle value={align} onChange={onChangeAlign} />
      </div>
      <textarea
        value={caption}
        onChange={(e) => onChangeCaption(e.target.value)}
        placeholder="Inline caption…"
        rows={2}
        style={textareaStyle}
        aria-label="Inline image caption"
      />
    </div>
  );
}

function AlignToggle({
  value,
  onChange,
}: {
  value: "left" | "right" | "center";
  onChange: (v: "left" | "right" | "center") => void;
}) {
  const options: readonly ("left" | "center" | "right")[] = [
    "left",
    "center",
    "right",
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Inline image alignment"
      style={{ display: "inline-flex", border: "1px solid var(--rule)" }}
    >
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`Align ${opt}`}
            onClick={() => onChange(opt)}
            className="mono-sm"
            style={{
              padding: "6px 10px",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: active ? "var(--ink)" : "var(--paper)",
              color: active ? "var(--paper)" : "var(--ink)",
              border: "none",
              borderRight:
                opt === "right" ? "none" : "1px solid var(--rule)",
              cursor: "pointer",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function MediaEmbedEditor({
  taskId,
  caption,
  onChangeCaption,
}: {
  taskId: string;
  caption: string;
  onChangeCaption: (v: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        border: "1px dashed var(--rule)",
        padding: 12,
        background: "var(--paper-2)",
      }}
    >
      <div
        className="mono-sm"
        style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          opacity: 0.6,
          textTransform: "uppercase",
        }}
      >
        Media embed
      </div>
      <div
        className="mono-sm"
        style={{
          fontSize: 11,
          background: "var(--paper)",
          border: "1px solid var(--rule)",
          padding: "6px 10px",
          fontFamily: "var(--f-mono)",
          opacity: taskId ? 1 : 0.55,
        }}
        aria-label="Media task id"
      >
        taskId: {taskId || "(none)"}
      </div>
      <div>
        <button
          type="button"
          className="btn btn-sm"
          disabled
          title="Media tasks coming later"
          aria-label="Replace media task (disabled)"
        >
          Replace
        </button>
      </div>
      <textarea
        value={caption}
        onChange={(e) => onChangeCaption(e.target.value)}
        placeholder="Embed caption…"
        rows={2}
        style={textareaStyle}
        aria-label="Media embed caption"
      />
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
  const KINDS: readonly SupportedKind[] = [
    "paragraph",
    "pullQuote",
    "metaRow",
    "heroImage",
    "inlineImage",
    "mediaEmbed",
  ];
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
      {KINDS.map((kind) => (
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
  if (kind === "metaRow") return "Meta row";
  if (kind === "heroImage") return "Hero image";
  if (kind === "inlineImage") return "Inline image";
  return "Media embed";
}

// ─── Auto-layout bar ──────────────────────────────────────────────────

function AutoLayoutBar({
  disabled,
  onClick,
  rationale,
  onDismiss,
}: {
  disabled: boolean;
  onClick: () => void;
  rationale: string | null;
  onDismiss: () => void;
}) {
  const title = disabled
    ? "Add a block first — AUTO-LAYOUT rearranges what you've written"
    : "Rearrange the body blocks into a beautiful shape";
  return (
    <div
      style={{
        marginTop: 24,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 720,
      }}
    >
      <div>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          title={title}
          aria-label="Auto-layout body blocks"
          className="mono-sm"
          style={{
            padding: "10px 18px",
            border: "1px solid var(--ink)",
            background: disabled ? "var(--paper-2)" : "var(--ink)",
            color: disabled ? "var(--ink)" : "var(--paper)",
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.55 : 1,
          }}
        >
          ✨ Auto-layout
        </button>
      </div>
      {rationale && (
        <div
          role="status"
          aria-live="polite"
          className="mono-sm"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            background: "var(--paper-2)",
            border: "1px solid var(--rule)",
            fontFamily: "var(--f-mono)",
            fontSize: 11,
            lineHeight: 1.5,
            opacity: 0.9,
            animation: "skeleton-fade-in 200ms ease-out",
          }}
        >
          <span style={{ flex: 1 }}>{rationale}</span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss auto-layout message"
            title="Dismiss"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
              lineHeight: 1,
              padding: 2,
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
