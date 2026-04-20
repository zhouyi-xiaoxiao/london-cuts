export type NarrativeMode = "punk" | "fashion" | "cinema";

export type Visibility = "public" | "unlisted" | "private";
export type ProjectStatus =
  | "draft"
  | "in_progress"
  | "publishing"
  | "published"
  | "unlisted"
  | "archived";

export type AssetKind =
  | "photo"
  | "video"
  | "voice"
  | "text"
  | "generated-image"
  | "generated-video";

export type AssetTone = "warm" | "cool" | "dark" | "punk" | "neutral";
export type MediaJobState = "queued" | "running" | "done" | "failed" | "cancelled";
export type MediaJobKind = "image-to-image" | "image-to-video";

export interface Asset {
  id: string;
  kind: AssetKind;
  label: string;
  title: string;
  tone: AssetTone;
  src?: string;
  caption?: string;
  location?: string;
  capturedAt?: string;
  mimeType?: string;
  transcript?: string;
  notes?: string;
}

export interface PostcardVersion {
  id: string;
  label: string;
  createdAt: string;
  note: string;
  sourceAssetId: string;
}

export interface StoryStop {
  id: string;
  slug: string;
  number: string;
  code: string;
  title: string;
  place: string;
  time: string;
  mood: string;
  label: string;
  tone: AssetTone;
  excerpt: string;
  story: string;
  lat: number;
  lng: number;
  coverAssetId: string;
  galleryAssetIds: string[];
  generatedAssetIds: string[];
  postcardVersions: PostcardVersion[];
  activePostcardVersionId: string;
}

export interface Project {
  id: string;
  authorName: string;
  authorHandle: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  coverLabel: string;
  area: string;
  tags: string[];
  publishedAt: string;
  reads: number;
  saves: number;
  duration: string;
  defaultMode: NarrativeMode;
  visibility: Visibility;
  status: ProjectStatus;
  stopIds: string[];
  uploadAssetIds: string[];
}

export interface ExploreProject {
  id: string;
  title: string;
  author: string;
  authorHandle: string;
  slug: string;
  stops: number;
  mode: NarrativeMode;
  label: string;
  reads: string;
  borough: string;
  tone: AssetTone;
  summary: string;
  lat: number;
  lng: number;
}

export interface MediaGenerationJob {
  id: string;
  projectId: string;
  stopId: string;
  sourceAssetId: string;
  resultAssetId?: string;
  kind: MediaJobKind;
  state: MediaJobState;
  prompt: string;
  strength: number;
  seed: number;
  progress: number;
  etaMs: number;
  createdAt: string;
  updatedAt: string;
  provider: string;
  error?: string;
}

export interface MediaJobStatus {
  job: MediaGenerationJob;
  resultAsset?: Asset;
}

export interface MediaJobInput {
  projectId: string;
  stopId: string;
  sourceAssetId: string;
  prompt?: string;
  strength?: number;
  seed?: number;
  mode: NarrativeMode;
}

export interface MediaProvider {
  readonly name: string;
  createImageToImageJob(input: MediaJobInput): Promise<MediaGenerationJob>;
  createImageToVideoJob(input: MediaJobInput): Promise<MediaGenerationJob>;
  getJobStatus(job: MediaGenerationJob): Promise<MediaJobStatus>;
}

export interface DemoState {
  currentMode: NarrativeMode;
  activeProjectId: string;
  projects: Project[];
  stops: StoryStop[];
  assets: Asset[];
  mediaJobs: MediaGenerationJob[];
}
