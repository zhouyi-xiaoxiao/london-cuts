"use client";

// Adapter layer: projects the new Zustand store shape into the legacy
// DemoState-shaped value that the scaffold pages + ui.tsx components
// were written against. Lives alongside studio-pages.tsx because it's
// scaffold-only and scheduled for removal once the pages themselves
// are deleted (see tasks: post-migration Phase 2 cleanup).

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import {
  useRootStore,
  type RootState,
} from "@/stores/root";
import type {
  Asset as NewAsset,
  Project as NewProject,
  Stop as NewStop,
  MediaTask,
} from "@/stores/types";
import type {
  Asset as LegacyAsset,
  AssetKind,
  AssetTone as LegacyTone,
  DemoState,
  MediaGenerationJob,
  MediaJobKind,
  MediaJobState,
  NarrativeMode,
  Project as LegacyProject,
  ProjectStatus as LegacyProjectStatus,
  StoryStop as LegacyStop,
  Visibility,
} from "@/lib/types";

export interface UploadSummary {
  total: number;
  photos: number;
  videos: number;
  voices: number;
  texts: number;
}

export interface LegacyState extends DemoState {
  // Nothing extra — re-export for downstream typing.
}

export interface LegacyAdapter {
  state: LegacyState;
  activeProject: LegacyProject;
  activeStops: LegacyStop[];
  currentMode: NarrativeMode;
  uploadSummary: UploadSummary;
  setMode: (mode: NarrativeMode) => void;
  setDefaultMode: (mode: NarrativeMode) => void;
  createProject: (payload: {
    title: string;
    subtitle: string;
    area: string;
    defaultMode: NarrativeMode;
  }) => string;
  addUploads: (files: FileList | File[]) => Promise<void>;
  reorderStop: (stopId: string, direction: "up" | "down") => void;
  selectProject: (projectId: string) => void;
  updateStop: (stopId: string, patch: Partial<LegacyStop>) => void;
  updateProject: (patch: Partial<LegacyProject>) => void;
  createMediaJob: (args: {
    stopId: string;
    sourceAssetId: string;
    kind: MediaJobKind;
    prompt?: string;
  }) => Promise<void>;
  setActivePostcardVersion: (stopId: string, versionId: string) => void;
  resetDemo: () => void;
}

// ─── Projections (new shape → legacy shape) ─────────────────────────

const SEED_AUTHOR_HANDLE = "@ana-ishii";
const SEED_AUTHOR_NAME = "Ana Ishii";

function legacyTone(tone: NewAsset["tone"] | NewStop["tone"] | undefined): LegacyTone {
  if (tone === "punk") return "punk";
  if (tone === "warm") return "warm";
  if (tone === "cool") return "cool";
  return "neutral";
}

function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function narrowStatus(status: NewProject["status"]): LegacyProjectStatus {
  if (status === "published") return "published";
  return "draft";
}

function narrowVisibility(v: NewProject["visibility"]): Visibility {
  if (v === "private") return "private";
  if (v === "unlisted") return "unlisted";
  return "public";
}

function assetKindFromId(id: string): AssetKind {
  // The new seed has no kind field; best-effort from id prefix.
  if (id.startsWith("generated-")) return "generated-image";
  return "photo";
}

function projectToLegacy(
  p: NewProject,
  stops: readonly NewStop[],
  assets: readonly NewAsset[],
): LegacyProject {
  return {
    id: p.id,
    authorName: p.author ?? SEED_AUTHOR_NAME,
    authorHandle: SEED_AUTHOR_HANDLE,
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle ?? "",
    description: p.subtitle ?? "",
    coverLabel: p.coverLabel ?? "",
    area: p.locationName ?? "",
    tags: [...(p.tags ?? [])],
    publishedAt: p.publishedAt ?? p.published ?? "",
    reads: p.reads ?? 0,
    saves: p.saves ?? 0,
    duration: p.duration ?? "",
    defaultMode: p.defaultMode,
    visibility: narrowVisibility(p.visibility),
    status: narrowStatus(p.status),
    stopIds: stops.map((s) => s.n),
    uploadAssetIds: assets.map((a) => a.id),
  };
}

