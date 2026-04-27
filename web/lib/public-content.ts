import type { Metadata } from "next";

import {
  DEFAULT_LOCALE,
  LOCALES,
  SEED_POSTCARD_TRANSLATIONS,
  SEED_PROJECT_TRANSLATIONS,
  SEED_STOP_TRANSLATIONS,
  localizeBodyBlocks,
  localizePath,
  localizedField,
  type Locale,
  type Localized,
  type ProjectTranslation,
  type StopTranslation,
} from "@/lib/i18n";
import { fetchPublicProjectByHandleAndSlug } from "@/lib/public-lookup";
import {
  SEED_ASSETS,
  SEED_BODIES,
  SEED_POSTCARDS,
  SEED_PROJECT,
  SEED_PROJECT_REYKJAVIK,
  SEED_STOPS,
  SEED_STOPS_REYKJAVIK,
  type BodyBlock,
} from "@/lib/seed";
import { getBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import type { Asset, Project, Stop } from "@/stores/types";

const DEFAULT_BASE_URL = "https://london-cuts.vercel.app";
const SEED_OWNER_ID = "00000000-0000-4000-8000-000000000001";
const SEED_HANDLE = "ana-ishii";

export interface PublicAssetDTO {
  id: string;
  url: string | null;
  absoluteUrl: string | null;
  tone: string | null;
  alt: string;
  caption: string | null;
  styleId?: string | null;
  locale: Locale;
  availableLocales: readonly Locale[];
}

export interface PublicPostcardDTO {
  message: string;
  style: string | null;
  orientation: "portrait" | "landscape" | null;
  frontAssetId: string | null;
  frontImageUrl: string | null;
  canonicalUrl: string;
  locale: Locale;
  availableLocales: readonly Locale[];
  alternateUrls: Record<Locale, string>;
}

export interface PublicStopDTO {
  id: string;
  n: string;
  slug: string;
  title: string;
  time: string;
  mood: string;
  tone: string;
  label: string;
  code: string;
  lat: number | null;
  lng: number | null;
  bodyBlocks: readonly BodyBlock[];
  bodyText: string;
  heroAssetId: string | null;
  heroImageUrl: string | null;
  canonicalUrl: string;
  postcard: PublicPostcardDTO;
  locale: Locale;
  availableLocales: readonly Locale[];
  alternateUrls: Record<Locale, string>;
}

export interface PublicFeaturedStopDTO {
  n: string;
  title: string;
  slug: string;
  mood: string;
  location: string;
  canonicalUrl: string;
  heroImageUrl: string | null;
}

export interface PublicCitationGuidanceDTO {
  project: string;
  markdown: string;
  stops: readonly string[];
  doNotInfer: readonly string[];
}

export interface PublicProjectSummaryDTO {
  id: string;
  handle: string;
  authorName: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  locationName: string | null;
  defaultMode: string;
  tags: readonly string[];
  publishedAt: string | null;
  updatedAt: string | null;
  canonicalUrl: string;
  apiUrl: string;
  markdownUrl: string;
  coverImageUrl: string | null;
  stopCount: number;
  shortSummary: string;
  retrievalKeywords: readonly string[];
  featuredStops: readonly PublicFeaturedStopDTO[];
  places: readonly string[];
  imageCount: number;
  citationGuidance: PublicCitationGuidanceDTO;
  locale: Locale;
  availableLocales: readonly Locale[];
  alternateUrls: Record<Locale, string>;
  translationStatus: "source" | "translated" | "fallback";
}

export interface PublicProjectDTO extends PublicProjectSummaryDTO {
  stops: readonly PublicStopDTO[];
  assets: readonly PublicAssetDTO[];
  markdown: string;
}

interface DiscoveryStopInput {
  n: string;
  title: string;
  slug: string;
  mood: string;
  canonicalUrl: string;
  heroImageUrl: string | null;
  location?: string | null;
  label?: string | null;
  code?: string | null;
  heroAssetId?: string | null;
}

type PublicProjectDiscoveryFields = Pick<
  PublicProjectSummaryDTO,
  | "shortSummary"
  | "retrievalKeywords"
  | "featuredStops"
  | "places"
  | "imageCount"
  | "citationGuidance"
>;

export function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_BASE_URL;
  return raw.replace(/\/+$/, "");
}

export function normalizeHandle(handle: string): string {
  return decodeURIComponent(handle).replace(/^@/, "").toLowerCase();
}

export function handlePath(handle: string): string {
  return `@${normalizeHandle(handle)}`;
}

export function stopSlug(title: string): string {
  return slugify(title || "stop");
}

