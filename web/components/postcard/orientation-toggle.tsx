"use client";

export type PostcardOrientation = "portrait" | "landscape";

export interface OrientationToggleProps {
  value: PostcardOrientation;
  onChange: (next: PostcardOrientation) => void;
}

export function OrientationToggle({ value, onChange }: OrientationToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Postcard orientation"
      style={{ display: "inline-flex", gap: 0, border: "1px solid var(--rule)" }}
    >
      {(["landscape", "portrait"] as const).map((o) => (
        <button
          key={o}
          role="radio"
          aria-checked={value === o}
          type="button"
          onClick={() => onChange(o)}
          className="mono-sm"
          style={{
            padding: "6px 12px",
            background:
              value === o ? "var(--mode-ink, var(--ink))" : "transparent",
            color:
              value === o ? "var(--mode-bg, var(--paper))" : "var(--mode-ink, var(--ink))",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
            border: "none",
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
