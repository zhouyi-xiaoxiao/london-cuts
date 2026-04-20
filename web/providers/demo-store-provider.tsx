"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

import { MockMediaProvider } from "@/lib/media-provider";
import { seedProject, seedState } from "@/lib/seed-data";
import type {
  Asset,
  DemoState,
  MediaGenerationJob,
  MediaJobKind,
  NarrativeMode,
  Project,
  StoryStop,
} from "@/lib/types";

interface UploadSummary {
  total: number;
  photos: number;
  videos: number;
  voices: number;
  texts: number;
}

interface DemoStoreValue {
  state: DemoState;
  activeProject: Project;
  activeStops: StoryStop[];
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
  updateStop: (stopId: string, patch: Partial<StoryStop>) => void;
  updateProject: (patch: Partial<Project>) => void;
  createMediaJob: (args: {
    stopId: string;
    sourceAssetId: string;
    kind: MediaJobKind;
    prompt?: string;
  }) => Promise<void>;
  setActivePostcardVersion: (stopId: string, versionId: string) => void;
  resetDemo: () => void;
}

const MODE_KEY = "london-cuts-mode";

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

const mediaProvider = new MockMediaProvider();

function cloneSeedState(): DemoState {
  return JSON.parse(JSON.stringify(seedState)) as DemoState;
}

function summarizeUploads(assets: Asset[]): UploadSummary {
  return assets.reduce<UploadSummary>(
    (summary, asset) => {
      summary.total += 1;
      if (asset.kind === "photo" || asset.kind === "generated-image") summary.photos += 1;
      if (asset.kind === "video" || asset.kind === "generated-video") summary.videos += 1;
      if (asset.kind === "voice") summary.voices += 1;
      if (asset.kind === "text") summary.texts += 1;
      return summary;
    },
    { total: 0, photos: 0, videos: 0, voices: 0, texts: 0 },
  );
}

function mergeJobResult(
  prev: DemoState,
  updatedJob: MediaGenerationJob,
  resultAsset?: Asset,
): DemoState {
  const mediaJobs = prev.mediaJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job));

  let assets = prev.assets;
  let stops = prev.stops;

  if (resultAsset && !prev.assets.find((asset) => asset.id === resultAsset.id)) {
    assets = [...prev.assets, resultAsset];
    stops = prev.stops.map((stop) =>
      stop.id === updatedJob.stopId
        ? {
            ...stop,
            generatedAssetIds: [...new Set([...stop.generatedAssetIds, resultAsset.id])],
          }
        : stop,
    );
  }

  return { ...prev, mediaJobs, assets, stops };
}