export function absoluteUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getAppBaseUrl()}${path}`;
}

export async function listPublicProjects(
  locale: Locale = DEFAULT_LOCALE,
): Promise<PublicProjectSummaryDTO[]> {
  const live = await listSupabaseProjectSummaries(locale);
  if (live.length > 0) return live;

  return [
    seedProjectToPublic({
      project: seedProjectToRuntime(SEED_PROJECT, "seed-a-year-in-se1"),
      stops: seedStopsToRuntime(SEED_STOPS, SEED_PROJECT.slug),
      assets: seedAssetsToRuntime(),
    }, locale),
    seedProjectToPublic({
      project: seedProjectToRuntime(
        SEED_PROJECT_REYKJAVIK,
        "seed-a-week-in-reykjavik",
      ),
      stops: seedStopsToRuntime(SEED_STOPS_REYKJAVIK, SEED_PROJECT_REYKJAVIK.slug),
      assets: [],
    }, locale),
  ].map(projectSummary);
}

export async function getPublicProject(
  handle: string,
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<PublicProjectDTO | null> {
  const normalizedHandle = normalizeHandle(handle);
  const live = await fetchPublicProjectByHandleAndSlug(normalizedHandle, slug);
  if (live) return publicLookupPayloadToProject(live, normalizedHandle, locale);

  if (normalizedHandle === SEED_HANDLE && slug === SEED_PROJECT.slug) {
    return seedProjectToPublic({
      project: seedProjectToRuntime(SEED_PROJECT, "seed-a-year-in-se1"),
      stops: seedStopsToRuntime(SEED_STOPS, SEED_PROJECT.slug),
      assets: seedAssetsToRuntime(),
    }, locale);
  }
  if (normalizedHandle === SEED_HANDLE && slug === SEED_PROJECT_REYKJAVIK.slug) {
    return seedProjectToPublic({
      project: seedProjectToRuntime(
        SEED_PROJECT_REYKJAVIK,
        "seed-a-week-in-reykjavik",
      ),
      stops: seedStopsToRuntime(SEED_STOPS_REYKJAVIK, SEED_PROJECT_REYKJAVIK.slug),
      assets: [],
    }, locale);
  }
  return null;
}

export async function getPublicStop(
  handle: string,
  slug: string,
  stop: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<{ project: PublicProjectDTO; stop: PublicStopDTO } | null> {
  const project = await getPublicProject(handle, slug, locale);
  if (!project) return null;
  const wanted = decodeURIComponent(stop);
  const found = project.stops.find(
    (s) => s.slug === wanted || s.n === wanted || slugify(s.title) === wanted,
  );
  return found ? { project, stop: found } : null;
}

export function projectSummary(
  project: PublicProjectDTO,
): PublicProjectSummaryDTO {
  const {
    stops: _stops,
    assets: _assets,
    markdown: _markdown,
    ...summary
  } = project;
  return summary;
}

export function publicProjectToRuntimeLookup(project: PublicProjectDTO): {
  project: Project;
  stops: Stop[];
  assets: Asset[];
  isCurrent: false;
} {
  return {
    project: {
      id: project.id,
      ownerId: project.handle,
      slug: project.slug,
      title: project.title,
      subtitle: project.subtitle,
      locationName: project.locationName,
      defaultMode:
        project.defaultMode === "punk" || project.defaultMode === "cinema"
          ? project.defaultMode
          : "fashion",
      status: "published",
      visibility: "public",
      coverAssetId: null,
      publishedAt: project.publishedAt,
      createdAt: project.publishedAt ?? "",
      updatedAt: project.updatedAt ?? project.publishedAt ?? "",
      author: project.authorName,
      tags: [...project.tags],
      published: project.publishedAt ?? "",
      reads: 0,
      saves: 0,
      duration: "",
      coverLabel: project.locationName ?? project.places.join(" · "),
    },
    stops: project.stops.map((stop) => ({
      n: stop.n,
      code: stop.code,
      title: stop.title,
      time: stop.time,
      mood: stop.mood,
      tone:
        stop.tone === "punk" || stop.tone === "cool" ? stop.tone : "warm",
      lat: stop.lat ?? 0,
      lng: stop.lng ?? 0,
      label: stop.label,
      body: stop.bodyBlocks,
      postcard: {
        message: stop.postcard.message,
        recipient: { name: "", line1: "", line2: "", country: "" },
        orientation: stop.postcard.orientation ?? "portrait",
        frontAssetId: stop.postcard.frontAssetId,
        style: null,
      },
      heroAssetId: stop.heroAssetId,
      assetIds: [stop.heroAssetId, stop.postcard.frontAssetId].filter(
        (id): id is string => Boolean(id),
      ),
      status: {
        upload: Boolean(stop.heroImageUrl),
        hero: Boolean(stop.heroImageUrl),
        body: stop.bodyText.trim().length > 0,
        media: null,
      },
    })),
    assets: project.assets.map((asset) => ({
      id: asset.id,
      stop: null,
      tone:
        asset.tone === "punk" || asset.tone === "cool" ? asset.tone : "warm",
      imageUrl: asset.url,
      styleId:
        asset.styleId === "illustration" ||
        asset.styleId === "poster" ||
        asset.styleId === "riso" ||
        asset.styleId === "inkwash" ||
        asset.styleId === "anime" ||
        asset.styleId === "artnouveau"
          ? asset.styleId
          : undefined,
      styleLabel: asset.caption ?? undefined,
    })),
    isCurrent: false,
  };
}

export function projectMarkdown(project: PublicProjectDTO): string {
  const zh = project.locale === "zh";
  const labels = zh
    ? {
        atAGlance: "概览",
        facts: "事实",
        stopsTable: "站点表",
        imageReferences: "图片引用",
        stopNotes: "站点笔记",
        citationUrls: "引用 URL",
        doNotInfer: "不要推断",
        citationGuidance: "引用指引",
        summary: "摘要",
        author: "作者",
        places: "地点",
        keywords: "关键词",
        canonicalUrl: "规范 URL",
        apiUrl: "API URL",
        markdownUrl: "Markdown URL",
        published: "发布时间",
        stops: "站点",
        images: "图片",
        title: "标题",
        subtitle: "副标题",
        description: "描述",
        location: "地点",
        defaultMode: "默认模式",
        tags: "标签",
        coverImage: "封面图片",
        noImages: "这个项目没有公开图片资产。",
        none: "无",
        unknown: "未知",
        time: "时间",
        mood: "情绪",
        coordinates: "坐标",
        heroImage: "主图",
        postcard: "明信片",
        projectCanonical: "项目规范 URL",
        markdownPack: "Markdown 包",
        publicApi: "公开 API",
      }
    : {
        atAGlance: "At a Glance",
        facts: "Facts",
        stopsTable: "Stops Table",
        imageReferences: "Image References",
        stopNotes: "Stop Notes",
        citationUrls: "Citation URLs",
        doNotInfer: "Do-Not-Infer Notes",
        citationGuidance: "Citation Guidance",
        summary: "Summary",
        author: "Author",
        places: "Places",
        keywords: "Keywords",
        canonicalUrl: "Canonical URL",
        apiUrl: "API URL",
        markdownUrl: "Markdown URL",
        published: "Published",
        stops: "Stops",
        images: "Images",
        title: "Title",
        subtitle: "Subtitle",
        description: "Description",
        location: "Location",
        defaultMode: "Default mode",
        tags: "Tags",
        coverImage: "Cover image",
        noImages: "No public image assets are exposed for this project.",
        none: "none",
        unknown: "unknown",
        time: "Time",
        mood: "Mood",
        coordinates: "Coordinates",
        heroImage: "Hero image",
        postcard: "Postcard",
        projectCanonical: "Project canonical",
        markdownPack: "Markdown pack",
        publicApi: "Public API",
      };
  const lines = [
    `# ${project.title}`,
    "",
    project.shortSummary,
    "",
    `## ${labels.atAGlance}`,
    "",
    `- ${labels.summary}: ${project.shortSummary}`,
    `- ${labels.author}: ${project.authorName} (@${project.handle})`,
    `- ${labels.places}: ${listOrUnknown(project.places, project.locale)}`,
    `- ${labels.keywords}: ${listOrUnknown(project.retrievalKeywords, project.locale)}`,
    `- ${labels.canonicalUrl}: ${project.canonicalUrl}`,
    `- ${labels.apiUrl}: ${project.apiUrl}`,
    `- ${labels.markdownUrl}: ${project.markdownUrl}`,
    `- ${labels.published}: ${project.publishedAt ?? labels.unknown}`,
    `- ${labels.stops}: ${project.stopCount}`,
    `- ${labels.images}: ${project.imageCount}`,
    "",
    `## ${labels.facts}`,
    "",
    `- ${labels.title}: ${project.title}`,
    `- ${labels.subtitle}: ${project.subtitle ?? labels.none}`,
    `- ${labels.description}: ${project.description}`,
    `- ${labels.location}: ${project.locationName ?? listOrUnknown(project.places, project.locale)}`,
    `- ${labels.defaultMode}: ${project.defaultMode}`,
    `- ${labels.tags}: ${listOrUnknown(project.tags, project.locale)}`,
    `- ${labels.coverImage}: ${project.coverImageUrl ?? labels.none}`,
    "",
    `## ${labels.stopsTable}`,
    "",
    zh
      ? "| # | 站点 | 情绪 | 地点 | 时间 | 章节 URL |"
      : "| # | Stop | Mood | Place | Time | Chapter URL |",
    "|---|---|---|---|---|---|",
    ...project.stops.map(
      (stop) =>
        `| ${mdCell(stop.n)} | ${mdCell(stop.title)} | ${mdCell(
          stop.mood,
        )} | ${mdCell(stop.label || stop.code)} | ${mdCell(stop.time)} | ${
          stop.canonicalUrl
        } |`,
    ),
    "",
    `## ${labels.imageReferences}`,
    "",
    ...(project.assets.length > 0
      ? [
          zh ? "| 资产 | URL | 替代文本 | 图注 |" : "| Asset | URL | Alt | Caption |",
          "|---|---|---|---|",
          ...project.assets.map(
            (asset) =>
              `| ${mdCell(asset.id)} | ${asset.absoluteUrl ?? "none"} | ${mdCell(
                asset.alt,
              )} | ${mdCell(asset.caption)} |`,
          ),
        ]
      : [labels.noImages]),
    "",
    `## ${labels.stopNotes}`,
    "",
  ];

  for (const stop of project.stops) {
    lines.push(`### ${stop.n}. ${stop.title}`);
    lines.push("");
    lines.push(`- URL: ${stop.canonicalUrl}`);
    lines.push(`- ${labels.time}: ${stop.time || labels.unknown}`);
    lines.push(`- ${labels.mood}: ${stop.mood || labels.unknown}`);
    lines.push(`- ${labels.location}: ${stop.label || stop.code || labels.unknown}`);
    if (stop.lat != null && stop.lng != null) {
      lines.push(`- ${labels.coordinates}: ${stop.lat}, ${stop.lng}`);
    }
    if (stop.heroImageUrl) lines.push(`- ${labels.heroImage}: ${stop.heroImageUrl}`);
    if (stop.bodyText) {
      lines.push("");
      lines.push(stop.bodyText);
    }
    if (stop.postcard.message) {
      lines.push("");
      lines.push(`${labels.postcard}: ${stop.postcard.message}`);
    }
    lines.push("");
  }

  lines.push(`## ${labels.citationUrls}`);
  lines.push("");
  lines.push(`- ${labels.projectCanonical}: ${project.canonicalUrl}`);
  lines.push(`- ${labels.markdownPack}: ${project.markdownUrl}`);
  lines.push(`- ${labels.publicApi}: ${project.apiUrl}`);
  for (const stop of project.stops) {
    lines.push(`- ${stop.n}. ${stop.title}: ${stop.canonicalUrl}`);
    lines.push(`- ${stop.n}. ${stop.title} ${labels.postcard}: ${stop.postcard.canonicalUrl}`);
  }
  lines.push("");
  lines.push(`## ${labels.doNotInfer}`);
  lines.push("");
  for (const note of project.citationGuidance.doNotInfer) {
    lines.push(`- ${note}`);
  }
  lines.push("");
  lines.push(`## ${labels.citationGuidance}`);
  lines.push("");
  lines.push(`- ${project.citationGuidance.project}`);
  lines.push(`- ${project.citationGuidance.markdown}`);
  return lines.join("\n").trimEnd() + "\n";
}

