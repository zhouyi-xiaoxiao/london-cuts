// Studio → Supabase sync endpoint (M1 Phase 3 full).
//
// The dashboard ships a "☁️ Sync to cloud" button. On click, the client POSTs
// the current Zustand state here. We upsert it into Supabase using the
// service_role key (M2 flips to owner-scoped RLS writes).
//
// What syncs:
//   ✓ Project row (title, subtitle, default_mode, etc.)
//   ✓ Stops (ordered, body_blocks, status_json)
//   ✓ Postcard back_message + recipient per stop
//   ✓ Assets — metadata AND binaries. For assets with a data: URL the
//     server uploads the bytes to Supabase Storage bucket `assets` at
//     path `{owner_id}/{project_id}/{legacyId}.{ext}` and stores the
//     resulting public URL. Assets with a publicUrl (seed /seed-images/*
//     or previously-synced Storage URL) pass through unchanged.
//   ✓ hero_asset_id wiring — resolved via legacy_id → uuid map built
//     during the asset insert pass.
//
// Idempotent: every table is delete-then-insert scoped to the project.

import { NextResponse } from "next/server";

import { getServerClient } from "@/lib/supabase";

// Same seeded owner UUID as migrate/seed/route.ts. M2 replaces with auth.uid().
const OWNER_ID = "00000000-0000-4000-8000-000000000001";
const ASSETS_BUCKET = "assets";

interface SyncAsset {
  legacyId: string;
  tone?: string | null;
  /** Base64 data URL for user-uploaded binaries; server uploads to Storage. */
  dataUrl?: string | null;
  /** Pre-existing public URL (e.g. `/seed-images/*.jpg` or a prior Storage URL). */
  publicUrl?: string | null;
  styleId?: string | null;
  prompt?: string | null;
}

interface SyncStop {
  n: string;
  code?: string | null;
  title?: string | null;
  time?: string | null;
  mood?: string | null;
  tone?: string | null;
  label?: string | null;
  lat?: number | null;
  lng?: number | null;
  body?: unknown[];
  status?: Record<string, unknown>;
  heroAssetId?: string | null;
  postcard?: {
    message?: string;
    recipient?: {
      name?: string;
      line1?: string;
      line2?: string;
      country?: string;
    };
  };
}

interface SyncPayload {
  project: {
    id?: string;
    slug: string;
    title: string;
    subtitle?: string | null;
    coverLabel?: string | null;
    locationName?: string | null;
    defaultMode?: string;
    status?: string;
    visibility?: string;
    duration?: string | null;
    reads?: number;
    saves?: number;
    publishedAt?: string | null;
    author?: string;
    tags?: readonly string[];
    coverAssetLegacyId?: string | null;
  };
  stops: readonly SyncStop[];
  assets?: readonly SyncAsset[];
}

