import { seedProject, seedState } from "@/lib/seed-data";

export function getPublicProjectParams() {
  return [
    {
      author: seedProject.authorHandle,
      slug: seedProject.slug,
    },
  ];
}

export function getPublicStopParams() {
  return seedState.stops.map((stop) => ({
    author: seedProject.authorHandle,
    slug: seedProject.slug,
    stop: stop.slug,
  }));
}

export function getStudioProjectParams() {
  return seedState.projects.map((project) => ({
    projectId: project.id,
  }));
}
