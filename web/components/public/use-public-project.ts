// Shared lookup helper for the three public/reader pages. F-T009.
//
// Given a slug from the URL, this hook returns the matching project +
// stops + assets from the Zustand store. We check `useProject()` first
// (the single "current" project), then iterate `useProjectArchive()`
// (archived projects keyed by id). If no slug matches anywhere, the
// hook returns `null` so the caller can render a NotFoundCard instead
// of Next's `notFound()` — public URLs always build but may be empty
// for readers who don't share the browser's localStorage (M-fast
// single-device limitation).
"use client";

import { useProject, useProjectArchive } from "@/stores/project";
import { useStops } from "@/stores/stop";
import { useAssets } from "@/stores/asset";
import { useRootStore } from "@/stores/root";
import type { ArchivedProject, Asset, Project, Stop } from "@/stores/types";

export interface PublicProjectLookup {
  project: Project;
  stops: readonly Stop[];
  assets: readonly Asset[];
  /** True if we matched the current project (mutable) rather than archived. */
  isCurrent: boolean;
}

/**
 * Canonical slug for a stop (used to match the URL segment). Mirrors
 * `stopSlug()` in lib/static-params.ts — kept inline to avoid cross-
 * importing server helpers into client bundles.
 */
export function stopSlugFrom(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Find a stop by URL slug. Prefers an exact match on the slugified
 * title; falls back to a match on stop.n (e.g. "05") for robustness.
 */
export function findStopBySlug(
  stops: readonly Stop[],
  slug: string,
): Stop | undefined {
  return (
    stops.find((s) => stopSlugFrom(s.title) === slug) ??
    stops.find((s) => s.n === slug)
  );
}

/**
 * Match the URL slug against the current project first, then the
 * archive. Returns `null` when nothing matches — the caller renders
 * a NotFoundCard in that case.
 *
 * `authorHandle` is ignored in M-fast (single-user, local-only). Kept
 * in the signature so M1 can wire it up without touching callers.
 */
export function usePublicProjectLookup(
  _authorHandle: string,
  slug: string,
): PublicProjectLookup | null {
  const project = useProject();
  const archive = useProjectArchive();
  const stops = useStops();
  const assets = useAssets();

  if (project.slug === slug) {
    return { project, stops, assets, isCurrent: true };
  }

  const archived: ArchivedProject | undefined = Object.values(archive).find(
    (ap) => ap.project.slug === slug,
  );
  if (archived) {
    return {
      project: archived.project,
      stops: archived.stops,
      assets: archived.assetsPool,
      isCurrent: false,
    };
  }
  return null;
}

/**
 * SSR/build-time collector: all project slugs known to the store's
 * seeded state. Used by `generateStaticParams` in the three dynamic
 * routes so Next.js pre-builds a shell for each. Reads the store
 * snapshot directly (no React hooks) because it runs at build.
 */
export function listAllPublicProjects(): Array<{
  project: Project;
  stops: readonly Stop[];
}> {
  const s = useRootStore.getState();
  const out: Array<{ project: Project; stops: readonly Stop[] }> = [
    { project: s.project, stops: s.stops },
  ];
  for (const ap of Object.values(s.projectsArchive)) {
    out.push({ project: ap.project, stops: ap.stops });
  }
  return out;
}
