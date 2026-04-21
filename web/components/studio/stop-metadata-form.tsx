"use client";

// Stop metadata form — title, time, mood, tone, location code, lat/lng.
// Each input is controlled + writes back through the `stop` store.

import { useStopActions } from "@/stores/stop";
import type { Stop, StopTone } from "@/stores/types";

const TONE_OPTIONS: readonly StopTone[] = ["warm", "cool", "punk"] as const;

export interface StopMetadataFormProps {
  stop: Stop;
}

export function StopMetadataForm({ stop }: StopMetadataFormProps) {
  const { updateStop } = useStopActions();

  return (
    <section
      aria-label="Stop metadata"
      style={{
        marginTop: 32,
        padding: 20,
        border: "1px solid var(--rule)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 16,
      }}
    >
      <LabeledInput
        label="Location code"
        value={stop.code}
        onChange={(v) => updateStop(stop.n, { code: v })}
        placeholder="SE1 9DT / 101 RVK / …"
      />
      <LabeledInput
        label="Time"
        value={stop.time}
        onChange={(v) => updateStop(stop.n, { time: v })}
        placeholder="HH:MM"
      />
      <LabeledInput
        label="Mood (one word)"
        value={stop.mood}
        onChange={(v) => updateStop(stop.n, { mood: v })}
        placeholder="Amber · Glacier · Ember"
      />
      <div>
        <FieldLabel>Tone</FieldLabel>
        <div
          role="radiogroup"
          aria-label="Tone"
          style={{
            display: "flex",
            gap: 6,
            marginTop: 6,
            flexWrap: "wrap",
          }}
        >
          {TONE_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={stop.tone === t}
              onClick={() => updateStop(stop.n, { tone: t })}
              className="mono-sm"
              style={{
                padding: "6px 10px",
                border: "1px solid var(--mode-ink, var(--ink))",
                background:
                  stop.tone === t
                    ? "var(--mode-ink, var(--ink))"
                    : "transparent",
                color:
                  stop.tone === t
                    ? "var(--mode-bg, var(--paper))"
                    : "var(--mode-ink, var(--ink))",
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                minHeight: 32,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <LabeledInput
        label="Latitude"
        value={String(stop.lat)}
        onChange={(v) => {
          const n = Number(v);
          if (!Number.isNaN(n)) updateStop(stop.n, { lat: n });
        }}
        placeholder="51.5074"
      />
      <LabeledInput
        label="Longitude"
        value={String(stop.lng)}
        onChange={(v) => {
          const n = Number(v);
          if (!Number.isNaN(n)) updateStop(stop.n, { lng: n });
        }}
        placeholder="-0.1278"
      />
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mono-sm"
      style={{
        fontSize: 10,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        opacity: 0.55,
      }}
    >
      {children}
    </div>
  );
}

interface LabeledInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: LabeledInputProps) {
  return (
    <label style={{ display: "block" }}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          marginTop: 6,
          width: "100%",
          padding: "6px 0",
          borderBottom: "1px solid var(--rule)",
          background: "transparent",
          fontFamily: "var(--f-sans)",
          fontSize: 14,
        }}
      />
    </label>
  );
}