export function projectJsonLd(project: PublicProjectDTO): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    url: project.canonicalUrl,
    author: {
      "@type": "Person",
      name: project.authorName,
      url: `${getAppBaseUrl()}/${handlePath(project.handle)}`,
    },
    datePublished: project.publishedAt ?? undefined,
    image: project.coverImageUrl ?? undefined,
    inLanguage: project.locale === "zh" ? "zh-CN" : "en",
    hasPart: project.stops.map((stop, index) => ({
      "@type": "CreativeWork",
      position: index + 1,
      name: stop.title,
      url: stop.canonicalUrl,
      image: stop.heroImageUrl ?? undefined,
      contentLocation:
        stop.lat != null && stop.lng != null
          ? {
              "@type": "Place",
              name: stop.label || stop.code || stop.title,
              geo: {
                "@type": "GeoCoordinates",
                latitude: stop.lat,
                longitude: stop.lng,
              },
            }
          : undefined,
    })),
  };
}

export function stopJsonLd(
  project: PublicProjectDTO,
  stop: PublicStopDTO,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `${stop.title} - ${project.title}`,
    description: stop.bodyText || stop.label || project.description,
    url: stop.canonicalUrl,
    isPartOf: {
      "@type": "CreativeWork",
      name: project.title,
      url: project.canonicalUrl,
    },
    image: stop.heroImageUrl ?? undefined,
    inLanguage: project.locale === "zh" ? "zh-CN" : "en",
    contentLocation:
      stop.lat != null && stop.lng != null
        ? {
            "@type": "Place",
            name: stop.label || stop.code || stop.title,
            geo: {
              "@type": "GeoCoordinates",
              latitude: stop.lat,
              longitude: stop.lng,
            },
          }
        : undefined,
  };
}

