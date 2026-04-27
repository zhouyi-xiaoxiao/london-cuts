// One-time seed migration: push web/lib/seed.ts data into Supabase so
// public pages can SSR/ISR from the DB instead of from the bundled seed
// (M1 Phase 1 acceptance criterion: the DB has real rows).
//
// Dev-gated. Runs in two contexts:
//   (a) local dev — `pnpm dev` + `curl -X POST http://localhost:3000/api/migrate/seed`
//   (b) Vercel preview with `MIGRATE_SECRET` header set — but prod is blocked.
//
// Idempotent via legacy_id upserts: re-running is safe. Clears existing
// rows for the seeded owner first to avoid stale junk during iteration.

import { NextResponse } from "next/server";

import {
  SEED_ASSET_TRANSLATIONS,
  SEED_POSTCARD_TRANSLATIONS,
  SEED_PROJECT_TRANSLATIONS,
  SEED_STOP_TRANSLATIONS,
} from "@/lib/i18n";
import { getServerClient } from "@/lib/supabase";
import {
  SEED_ASSETS,
  SEED_BODIES,
  SEED_POSTCARDS,
  SEED_PROJECT,
  SEED_PROJECT_REYKJAVIK,
  SEED_STOPS,
  SEED_STOPS_REYKJAVIK,
} from "@/lib/seed";

// Fixed UUIDs for the two seeded entities. Using deterministic values means
// re-running the migration is safe — rows get upserted rather than duplicated.
const OWNER_ID = "00000000-0000-4000-8000-000000000001";
const SE1_PROJECT_ID = "00000000-0000-4000-8000-000000000101";
const REYKJAVIK_PROJECT_ID = "00000000-0000-4000-8000-000000000102";

