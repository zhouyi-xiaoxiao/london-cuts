import type { MetadataRoute } from "next";

import {
  getAppBaseUrl,
  getPublicProject,
  listPublicProjects,
} from "@/lib/public-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppBaseUrl();
  const projects = await listPublicProjects();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/atlas`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/llms.txt`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${base}/api/openapi.json`, changeFrequency: "weekly", priority: 0.3 },
  ];

  const projectEntries: MetadataRoute.Sitemap = [];
  for (const summary of projects) {
    projectEntries.push(
      {
        url: summary.canonicalUrl,
        lastModified: summary.updatedAt ?? summary.publishedAt ?? undefined,
        changeFrequency: "weekly",
        priority: 0.9,
      },
      {
        url: summary.markdownUrl,
        lastModified: summary.updatedAt ?? summary.publishedAt ?? undefined,
        changeFrequency: "weekly",
        priority: 0.5,
      },
      {
        url: `${summary.apiUrl}/ai-visibility`,
        lastModified: summary.updatedAt ?? summary.publishedAt ?? undefined,
        changeFrequency: "weekly",
        priority: 0.4,
      },
    );
    const project = await getPublicProject(summary.handle, summary.slug);
    for (const stop of project?.stops ?? []) {
      projectEntries.push(
        {
          url: stop.canonicalUrl,
          lastModified: summary.updatedAt ?? summary.publishedAt ?? undefined,
          changeFrequency: "monthly",
          priority: 0.7,
        },
        {
          url: stop.postcard.canonicalUrl,
          lastModified: summary.updatedAt ?? summary.publishedAt ?? undefined,
          changeFrequency: "monthly",
          priority: 0.6,
        },
      );
    }
  }

  return [...staticEntries, ...projectEntries];
}
