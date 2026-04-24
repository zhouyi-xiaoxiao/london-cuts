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

import type {
  ComposeProjectResult,
  VisionAnalysisResult,
} from "@/lib/ai-provider";
import {
  codeFromLocationHint,
  coordinateForPhoto,
  coordinateForPhotos,
  earliestCaptureIso,
  sortPhotosByCapture,
  timeLabelFromCapture,
  type PhotoGrounding,
} from "@/lib/photo-grounding";
import { prepareImage } from "@/lib/utils/image";
import { useAssetActions } from "@/stores/asset";
import { useProjectActions } from "@/stores/project";
import { useStopActions } from "@/stores/stop";
import { useRootStore } from "@/stores/root";
import type { BodyBlock, Stop, StopTone } from "@/stores/types";

interface ProgressItem {
  fileName: string;
  status: "queued" | "resizing" | "describing" | "done" | "failed";
  error?: string;
  result?: VisionAnalysisResult & { mock: boolean };
}

/** One described photo we've analysed, ready to hand off to either the
 *  "one stop per photo" flow or the compose-project flow. Kept in-memory
 *  until the user picks an outcome. */
interface DescribedPhoto {
  id: string;
  fileName: string;
  dataUrl: string;
  grounding: PhotoGrounding;
  description: VisionAnalysisResult & { mock: boolean };
}

export interface VisionUploadProps {
  onComplete?: (stopsCreated: number) => void;
  onClose?: () => void;
}

