"use client";

// Right column of the workspace: asset pool + media queue tabs.
// AssetsDrawer ports the legacy `AssetsPoolDrawer` (workspace.jsx 2340–2491)
// forward: thumbnail grid, drag-source, hover × delete, hover ⇥ detach,
// per-section upload buttons (multi-file). QueueDrawer is still a placeholder.

import { useRef, useState } from "react";

import { MIME_ASSET_ID } from "@/lib/constants";
import { useAssetActions, useAssets } from "@/stores/asset";
import {
  useActiveStop,
  useActiveStopId,
  useStopActions,
  useStops,
} from "@/stores/stop";
import type { Asset, DrawerTab } from "@/stores/types";

export interface DrawersProps {
  isOverlay: boolean;
  tab: DrawerTab;
  onTabChange: (tab: DrawerTab) => void;
  onClose: () => void;
}

export function Drawers({ isOverlay, tab, onTabChange, onClose }: DrawersProps) {
  return (
    <aside
      style={{
        borderLeft: "1px solid var(--rule)",
        background: "var(--paper-2)",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        ...(isOverlay
          ? {
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(var(--drawer-w), 92vw)",
              zIndex: 50,
              boxShadow: "-12px 0 32px rgba(0,0,0,0.15)",
            }
          : {}),
      }}
      aria-label="Workspace side panels"
    >
      {isOverlay && (
        <button
          className="btn btn-sm"
          onClick={onClose}
          aria-label="Close panels"
          style={{
            alignSelf: "flex-end",
            margin: 8,
            padding: "4px 10px",
          }}
        >
          ×
        </button>
      )}

      <nav
        style={{
          display: "flex",
          borderBottom: "1px solid var(--rule)",
        }}
        aria-label="Drawer tabs"
      >
        <TabButton active={tab === "assets"} onClick={() => onTabChange("assets")}>
          Assets pool
        </TabButton>
        <TabButton active={tab === "queue"} onClick={() => onTabChange("queue")}>
          Media queue
        </TabButton>
      </nav>

      <div style={{ flex: 1, overflow: "auto" }}>
        {tab === "assets" ? <AssetsDrawer /> : <QueueDrawer />}
      </div>
    </aside>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="mono-sm"
      style={{
        flex: 1,
        padding: "12px 14px",
        background: active ? "var(--paper-3)" : "transparent",
        borderRight: "1px solid var(--rule)",
        fontSize: 10,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        opacity: active ? 1 : 0.55,
      }}
    >
      {children}
    </button>
  );
}

// ─── Assets drawer ─────────────────────────────────────────────────────

// Cap the visible Loose list so a user with a big pool doesn't turn the
// drawer into an endless scroll. Legacy prototype had no such cap; the
// `+ N more` eyebrow below mimics the same intent without paginating.
const LOOSE_VISIBLE_CAP = 30;

function AssetsDrawer() {
  const assets = useAssets();
  const activeStopId = useActiveStopId();
  const activeStop = useActiveStop();
  const stops = useStops();
  const { addAsset, updateAsset, removeAsset } = useAssetActions();
  const { updateStop } = useStopActions();

  const [uploadingCount, setUploadingCount] = useState(0);

  const forStop = assets.filter((a) => a.stop === activeStopId);
  const loose = assets.filter((a) => a.stop == null);
  const looseVisible = loose.slice(0, LOOSE_VISIBLE_CAP);
  const looseOverflow = Math.max(0, loose.length - LOOSE_VISIBLE_CAP);

  const activeTone = activeStop?.tone ?? "warm";

  async function handleFiles(files: FileList | null, stopId: string | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;

    setUploadingCount((n) => n + list.length);
    try {
      const { prepareImage } = await import("@/lib/utils/image");
      for (const file of list) {
        try {
          const { dataUrl } = await prepareImage(file, { maxEdge: 1600 });
          const id =
            stopId != null
              ? `upload-${stopId}-${Date.now().toString(36)}-${Math.random()
                  .toString(36)
                  .slice(2, 6)}`
              : `upload-loose-${Date.now().toString(36)}-${Math.random()
                  .toString(36)
                  .slice(2, 6)}`;
          addAsset({
            id,
            stop: stopId,
            tone: activeTone,
            imageUrl: dataUrl,
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("[AssetsDrawer] upload failed", err);
        } finally {
          setUploadingCount((n) => Math.max(0, n - 1));
        }
      }
    } catch (err) {
      // prepareImage import failure — release the whole batch
      // eslint-disable-next-line no-console
      console.warn("[AssetsDrawer] prepareImage load failed", err);
      setUploadingCount((n) => Math.max(0, n - list.length));
    }
  }

  function handleDelete(asset: Asset) {
    const referencingStops = stops.filter((st) => st.heroAssetId === asset.id);
    if (referencingStops.length > 0) {
      const stopLabel = referencingStops.map((st) => st.n).join(", ");
      if (
        !confirm(
          `This photo is used as the hero of stop ${stopLabel}. Delete anyway?`,
        )
      ) {
        return;
      }
      // Clear heroAssetId on any stop referencing it so spine/hero don't
      // dangle with a vanished id.
      for (const st of referencingStops) {
        updateStop(st.n, {
          heroAssetId: null,
          heroFocus: null,
          status: { ...st.status, hero: false },
        });
      }
    }
    removeAsset(asset.id);
  }

  function handleDetach(asset: Asset) {
    if (asset.stop == null) return;
    // If this asset was also a hero, detaching should clear that too so a
    // stop's hero doesn't suddenly point at a loose asset from a foreign stop.
    const heroingStops = stops.filter((st) => st.heroAssetId === asset.id);
    for (const st of heroingStops) {
      updateStop(st.n, {
        heroAssetId: null,
        heroFocus: null,
        status: { ...st.status, hero: false },
      });
    }
    updateAsset(asset.id, { stop: null });
  }

  return (
    <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 20 }}>
      {uploadingCount > 0 && (
        <div
          role="status"
          className="mono-sm"
          style={{
            alignSelf: "flex-start",
            padding: "4px 10px",
            background: "var(--mode-accent)",
            color: "var(--paper)",
            borderRadius: 2,
          }}
        >
          Uploading {uploadingCount} photo{uploadingCount === 1 ? "" : "(s)"}…
        </div>
      )}

      <AssetsSection
        title={`Assigned to stop ${activeStopId}`}
        count={forStop.length}
        uploadLabel={`+ Upload to stop ${activeStopId}`}
        uploadDisabled={uploadingCount > 0}
        onFilesPicked={(files) => handleFiles(files, activeStopId)}
        emptyText="No assets yet. Upload or drag from Loose."
      >
        {forStop.map((a) => (
          <AssetCell
            key={a.id}
            asset={a}
            onDelete={handleDelete}
            onDetach={handleDetach}
          />
        ))}
      </AssetsSection>

      <AssetsSection
        title="Loose"
        count={loose.length}
        uploadLabel="+ Upload loose"
        uploadDisabled={uploadingCount > 0}
        onFilesPicked={(files) => handleFiles(files, null)}
        emptyText="None."
      >
        {looseVisible.map((a) => (
          <AssetCell key={a.id} asset={a} onDelete={handleDelete} />
        ))}
        {looseOverflow > 0 && (
          <div
            className="eyebrow"
            style={{
              gridColumn: "1 / -1",
              opacity: 0.55,
              paddingTop: 6,
            }}
          >
            + {looseOverflow} more (hidden)
          </div>
        )}
      </AssetsSection>
    </div>
  );
}