function stopToLegacy(s: NewStop): LegacyStop {
  const place = s.label.split(" · ")[0] ?? s.label;
  return {
    id: s.n,
    slug: slugFromTitle(s.title),
    number: s.n,
    code: s.code,
    title: s.title,
    place,
    time: s.time,
    mood: s.mood,
    label: s.label,
    tone: legacyTone(s.tone),
    excerpt: "",
    story: "",
    lat: s.lat,
    lng: s.lng,
    coverAssetId: s.heroAssetId ?? "",
    galleryAssetIds: [...s.assetIds],
    generatedAssetIds: [],
    postcardVersions: [],
    activePostcardVersionId: "",
  };
}

function assetToLegacy(a: NewAsset): LegacyAsset {
  return {
    id: a.id,
    kind: assetKindFromId(a.id),
    label: a.id,
    title: a.id,
    tone: legacyTone(a.tone),
    src: a.imageUrl ?? undefined,
  };
}

function mediaTaskStateToLegacy(state: MediaTask["state"]): MediaJobState {
  if (state === "done") return "done";
  if (state === "failed") return "failed";
  if (state === "running") return "running";
  return "queued";
}

function mediaTaskKindToLegacy(kind: MediaTask["kind"]): MediaJobKind {
  return kind === "img2vid" ? "image-to-video" : "image-to-image";
}

function mediaTaskToLegacy(
  task: MediaTask,
  projectId: string,
): MediaGenerationJob {
  return {
    id: task.id,
    projectId,
    stopId: task.stopId,
    sourceAssetId: "",
    kind: mediaTaskKindToLegacy(task.kind),
    state: mediaTaskStateToLegacy(task.state),
    prompt: task.prompt,
    strength: 0.68,
    seed: 0,
    progress: Math.round(task.progress * 100),
    etaMs: 0,
    createdAt: "",
    updatedAt: "",
    provider: "mock-media-provider",
  };
}

// ─── The hook ───────────────────────────────────────────────────────

