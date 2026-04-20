// Data access seam. All DB reads/writes go through here.
// Implementations land in M-fast (localStorage + IndexedDB) → M1 (Supabase).
// See ../docs/architecture.md#the-seam-layers and ../docs/data-model.md
import { NotImplementedError } from "./errors";

export type ProjectStatus = "draft" | "published";
export type ProjectVisibility = "public" | "unlisted" | "private";
export type NarrativeMode = "fashion" | "punk" | "cinema";

export interface Project {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  subtitle: string | null;
  locationName: string | null;
  defaultMode: NarrativeMode;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  coverAssetId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getProject(_id: string): Promise<Project | null> {
  throw new NotImplementedError("getProject");
}

export async function getProjectByHandleAndSlug(
  _handle: string,
  _slug: string,
): Promise<Project | null> {
  throw new NotImplementedError("getProjectByHandleAndSlug");
}

export async function listProjects(_args: {
  ownerId: string;
}): Promise<Project[]> {
  throw new NotImplementedError("listProjects");
}

export async function createProject(
  _input: Partial<Project> & { ownerId: string; title: string; slug: string },
): Promise<Project> {
  throw new NotImplementedError("createProject");
}

export async function updateProject(
  _id: string,
  _patch: Partial<Project>,
): Promise<Project> {
  throw new NotImplementedError("updateProject");
}

export async function softDeleteProject(_id: string): Promise<void> {
  throw new NotImplementedError("softDeleteProject");
}

// Stops, Postcards, Assets: fill in during M-fast as each feature lands.