export function projectMetadata(project: PublicProjectDTO): Metadata {
  const title = `${project.title} | London Cuts`;
  const description = project.shortSummary || project.description;
  return {
    title,
    description,
    alternates: {
      canonical: project.canonicalUrl,
      languages: {
        en: project.alternateUrls.en,
        "zh-CN": project.alternateUrls.zh,
      },
    },
    openGraph: {
      title,
      description,
      url: project.canonicalUrl,
      siteName: "London Cuts",
      type: "article",
      images: project.coverImageUrl ? [{ url: project.coverImageUrl }] : [],
    },
    twitter: {
      card: project.coverImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: project.coverImageUrl ? [project.coverImageUrl] : [],
    },
  };
}

export function stopMetadata(
  project: PublicProjectDTO,
  stop: PublicStopDTO,
  kind: "chapter" | "postcard",
): Metadata {
  const title =
    kind === "postcard"
      ? `${stop.title} postcard | ${project.title}`
      : `${stop.title} | ${project.title}`;
  const description =
    kind === "postcard"
      ? stop.postcard.message || stop.bodyText || project.description
      : stop.bodyText || stop.label || project.description;
  const url = kind === "postcard" ? stop.postcard.canonicalUrl : stop.canonicalUrl;
  const image = kind === "postcard"
    ? (stop.postcard.frontImageUrl ?? stop.heroImageUrl)
    : stop.heroImageUrl;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: project.alternateUrls.en,
        "zh-CN": project.alternateUrls.zh,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "London Cuts",
      type: "article",
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

async function listSupabaseProjectSummaries(
  locale: Locale,
): Promise<PublicProjectSummaryDTO[]> {
  if (!hasSupabaseConfig()) return [];
  let db;
  try {
    db = getBrowserClient();
  } catch {
    return [];
  }

  const { data: projects, error: projectErr } = await db
    .from("projects")
    .select("*")
    .eq("status", "published")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("published_at", { ascending: false });
  if (projectErr || !projects?.length) return [];

  const ownerIds = Array.from(
    new Set(projects.map((p) => p.owner_id).filter(Boolean) as string[]),
  );
  const projectIds = projects.map((p) => p.id as string);
  const coverIds = projects
    .map((p) => p.cover_asset_id as string | null)
    .filter(Boolean) as string[];
  const { data: users } = ownerIds.length
    ? await db
        .from("users")
        .select("id, handle, display_name")
        .in("id", ownerIds)
        .is("deleted_at", null)
    : { data: [] };
  const userById = new Map<string, { handle: string; display_name?: string | null }>();
  for (const u of users ?? []) {
    userById.set(u.id as string, {
      handle: u.handle as string,
      display_name: (u.display_name as string | null) ?? null,
    });
  }

  const { data: stopRows } = projectIds.length
    ? await db
        .from("stops")
        .select(
          "project_id, legacy_n, order_index, slug, code, title, place, time_label, mood, display_label, hero_asset_id, translations",
        )
        .in("project_id", projectIds)
        .is("deleted_at", null)
        .order("order_index", { ascending: true })
    : { data: [] };
  const stopCountByProject = new Map<string, number>();
  const stopsByProject = new Map<string, DiscoveryStopInput[]>();
  for (const stop of stopRows ?? []) {
    const projectId = stop.project_id as string;
    stopCountByProject.set(projectId, (stopCountByProject.get(projectId) ?? 0) + 1);
    const current = stopsByProject.get(projectId) ?? [];
    const translations = parseTranslations<StopTranslation>(stop.translations);
    const title = cleanText(
      (localizedField(
        locale,
        (stop.title as string | null) ?? "",
        translations,
        "title",
      ) as string | null) ?? "",
    );
    const slug = ((stop.slug as string | null) ?? stopSlug(title || "stop")).trim();
    const label = cleanText(
      (localizedField(
        locale,
        ((stop.display_label as string | null) ??
          (stop.place as string | null) ??
          (stop.code as string | null) ??
          "") as string,
        translations,
        "label",
      ) as string | null) ?? "",
    );
    current.push({
      n:
        ((stop.legacy_n as string | null) ??
          String((stop.order_index as number | null) ?? current.length + 1)),
      title,
      slug,
      mood: cleanText(
        (localizedField(
          locale,
          ((stop.mood as string | null) ?? "") as string,
          translations,
          "mood",
        ) as string | null) ?? "",
      ),
      location: label,
      canonicalUrl: "",
      heroImageUrl: null,
      heroAssetId: (stop.hero_asset_id as string | null) ?? null,
    });
    stopsByProject.set(projectId, current);
  }

  const { data: assetRows } = projectIds.length
    ? await db
        .from("assets")
        .select("id, project_id, storage_path")
        .in("project_id", projectIds)
        .is("deleted_at", null)
    : { data: [] };
  const imageCountByProject = new Map<string, number>();
  const assetUrlById = new Map<string, string | null>();
  for (const asset of assetRows ?? []) {
    const projectId = asset.project_id as string | null;
    if (projectId) {
      imageCountByProject.set(projectId, (imageCountByProject.get(projectId) ?? 0) + 1);
    }
    assetUrlById.set(
      asset.id as string,
      absoluteUrl((asset.storage_path as string | null) ?? null),
    );
  }

  const missingCoverIds = coverIds.filter((id) => !assetUrlById.has(id));
  const { data: coverRows } = missingCoverIds.length
    ? await db
        .from("assets")
        .select("id, storage_path")
        .in("id", missingCoverIds)
        .is("deleted_at", null)
    : { data: [] };
  const coverById = new Map<string, string | null>();
  for (const cover of coverRows ?? []) {
    const url = absoluteUrl((cover.storage_path as string | null) ?? null);
    coverById.set(cover.id as string, url);
    assetUrlById.set(cover.id as string, url);
  }

  return projects.map((row) => {
    const user = userById.get(row.owner_id as string) ?? {
      handle: SEED_HANDLE,
      display_name: "Ana Ishii",
    };
    const handle = normalizeHandle(user.handle);
    const canonicalUrl = `${getAppBaseUrl()}/${handlePath(handle)}/${row.slug}`;
    const markdownUrl = `${getAppBaseUrl()}/api/v1/projects/${encodeURIComponent(
      handlePath(handle),
    )}/${row.slug}/markdown`;
    const featuredStops = (stopsByProject.get(row.id as string) ?? [])
      .slice(0, 5)
      .map((stop) => ({
        ...stop,
        canonicalUrl: `${canonicalUrl}/chapter/${stop.slug}`,
        heroImageUrl: stop.heroAssetId
          ? (assetUrlById.get(stop.heroAssetId) ?? null)
          : null,
      }));
    const translations = parseTranslations<ProjectTranslation>(row.translations);
    const baseDescription =
      ((row.description as string | null) ??
        (row.subtitle as string | null) ??
        `${row.title} by ${user.display_name ?? handle}`);
    const title = localizedField(
      locale,
      row.title as string,
      translations,
      "title",
    ) as string;
    const subtitle = localizedField(
      locale,
      (row.subtitle as string | null) ?? null,
      translations,
      "subtitle",
    ) as string | null;
    const description = localizedField(
      locale,
      baseDescription,
      translations,
      "description",
    ) as string;
    const locationName = localizedField(
      locale,
      (row.location_name as string | null) ?? null,
      translations,
      "locationName",
    ) as string | null;
    const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];
    const localizedTags = localizedField(locale, tags, translations, "tags") as string[];
    const imageCount = imageCountByProject.get(row.id as string) ?? 0;
    const discovery = buildDiscoveryFields({
      authorName: user.display_name ?? handle,
      title,
      subtitle,
      description,
      locationName,
      tags: localizedTags,
      canonicalUrl,
      markdownUrl,
      stops: featuredStops,
      stopCount: stopCountByProject.get(row.id as string) ?? featuredStops.length,
      imageCount,
      locale,
    });
    return {
      id: row.id as string,
      handle,
      authorName: user.display_name ?? handle,
      slug: row.slug as string,
      title,
      subtitle,
      description,
      locationName,
      defaultMode: (row.default_mode as string | null) ?? "fashion",
      tags: localizedTags,
      publishedAt: (row.published_at as string | null) ?? null,
      updatedAt: (row.updated_at as string | null) ?? null,
      canonicalUrl,
      apiUrl: `${getAppBaseUrl()}/api/v1/projects/${encodeURIComponent(
        handlePath(handle),
      )}/${row.slug}`,
      markdownUrl,
      coverImageUrl: row.cover_asset_id
        ? (assetUrlById.get(row.cover_asset_id as string) ??
          coverById.get(row.cover_asset_id as string) ??
          null)
        : null,
      stopCount: stopCountByProject.get(row.id as string) ?? 0,
      locale,
      availableLocales: availableLocales(translations),
      alternateUrls: alternateUrlsForProject(handle, row.slug as string),
      translationStatus: translationStatus(locale, translations),
      ...discovery,
    };
  });
}

