"use client";

// 3D flip card — the star widget of the postcard editor.
// Click to flip between front (AI-generated art) and back (message +
// recipient address). Ported from legacy postcard-editor.jsx's flip
// container (rotateY transform, 700ms transition).

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import type { PostcardOrientation } from "./orientation-toggle";

export interface PostcardCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  orientation: PostcardOrientation;
  /** Controlled flip state (optional). */
  flipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
  /** Scale factor (0 to 1). Default 1. Used when card shrinks for export. */
  scale?: number;
  /** CSS class for the whole perspective wrapper. */
  className?: string;
}

export interface PostcardCardHandle {
  /** Get the front face DOM node (for html-to-image / jsPDF export). */
  frontNode: () => HTMLDivElement | null;
  backNode: () => HTMLDivElement | null;
}

// Card dimensions in mm (ISO B6-ish postcard). Converted to px at 96dpi
// × 3.78 roughly. We use CSS aspect-ratio to avoid px-locking at
// various container widths.
const CARD_DIMENSIONS: Record<
  PostcardOrientation,
  { aspectRatio: string; label: string }
> = {
  landscape: { aspectRatio: "148 / 105", label: "148 × 105mm · landscape" },
  portrait: { aspectRatio: "105 / 148", label: "105 × 148mm · portrait" },
};

export const PostcardCard = forwardRef<PostcardCardHandle, PostcardCardProps>(
  function PostcardCard(
    { front, back, orientation, flipped: controlled, onFlipChange, scale = 1, className },
    ref,
  ) {
    const [uncontrolled, setUncontrolled] = useState(false);
    const flipped = controlled ?? uncontrolled;

    const frontRef = useRef<HTMLDivElement>(null);
    const backRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      frontNode: () => frontRef.current,
      backNode: () => backRef.current,
    }));

    const toggleFlip = () => {
      const next = !flipped;
      if (onFlipChange) onFlipChange(next);
      else setUncontrolled(next);
    };

    const dims = CARD_DIMENSIONS[orientation];

    return (
      <div
        className={className}
        style={{
          perspective: 2000,
          width: "100%",
          maxWidth: orientation === "landscape" ? 680 : 480,
          margin: "0 auto",
          transform: `scale(${scale})`,
          transformOrigin: "center top",
        }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label={
            flipped ? "Postcard back — click to flip to front" : "Postcard front — click to flip to back"
          }
          onClick={toggleFlip}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleFlip();
            }
          }}
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: dims.aspectRatio,
            transformStyle: "preserve-3d",
            transition: "transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            cursor: "pointer",
            outline: "none",
          }}
          data-testid="postcard-card"
        >
          <div
            ref={frontRef}
            data-postcard-side="front"
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
              background: "var(--paper-2)",
              overflow: "hidden",
            }}
          >
            {front}
          </div>
          <div
            ref={backRef}
            data-postcard-side="back"
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
              background: "var(--paper)",
              overflow: "hidden",
            }}
          >
            {back}
          </div>
        </div>
        <div
          className="mono-sm"
          style={{
            textAlign: "center",
            marginTop: 14,
            opacity: 0.55,
            fontSize: 10,
          }}
        >
          {flipped ? "BACK" : "FRONT"} · {dims.label} · click to flip
        </div>
      </div>
    );
  },
);
