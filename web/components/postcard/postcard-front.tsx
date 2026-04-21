"use client";

// Postcard front — shows the currently-selected AI-generated art image,
// or a placeholder if none generated yet. Stop number pill in bottom-right.

export interface PostcardFrontProps {
  imageUrl: string | null;
  stopNumber: string;
  totalStops: number;
  styleLabel: string | null;
}

export function PostcardFront({
  imageUrl,
  stopNumber,
  totalStops,
  styleLabel,
}: PostcardFrontProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: imageUrl ? "var(--paper-3)" : "var(--paper-2)",
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={styleLabel ?? "postcard art"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div
            className="mono-sm"
            style={{ opacity: 0.45, letterSpacing: "0.2em" }}
          >
            NO POSTCARD ART YET
          </div>
          <div
            className="mono-sm"
            style={{ opacity: 0.3, fontSize: 10 }}
          >
            Pick a style + click Generate
          </div>
        </div>
      )}

      {/* Stop counter pill */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          padding: "4px 10px",
          background: "var(--paper)",
          border: "1px solid var(--mode-ink, var(--ink))",
          fontFamily: "var(--f-mono)",
          fontSize: 9,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {stopNumber} / {totalStops}
      </div>

      {/* Style label pill (only when we have art) */}
      {imageUrl && styleLabel && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            padding: "4px 10px",
            background: "var(--paper)",
            border: "1px solid var(--mode-ink, var(--ink))",
            fontFamily: "var(--f-mono)",
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {styleLabel}
        </div>
      )}
    </div>
  );
}