export async function POST(req: Request) {
  let payload: SyncPayload;
  try {
    payload = (await req.json()) as SyncPayload;
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }
  if (!payload?.project?.slug || !payload?.project?.title) {
    return NextResponse.json(
      { error: "project.slug and project.title are required" },
      { status: 400 },
    );
  }

  let db;
  try {
    db = getServerClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }

  const log: string[] = [];

  try {
    // ─── Ensure owner user row exists ──────────────────────────────
    await db.from("users").upsert(
      {
        id: OWNER_ID,
        handle: "ana-ishii",
        display_name: payload.project.author ?? "Ana Ishii",
      },
      { onConflict: "id" },
    );

    // ─── Upsert project by legacy_id ───────────────────────────────
    const projectLegacyId = payload.project.id ?? `lc-${payload.project.slug}`;
    const { data: projUpsert, error: projErr } = await db
      .from("projects")
      .upsert(
        {
          legacy_id: projectLegacyId,
          owner_id: OWNER_ID,
          slug: payload.project.slug,
          title: payload.project.title,
          subtitle: payload.project.subtitle ?? null,
          cover_label: payload.project.coverLabel ?? null,
          location_name: payload.project.locationName ?? null,
          tags: payload.project.tags ? Array.from(payload.project.tags) : [],
          default_mode: payload.project.defaultMode ?? "fashion",
          status: payload.project.status ?? "draft",
          visibility: payload.project.visibility ?? "public",
          duration_label: payload.project.duration ?? null,
          reads: payload.project.reads ?? 0,
          saves: payload.project.saves ?? 0,
          published_at: payload.project.publishedAt ?? null,
        },
        { onConflict: "legacy_id" },
      )
      .select("id, slug")
      .single();
    if (projErr || !projUpsert) {
      throw new Error(`projects.upsert: ${projErr?.message ?? "no row"}`);
    }
    const projectId = projUpsert.id as string;
    log.push(`✓ project ${projectId} (${projUpsert.slug}) upserted`);

    // ─── Assets: wipe + re-insert (binaries uploaded to Storage) ───
    // Delete first so re-syncs stay clean. This removes any prior
    // asset rows for this project (including seed-migrated ones if
    // client is resyncing the seed project). Client is responsible
    // for sending ALL assets referenced by this project every time.
    await db.from("assets").delete().eq("project_id", projectId);

    const assetByLegacy = new Map<string, string>(); // legacy_id → uuid
    let uploadedCount = 0;
    let passedThroughCount = 0;

    if (payload.assets && payload.assets.length > 0) {
      const assetRows: Array<Record<string, unknown>> = [];
      for (const a of payload.assets) {
        let storagePath = a.publicUrl ?? null;

        // Upload binary if client sent a data URL.
        if (a.dataUrl && a.dataUrl.startsWith("data:")) {
          const uploaded = await uploadDataUrlToStorage(
            db,
            a.dataUrl,
            `${OWNER_ID}/${projectId}/${a.legacyId}`,
          );
          if (uploaded.ok) {
            storagePath = uploaded.publicUrl;
            uploadedCount += 1;
          } else {
            log.push(`⚠ asset ${a.legacyId} upload failed: ${uploaded.error}`);
            continue;
          }
        } else if (a.publicUrl) {
          passedThroughCount += 1;
        } else {
          // No data URL + no public URL — skip; can't store nothing.
          continue;
        }

        assetRows.push({
          legacy_id: a.legacyId,
          owner_id: OWNER_ID,
          project_id: projectId,
          kind: "photo",
          tone:
            a.tone === "punk" ? "punk" : a.tone === "cool" ? "cool" : "warm",
          storage_path: storagePath ?? `missing/${a.legacyId}`,
          label: a.legacyId,
          style_id: a.styleId ?? null,
          prompt: a.prompt ?? null,
        });
      }

      if (assetRows.length > 0) {
        const { data: insertedAssets, error: assetErr } = await db
          .from("assets")
          .insert(assetRows)
          .select("id, legacy_id");
        if (assetErr) throw new Error(`assets.insert: ${assetErr.message}`);
        for (const r of insertedAssets ?? []) {
          if (r.legacy_id) assetByLegacy.set(r.legacy_id as string, r.id as string);
        }
        log.push(
          `✓ ${assetRows.length} assets (${uploadedCount} uploaded to Storage, ${passedThroughCount} passed through)`,
        );
      }

      // Resolve project cover asset if the client named one.
      if (payload.project.coverAssetLegacyId) {
        const coverUuid = assetByLegacy.get(payload.project.coverAssetLegacyId);
        if (coverUuid) {
          await db
            .from("projects")
            .update({ cover_asset_id: coverUuid })
            .eq("id", projectId);
          log.push(`✓ cover asset wired (${coverUuid})`);
        }
      }
    }

    // ─── Stops (delete-then-insert with hero_asset_id resolution) ──
    await db.from("stops").delete().eq("project_id", projectId);

    const stopLegacyPrefix = `${payload.project.slug}-stop-`;
    const stopRows = payload.stops.map((s, i) => ({
      legacy_id: `${stopLegacyPrefix}${s.n}`,
      project_id: projectId,
      legacy_n: s.n,
      order_index: (i + 1) * 10,
      slug: s.title ? slugify(s.title) : null,
      code: s.code ?? null,
      title: s.title ?? null,
      time_label: s.time ?? null,
      mood: s.mood ?? null,
      tone:
        s.tone === "punk" ? "punk" : s.tone === "cool" ? "cool" : "warm",
      display_label: s.label ?? null,
      body_blocks: s.body ?? [],
      status_json: s.status ?? {},
      lat: s.lat ?? null,
      lng: s.lng ?? null,
      hero_asset_id: s.heroAssetId
        ? (assetByLegacy.get(s.heroAssetId) ?? null)
        : null,
    }));

    if (stopRows.length > 0) {
      const { data: insertedStops, error: stopErr } = await db
        .from("stops")
        .insert(stopRows)
        .select("id, legacy_id");
      if (stopErr) throw new Error(`stops.insert: ${stopErr.message}`);
      log.push(`✓ ${insertedStops?.length ?? 0} stops upserted`);

      // ─── Postcards ──────────────────────────────────────────────
      const stopByLegacy = new Map<string, string>();
      for (const s of insertedStops ?? []) {
        if (s.legacy_id) stopByLegacy.set(s.legacy_id as string, s.id as string);
      }
      const postcardRows: Array<Record<string, unknown>> = [];
      for (const s of payload.stops) {
        const stopId = stopByLegacy.get(`${stopLegacyPrefix}${s.n}`);
        if (!stopId) continue;
        const pc = s.postcard;
        if (!pc || (!pc.message && !pc.recipient?.name)) continue;
        postcardRows.push({
          stop_id: stopId,
          back_message: pc.message ?? null,
          recipient_name: pc.recipient?.name ?? null,
          recipient_line1: pc.recipient?.line1 ?? null,
          recipient_line2: pc.recipient?.line2 ?? null,
          recipient_country: pc.recipient?.country ?? null,
        });
      }
      if (postcardRows.length > 0) {
        const { error: pcErr } = await db
          .from("postcards")
          .upsert(postcardRows, { onConflict: "stop_id" });
        if (pcErr) throw new Error(`postcards.upsert: ${pcErr.message}`);
        log.push(`✓ ${postcardRows.length} postcards upserted`);
      }
    }

    return NextResponse.json({
      ok: true,
      projectId,
      assetsUploaded: uploadedCount,
      assetsPassedThrough: passedThroughCount,
      log,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        log,
      },
      { status: 500 },
    );
  }
}

// ─── Storage upload helper ─────────────────────────────────────────────

async function uploadDataUrlToStorage(
  db: ReturnType<typeof getServerClient>,
  dataUrl: string,
  pathPrefix: string,
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  // Parse data:<mime>;base64,<payload>
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return { ok: false, error: "not a base64 data URL" };
  const mime = match[1];
  const payload = match[2];
  const ext = extFromMime(mime);
  const path = `${pathPrefix}.${ext}`;
  const bytes = Buffer.from(payload, "base64");

  const { error: upErr } = await db.storage
    .from(ASSETS_BUCKET)
    .upload(path, bytes, {
      contentType: mime,
      upsert: true,
    });
  if (upErr) return { ok: false, error: upErr.message };

  const { data: pub } = db.storage.from(ASSETS_BUCKET).getPublicUrl(path);
  return { ok: true, publicUrl: pub.publicUrl };
}

function extFromMime(mime: string): string {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("svg")) return "svg";
  return "bin";
}

// ─── helpers ───────────────────────────────────────────────────────────

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