// Pull the store slices we need in one go. Selector returns a stable
// object (useShallow) so re-renders stay bounded.
export function useLegacyStudioAdapter(): LegacyAdapter {
  const { project, stops, assets, mediaTasks, mode, archive } = useRootStore(
    useShallow((s: RootState) => ({
      project: s.project,
      stops: s.stops,
      assets: s.assetsPool,
      mediaTasks: s.mediaTasks,
      mode: s.mode,
      archive: s.projectsArchive,
    })),
  );

  const actions = useRootStore(
    useShallow((s) => ({
      setMode: s.setMode,
      setProject: s.setProject,
      updateStop: s.updateStop,
      reorderStops: s.reorderStops,
      addAsset: s.addAsset,
      addMediaTask: s.addMediaTask,
    })),
  );

  return useMemo<LegacyAdapter>(() => {
    const legacyStops = stops.map(stopToLegacy);
    const legacyAssets = assets.map(assetToLegacy);
    const legacyActive = projectToLegacy(project, stops, assets);
    const legacyJobs = mediaTasks.map((t) => mediaTaskToLegacy(t, project.id));

    const projectsForState: LegacyProject[] = [
      legacyActive,
      ...Object.values(archive).map((ap) =>
        projectToLegacy(ap.project, ap.stops, ap.assetsPool),
      ),
    ];

    const state: LegacyState = {
      currentMode: mode,
      activeProjectId: project.id,
      projects: projectsForState,
      stops: legacyStops,
      assets: legacyAssets,
      mediaJobs: legacyJobs,
    };

    // Upload summary — scaffold only tracks counts.
    const photos = legacyAssets.filter(
      (a) => a.kind === "photo" || a.kind === "generated-image",
    ).length;
    const videos = legacyAssets.filter(
      (a) => a.kind === "video" || a.kind === "generated-video",
    ).length;
    const voices = legacyAssets.filter((a) => a.kind === "voice").length;
    const texts = legacyAssets.filter((a) => a.kind === "text").length;
    const uploadSummary: UploadSummary = {
      total: legacyAssets.length,
      photos,
      videos,
      voices,
      texts,
    };

    return {
      state,
      activeProject: legacyActive,
      activeStops: legacyStops,
      currentMode: mode,
      uploadSummary,

      setMode: actions.setMode,
      setDefaultMode: (nextMode) => {
        actions.setMode(nextMode);
        actions.setProject({ defaultMode: nextMode });
      },
      createProject: (payload) => {
        // Scaffold create is not wired through to the real storage seam
        // yet — update the current project in place so the scaffold flow
        // can continue, return the existing id.
        actions.setProject({
          title: payload.title,
          subtitle: payload.subtitle,
          locationName: payload.area,
          defaultMode: payload.defaultMode,
        });
        actions.setMode(payload.defaultMode);
        return project.id;
      },
      addUploads: async (files) => {
        const list = Array.from(files);
        for (let i = 0; i < list.length; i += 1) {
          const file = list[i];
          actions.addAsset({
            id: `upload-${Date.now()}-${i}`,
            stop: null,
            tone: "warm",
            imageUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
          });
        }
      },
      reorderStop: (stopId, direction) => {
        const order = stops.map((st) => st.n);
        const index = order.indexOf(stopId);
        if (index < 0) return;
        const swap = direction === "up" ? index - 1 : index + 1;
        if (swap < 0 || swap >= order.length) return;
        const next = [...order];
        [next[index], next[swap]] = [next[swap], next[index]];
        actions.reorderStops(next);
      },
      selectProject: () => {
        // M-fast: active project is always the store's current project.
        // Restore-from-archive is handled by the new dashboard.
      },
      updateStop: (stopId, patch) => {
        // Only forward fields that exist on the new Stop shape.
        const forwarded: Partial<NewStop> = {};
        if (patch.title !== undefined) forwarded.title = patch.title;
        if (patch.time !== undefined) forwarded.time = patch.time;
        if (patch.code !== undefined) forwarded.code = patch.code;
        if (patch.mood !== undefined) forwarded.mood = patch.mood;
        if (patch.label !== undefined) forwarded.label = patch.label;
        if (patch.coverAssetId !== undefined) {
          forwarded.heroAssetId = patch.coverAssetId || null;
        }
        if (Object.keys(forwarded).length > 0) {
          actions.updateStop(stopId, forwarded);
        }
      },
      updateProject: (patch) => {
        const forwarded: Partial<NewProject> = {};
        if (patch.title !== undefined) forwarded.title = patch.title;
        if (patch.subtitle !== undefined) forwarded.subtitle = patch.subtitle;
        if (patch.defaultMode !== undefined) {
          forwarded.defaultMode = patch.defaultMode;
        }
        if (patch.visibility !== undefined) {
          forwarded.visibility = patch.visibility;
        }
        if (patch.status !== undefined) {
          // Narrow legacy status to storage status.
          forwarded.status =
            patch.status === "published" ? "published" : "draft";
        }
        if (Object.keys(forwarded).length > 0) {
          actions.setProject(forwarded);
        }
      },
      createMediaJob: async ({ stopId, kind, prompt }) => {
        actions.addMediaTask({
          id: `job-${Date.now()}`,
          kind: kind === "image-to-video" ? "img2vid" : "img2img",
          stopId,
          mode,
          state: "queued",
          progress: 0,
          prompt: prompt ?? "",
        });
      },
      setActivePostcardVersion: () => {
        // No-op in the new store — versioned postcards are scaffold-only.
      },
      resetDemo: () => {
        useRootStore.getState().resetToSeed();
      },
    };
  }, [project, stops, assets, mediaTasks, mode, archive, actions]);
}
