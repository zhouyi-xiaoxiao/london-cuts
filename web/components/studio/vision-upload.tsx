"use client";

// Vision pipeline — upload a folder of photos, GPT-4o (via /api/vision/describe)
// analyses each, and we auto-create stops with title/body/postcard pre-filled.
//
// Ported from archive/app-html-prototype-2026-04-20/src/vision-pipeline.jsx.
// Differences:
//   - Server-side API (/api/vision/describe) replaces client-side OpenAI call
//   - Uses F-T001 prepareImage() for EXIF + resize before sending
//   - Concurrency limiter: 3 in flight max (legacy was 4)
//   - MOCK mode default — real mode flagged via AI_PROVIDER_MOCK=false

import { useRef, useState } from "react";

import type { VisionAnalysisResult } from "@/lib/ai-provider";
import { prepareImage } from "@/lib/utils/image";
import { useAssetActions } from "@/stores/asset";
import { useProjectActions } from "@/stores/project";
import { useStopActions } from "@/stores/stop";
import { useRootStore } from "@/stores/root";
import type { Stop, StopTone } from "@/stores/types";

interface ProgressItem {
  fileName: string;
  status: "queued" | "resizing" | "describing" | "done" | "failed";
  error?: string;
  result?: VisionAnalysisResult & { mock: boolean };
}

export interface VisionUploadProps {
  onComplete?: (stopsCreated: number) => void;
  onClose?: () => void;
}