function publicLookupPayloadToProject(
  payload: { project: Project; stops: readonly Stop[]; assets: readonly Asset[] },
  handle: string,
  locale: Locale,
): PublicProjectDTO {
  return runtimeToPublicProject(payload.project, payload.stops, payload.assets, handle, locale);
}

function seedProjectToPublic(payload: {
  project: Project;
  stops: readonly Stop[];
  assets: readonly Asset[];
}, locale: Locale): PublicProjectDTO {
  return runtimeToPublicProject(payload.project, payload.stops, payload.assets, SEED_HANDLE, locale);
}

function runtimeToPublicProject(
  project: Project,
  stops: readonly Stop[],
  assets: readonly Asset[],
  handle: string,
  locale: Locale,
): PublicProjectDTO {
  const normalizedHandle = normalizeHandle(handle);
  const projectPath = `/${handlePath(normalizedHandle)}/${project.slug}`;
  const canonicalUrl = `${getAppBaseUrl()}${projectPath}`;
  const assetDtos = assets.map((asset) => toAssetDto(asset, locale));
  const assetById = new Map(assetDtos.map((asset) => [asset.id, asset]));
  const stopDtos = stops.map((stop) =>
    toStopDto(stop, project, normalizedHandle, assetById, locale),
  );
  const coverAsset = project.coverAssetId
    ? assetById.get(project.coverAssetId)
    : assetDtos[assetDtos.length - 1];
  const projectTranslations = project.translations;
  const title = localizedField(locale, project.title, projectTranslations, "title") as string;
  const subtitle = localizedField(
    locale,
    project.subtitle,
    projectTranslations,
    "subtitle",
  ) as string | null;
  const locationName = localizedField(
    locale,
    project.locationName,
    projectTranslations,
    "locationName",
  ) as string | null;
  const authorName = localizedField(
    locale,
    project.author || normalizedHandle,
    projectTranslations,
    "author",
  ) as string;
  const tags = localizedField(
    locale,
    project.tags ?? [],
    projectTranslations,
    "tags",
  ) as readonly string[];
  const description =
    (localizedField(
      locale,
      project.subtitle ??
        project.locationName ??
        `${project.title}, a public London Cuts travel story.`,
      projectTranslations,
      "description",
    ) as string) ??
    `${title}, a public London Cuts travel story.`;
  const markdownUrl = `${getAppBaseUrl()}/api/v1/projects/${encodeURIComponent(
    handlePath(normalizedHandle),
  )}/${project.slug}/markdown${locale === "en" ? "" : `?lang=${locale}`}`;
  const discovery = buildDiscoveryFields({
    authorName,
    title,
    subtitle,
    description,
    locationName,
    tags,
    canonicalUrl,
    markdownUrl,
    stops: stopDtos,
    stopCount: stopDtos.length,
    imageCount: assetDtos.filter((asset) => asset.absoluteUrl).length,
    locale,
  });
  const dto: Omit<PublicProjectDTO, "markdown"> = {
    id: project.id,
    handle: normalizedHandle,
    authorName,
    slug: project.slug,
    title,
    subtitle,
    description,
    locationName,
    defaultMode: project.defaultMode,
    tags,
    publishedAt: project.publishedAt ?? project.published ?? null,
    updatedAt: project.updatedAt ?? null,
    canonicalUrl,
    apiUrl: `${getAppBaseUrl()}/api/v1/projects/${encodeURIComponent(
      handlePath(normalizedHandle),
    )}/${project.slug}`,
    markdownUrl,
    coverImageUrl: coverAsset?.absoluteUrl ?? null,
    stopCount: stopDtos.length,
    locale,
    availableLocales: availableLocales(projectTranslations),
    alternateUrls: alternateUrlsForProject(normalizedHandle, project.slug),
    translationStatus: translationStatus(locale, projectTranslations),
    ...discovery,
    stops: stopDtos,
    assets: assetDtos,
  };
  const full: PublicProjectDTO = { ...dto, markdown: "" };
  return { ...full, markdown: projectMarkdown(full) };
}

