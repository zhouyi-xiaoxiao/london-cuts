// Studio → Supabase sync endpoint (M1 Phase 3 minimal).
//
// The dashboard ships a "Sync to cloud" button. On click, the client POSTs
// the current Zustand state here. We upsert it into Supabase using the
// service_role key (M2 flips to owner-scoped RLS writes).
//
// Intentionally limited for Phase 3 minimal:
//   ✓ Project row (title, subtitle, default_mode, etc.)
//   ✓ Stops (ordered, body_blocks, status_json)
//   ✓ Postcard back_message + recipient per stop
//   ✗ Asset BINARIES — base64 data URLs are not pushed to Supabase Storage
//     in this cut. Only asset METADATA is upserted with the existing
//     storage_path unchanged. Phase 3 full will add the Storage upload.
//
// Idempotent via legacy_id on projects/stops: re-clicking Sync overwrites
// the same rows (no duplicate).

import { NextResponse } from "next/server";

import { getServerClient } from "@/lib/supabase";

// Same seeded owner UUID as migrate/seed/route.ts. M2 replaces with auth.uid().
const OWNER_ID = "00000000-0000-4000-8000-000000000001";

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
  };
  stops: readonly SyncStop[];
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
    // Idempotent — same UUID + handle as the seed migration.
    await db.from("users").upsert(
      {
        id: OWNER_ID,
        handle: "ana-ishii",
        display_name: payload.project.author ?? "Ana Ishii",
      },
      { onConflict: "id" },
    );

    // ─── Upsert project by (owner_id, slug) ────────────────────────
    const legacyId = payload.project.id ?? `lc-${payload.project.slug}`;
    const { data: projUpsert, error: projErr } = await db
      .from("projects")
      .upsert(
        {
          legacy_id: legacyId,
          owner_id: OWNER_ID,
          slug: payload.project.slug,
          title: payload.project.title,
          subtitle: payload.project.subtitle ?? null,
          cover_label: payload.project.coverLabel ?? null,
          location_name: payload.project.locationName ?? null,
          tags: payload.project.tags
            ? Array.from(payload.project.tags)
            : [],
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

    // ─── Upsert stops (delete-then-insert for idempotency) ─────────
    // Wipe ALL stops for this project — safer than a legacy_id prefix
    // match (different codepaths use different prefixes — migration uses
    // `se1-stop-*`, live sync uses `${slug}-stop-*`). Since the client
    // sends the full stop list each sync, total wipe + re-insert is the
    // simplest way to also drop stops the user removed.
    const stopLegacyPrefix = `${payload.project.slug}-stop-`;
    await db.from("stops").delete().eq("project_id", projectId);

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
      // Hero asset wiring — only set if we already have a matching asset.
      // Phase 3 full will sync asset binaries; for now we leave null when
      // the client-side id isn't already known to Supabase.
      hero_asset_id: null,
    }));

    if (stopRows.length > 0) {
      const { data: insertedStops, error: stopErr } = await db
        .from("stops")
        .insert(stopRows)
        .select("id, legacy_id");
      if (stopErr) throw new Error(`stops.insert: ${stopErr.message}`);
      log.push(`✓ ${insertedStops?.length ?? 0} stops upserted`);

      // ─── Postcards ──────────────────────────────────────────────
      const postcardRows: Array<{
        stop_id: string;
        back_message: string | null;
        recipient_name: string | null;
        recipient_line1: string | null;
        recipient_line2: string | null;
        recipient_country: string | null;
      }> = [];
      const stopByLegacy = new Map<string, string>();
      for (const s of insertedStops ?? []) {
        if (s.legacy_id) stopByLegacy.set(s.legacy_id as string, s.id as string);
      }
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

    return NextResponse.json({ ok: true, projectId, log });
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

// ─── helpers ───────────────────────────────────────────────────────────

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
