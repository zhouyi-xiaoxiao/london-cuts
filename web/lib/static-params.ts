// Static-params helpers for Next.js `generateStaticParams` in the dynamic
// scaffold + public routes. Keeps build time predictable by pre-rendering
// the seed author/project/stop combinations that the scaffold + reader
// pages consume.
//
// For F-T009: we enumerate BOTH seed projects (SE1 current + Reykjavík
// archived) so the public `[author]/[slug]` pages build a shell for
// each. The runtime render still reads the live Zustand store, so any
// user-published project in localStorage will render from the SE1 shell
// when its slug matches; otherwise we fall through to NotFoundCard.

import {
  SEED_PROJECT,
  SEED_PROJECT_REYKJAVIK,
  SEED_STOPS,
  SEED_STOPS_REYKJAVIK,
} from "@/lib/seed";

// The scaffold public routes key on an `@handle`. The new seed module
// carries display names only; derive a stable handle here so the routes
// stay canonical after the seed-data.ts deletion.
const SEED_AUTHOR_HANDLE = "@ana-ishii";

function stopSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getPublicProjectParams() {
  return [
    {
      author: SEED_AUTHOR_HANDLE,
      slug: SEED_PROJECT.slug,
    },
    {
      author: SEED_AUTHOR_HANDLE,
      slug: SEED_PROJECT_REYKJAVIK.slug,
    },
  ];
}

export function getPublicStopParams() {
  return [
    ...SEED_STOPS.map((stop) => ({
      author: SEED_AUTHOR_HANDLE,
      slug: SEED_PROJECT.slug,
      stop: stopSlug(stop.title),
    })),
    ...SEED_STOPS_REYKJAVIK.map((stop) => ({
      author: SEED_AUTHOR_HANDLE,
      slug: SEED_PROJECT_REYKJAVIK.slug,
      stop: stopSlug(stop.title),
    })),
  ];
}

export function getStudioProjectParams() {
  // The Zustand seed pre-loads the SE1 project as current + Reykjavík as
  // archived. Both need a stable static path for the scaffold routes.
  return [
    { projectId: "seed-a-year-in-se1" },
    { projectId: "seed-a-week-in-reykjavik" },
  ];
}
