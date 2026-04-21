// Data access seam. All DB reads/writes go through here.
// See docs/architecture.md#4-the-seam-layers and docs/data-model.md
//
// M-fast impl: backed by the Zustand root store + localStorage persist +
// IndexedDB for binary assets (ported from legacy).
// M1 swap target: Supabase. Only this file changes; callers stay identical.

import { NotImplementedError } from "./errors";

// ─── Shared types ──────────────────────────────────────────────────────

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

// ─── Project CRUD (client-only, backed by Zustand) ────────────────────

// We lazy-import the store to avoid pulling Zustand into RSC bundles.
async function store() {
  const { useRootStore } = await import("@/stores/root");
  return useRootStore.getState();
}

export async function getProject(id: string): Promise<Project | null> {
  const s = await store();
  if (s.project.id === id) return s.project;
  const archived = s.projectsArchive[id];
  return archived?.project ?? null;
}

export async function getProjectByHandleAndSlug(
  _handle: string,
  slug: string,
): Promise<Project | null> {
  const s = await store();
  // M-fast: single-user, ignore handle.
  if (s.project.slug === slug) return s.project;
  for (const ap of Object.values(s.projectsArchive)) {
    if (ap.project.slug === slug) return ap.project;
  }
  return null;
}

export async function listProjects(_args: {
  ownerId: string;
}): Promise<Project[]> {
  const s = await store();
  const archived = Object.values(s.projectsArchive).map((ap) => ap.project);
  return [s.project, ...archived];
}

export async function createProject(
  input: Partial<Project> & { ownerId: string; title: string; slug: string },
): Promise<Project> {
  const s = await store();
  const now = new Date().toISOString();
  const next: Project = {
    id: input.id ?? `proj-${Date.now().toString(36)}`,
    ownerId: input.ownerId,
    slug: input.slug,
    title: input.title,
    subtitle: input.subtitle ?? null,
    locationName: input.locationName ?? null,
    defaultMode: input.defaultMode ?? "fashion",
    status: input.status ?? "draft",
    visibility: input.visibility ?? "public",
    coverAssetId: input.coverAssetId ?? null,
    publishedAt: input.publishedAt ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
  // Archive the current project, then adopt the new one as current.
  s.archiveCurrentProject();
  s.setProject(next);
  return next;
}

export async function updateProject(
  id: string,
  patch: Partial<Project>,
): Promise<Project> {
  const s = await store();
  if (s.project.id !== id) {
    throw new Error(
      `updateProject: only the current project is mutable in M-fast (got ${id})`,
    );
  }
  s.setProject(patch);
  return (await store()).project;
}

export async function softDeleteProject(id: string): Promise<void> {
  const s = await store();
  if (s.project.id === id) {
    // Current project — archive it.
    s.archiveCurrentProject();
    s.resetToSeed();
    return;
  }
  s.deleteArchivedProject(id);
}

// ─── Stops, Postcards, Assets ──────────────────────────────────────────
// Stop / postcard / asset mutations go through their scoped hooks
// (stores/stop.ts etc.) from component code. If you need a non-React
// entry point, import from stores/root.ts directly — intentionally not
// re-exported here because it creates an easy foot-gun for SSR misuse.

// ─── Not yet implemented (M1+) ────────────────────────────────────────

/** Hard delete (GDPR). M1: only admin with service role. */
export async function hardDeleteProject(_id: string): Promise<void> {
  throw new NotImplementedError("hardDeleteProject");
}