function toStopDto(
  stop: Stop,
  project: Project,
  handle: string,
  assetById: Map<string, PublicAssetDTO>,
  locale: Locale,
): PublicStopDTO {
  const translations = stop.translations;
  const title = localizedField(locale, stop.title, translations, "title") as string;
  const time = localizedField(locale, stop.time, translations, "time") as string;
  const mood = localizedField(locale, stop.mood, translations, "mood") as string;
  const label = localizedField(locale, stop.label, translations, "label") as string;
  const code = localizedField(locale, stop.code, translations, "code") as string;
  const bodyBlocks = localizeBodyBlocks(locale, stop.body, translations);
  const postcardTranslations = stop.postcard.translations;
  const postcardMessage = localizedField(
    locale,
    stop.postcard.message,
    postcardTranslations,
    "message",
  ) as string;
  const slug = stopSlug(stop.title);
  const chapterUrl = `${getAppBaseUrl()}/${handlePath(handle)}/${project.slug}/chapter/${slug}`;
  const postcardUrl = `${getAppBaseUrl()}/${handlePath(handle)}/${project.slug}/p/${slug}`;
  const heroAsset = stop.heroAssetId ? assetById.get(stop.heroAssetId) : null;
  const frontAsset = stop.postcard.frontAssetId
    ? assetById.get(stop.postcard.frontAssetId)
    : heroAsset;
  return {
    id: `${project.id}:${stop.n}`,
    n: stop.n,
    slug,
    title,
    time,
    mood,
    tone: stop.tone,
    label,
    code,
    lat: Number.isFinite(stop.lat) ? stop.lat : null,
    lng: Number.isFinite(stop.lng) ? stop.lng : null,
    bodyBlocks,
    bodyText: bodyToText(bodyBlocks),
    heroAssetId: stop.heroAssetId,
    heroImageUrl: heroAsset?.absoluteUrl ?? null,
    canonicalUrl: chapterUrl,
    postcard: {
      message: postcardMessage,
      style: stop.postcard.style ?? null,
      orientation: stop.postcard.orientation ?? null,
      frontAssetId: stop.postcard.frontAssetId ?? null,
      frontImageUrl: frontAsset?.absoluteUrl ?? null,
      canonicalUrl: postcardUrl,
      locale,
      availableLocales: availableLocales(postcardTranslations),
      alternateUrls: alternateUrlsForPostcard(handle, project.slug, slug),
    },
    locale,
    availableLocales: availableLocales(translations),
    alternateUrls: alternateUrlsForStop(handle, project.slug, slug),
  };
}