export function VisionUpload({ onComplete, onClose }: VisionUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [spendCents, setSpendCents] = useState<number | null>(null);

  const { setStops } = useStopActions();
  const { addAsset } = useAssetActions();
  const { setProject, archiveCurrentProject } = useProjectActions();

  async function onFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, 20); // cap at 20 for safety
    setBusy(true);
    setItems(files.map((f) => ({ fileName: f.name, status: "queued" })));

    const results: Array<{
      dataUrl: string;
      description: VisionAnalysisResult & { mock: boolean };
      fileName: string;
    }> = [];

    // Concurrency limit: 3 photos in flight
    const concurrency = 3;
    let nextIdx = 0;
    const workers = Array.from({ length: concurrency }).map(async () => {
      while (nextIdx < files.length) {
        const idx = nextIdx++;
        const file = files[idx];
        try {
          setItems((prev) =>
            prev.map((p, i) => (i === idx ? { ...p, status: "resizing" } : p)),
          );
          const { dataUrl } = await prepareImage(file, { maxEdge: 1024 });

          setItems((prev) =>
            prev.map((p, i) =>
              i === idx ? { ...p, status: "describing" } : p,
            ),
          );
          const res = await fetch("/api/vision/describe", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ imageDataUrl: dataUrl }),
          });
          const body = (await res.json()) as
            | (VisionAnalysisResult & {
                costCents: number;
                mock: boolean;
                spendToDateCents: number;
              })
            | { error: string; spendToDateCents?: number };
          if (!res.ok || !("title" in body)) {
            const msg = "error" in body ? body.error : "vision failed";
            setItems((prev) =>
              prev.map((p, i) =>
                i === idx ? { ...p, status: "failed", error: msg } : p,
              ),
            );
            continue;
          }
          if (typeof body.spendToDateCents === "number") {
            setSpendCents(body.spendToDateCents);
          }
          results.push({
            dataUrl,
            description: {
              title: body.title,
              paragraph: body.paragraph,
              pullQuote: body.pullQuote,
              postcardMessage: body.postcardMessage,
              mood: body.mood,
              tone: body.tone,
              locationHint: body.locationHint,
              mock: body.mock,
            },
            fileName: file.name,
          });
          setItems((prev) =>
            prev.map((p, i) =>
              i === idx
                ? {
                    ...p,
                    status: "done",
                    result: {
                      title: body.title,
                      paragraph: body.paragraph,
                      pullQuote: body.pullQuote,
                      postcardMessage: body.postcardMessage,
                      mood: body.mood,
                      tone: body.tone,
                      locationHint: body.locationHint,
                      mock: body.mock,
                    },
                  }
                : p,
            ),
          );
        } catch (err) {
          setItems((prev) =>
            prev.map((p, i) =>
              i === idx
                ? {
                    ...p,
                    status: "failed",
                    error: err instanceof Error ? err.message : "unknown",
                  }
                : p,
            ),
          );
        }
      }
    });

    await Promise.all(workers);

    if (results.length === 0) {
      setBusy(false);
      return;
    }

    // Build a fresh project from the results.
    archiveCurrentProject();
    const now = new Date().toISOString();
    const projectId = `proj-vision-${Date.now().toString(36)}`;
    const slugBase =
      results[0].description.locationHint?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
      "new-walk";
    const slug = `${slugBase}-${Date.now().toString(36).slice(-4)}`;

    setProject({
      id: projectId,
      ownerId: "local",
      slug,
      title: slugBase.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "New walk from photos",
      subtitle: null,
      locationName: results[0].description.locationHint ?? null,
      defaultMode: "fashion",
      status: "draft",
      visibility: "public",
      coverAssetId: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    const newStops: Stop[] = results.map((r, i) => {
      const n = String(i + 1).padStart(2, "0");
      const assetId = `asset-vision-${projectId}-${n}`;
      // Write the asset
      addAsset({
        id: assetId,
        stop: n,
        tone: r.description.tone as StopTone,
        imageUrl: r.dataUrl,
      });
      return {
        n,
        code: r.description.locationHint.slice(0, 8) || "—",
        title: r.description.title,
        time: new Date().toTimeString().slice(0, 5),
        mood: r.description.mood,
        tone: r.description.tone as StopTone,
        lat: 0,
        lng: 0,
        label: (r.description.title || "").toUpperCase(),
        status: { upload: true, hero: true, body: true, media: "done" },
        heroAssetId: assetId,
        assetIds: [assetId],
        body: [
          { type: "paragraph" as const, content: r.description.paragraph },
          ...(r.description.pullQuote
            ? [{ type: "pullQuote" as const, content: r.description.pullQuote }]
            : []),
        ],
        postcard: {
          message: r.description.postcardMessage,
          recipient: { name: "", line1: "", line2: "", country: "" },
        },
      };
    });

    setStops(newStops);
    // Also set the active stop to the first one.
    useRootStore.getState().setActiveStop(newStops[0].n);

    setBusy(false);
    onComplete?.(newStops.length);
  }

  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "failed").length;
  const total = items.length;

  return (
    <section
      aria-label="New from photos — vision pipeline"
      style={{
        marginTop: 32,
        padding: 24,
        border: "1px dashed var(--rule)",
        background: "var(--paper-2)",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div className="eyebrow">New from photos</div>
          <h2
            style={{
              fontFamily: "var(--f-fashion, var(--mode-display-font))",
              fontStyle: "italic",
              fontSize: "clamp(28px, 4vw, 40px)",
              lineHeight: 1,
              margin: "6px 0 0",
            }}
          >
            Upload a folder → stops appear.
          </h2>
          <p className="mono-sm" style={{ opacity: 0.55, fontSize: 11, marginTop: 8 }}>
            GPT-4o mini analyses each photo for title / paragraph / postcard
            message. ~1 cent per photo. MOCK by default — flip
            AI_PROVIDER_MOCK=false for real.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={onClose}
            aria-label="Close vision upload"
          >
            ×
          </button>
        )}
      </header>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
        <button
          type="button"
          className="btn btn-solid"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "Analysing…" : "Pick photos"}
        </button>
        {spendCents !== null && (
          <span className="mono-sm" style={{ alignSelf: "center", opacity: 0.6 }}>
            spend to date: {spendCents}¢
          </span>
        )}
      </div>

      {items.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="mono-sm" style={{ marginBottom: 10, opacity: 0.7 }}>
            {done}/{total} analysed {failed > 0 ? `· ${failed} failed` : ""}
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              maxHeight: 240,
              overflowY: "auto",
              border: "1px solid var(--rule)",
            }}
          >
            {items.map((item, i) => (
              <li
                key={i}
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--rule)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 12,
                }}
              >
                <span className="mono-sm" style={{ fontSize: 11, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.fileName}
                </span>
                <StatusBadge status={item.status} />
                {item.result?.title && (
                  <span
                    style={{
                      fontSize: 12,
                      fontStyle: "italic",
                      fontFamily: "var(--f-fashion, var(--mode-display-font))",
                      flex: 2,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={item.result.title}
                  >
                    {item.result.title}
                  </span>
                )}
                {item.error && (
                  <span className="mono-sm" style={{ fontSize: 10, color: "var(--mode-accent)" }}>
                    {item.error}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: ProgressItem["status"] }) {
  const color: Record<ProgressItem["status"], string> = {
    queued: "rgba(0,0,0,0.35)",
    resizing: "var(--mode-ink, var(--ink))",
    describing: "var(--mode-accent)",
    done: "var(--mode-ink, var(--ink))",
    failed: "var(--mode-accent)",
  };
  return (
    <span
      className="mono-sm"
      style={{
        fontSize: 9,
        letterSpacing: "0.14em",
        padding: "2px 6px",
        border: `1px solid ${color[status]}`,
        color: color[status],
        whiteSpace: "nowrap",
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}
