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
    localeEntry(base, `${base}/en`, `${base}/zh`, 0.8),
    localeEntry(`${base}/atlas`, `${base}/en/atlas`, `${base}/zh/atlas`, 0.5),
    {
      url: `${base}/llms.txt`,
      changeFrequency: "weekly",
      priority: 0.4,
      alternates: {
        languages: {
          en: `${base}/llms.txt`,
          "zh-CN": `${base}/llms.txt?lang=zh`,
        },
      },
    },
    {
      url: `${base}/api/openapi.json`,
      changeFrequency: "weekly",
      priority: 0.3,
      alternates: {
        languages: {
          en: `${base}/api/openapi.json`,
          "zh-CN": `${base}/api/openapi.json?lang=zh`,
        },
      },
    },
  ];

  const projectEntries: MetadataRoute.Sitemap = [];
  for (const summary of projects) {
    projectEntries.push(
      {
        url: summary.canonicalUrl,
        lastModified: summary.updatedAt ?? summary.publishedAt ?? undefined,
        changeFrequency: "weekly",
        priority: 0.9,
        alternates: { languages: sitemapLanguages(summary.alternateUrls) },
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
          alternates: { languages: sitemapLanguages(stop.alternateUrls) },
        },
        {
          url: stop.postcard.canonicalUrl,
          lastModified: summary.updatedAt ?? summary.publishedAt ?? undefined,
          changeFrequency: "monthly",
          priority: 0.6,
          alternates: { languages: sitemapLanguages(stop.postcard.alternateUrls) },
        },
      );
    }
  }

  return [...staticEntries, ...projectEntries];
}

function localeEntry(
  url: string,
  en: string,
  zh: string,
  priority: number,
): MetadataRoute.Sitemap[number] {
  return {
    url,
    changeFrequency: "weekly",
    priority,
    alternates: { languages: { en, "zh-CN": zh } },
  };
}

function sitemapLanguages(urls: { en: string; zh: string }) {
  return { en: urls.en, "zh-CN": urls.zh };
}