function toAssetDto(asset: Asset, locale: Locale): PublicAssetDTO {
  const absolute = absoluteUrl(asset.imageUrl);
  const caption = asset.styleLabel ?? asset.prompt ?? null;
  const translations = asset.translations;
  const localizedCaption = localizedField(
    locale,
    caption,
    translations,
    "caption",
  ) as string | null;
  const alt = localizedField(
    locale,
    caption ?? asset.id,
    translations,
    "alt",
  ) as string;
  return {
    id: asset.id,
    url: asset.imageUrl,
    absoluteUrl: absolute,
    tone: asset.tone ?? null,
    alt,
    caption: localizedCaption,
    styleId: asset.styleId ?? null,
    locale,
    availableLocales: availableLocales(translations),
  };
}

function buildDiscoveryFields(input: {
  authorName: string;
  title: string;
  subtitle: string | null;
  description: string;
  locationName: string | null;
  tags: readonly string[];
  canonicalUrl: string;
  markdownUrl: string;
  stops: readonly DiscoveryStopInput[];
  stopCount?: number;
  imageCount: number;
  locale: Locale;
}): PublicProjectDiscoveryFields {
  const featuredStops = input.stops.slice(0, 5).map((stop) => ({
    n: stop.n,
    title: stop.title,
    slug: stop.slug,
    mood: stop.mood,
    location: stopLocation(stop),
    canonicalUrl: stop.canonicalUrl,
    heroImageUrl: stop.heroImageUrl,
  }));
  const places = uniqueClean([
    input.locationName,
    ...input.tags,
    ...input.stops.flatMap((stop) => [
      stop.location,
      stop.label,
      stop.code,
      stop.title,
    ]),
  ]).slice(0, 16);
  const stopTitles = input.stops.map((stop) => stop.title);
  const retrievalKeywords = uniqueClean([
    "London Cuts",
    input.locale === "zh" ? "伦敦剪影" : null,
    input.title,
    input.subtitle,
    input.authorName,
    ...places,
    ...input.tags,
    ...stopTitles,
    ...input.stops.map((stop) => stop.mood),
  ]).slice(0, 32);
  const shortSummary = truncateText(
    [
      firstSentence(input.description || input.subtitle || input.title),
      input.locationName
        ? input.locale === "zh"
          ? `地点：${input.locationName}。`
          : `Location: ${input.locationName}.`
        : "",
      input.locale === "zh"
        ? `${input.stopCount ?? input.stops.length} 个公开站点，${input.imageCount} 张公开图片。`
        : `${input.stopCount ?? input.stops.length} public stops and ${
            input.imageCount
          } public images.`,
    ]
      .filter(Boolean)
      .join(" "),
    280,
  );
  const stopCitations = input.stops.map(
    (stop) => `${stop.title}: ${stop.canonicalUrl}`,
  );
  return {
    shortSummary,
    retrievalKeywords,
    featuredStops,
    places,
    imageCount: input.imageCount,
    citationGuidance: {
      project:
        input.locale === "zh"
          ? `关于整个公开项目的表述请引用 ${input.canonicalUrl}。`
          : `Use ${input.canonicalUrl} for claims about the whole public project.`,
      markdown:
        input.locale === "zh"
          ? `当 AI 系统需要结构化事实、站点表、图片引用和不要推断说明时，请使用 ${input.markdownUrl}。`
          : `Use ${input.markdownUrl} when an AI system needs structured facts, stop tables, image references, and do-not-infer notes.`,
      stops: stopCitations,
      doNotInfer:
        input.locale === "zh"
          ? [
              "不要推断私人行程细节、未发布草稿、认证状态、邀请码、API token 或 service-role 权限。",
              "不要声称作者联系方式、邮箱地址或私有账号标识；公开 DTO 会有意省略这些信息。",
              "不要把 AI 生成的明信片文字当作已验证的历史记录。",
              "除非公开站点文字或公开图片图注明确说明，不要识别人、品牌或精确场所。",
            ]
          : [
              "Do not infer private itinerary details, unpublished drafts, auth state, invite codes, API tokens, or service-role access.",
              "Do not claim author contact details, email addresses, or private account identifiers; public DTOs intentionally omit them.",
              "Do not treat AI-generated postcard copy as a verified historical record.",
              "Do not identify people, brands, or exact venues unless the public stop text or public image caption says so.",
            ],
    },
  };
}

