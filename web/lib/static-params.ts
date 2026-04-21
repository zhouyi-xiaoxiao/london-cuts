// Static-params helpers for Next.js `generateStaticParams` in the dynamic
// scaffold routes. Keeps build time predictable by pre-rendering the seed
// author/project/stop combinations that the scaffold pages consume.

import { SEED_PROJECT, SEED_STOPS } from "@/lib/seed";

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
  ];
}

export function getPublicStopParams() {
  return SEED_STOPS.map((stop) => ({
    author: SEED_AUTHOR_HANDLE,
    slug: SEED_PROJECT.slug,
    stop: stopSlug(stop.title),
  }));
}

export function getStudioProjectParams() {
  // The Zustand seed pre-loads the SE1 project as current + Reykjavík as
  // archived. Both need a stable static path for the scaffold routes.
  return [
    { projectId: "seed-a-year-in-se1" },
    { projectId: "seed-a-week-in-reykjavik" },
  ];
}