export function VisionUpload({ onComplete, onClose }: VisionUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [composing, setComposing] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [describedPhotos, setDescribedPhotos] = useState<DescribedPhoto[]>([]);
  const [spendCents, setSpendCents] = useState<number | null>(null);

  const { setStops } = useStopActions();
  const { addAsset } = useAssetActions();
  const { setProject, archiveCurrentProject } = useProjectActions();

  async function onFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, 20); // cap at 20 for safety
    setBusy(true);
    setComposeError(null);
    setDescribedPhotos([]);
    setItems(files.map((f) => ({ fileName: f.name, status: "queued" })));

    const results: Array<{
      id: string;
      dataUrl: string;
      grounding: PhotoGrounding;
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
          const { dataUrl, lat, lng, dateOriginal } = await prepareImage(file, {
            maxEdge: 1024,
          });
          const grounding: PhotoGrounding = {
            lat,
            lng,
            capturedAtIso: dateOriginal?.toISOString() ?? null,
          };

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
            id: `photo-${idx}-${Date.now().toString(36)}`,
            dataUrl,
            grounding,
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

    setBusy(false);

    if (results.length === 0) return;

    // Park the described photos in state — the owner now picks between
    // "one stop per photo" (straight-through) and "✨ generate full draft"
    // (calls /api/ai/compose-project to group + add project metadata).
    setDescribedPhotos(sortPhotosByCapture(results));
  }

  /** Create exactly one stop per described photo. The legacy straight-through
   *  flow. Fast, zero extra AI cost, but N photos = N stops with no grouping. */
  function createStopsOnePerPhoto() {
    if (describedPhotos.length === 0) return;

    archiveCurrentProject();
    const now = new Date().toISOString();
    const projectId = `proj-vision-${Date.now().toString(36)}`;
    const slugBase =
      describedPhotos[0].description.locationHint
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "new-walk";
    const slug = `${slugBase}-${Date.now().toString(36).slice(-4)}`;

    setProject({
      id: projectId,
      ownerId: "local",
      slug,
      title:
        slugBase.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
        "New walk from photos",
      subtitle: null,
      locationName: describedPhotos[0].description.locationHint ?? null,
      defaultMode: "fashion",
      status: "draft",
      visibility: "public",
      coverAssetId: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    const newStops: Stop[] = describedPhotos.map((r, i) => {
      const n = String(i + 1).padStart(2, "0");
      const assetId = `asset-vision-${projectId}-${n}`;
      addAsset({
        id: assetId,
        stop: n,
        tone: r.description.tone as StopTone,
        imageUrl: r.dataUrl,
      });
      const coord = coordinateForPhoto(r) ?? { lat: 0, lng: 0 };
      const time =
        timeLabelFromCapture(r.grounding.capturedAtIso) ||
        new Date().toTimeString().slice(0, 5);
      return {
        n,
        code: codeFromLocationHint(r.description.locationHint),
        title: r.description.title,
        time,
        mood: r.description.mood,
        tone: r.description.tone as StopTone,
        lat: coord.lat,
        lng: coord.lng,
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
    useRootStore.getState().setActiveStop(newStops[0].n);
    setDescribedPhotos([]);
    onComplete?.(newStops.length);
  }

  /** AI-group the described photos into fewer, richer stops via the
   *  compose-project endpoint, then materialise them. ~$0.02 per project. */
  async function generateFullDraft() {
    if (describedPhotos.length === 0) return;
    setComposing(true);
    setComposeError(null);
    try {
      const res = await fetch("/api/ai/compose-project", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          photos: describedPhotos.map((p) => ({
            id: p.id,
            fileName: p.fileName,
            lat: p.grounding.lat,
            lng: p.grounding.lng,
            capturedAtIso: p.grounding.capturedAtIso,
            description: p.description,
          })),
        }),
      });
      const body = (await res.json()) as
        | (ComposeProjectResult & { spendToDateCents?: number })
        | { error: string };
      if (!res.ok || !("project" in body)) {
        const msg = "error" in body ? body.error : "compose failed";
        setComposeError(msg);
        setComposing(false);
        return;
      }
      if (typeof (body as { spendToDateCents?: number }).spendToDateCents === "number") {
        setSpendCents((body as { spendToDateCents: number }).spendToDateCents);
      }

      // ── Materialise the project + grouped stops. ───────────────────
      archiveCurrentProject();
      const now = new Date().toISOString();
      const projectId = `proj-compose-${Date.now().toString(36)}`;
      const composed = body as ComposeProjectResult;

      const slug = composed.project.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48) || `project-${Date.now().toString(36).slice(-4)}`;

      setProject({
        id: projectId,
        ownerId: "local",
        slug,
        title: composed.project.title,
        subtitle: composed.project.subtitle ?? null,
        locationName: null,
        defaultMode: composed.project.defaultMode,
        status: "draft",
        visibility: "public",
        coverAssetId: null,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      });

      // Pre-index photos by id for quick lookup during asset creation.
      const photoById = new Map(describedPhotos.map((p) => [p.id, p]));

      const newStops: Stop[] = composed.stops.map((cs, i) => {
        const n = String(i + 1).padStart(2, "0");
        const assetIds: string[] = [];
        let heroAssetId: string | null = null;
        const groupedPhotos: DescribedPhoto[] = [];

        for (const photoId of cs.photoIds) {
          const photo = photoById.get(photoId);
          if (!photo) continue;
          groupedPhotos.push(photo);
          const assetId = `asset-compose-${projectId}-${n}-${photoId}`;
          addAsset({
            id: assetId,
            stop: n,
            tone: cs.tone,
            imageUrl: photo.dataUrl,
          });
          assetIds.push(assetId);
          if (photoId === cs.heroPhotoId || heroAssetId === null) {
            heroAssetId = assetId;
          }
        }

        // Build body: paragraphs verbatim from the LLM's pick, pullQuote
        // between paragraphs 1 and 2 if we have ≥2 paragraphs.
        const paras = cs.paragraphs.filter(Boolean);
        const body: BodyBlock[] = [];
        if (paras[0]) body.push({ type: "paragraph", content: paras[0] });
        if (cs.pullQuote) body.push({ type: "pullQuote", content: cs.pullQuote });
        for (let pi = 1; pi < paras.length; pi++) {
          body.push({ type: "paragraph", content: paras[pi] });
        }

        const heroPhoto = photoById.get(cs.heroPhotoId);
        const coord =
          (heroPhoto ? coordinateForPhoto(heroPhoto) : null) ??
          coordinateForPhotos(groupedPhotos) ??
          (typeof cs.lat === "number" && typeof cs.lng === "number"
            ? { lat: cs.lat, lng: cs.lng }
            : { lat: 0, lng: 0 });
        const capturedAtIso = earliestCaptureIso(groupedPhotos);
        const time =
          timeLabelFromCapture(capturedAtIso) ||
          cs.timeLabel ||
          new Date().toTimeString().slice(0, 5);

        return {
          n,
          code: cs.code || "—",
          title: cs.title,
          time,
          mood: cs.mood,
          tone: cs.tone,
          lat: coord.lat,
          lng: coord.lng,
          label: cs.title.toUpperCase(),
          status: {
            upload: assetIds.length > 0,
            hero: heroAssetId !== null,
            body: body.length > 0,
            media: null,
          },
          heroAssetId,
          assetIds,
          body,
          postcard: {
            message: cs.postcardMessage,
            recipient: { name: "", line1: "", line2: "", country: "" },
          },
        };
      });

      setStops(newStops);
      if (newStops[0]) useRootStore.getState().setActiveStop(newStops[0].n);
      setDescribedPhotos([]);
      setComposing(false);
      onComplete?.(newStops.length);
    } catch (err) {
      setComposeError(err instanceof Error ? err.message : "compose failed");
      setComposing(false);
    }
  }

  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "failed").length;
  const total = items.length;
  const groundedCount = describedPhotos.filter((p) =>
    coordinateForPhoto(p),
  ).length;

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
              fontFamily: "var(--mode-display-font, var(--f-fashion))",
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

      {describedPhotos.length > 0 && !busy && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            border: "1px solid var(--rule)",
            background: "var(--paper)",
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            {describedPhotos.length} photos analysed
            {groundedCount > 0 ? ` · ${groundedCount} GPS` : ""} — pick a mode
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={createStopsOnePerPhoto}
              disabled={composing}
              title="Create one stop per photo — no extra AI call"
            >
              + Create {describedPhotos.length} stops
            </button>
            <button
              type="button"
              className="btn btn-solid"
              onClick={generateFullDraft}
              disabled={composing}
              title="AI groups photos into fewer richer stops + picks a project title. ~2¢."
              style={{
                background: "var(--mode-accent, var(--accent))",
                borderColor: "var(--mode-accent, var(--accent))",
                color: "var(--paper)",
              }}
            >
              {composing ? "✨ composing…" : "✨ Generate full draft"}
            </button>
          </div>
          {composeError && (
            <div
              role="alert"
              className="mono-sm"
              style={{
                marginTop: 10,
                padding: "6px 10px",
                background: "var(--mode-accent, #b8360a)",
                color: "var(--paper)",
                fontSize: 10,
              }}
            >
              {composeError}
            </div>
          )}
        </div>
      )}

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
                      fontFamily: "var(--mode-display-font, var(--f-fashion))",
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
