"use client";

// Postcard back — editable message on the left, recipient block on the right.
// Dotted vertical divider, handwriting font for the message, mono for address.

import type { Postcard } from "@/stores/types";

export interface PostcardBackProps {
  postcard: Postcard;
  onUpdate: (patch: Partial<Postcard>) => void;
  /** When true, inputs render as static text (for html-to-image export). */
  readOnly?: boolean;
}

export function PostcardBack({
  postcard,
  onUpdate,
  readOnly = false,
}: PostcardBackProps) {
  const updateRecipient = (k: keyof Postcard["recipient"], v: string) =>
    onUpdate({
      recipient: { ...postcard.recipient, [k]: v },
    });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: "1.4fr 1px 1fr",
        gap: 20,
        padding: "clamp(12px, 2.2vw, 26px)",
        background: "var(--paper)",
      }}
    >
      {/* Message side */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <div className="mono-sm" style={{ opacity: 0.45, fontSize: 9, letterSpacing: "0.18em" }}>
          MESSAGE
        </div>
        {readOnly ? (
          <p
            style={{
              marginTop: 10,
              fontFamily: "var(--f-hand, 'Caveat', cursive)",
              fontSize: "clamp(16px, 2vw, 24px)",
              lineHeight: 1.35,
              whiteSpace: "pre-wrap",
              flex: 1,
            }}
          >
            {postcard.message}
          </p>
        ) : (
          <textarea
            aria-label="Postcard message"
            value={postcard.message}
            onChange={(e) => onUpdate({ message: e.target.value })}
            placeholder="Dear M —"
            style={{
              marginTop: 10,
              flex: 1,
              fontFamily: "var(--f-hand, 'Caveat', cursive)",
              fontSize: "clamp(16px, 2vw, 24px)",
              lineHeight: 1.35,
              background: "transparent",
              border: "none",
              resize: "none",
              outline: "none",
            }}
          />
        )}
      </div>

      {/* Vertical divider */}
      <div
        style={{
          width: 1,
          background:
            "repeating-linear-gradient(to bottom, var(--rule) 0 4px, transparent 4px 8px)",
        }}
        aria-hidden
      />

      {/* Recipient side */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontFamily: "var(--f-mono)",
          fontSize: "clamp(10px, 1.1vw, 12px)",
          letterSpacing: "0.04em",
        }}
      >
        <div className="mono-sm" style={{ opacity: 0.45, fontSize: 9, letterSpacing: "0.18em" }}>
          TO
        </div>
        {readOnly ? (
          <div style={{ marginTop: 10, lineHeight: 1.7, flex: 1 }}>
            <div>{postcard.recipient.name}</div>
            <div>{postcard.recipient.line1}</div>
            <div>{postcard.recipient.line2}</div>
            <div style={{ textTransform: "uppercase" }}>
              {postcard.recipient.country}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {(
              [
                { key: "name" as const, placeholder: "Name" },
                { key: "line1" as const, placeholder: "Address line 1" },
                { key: "line2" as const, placeholder: "Address line 2" },
                { key: "country" as const, placeholder: "Country" },
              ]
            ).map((f) => (
              <input
                key={f.key}
                type="text"
                aria-label={`Recipient ${f.placeholder}`}
                value={postcard.recipient[f.key] ?? ""}
                onChange={(e) => updateRecipient(f.key, e.target.value)}
                placeholder={f.placeholder}
                style={{
                  width: "100%",
                  padding: "4px 0",
                  background: "transparent",
                  borderBottom: "1px dashed var(--rule)",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  letterSpacing: "inherit",
                  textTransform: f.key === "country" ? "uppercase" : "none",
                }}
              />
            ))}
          </div>
        )}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 10,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            aria-label="stamp"
            style={{
              width: 44,
              height: 58,
              border: "1px solid var(--mode-ink, var(--ink))",
              fontSize: 8,
              padding: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              opacity: 0.65,
            }}
          >
            <span style={{ fontFamily: "var(--f-fashion, serif)", fontStyle: "italic", fontSize: 12 }}>
              Cut.
            </span>
            <span style={{ fontSize: 6, letterSpacing: "0.15em" }}>ED.01</span>
          </div>
        </div>
      </div>
    </div>
  );
}
