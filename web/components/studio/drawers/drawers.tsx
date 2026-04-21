"use client";

// Right column of the workspace: asset pool + media queue tabs.
// Shell only — real asset management (drag-drop, delete, detach) lands
// alongside F-T005 stop editing.

import type { DrawerTab } from "@/stores/types";
import { useAssets } from "@/stores/asset";
import { useActiveStopId } from "@/stores/stop";

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

function AssetsDrawer() {
  const assets = useAssets();
  const activeStopId = useActiveStopId();
  const forStop = assets.filter((a) => a.stop === activeStopId);
  const loose = assets.filter((a) => a.stop == null);

  return (
    <div style={{ padding: "16px 14px" }}>
      <section>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Assigned to stop {activeStopId} · {forStop.length}
        </div>
        {forStop.length === 0 ? (
          <p
            className="mono-sm"
            style={{ opacity: 0.45, fontStyle: "italic" }}
          >
            No assets yet. Upload comes in F-T005.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {forStop.map((a) => (
              <li
                key={a.id}
                className="mono-sm"
                style={{
                  padding: "6px 0",
                  borderBottom: "1px dashed var(--rule)",
                  opacity: 0.75,
                }}
              >
                {a.id}{" "}
                <span style={{ opacity: 0.5 }}>· {a.tone}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Loose · {loose.length}
        </div>
        {loose.length === 0 ? (
          <p
            className="mono-sm"
            style={{ opacity: 0.45, fontStyle: "italic" }}
          >
            None.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {loose.slice(0, 10).map((a) => (
              <li
                key={a.id}
                className="mono-sm"
                style={{
                  padding: "6px 0",
                  borderBottom: "1px dashed var(--rule)",
                  opacity: 0.75,
                }}
              >
                {a.id}{" "}
                <span style={{ opacity: 0.5 }}>· {a.tone}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
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
