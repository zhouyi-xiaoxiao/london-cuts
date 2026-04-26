import type { Metadata } from "next";

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
}

export interface PublicPostcardDTO {
  message: string;
  style: string | null;
  orientation: "portrait" | "landscape" | null;
  frontAssetId: string | null;
  frontImageUrl: string | null;
  canonicalUrl: string;
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
}

export interface PublicProjectDTO extends PublicProjectSummaryDTO {
  stops: readonly PublicStopDTO[];
  assets: readonly PublicAssetDTO[];
  markdown: string;
}

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

export async function listPublicProjects(): Promise<PublicProjectSummaryDTO[]> {
  const live = await listSupabaseProjectSummaries();
  if (live.length > 0) return live;

  return [
    seedProjectToPublic({
      project: seedProjectToRuntime(SEED_PROJECT, "seed-a-year-in-se1"),
      stops: seedStopsToRuntime(SEED_STOPS),
      assets: seedAssetsToRuntime(),
    }),
    seedProjectToPublic({
      project: seedProjectToRuntime(
        SEED_PROJECT_REYKJAVIK,
        "seed-a-week-in-reykjavik",
      ),
      stops: seedStopsToRuntime(SEED_STOPS_REYKJAVIK),
      assets: [],
    }),
  ].map(projectSummary);
}

export async function getPublicProject(
  handle: string,
  slug: string,
): Promise<PublicProjectDTO | null> {
  const normalizedHandle = normalizeHandle(handle);
  const live = await fetchPublicProjectByHandleAndSlug(normalizedHandle, slug);
  if (live) return publicLookupPayloadToProject(live, normalizedHandle);

  if (normalizedHandle === SEED_HANDLE && slug === SEED_PROJECT.slug) {
    return seedProjectToPublic({
      project: seedProjectToRuntime(SEED_PROJECT, "seed-a-year-in-se1"),
      stops: seedStopsToRuntime(SEED_STOPS),
      assets: seedAssetsToRuntime(),
    });
  }
  if (normalizedHandle === SEED_HANDLE && slug === SEED_PROJECT_REYKJAVIK.slug) {
    return seedProjectToPublic({
      project: seedProjectToRuntime(
        SEED_PROJECT_REYKJAVIK,
        "seed-a-week-in-reykjavik",
      ),
      stops: seedStopsToRuntime(SEED_STOPS_REYKJAVIK),
      assets: [],
    });
  }
  return null;
}

