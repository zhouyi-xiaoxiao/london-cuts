"use client";

// Projects dashboard ("Your work.") — port of legacy projects-list.jsx.
// Displays the current project as CURRENT plus all archived projects.
// Actions: create new project (archives current), switch to archived, delete
// archived, reset to seed.

import { useMemo, useState } from "react";
import Link from "next/link";

import { VisionUpload } from "@/components/studio/vision-upload";
import { useAssets } from "@/stores/asset";
import { useMode } from "@/stores/mode";
import { useProject, useProjectArchive, useProjectActions } from "@/stores/project";
import { useRootStore } from "@/stores/root";
import { useStops } from "@/stores/stop";
import type { ArchivedProject, Project, Stop } from "@/stores/types";
import type { Asset } from "@/stores/types";

// ─── helpers ───────────────────────────────────────────────────────────

function summary(stops: readonly Stop[]) {
  const missingHeroes = stops.filter((s) => !s.status.hero).length;
  const missingBodies = stops.filter((s) => !s.status.body).length;
  const totalComplete = stops.filter(
    (s) => s.status.upload && s.status.hero && s.status.body,
  ).length;
  return { missingHeroes, missingBodies, totalComplete, total: stops.length };
}

function coverUrlFor(
  stops: readonly Stop[],
  assets: readonly Asset[],
): string | null {
  const coverStop = stops.find((s) => s.heroAssetId) ?? stops[0];
  if (!coverStop) return null;
  if (coverStop.heroAssetId) {
    const hit = assets.find((a) => a.id === coverStop.heroAssetId);
    if (hit?.imageUrl) return hit.imageUrl;
  }
  return assets.find((a) => a.imageUrl)?.imageUrl ?? null;
}

// ─── main component ───────────────────────────────────────────────────

