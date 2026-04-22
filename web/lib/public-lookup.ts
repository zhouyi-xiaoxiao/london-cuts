// Server-side Supabase lookups for the public reader routes.
// Used by app/[author]/[slug]/page.tsx and its chapter/postcard siblings
// to fetch a project + its stops + assets server-side, then hand the
// payload to the client component as an `initialData` prop. That way
// fresh browsers (no localStorage) still see cross-device content.
//
// Safe to call from RSC / route handlers. Uses the anon key via
// getBrowserClient() (despite the name) because these reads are
// exactly what the public SELECT RLS policy allows — published + public
// projects and their children.

import { getBrowserClient, hasSupabaseConfig } from "./supabase";
import type { Asset, Project, Stop, BodyBlock } from "@/stores/types";

export interface PublicProjectPayload {
  project: Project;
  stops: readonly Stop[];
  assets: readonly Asset[];
}

/**
 * Fetch a project + stops + assets by author handle + slug.
 * Returns null when Supabase isn't configured, when nothing matches,
 * or on any error — callers should fall back to local seed data.
 */
export async function fetchPublicProjectByHandleAndSlug(
  handle: string,
  slug: string,
): Promise<PublicProjectPayload | null> {
  if (!hasSupabaseConfig()) return null;

  // Strip leading `@` — SSG URLs are built with `@ana-ishii` but the
  // `users.handle` column stores the bare `ana-ishii`.
  const bareHandle = handle.startsWith("@") ? handle.slice(1) : handle;

  let db;
  try {
    db = getBrowserClient();
  } catch {
    return null;
  }

  // 1. Resolve user id from handle.
  const { data: user, error: userErr } = await db
    .from("users")
    .select("id, handle, display_name")
    .eq("handle", bareHandle)
    .is("deleted_at", null)
    .maybeSingle();
  if (userErr || !user) return null;

  // 2. Find the project by (owner_id, slug). RLS enforces visibility.
  const { data: proj, error: projErr } = await db
    .from("projects")
    .select("*")
    .eq("owner_id", user.id)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (projErr || !proj) return null;

  // 3. Stops for the project (ordered).
  const { data: stopsRows, error: stopsErr } = await db
    .from("stops")
    .select("*")
    .eq("project_id", proj.id)
    .is("deleted_at", null)
    .order("order_index", { ascending: true });
  if (stopsErr) return null;

  // 4. Assets owned by this user and attached to this project. Plus any
  //    loose cover photo that the project references.
  const assetIds = new Set<string>();
  if (proj.cover_asset_id) assetIds.add(proj.cover_asset_id as string);
  for (const s of stopsRows ?? []) {
    if (s.hero_asset_id) assetIds.add(s.hero_asset_id as string);
  }
  const { data: assetsRows, error: assetsErr } =
    assetIds.size > 0
      ? await db
          .from("assets")
          .select("*")
          .in("id", Array.from(assetIds))
          .is("deleted_at", null)
      : { data: [], error: null };
  if (assetsErr) return null;

  return {
    project: toProject(proj, user),
    stops: (stopsRows ?? []).map(toStop),
    assets: (assetsRows ?? []).map(toAsset),
  };
}

// ─── Row → runtime type adapters ──────────────────────────────────────
// The Zustand `Project`/`Stop`/`Asset` shapes predate the SQL schema,
// so we translate here. Anything the Zustand type expects but SQL doesn't
// have gets a sensible default; the public reader pages only care about
// title/subtitle/cover/stops/postcard data.

function toProject(
  row: Record<string, unknown>,
  user: { handle: string; display_name?: string | null },
): Project {
  const r = row as any;
  return {
    id: r.id,
    ownerId: r.owner_id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle ?? null,
    locationName: r.location_name ?? null,
    defaultMode: r.default_mode ?? "fashion",
    status: r.status === "published" ? "published" : "draft",
    visibility: r.visibility ?? "public",
    coverAssetId: r.cover_asset_id ?? null,
    publishedAt: r.published_at ?? null,
    createdAt: r.created_at ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? new Date().toISOString(),
    author: user.display_name ?? user.handle,
    tags: Array.isArray(r.tags) ? r.tags : [],
    published: r.published_at
      ? new Date(r.published_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "",
    reads: r.reads ?? 0,
    saves: r.saves ?? 0,
    duration: r.duration_label ?? "",
    coverLabel: r.cover_label ?? "",
  };
}

function toStop(row: Record<string, unknown>): Stop {
  const r = row as any;
  const body: readonly BodyBlock[] = Array.isArray(r.body_blocks)
    ? r.body_blocks
    : [];
  const status = r.status_json ?? {};
  return {
    n: r.legacy_n ?? String(r.order_index ?? ""),
    code: r.code ?? "",
    title: r.title ?? "",
    time: r.time_label ?? "",
    mood: r.mood ?? "",
    tone:
      r.tone === "punk" ? "punk" : r.tone === "cool" ? "cool" : "warm",
    lat: typeof r.lat === "number" ? r.lat : 0,
    lng: typeof r.lng === "number" ? r.lng : 0,
    label: r.display_label ?? "",
    body,
    postcard: {
      message: r.back_message ?? "",
      recipient: {
        name: "",
        line1: "",
        line2: "",
        country: "",
      },
    },
    heroAssetId: r.hero_asset_id ?? null,
    assetIds: Array.isArray(r.asset_ids) ? r.asset_ids : [],
    status: {
      upload: Boolean(status.upload),
      hero: Boolean(status.hero),
      body: Boolean(status.body),
      media: status.media ?? null,
    },
  };
}

function toAsset(row: Record<string, unknown>): Asset {
  const r = row as any;
  return {
    id: r.id,
    stop: r.legacy_n ?? null,
    tone:
      r.tone === "cool" ? "cool" : r.tone === "punk" ? "punk" : "warm",
    // In Phase 1 we stored the public /seed-images/*.jpg path directly in
    // storage_path. Phase 3 uploads binaries to the bucket + flips this
    // to a full Supabase Storage URL.
    imageUrl:
      typeof r.storage_path === "string" ? r.storage_path : null,
  };
}
