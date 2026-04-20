import type { Project, StoryStop } from "@/lib/types";

export function projectPath(project: Pick<Project, "authorHandle" | "slug">) {
  return `/${project.authorHandle}/${project.slug}`;
}

export function atlasPath() {
  return "/atlas";
}

export function chapterPath(
  project: Pick<Project, "authorHandle" | "slug">,
  stop: Pick<StoryStop, "slug">,
) {
  return `/${project.authorHandle}/${project.slug}/chapter/${stop.slug}`;
}

export function postcardPath(
  project: Pick<Project, "authorHandle" | "slug">,
  stop: Pick<StoryStop, "slug">,
) {
  return `/${project.authorHandle}/${project.slug}/p/${stop.slug}`;
}

export function studioProjectPath(projectId: string) {
  return `/studio/${projectId}`;
}