export function ProjectsDashboard() {
  const project = useProject();
  const stops = useStops();
  const assets = useAssets();
  const mode = useMode();
  const archivedMap = useProjectArchive();
  const {
    archiveCurrentProject,
    restoreProject,
    deleteArchivedProject,
    resetToSeed,
  } = useProjectActions();

  const [modalOpen, setModalOpen] = useState(false);
  const [visionOpen, setVisionOpen] = useState(false);

  const archivedList = useMemo(
    () =>
      Object.values(archivedMap).sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
      ),
    [archivedMap],
  );

  const s = summary(stops);
  const progress = Math.round(
    (100 * s.totalComplete) / Math.max(1, s.total),
  );
  const cover = coverUrlFor(stops, assets);

  const onReset = () => {
    if (
      confirm("Reset this project to seed data? All your edits will be lost.")
    ) {
      resetToSeed();
    }
  };

  return (
    <div className="page" style={{ overflow: "auto", minHeight: "100vh" }}>
      <header
        className="studio-dash-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 40px",
          borderBottom: "1px solid var(--rule)",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            className="roundel"
            style={{ width: 24, height: 24, display: "inline-block" }}
            aria-hidden
          />
          <span
            style={{
              fontFamily: "var(--mode-display-font, var(--f-fashion))",
              fontSize: 15,
              fontStyle: "italic",
            }}
          >
            London Cuts Studio
          </span>
          <span className="mono-sm" style={{ opacity: 0.5 }}>
            {project.author}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="btn btn-sm"
            onClick={onReset}
            title="Reset current project to seed data"
          >
            Reset data
          </button>
          <button
            className="btn btn-sm"
            onClick={() => setVisionOpen((v) => !v)}
            title="Upload photos → GPT-4o auto-creates stops"
          >
            {visionOpen ? "Hide vision upload" : "📁 New from photos"}
          </button>
          <button
            className="btn btn-solid"
            onClick={() => setModalOpen(true)}
            title="Archive current project and start a new one"
          >
            + New project
          </button>
        </div>
      </header>

      <main
        className="studio-dash-main"
        style={{ padding: "48px 40px", maxWidth: 1680, margin: "0 auto" }}
      >
        {visionOpen && (
          <VisionUpload
            onComplete={(count) => {
              setVisionOpen(false);
              window.location.href = `/studio/${useRootStore.getState().project.id}/editor`;
              // Avoid unused-var warning
              void count;
            }}
            onClose={() => setVisionOpen(false)}
          />
        )}

        <div style={{ marginBottom: 32 }}>
          <div className="eyebrow">Studio</div>
          <h1
            style={{
              fontFamily: "var(--mode-display-font, var(--f-fashion))",
              fontSize: "clamp(48px, 8vw, 72px)",
              fontStyle: "italic",
              lineHeight: 1,
              marginTop: 8,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Your work.
          </h1>
          <div
            className="mono-sm"
            style={{ marginTop: 10, opacity: 0.55, maxWidth: 560 }}
          >
            {archivedList.length > 0
              ? `${archivedList.length + 1} projects · click any card to switch. Creating a new project archives the current one so nothing is lost.`
              : "Multi-project studio. Use “New project” above to start another; the current one will be archived safely."}
          </div>
        </div>

        <div
          className="studio-dash-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          <ProjectCard
            isCurrent
            coverUrl={cover}
            coverLabel={project.coverLabel || "UNTITLED"}
            project={project}
            stops={stops}
            summary={s}
            mode={mode}
            progress={progress}
            onClick={() => {
              /* workspace route lands in F-T004 */
              window.location.href = `/studio/${project.id}/editor`;
            }}
          />
          {archivedList.map((p) => (
            <ArchivedCard
              key={p.id}
              archived={p}
              onClick={() => {
                restoreProject(p.id);
                window.location.href = `/studio/${p.project.id}/editor`;
              }}
              onDelete={(ev) => {
                ev.stopPropagation();
                if (confirm("Delete this archived project? Cannot be undone.")) {
                  deleteArchivedProject(p.id);
                }
              }}
            />
          ))}
        </div>

        <section style={{ marginTop: 56 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Activity
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              fontSize: 13,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {[
              [
                "NOW",
                `${s.totalComplete}/${s.total} stops ready · ${s.missingHeroes} need a hero`,
              ],
              [
                "TODAY",
                `${assets.length} assets in pool · ${archivedList.length} archived project${archivedList.length === 1 ? "" : "s"}`,
              ],
              ["YESTERDAY", `Default mode: ${mode}`],
              ["2 DAYS AGO", "Sample: published Brick Lane after rain"],
            ].map(([when, msg]) => (
              <li
                key={when}
                style={{
                  display: "flex",
                  gap: 24,
                  padding: "10px 0",
                  borderBottom: "1px dashed var(--rule)",
                }}
              >
                <span className="mono-sm" style={{ opacity: 0.55, width: 100 }}>
                  {when}
                </span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        </section>

        <nav style={{ marginTop: 56, opacity: 0.6 }}>
          <Link
            href="/atlas"
            style={{ fontFamily: "var(--f-mono)", fontSize: 12 }}
          >
            → Public atlas
          </Link>
        </nav>
      </main>

      {modalOpen && (
        <NewProjectModal
          onClose={() => setModalOpen(false)}
          onCreate={async (data) => {
            archiveCurrentProject();
            const now = new Date().toISOString();
            const slug = data.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");
            const id = `proj-${Date.now().toString(36)}`;
            // Adopt the blank project directly via the store action.
            const { setProject } = await import("@/stores/root").then((m) =>
              m.useRootStore.getState(),
            );
            setProject({
              id,
              ownerId: "local",
              slug,
              title: data.title,
              subtitle: null,
              locationName: data.location,
              defaultMode: data.mode,
              status: "draft",
              visibility: "public",
              coverAssetId: null,
              publishedAt: null,
              createdAt: now,
              updatedAt: now,
            });
            setModalOpen(false);
            window.location.href = `/studio/${id}/editor`;
          }}
        />
      )}
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────

interface CardProps {
  isCurrent?: boolean;
  coverUrl: string | null;
  coverLabel: string;
  project: Project;
  stops: readonly Stop[];
  summary: ReturnType<typeof summary>;
  mode: string;
  progress: number;
  onClick: () => void;
}

function ProjectCard(props: CardProps) {
  const { coverUrl, coverLabel, project, stops, summary: s, mode, progress, onClick, isCurrent } =
    props;
  const published = project.publishedAt;
  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      style={{
        cursor: "pointer",
        border: "1px solid var(--rule)",
        padding: 20,
        position: "relative",
        background: "var(--paper-2)",
      }}
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          style={{
            width: "100%",
            aspectRatio: "16/9",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <div
          className="img-ph"
          data-label={coverLabel}
          data-tone="warm"
          style={{ width: "100%", aspectRatio: "16/9" }}
        />
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginTop: 16,
          gap: 8,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--mode-display-font, var(--f-fashion))",
            fontStyle: "italic",
            fontSize: 24,
            lineHeight: 1.05,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {project.title}
        </h2>
        <span
          className="chip chip-solid"
          style={{ flexShrink: 0, fontSize: 10 }}
        >
          {isCurrent ? "CURRENT" : project.visibility === "public" && published ? "LIVE" : "DRAFT"}
        </span>
      </div>
      {project.subtitle && (
        <p
          style={{
            marginTop: 6,
            fontSize: 13,
            opacity: 0.7,
            fontStyle: "italic",
            fontFamily: "var(--mode-display-font, var(--f-fashion))",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {project.subtitle}
        </p>
      )}
      <div
        className="mono-sm"
        style={{ marginTop: 10, opacity: 0.65, fontSize: 11 }}
      >
        {stops.length} STOPS · {s.totalComplete}/{s.total} READY ·{" "}
        {String(mode).toUpperCase()}
        {published && ` · PUBLISHED ${published}`}
      </div>
      <div
        style={{ marginTop: 10, height: 3, background: "var(--paper-3)" }}
      >
        <div
          style={{
            width: progress + "%",
            height: "100%",
            background: "var(--mode-accent)",
            transition: "width 240ms ease",
          }}
        />
      </div>
    </article>
  );
}

interface ArchivedCardProps {
  archived: ArchivedProject;
  onClick: () => void;
  onDelete: (ev: React.MouseEvent) => void;
}

function ArchivedCard({ archived, onClick, onDelete }: ArchivedCardProps) {
  const { project, stops, assetsPool } = archived;
  const s = summary(stops);
  const progress = Math.round((100 * s.totalComplete) / Math.max(1, s.total));
  const cover = coverUrlFor(stops, assetsPool);
  const createdLabel = new Date(archived.createdAt)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
  return (
    <div style={{ position: "relative" }}>
      <ProjectCard
        coverUrl={cover}
        coverLabel={project.coverLabel || "UNTITLED"}
        project={project}
        stops={stops}
        summary={s}
        mode={project.defaultMode}
        progress={progress}
        onClick={onClick}
      />
      <div
        className="mono-sm"
        style={{
          position: "absolute",
          bottom: 12,
          left: 20,
          right: 20,
          opacity: 0.45,
          fontSize: 10,
          pointerEvents: "none",
        }}
      >
        ARCHIVED {createdLabel}
      </div>
      <button
        className="btn btn-sm"
        title="Delete this archived project"
        onClick={onDelete}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          opacity: 0.7,
          fontSize: 11,
          padding: "2px 8px",
        }}
        aria-label={`Delete archived project ${project.title}`}
      >
        ×
      </button>
    </div>
  );
}

// ─── new project modal ────────────────────────────────────────────────

interface NewProjectModalProps {
  onClose: () => void;
  onCreate: (data: {
    title: string;
    mode: "fashion" | "punk" | "cinema";
    location: string;
  }) => void;
}

function NewProjectModal({ onClose, onCreate }: NewProjectModalProps) {
  const [title, setTitle] = useState("New walk");
  const [mode, setMode] = useState<"fashion" | "punk" | "cinema">("fashion");
  const [location, setLocation] = useState("");

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 101,
        }}
      />
      <div
        role="dialog"
        aria-labelledby="new-project-title"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 560,
          maxWidth: "92vw",
          background: "var(--paper)",
          color: "var(--ink)",
          border: "1px solid var(--ink)",
          zIndex: 102,
          padding: 28,
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 4 }}>
          New project
        </div>
        <h2
          id="new-project-title"
          style={{
            fontFamily: "var(--mode-display-font, var(--f-fashion))",
            fontStyle: "italic",
            fontSize: 32,
            lineHeight: 1,
            margin: 0,
          }}
        >
          Start a walk.
        </h2>
        <p className="mono-sm" style={{ opacity: 0.6, marginTop: 8 }}>
          Archives the current project so you can switch back to it later.
          Creates a single blank stop you can build on.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
          <label>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              Title
            </div>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                borderBottom: "1.5px solid var(--ink)",
                padding: "6px 0",
                fontSize: 18,
                background: "transparent",
              }}
            />
          </label>
          <label>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              Location (free text)
            </div>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Reykjavík, Tokyo, South London…"
              style={{
                width: "100%",
                borderBottom: "1.5px solid var(--ink)",
                padding: "6px 0",
                fontSize: 16,
                background: "transparent",
              }}
            />
          </label>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              Default mode for readers
            </div>
            <div className="mode-pill" role="radiogroup" aria-label="Default narrative mode">
              {(["punk", "fashion", "cinema"] as const).map((m) => (
                <button
                  key={m}
                  role="radio"
                  aria-checked={mode === m}
                  data-active={mode === m}
                  onClick={() => setMode(m)}
                >
                  {m[0].toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 28,
            justifyContent: "flex-end",
          }}
        >
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-solid"
            onClick={() =>
              onCreate({
                title: title.trim() || "New walk",
                mode,
                location: location.trim(),
              })
            }
          >
            Create &amp; open workspace →
          </button>
        </div>
      </div>
    </>
  );
}