function stopLocation(stop: DiscoveryStopInput): string {
  return cleanText(stop.location ?? stop.label ?? stop.code ?? "") || "unknown";
}

function firstSentence(value: string): string {
  const cleaned = cleanText(value);
  const match = cleaned.match(/^(.+?[.!?])\s/);
  return match?.[1] ?? cleaned;
}

function truncateText(value: string, maxLength: number): string {
  const cleaned = cleanText(value);
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}...`;
}

function uniqueClean(values: readonly (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleaned = cleanText(value ?? "");
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }
  return result;
}

function listOrUnknown(values: readonly string[], locale: Locale = DEFAULT_LOCALE): string {
  return values.length > 0 ? values.join(", ") : locale === "zh" ? "未知" : "unknown";
}

function mdCell(value: string | null | undefined): string {
  const cleaned = cleanText(value ?? "");
  return (cleaned || "unknown").replace(/\|/g, "\\|");
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseTranslations<T>(value: unknown): Localized<T> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Localized<T>;
}

function availableLocales(translations: Localized<unknown> | null | undefined): readonly Locale[] {
  const locales = new Set<Locale>(["en"]);
  for (const locale of LOCALES) {
    if (locale !== "en" && translations?.[locale]) locales.add(locale);
  }
  return Array.from(locales);
}

function translationStatus(
  locale: Locale,
  translations: Localized<unknown> | null | undefined,
): "source" | "translated" | "fallback" {
  if (locale === "en") return "source";
  return translations?.[locale] ? "translated" : "fallback";
}

function alternateUrlsForProject(handle: string, slug: string): Record<Locale, string> {
  const path = `/${handlePath(handle)}/${slug}`;
  return {
    en: `${getAppBaseUrl()}${localizePath(path, "en")}`,
    zh: `${getAppBaseUrl()}${localizePath(path, "zh")}`,
  };
}

function alternateUrlsForStop(
  handle: string,
  slug: string,
  stop: string,
): Record<Locale, string> {
  const path = `/${handlePath(handle)}/${slug}/chapter/${stop}`;
  return {
    en: `${getAppBaseUrl()}${localizePath(path, "en")}`,
    zh: `${getAppBaseUrl()}${localizePath(path, "zh")}`,
  };
}

function alternateUrlsForPostcard(
  handle: string,
  slug: string,
  stop: string,
): Record<Locale, string> {
  const path = `/${handlePath(handle)}/${slug}/p/${stop}`;
  return {
    en: `${getAppBaseUrl()}${localizePath(path, "en")}`,
    zh: `${getAppBaseUrl()}${localizePath(path, "zh")}`,
  };
}

function seedProjectToRuntime(seed: typeof SEED_PROJECT, id: string): Project {
  return {
    id,
    ownerId: SEED_OWNER_ID,
    slug: seed.slug,
    title: seed.title,
    subtitle: seed.subtitle,
    locationName: seed.coverLabel,
    defaultMode: seed.defaultMode,
    status: seed.status,
    visibility: seed.visibility,
    coverAssetId: id === "seed-a-year-in-se1" ? "se1-13" : null,
    publishedAt: seed.published,
    createdAt: "2026-04-24T00:00:00.000Z",
    updatedAt: "2026-04-25T23:10:00.000Z",
    author: seed.author,
    tags: seed.tags,
    published: seed.published,
    reads: seed.reads,
    saves: seed.saves,
    duration: seed.duration,
    coverLabel: seed.coverLabel,
    translations: SEED_PROJECT_TRANSLATIONS[seed.slug],
  };
}

function seedStopsToRuntime(
  stops: typeof SEED_STOPS | typeof SEED_STOPS_REYKJAVIK,
  projectSlug: string,
): Stop[] {
  return stops.map((stop) => ({
    ...stop,
    body: SEED_BODIES[stop.n] ?? [],
    postcard: {
      message: SEED_POSTCARDS[stop.n]?.message ?? "",
      recipient: SEED_POSTCARDS[stop.n]?.recipient ?? {
        name: "",
        line1: "",
        line2: "",
        country: "",
      },
      orientation: "portrait",
      frontAssetId: `se1-${stop.n}`,
      style: null,
      translations: SEED_POSTCARD_TRANSLATIONS[`${projectSlug}:${stop.n}`],
    },
    heroAssetId: `se1-${stop.n}`,
    assetIds: [`se1-${stop.n}`],
    translations: SEED_STOP_TRANSLATIONS[`${projectSlug}:${stop.n}`],
  }));
}

function seedAssetsToRuntime(): Asset[] {
  return SEED_ASSETS.map((asset) => ({
    ...asset,
    imageUrl: asset.imageUrl ?? null,
  }));
}

function bodyToText(blocks: readonly BodyBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === "paragraph" || block.type === "pullQuote") {
        return block.content;
      }
      if (block.type === "heroImage" || block.type === "inlineImage") {
        return block.caption;
      }
      if (block.type === "metaRow") return block.content.join(" · ");
      if (block.type === "mediaEmbed") return block.caption;
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