// ─── AssetsSection: header + upload + grid ────────────────────────────

function AssetsSection({
  title,
  count,
  uploadLabel,
  uploadDisabled,
  onFilesPicked,
  emptyText,
  children,
}: {
  title: string;
  count: number;
  uploadLabel: string;
  uploadDisabled: boolean;
  onFilesPicked: (files: FileList | null) => void;
  emptyText: string;
  children: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div className="eyebrow">
          {title} · {count}
        </div>
        <label
          className="mono-sm"
          title={uploadLabel}
          style={{
            cursor: uploadDisabled ? "not-allowed" : "pointer",
            opacity: uploadDisabled ? 0.45 : 0.85,
          }}
        >
          {uploadLabel}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={uploadDisabled}
            onChange={(e) => {
              onFilesPicked(e.target.files);
              // allow re-picking the same file
              if (inputRef.current) inputRef.current.value = "";
            }}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {count === 0 ? (
        <p
          className="mono-sm"
          style={{ opacity: 0.45, fontStyle: "italic", fontSize: 11 }}
        >
          {emptyText}
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
            gap: 6,
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}

// ─── AssetCell: single thumbnail, drag source, hover ×/⇥ ──────────────

function AssetCell({
  asset,
  onDelete,
  onDetach,
}: {
  asset: Asset;
  onDelete: (asset: Asset) => void;
  onDetach?: (asset: Asset) => void;
}) {
  const [hover, setHover] = useState(false);

  function onDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData(MIME_ASSET_ID, asset.id);
    e.dataTransfer.effectAllowed = "copyMove";
  }

  const hasImage = typeof asset.imageUrl === "string" && asset.imageUrl.length > 0;
  const title =
    asset.id + (asset.stop != null ? ` · stop ${asset.stop}` : " · loose");

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title}
      aria-label={title}
      style={{
        position: "relative",
        aspectRatio: "1 / 1",
        background: "var(--paper-3)",
        border: "1px solid var(--rule)",
        cursor: "grab",
        overflow: "hidden",
      }}
    >
      {hasImage ? (
        <img
          src={asset.imageUrl ?? undefined}
          alt={asset.id}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
      ) : (
        <div
          className="mono-sm"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 4,
            textAlign: "center",
            fontSize: 9,
            opacity: 0.55,
            overflow: "hidden",
            wordBreak: "break-all",
          }}
        >
          {asset.id}
        </div>
      )}

      {hover && (
        <div
          style={{
            position: "absolute",
            top: 3,
            right: 3,
            display: "flex",
            gap: 2,
          }}
        >
          {onDetach && asset.stop != null && (
            <button
              type="button"
              className="mono-sm"
              title={`Detach from stop ${asset.stop} (make loose)`}
              aria-label={`Detach asset ${asset.id} from stop ${asset.stop}`}
              onClick={(e) => {
                e.stopPropagation();
                onDetach(asset);
              }}
              style={{
                padding: "1px 5px",
                fontSize: 10,
                background: "rgba(0,0,0,0.7)",
                color: "white",
                border: "none",
                cursor: "pointer",
                lineHeight: 1.2,
              }}
            >
              ⇥
            </button>
          )}
          <button
            type="button"
            className="mono-sm"
            title="Delete this asset permanently"
            aria-label={`Delete asset ${asset.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(asset);
            }}
            style={{
              padding: "1px 6px",
              fontSize: 10,
              background: "rgba(190,40,40,0.92)",
              color: "white",
              border: "none",
              cursor: "pointer",
              lineHeight: 1.2,
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

function QueueDrawer() {
  return (
    <div style={{ padding: "16px 14px" }}>
      <div className="eyebrow">Media queue</div>
      <p
        className="mono-sm"
        style={{ opacity: 0.55, marginTop: 10, lineHeight: 1.6 }}
      >
        Live AI generation jobs land here in F-T006 (postcard styles) and
        F-T007 (vision analysis).
      </p>
    </div>
  );
}