export async function getPublicStop(
  handle: string,
  slug: string,
  stop: string,
): Promise<{ project: PublicProjectDTO; stop: PublicStopDTO } | null> {
  const project = await getPublicProject(handle, slug);
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

export function projectMarkdown(project: PublicProjectDTO): string {
  const lines = [
    `# ${project.title}`,
    "",
    project.subtitle ?? project.description,
    "",
    `- Author: ${project.authorName} (@${project.handle})`,
    `- Canonical URL: ${project.canonicalUrl}`,
    `- API URL: ${project.apiUrl}`,
    `- Published: ${project.publishedAt ?? "unknown"}`,
    `- Stops: ${project.stopCount}`,
    "",
    "## Stops",
    "",
  ];

  for (const stop of project.stops) {
    lines.push(`### ${stop.n}. ${stop.title}`);
    lines.push("");
    lines.push(`- URL: ${stop.canonicalUrl}`);
    lines.push(`- Time: ${stop.time || "unknown"}`);
    lines.push(`- Mood: ${stop.mood || "unknown"}`);
    lines.push(`- Location: ${stop.label || stop.code || "unknown"}`);
    if (stop.lat != null && stop.lng != null) {
      lines.push(`- Coordinates: ${stop.lat}, ${stop.lng}`);
    }
    if (stop.heroImageUrl) lines.push(`- Hero image: ${stop.heroImageUrl}`);
    if (stop.bodyText) {
      lines.push("");
      lines.push(stop.bodyText);
    }
    if (stop.postcard.message) {
      lines.push("");
      lines.push(`Postcard: ${stop.postcard.message}`);
    }
    lines.push("");
  }

  lines.push("## Citation");
  lines.push("");
  lines.push(
    `When citing this project, prefer the canonical project URL ${project.canonicalUrl} and the stop URL for stop-level claims.`,
  );
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
    inLanguage: "en",
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
  const description = project.description;
  return {
    title,
    description,
    alternates: { canonical: project.canonicalUrl },
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
    alternates: { canonical: url },
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

async function listSupabaseProjectSummaries(): Promise<PublicProjectSummaryDTO[]> {
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
        .select("project_id")
        .in("project_id", projectIds)
        .is("deleted_at", null)
    : { data: [] };
  const stopCountByProject = new Map<string, number>();
  for (const stop of stopRows ?? []) {
    const projectId = stop.project_id as string;
    stopCountByProject.set(projectId, (stopCountByProject.get(projectId) ?? 0) + 1);
  }

  const { data: coverRows } = coverIds.length
    ? await db
        .from("assets")
        .select("id, storage_path")
        .in("id", coverIds)
        .is("deleted_at", null)
    : { data: [] };
  const coverById = new Map<string, string | null>();
  for (const cover of coverRows ?? []) {
    coverById.set(
      cover.id as string,
      absoluteUrl((cover.storage_path as string | null) ?? null),
    );
  }

  return projects.map((row) => {
    const user = userById.get(row.owner_id as string) ?? {
      handle: SEED_HANDLE,
      display_name: "Ana Ishii",
    };
    const handle = normalizeHandle(user.handle);
    const canonicalUrl = `${getAppBaseUrl()}/${handlePath(handle)}/${row.slug}`;
    return {
      id: row.id as string,
      handle,
      authorName: user.display_name ?? handle,
      slug: row.slug as string,
      title: row.title as string,
      subtitle: (row.subtitle as string | null) ?? null,
      description:
        ((row.description as string | null) ??
          (row.subtitle as string | null) ??
          `${row.title} by ${user.display_name ?? handle}`),
      locationName: (row.location_name as string | null) ?? null,
      defaultMode: (row.default_mode as string | null) ?? "fashion",
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
      publishedAt: (row.published_at as string | null) ?? null,
      updatedAt: (row.updated_at as string | null) ?? null,
      canonicalUrl,
      apiUrl: `${getAppBaseUrl()}/api/v1/projects/${encodeURIComponent(
        handlePath(handle),
      )}/${row.slug}`,
      markdownUrl: `${getAppBaseUrl()}/api/v1/projects/${encodeURIComponent(
        handlePath(handle),
      )}/${row.slug}/markdown`,
      coverImageUrl: row.cover_asset_id
        ? (coverById.get(row.cover_asset_id as string) ?? null)
        : null,
      stopCount: stopCountByProject.get(row.id as string) ?? 0,
    };
  });
}

function publicLookupPayloadToProject(
  payload: { project: Project; stops: readonly Stop[]; assets: readonly Asset[] },
  handle: string,
): PublicProjectDTO {
  return runtimeToPublicProject(payload.project, payload.stops, payload.assets, handle);
}

function seedProjectToPublic(payload: {
  project: Project;
  stops: readonly Stop[];
  assets: readonly Asset[];
}): PublicProjectDTO {
  return runtimeToPublicProject(payload.project, payload.stops, payload.assets, SEED_HANDLE);
}

function runtimeToPublicProject(
  project: Project,
  stops: readonly Stop[],
  assets: readonly Asset[],
  handle: string,
): PublicProjectDTO {
  const normalizedHandle = normalizeHandle(handle);
  const projectPath = `/${handlePath(normalizedHandle)}/${project.slug}`;
  const canonicalUrl = `${getAppBaseUrl()}${projectPath}`;
  const assetDtos = assets.map((asset) => toAssetDto(asset));
  const assetById = new Map(assetDtos.map((asset) => [asset.id, asset]));
  const stopDtos = stops.map((stop) =>
    toStopDto(stop, project, normalizedHandle, assetById),
  );
  const coverAsset = project.coverAssetId
    ? assetById.get(project.coverAssetId)
    : assetDtos[assetDtos.length - 1];
  const dto: Omit<PublicProjectDTO, "markdown"> = {
    id: project.id,
    handle: normalizedHandle,
    authorName: project.author || normalizedHandle,
    slug: project.slug,
    title: project.title,
    subtitle: project.subtitle,
    description:
      project.subtitle ??
      project.locationName ??
      `${project.title}, a public London Cuts travel story.`,
    locationName: project.locationName,
    defaultMode: project.defaultMode,
    tags: project.tags ?? [],
    publishedAt: project.publishedAt ?? project.published ?? null,
    updatedAt: project.updatedAt ?? null,
    canonicalUrl,
    apiUrl: `${getAppBaseUrl()}/api/v1/projects/${encodeURIComponent(
      handlePath(normalizedHandle),
    )}/${project.slug}`,
    markdownUrl: `${getAppBaseUrl()}/api/v1/projects/${encodeURIComponent(
      handlePath(normalizedHandle),
    )}/${project.slug}/markdown`,
    coverImageUrl: coverAsset?.absoluteUrl ?? null,
    stopCount: stopDtos.length,
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
): PublicStopDTO {
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
    title: stop.title,
    time: stop.time,
    mood: stop.mood,
    tone: stop.tone,
    label: stop.label,
    code: stop.code,
    lat: Number.isFinite(stop.lat) ? stop.lat : null,
    lng: Number.isFinite(stop.lng) ? stop.lng : null,
    bodyBlocks: stop.body,
    bodyText: bodyToText(stop.body),
    heroAssetId: stop.heroAssetId,
    heroImageUrl: heroAsset?.absoluteUrl ?? null,
    canonicalUrl: chapterUrl,
    postcard: {
      message: stop.postcard.message,
      style: stop.postcard.style ?? null,
      orientation: stop.postcard.orientation ?? null,
      frontAssetId: stop.postcard.frontAssetId ?? null,
      frontImageUrl: frontAsset?.absoluteUrl ?? null,
      canonicalUrl: postcardUrl,
    },
  };
}

function toAssetDto(asset: Asset): PublicAssetDTO {
  const absolute = absoluteUrl(asset.imageUrl);
  const caption = asset.styleLabel ?? asset.prompt ?? null;
  return {
    id: asset.id,
    url: asset.imageUrl,
    absoluteUrl: absolute,
    tone: asset.tone ?? null,
    alt: caption ?? asset.id,
    caption,
    styleId: asset.styleId ?? null,
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
  };
}

function seedStopsToRuntime(stops: typeof SEED_STOPS): Stop[] {
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
    },
    heroAssetId: `se1-${stop.n}`,
    assetIds: [`se1-${stop.n}`],
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
