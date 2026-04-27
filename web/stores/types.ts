// Shared types for the London Cuts client state.
// See docs/data-model.md for the target Supabase schema — these shapes
// are compatible so the M1 swap from localStorage → Supabase is minimal.

import type { PostcardStyle } from "@/lib/ai-provider";
import type {
  AssetTranslation,
  Localized,
  PostcardTranslation,
  ProjectTranslation,
  StopTranslation,
} from "@/lib/i18n";
import type {
  BodyBlock,
  PostcardRecipient,
  SeedAsset,
  SeedStop,
  StopTone,
} from "@/lib/seed";
import type {
  NarrativeMode,
  Project as StorageProject,
  ProjectStatus,
  ProjectVisibility,
} from "@/lib/storage";

// Re-export the primitives that are also referenced from components.
export type {
  BodyBlock,
  NarrativeMode,
  PostcardRecipient,
  PostcardStyle,
  ProjectStatus,
  ProjectVisibility,
  StopTone,
};

// ─── Project ───────────────────────────────────────────────────────────

export interface Project extends StorageProject {
  // Legacy-facing fields preserved so we can read archived seed data without
  // mapping. Everything here must be JSON-serialisable (we persist to
  // localStorage). Binary assets live in IndexedDB via `asset.imageUrl`.
  author: string;
  tags: readonly string[];
  published: string;
  reads: number;
  saves: number;
  duration: string;
  coverLabel: string;
  translations?: Localized<ProjectTranslation>;
}

// ─── Stop (a numbered scene within a project) ──────────────────────────

export interface Postcard {
  message: string;
  recipient: PostcardRecipient;
  orientation?: "portrait" | "landscape";
  frontAssetId?: string | null;
  style?: PostcardStyle | null;
  translations?: Localized<PostcardTranslation>;
}

/** Normalised 2D coordinate (0..100 %) for hero image object-position pan.
 * Stored per-stop so the owner's manual recentering survives reloads.
 * `null` / missing = centered (50, 50). */
export interface HeroFocus {
  x: number;
  y: number;
}

export interface Stop extends Omit<SeedStop, "status"> {
  body: readonly BodyBlock[];
  postcard: Postcard;
  heroAssetId: string | null;
  heroFocus?: HeroFocus | null;
  assetIds: readonly string[];
  translations?: Localized<StopTranslation>;
  status: {
    upload: boolean;
    hero: boolean;
    body: boolean;
    media: "done" | "running" | "queued" | "failed" | null;
  };
}

// ─── Asset ─────────────────────────────────────────────────────────────

export interface Asset extends SeedAsset {
  /** Data URL or https URL. For data: URLs the real bytes live in IDB. */
  imageUrl: string | null;
  /** AI-generation metadata if this asset was produced by the postcard editor. */
  generatedAt?: number;
  prompt?: string;
  revisedPrompt?: string;
  styleLabel?: string;
  styleId?: PostcardStyle;
  translations?: Localized<AssetTranslation>;
}

// ─── Media job (AI generation task) ────────────────────────────────────

export type MediaTaskState = "queued" | "running" | "done" | "failed";

export interface MediaTask {
  id: string;
  kind: "img2img" | "img2vid";
  stopId: string;
  mode: NarrativeMode;
  state: MediaTaskState;
  progress: number;
  prompt: string;
}

// ─── Archived project snapshot ─────────────────────────────────────────

export interface ArchivedProject {
  id: string;
  createdAt: number;
  project: Project;
  stops: readonly Stop[];
  assetsPool: readonly Asset[];
  mediaTasks: readonly MediaTask[];
}

// ─── UI slice ──────────────────────────────────────────────────────────

export type DrawerTab = "assets" | "queue";

export interface UiState {
  drawerOpen: boolean;
  drawerTab: DrawerTab;
  publishOpen: boolean;
  activeStopId: string;
  tour: { active: boolean; step: number };
}