export async function POST(req: Request) {
  // Dev-only by default. Allow a future prod override via a secret header.
  const allowProd = req.headers.get("x-migrate-secret");
  if (process.env.NODE_ENV === "production" && !allowProd) {
    return NextResponse.json(
      { error: "migration disabled in production" },
      { status: 403 },
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
  const step = (msg: string) => log.push(msg);

  try {
    // ─── 1. Owner user row ──────────────────────────────────────────
    // Preserve any M2 auth link. Older versions of this endpoint wrote
    // auth_user_id:null, which could detach the demo owner from a real login.
    const { error: userErr } = await db.from("users").upsert(
      {
        id: OWNER_ID,
        handle: "ana-ishii",
        display_name: "Ana Ishii",
      },
      { onConflict: "id" },
    );
    if (userErr) throw new Error(`users.upsert: ${userErr.message}`);
    step("✓ users row (ana-ishii) upserted");

    // ─── 2. Wipe prior seeded children (so re-runs stay clean) ──────
    // Children first, then parents, because of FK constraints.
    await db.from("postcards").delete().in("stop_id", await seededStopIds(db));
    await db.from("stops").delete().in("project_id", [SE1_PROJECT_ID, REYKJAVIK_PROJECT_ID]);
    await db
      .from("assets")
      .delete()
      .in("project_id", [SE1_PROJECT_ID, REYKJAVIK_PROJECT_ID]);
    await db
      .from("projects")
      .delete()
      .in("id", [SE1_PROJECT_ID, REYKJAVIK_PROJECT_ID]);
    step("✓ prior seeded rows cleared (safe re-run)");

    // ─── 3. Projects ────────────────────────────────────────────────
    const { error: projErr } = await db.from("projects").upsert(
      [
        {
          id: SE1_PROJECT_ID,
          legacy_id: "seed-a-year-in-se1",
          owner_id: OWNER_ID,
          slug: SEED_PROJECT.slug,
          title: SEED_PROJECT.title,
          subtitle: SEED_PROJECT.subtitle,
          cover_label: SEED_PROJECT.coverLabel,
          location_name: "London, Windsor and nearby",
          area: "London / Windsor",
          tags: Array.from(SEED_PROJECT.tags),
          default_mode: SEED_PROJECT.defaultMode,
          status: SEED_PROJECT.status,
          visibility: SEED_PROJECT.visibility,
          duration_label: SEED_PROJECT.duration,
          reads: SEED_PROJECT.reads,
          saves: SEED_PROJECT.saves,
          translations: SEED_PROJECT_TRANSLATIONS[SEED_PROJECT.slug] ?? {},
          published_at: new Date().toISOString(),
        },
        {
          id: REYKJAVIK_PROJECT_ID,
          legacy_id: "seed-a-week-in-reykjavik",
          owner_id: OWNER_ID,
          slug: SEED_PROJECT_REYKJAVIK.slug,
          title: SEED_PROJECT_REYKJAVIK.title,
          subtitle: SEED_PROJECT_REYKJAVIK.subtitle,
          cover_label: SEED_PROJECT_REYKJAVIK.coverLabel,
          location_name: "Reykjavík, Iceland",
          tags: Array.from(SEED_PROJECT_REYKJAVIK.tags),
          default_mode: SEED_PROJECT_REYKJAVIK.defaultMode,
          status: SEED_PROJECT_REYKJAVIK.status,
          visibility: SEED_PROJECT_REYKJAVIK.visibility,
          duration_label: SEED_PROJECT_REYKJAVIK.duration,
          reads: SEED_PROJECT_REYKJAVIK.reads,
          saves: SEED_PROJECT_REYKJAVIK.saves,
          translations:
            SEED_PROJECT_TRANSLATIONS[SEED_PROJECT_REYKJAVIK.slug] ?? {},
          published_at: new Date().toISOString(),
        },
      ],
      { onConflict: "id" },
    );
    if (projErr) throw new Error(`projects.upsert: ${projErr.message}`);
    step("✓ 2 projects (SE1, Reykjavík) upserted");

    // ─── 4. Assets ──────────────────────────────────────────────────
    // All 13 seed photos for the London/Windsor demo. Reykjavík has none
    // seeded (stock demo).
    // storage_path leaves Supabase Storage unused in Phase 1 — the
    // production public URL (/seed-images/*.jpg) stays canonical; Phase 2
    // will upload binaries + flip storage_path to the bucket path.
    const assetRows = SEED_ASSETS.map((a) => ({
      legacy_id: a.id,
      owner_id: OWNER_ID,
      project_id: SE1_PROJECT_ID,
      kind: "photo" as const,
      tone:
        a.tone === "cool"
          ? ("cool" as const)
          : a.tone === "punk"
            ? ("punk" as const)
            : ("warm" as const),
      storage_path: a.imageUrl ?? `missing/${a.id}`,
      label: a.id,
      prompt: seedAssetCaption(a.id),
      translations: SEED_ASSET_TRANSLATIONS[a.id] ?? {},
    }));
    const { data: insertedAssets, error: assetErr } = await db
      .from("assets")
      .insert(assetRows)
      .select("id, legacy_id");
    if (assetErr) throw new Error(`assets.insert: ${assetErr.message}`);
    step(`✓ ${insertedAssets?.length ?? 0} assets inserted`);

    // Build legacy_id → uuid map for stop foreign keys.
    const assetByLegacy = new Map<string, string>();
    for (const r of insertedAssets ?? []) {
      if (r.legacy_id) assetByLegacy.set(r.legacy_id, r.id as string);
    }

    // Set SE1 project cover_asset_id to the 13th photo.
    const coverUuid = assetByLegacy.get("se1-13");
    if (coverUuid) {
      await db
        .from("projects")
        .update({ cover_asset_id: coverUuid })
        .eq("id", SE1_PROJECT_ID);
      step(`✓ SE1 cover_asset_id set (${coverUuid})`);
    }

    // ─── 5. Stops ───────────────────────────────────────────────────
    const se1Stops = SEED_STOPS.map((s, i) => ({
      legacy_id: `se1-stop-${s.n}`,
      project_id: SE1_PROJECT_ID,
      legacy_n: s.n,
      order_index: (i + 1) * 10,
      slug: slugify(s.title),
      code: s.code,
      title: s.title,
      time_label: s.time,
      mood: s.mood,
      tone: s.tone === "punk" ? "punk" : s.tone === "cool" ? "cool" : "warm",
      display_label: s.label,
      body_blocks: SEED_BODIES[s.n] ?? [],
      status_json: s.status,
      lat: s.lat,
      lng: s.lng,
      hero_asset_id: assetByLegacy.get(`se1-${s.n}`) ?? null,
      translations: SEED_STOP_TRANSLATIONS[`${SEED_PROJECT.slug}:${s.n}`] ?? {},
    }));
    const reykjavikStops = SEED_STOPS_REYKJAVIK.map((s, i) => ({
      legacy_id: `rvk-stop-${s.n}`,
      project_id: REYKJAVIK_PROJECT_ID,
      legacy_n: s.n,
      order_index: (i + 1) * 10,
      slug: slugify(s.title),
      code: s.code,
      title: s.title,
      time_label: s.time,
      mood: s.mood,
      tone: s.tone === "punk" ? "punk" : s.tone === "cool" ? "cool" : "warm",
      display_label: s.label,
      body_blocks: [],
      status_json: s.status,
      lat: s.lat,
      lng: s.lng,
      hero_asset_id: null,
      translations:
        SEED_STOP_TRANSLATIONS[`${SEED_PROJECT_REYKJAVIK.slug}:${s.n}`] ?? {},
    }));
    const { data: insertedStops, error: stopErr } = await db
      .from("stops")
      .insert([...se1Stops, ...reykjavikStops])
      .select("id, legacy_id");
    if (stopErr) throw new Error(`stops.insert: ${stopErr.message}`);
    step(`✓ ${insertedStops?.length ?? 0} stops inserted`);

    const stopByLegacy = new Map<string, string>();
    for (const r of insertedStops ?? []) {
      if (r.legacy_id) stopByLegacy.set(r.legacy_id, r.id as string);
    }

    // ─── 6. Postcards ───────────────────────────────────────────────
    const postcardRows = Object.entries(SEED_POSTCARDS)
      .map(([n, postcard]) => {
        const stopId = stopByLegacy.get(`se1-stop-${n}`);
        if (!stopId) return null;
        return {
          stop_id: stopId,
          front_asset_id: assetByLegacy.get(`se1-${n}`) ?? null,
          back_message: postcard.message,
          recipient_name: postcard.recipient.name,
          recipient_line1: postcard.recipient.line1,
          recipient_line2: postcard.recipient.line2,
          recipient_country: postcard.recipient.country,
          style_id: null,
          orientation: "landscape",
          translations: SEED_POSTCARD_TRANSLATIONS[`${SEED_PROJECT.slug}:${n}`] ?? {},
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
    if (postcardRows.length > 0) {
      const { error: pcErr } = await db.from("postcards").insert(postcardRows);
      if (pcErr) throw new Error(`postcards.insert: ${pcErr.message}`);
      step(`✓ ${postcardRows.length} postcards inserted`);
    }

    return NextResponse.json({ ok: true, log });
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

function seedAssetCaption(assetId: string): string | null {
  const stop = SEED_ASSETS.find((asset) => asset.id === assetId)?.stop;
  if (!stop) return null;
  const hero = (SEED_BODIES[stop] ?? []).find(
    (block) => block.type === "heroImage" && block.assetId === assetId,
  );
  return hero?.type === "heroImage" ? hero.caption : null;
}

async function seededStopIds(
  db: ReturnType<typeof getServerClient>,
): Promise<string[]> {
  const { data, error } = await db
    .from("stops")
    .select("id")
    .in("project_id", [SE1_PROJECT_ID, REYKJAVIK_PROJECT_ID]);
  if (error || !data) return [];
  return data.map((r) => r.id as string);
}