export function DemoStoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<DemoState>(() => {
    const initial = cloneSeedState();
    if (typeof window !== "undefined") {
      const savedMode = window.localStorage.getItem(MODE_KEY) as NarrativeMode | null;
      if (savedMode) {
        initial.currentMode = savedMode;
      }
    }
    return initial;
  });
  useEffect(() => {
    const activeJobs = state.mediaJobs.filter(
      (job) => job.state === "queued" || job.state === "running",
    );
    if (!activeJobs.length) return;

    const timer = window.setInterval(() => {
      void Promise.all(activeJobs.map((job) => mediaProvider.getJobStatus(job))).then(
        (updates) => {
          setState((prev) =>
            updates.reduce(
              (nextState, update) => mergeJobResult(nextState, update.job, update.resultAsset),
              prev,
            ),
          );
        },
      );
    }, 1200);

    return () => window.clearInterval(timer);
  }, [state.mediaJobs]);

  const activeProject =
    state.projects.find((project) => project.id === state.activeProjectId) ?? state.projects[0];
  const activeStops = activeProject
    ? activeProject.stopIds
        .map((stopId) => state.stops.find((stop) => stop.id === stopId))
        .filter((stop): stop is StoryStop => Boolean(stop))
    : [];
  const uploadSummary = summarizeUploads(
    activeProject
      ? activeProject.uploadAssetIds
          .map((assetId) => state.assets.find((asset) => asset.id === assetId))
          .filter((asset): asset is Asset => Boolean(asset))
      : [],
  );

  const value: DemoStoreValue = {
    state,
    activeProject,
    activeStops,
    currentMode: state.currentMode,
    uploadSummary,
    setMode(mode) {
      window.localStorage.setItem(MODE_KEY, mode);
      setState((prev) => ({ ...prev, currentMode: mode }));
    },
    setDefaultMode(mode) {
      setState((prev) => ({
        ...prev,
        currentMode: mode,
        projects: prev.projects.map((project) =>
          project.id === prev.activeProjectId ? { ...project, defaultMode: mode } : project,
        ),
      }));
    },
    createProject(payload) {
      const projectId = `project-${Math.random().toString(36).slice(2, 9)}`;
      const project: Project = {
        ...seedProject,
        id: projectId,
        slug: payload.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        title: payload.title,
        subtitle: payload.subtitle,
        area: payload.area,
        defaultMode: payload.defaultMode,
        status: "draft",
        publishedAt: "Draft",
        stopIds: state.stops.slice(0, 4).map((stop) => stop.id),
      };
      setState((prev) => ({
        ...prev,
        currentMode: payload.defaultMode,
        activeProjectId: projectId,
        projects: [...prev.projects, project],
      }));
      return projectId;
    },
    async addUploads(files) {
      const nextFiles = Array.from(files);
      if (!nextFiles.length) return;

      const uploadedAssets: Asset[] = nextFiles.map((file, index) => {
        const url = URL.createObjectURL(file);
        const kind =
          file.type.startsWith("image/") ? "photo" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "voice" : "text";
        return {
          id: `upload-${Date.now()}-${index}`,
          kind,
          label: file.name,
          title: file.name,
          tone: kind === "video" ? "dark" : kind === "voice" ? "neutral" : "cool",
          src: url,
          mimeType: file.type,
          notes: "Local upload added in the studio happy path.",
        };
      });

      setState((prev) => ({
        ...prev,
        assets: [...prev.assets, ...uploadedAssets],
        projects: prev.projects.map((project) =>
          project.id === prev.activeProjectId
            ? {
                ...project,
                uploadAssetIds: [...uploadedAssets.map((asset) => asset.id), ...project.uploadAssetIds],
              }
            : project,
        ),
      }));
    },
    reorderStop(stopId, direction) {
      setState((prev) => {
        const project = prev.projects.find((item) => item.id === prev.activeProjectId);
        if (!project) return prev;
        const index = project.stopIds.findIndex((id) => id === stopId);
        if (index < 0) return prev;
        const swapIndex = direction === "up" ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= project.stopIds.length) return prev;
        const stopIds = [...project.stopIds];
        [stopIds[index], stopIds[swapIndex]] = [stopIds[swapIndex], stopIds[index]];
        return {
          ...prev,
          projects: prev.projects.map((item) =>
            item.id === project.id ? { ...item, stopIds } : item,
          ),
        };
      });
    },
    selectProject(projectId) {
      setState((prev) => ({ ...prev, activeProjectId: projectId }));
    },
    updateStop(stopId, patch) {
      setState((prev) => ({
        ...prev,
        stops: prev.stops.map((stop) => (stop.id === stopId ? { ...stop, ...patch } : stop)),
      }));
    },
    updateProject(patch) {
      setState((prev) => ({
        ...prev,
        projects: prev.projects.map((project) =>
          project.id === prev.activeProjectId ? { ...project, ...patch } : project,
        ),
      }));
    },
    async createMediaJob({ stopId, sourceAssetId, kind, prompt }) {
      const input = {
        projectId: activeProject.id,
        stopId,
        sourceAssetId,
        prompt,
        mode: state.currentMode,
      };
      const job =
        kind === "image-to-video"
          ? await mediaProvider.createImageToVideoJob(input)
          : await mediaProvider.createImageToImageJob(input);
      setState((prev) => ({ ...prev, mediaJobs: [job, ...prev.mediaJobs] }));
    },
    setActivePostcardVersion(stopId, versionId) {
      setState((prev) => ({
        ...prev,
        stops: prev.stops.map((stop) =>
          stop.id === stopId ? { ...stop, activePostcardVersionId: versionId } : stop,
        ),
      }));
    },
    resetDemo() {
      window.localStorage.removeItem(MODE_KEY);
      setState(cloneSeedState());
    },
  };

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const value = useContext(DemoStoreContext);
  if (!value) {
    throw new Error("useDemoStore must be used within DemoStoreProvider");
  }
  return value;
}
