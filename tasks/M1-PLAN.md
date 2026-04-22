# M1 — Storage seam plan (Supabase wiring)

**Status:** plan only; no implementation yet. M-fast is complete (14/14), M-preview is the soft-launch milestone in front of this. M1 starts when the owner approves leaving localStorage behind.

This doc is the bridge between the schema (`docs/data-model.md`, now landed in `web/supabase/migrations/0001_initial.sql`) and the code change (`web/lib/storage.ts`). Implementation comes after the owner provisions a Supabase project; this doc tells them how to do that and what Claude will do once they hand back the keys.

---

## 1. Schema summary

The M1 schema covers the M-fast domain (creator can store the same data they're producing today in localStorage + IndexedDB) plus a minimal `users` row. M2 expands `users` and adds `invites`, `invite_uses`, `daily_quotas`, `ai_generations`, `feedback`, and full RLS hardening — none of those are in M1 because they're auth-coupled and would slow down the first round-trip from "can we save a project to Postgres?" to "yes." Everything that needs auth is deferred to M2.

| Table | Purpose | Key relationships | Notable columns |
|-------|---------|-------------------|-----------------|
| `users` | One row per signed-in human (M2 will add display_name, avatar_url, bio, invite linkage). | `auth_user_id` → `auth.users.id` (cascade) | `handle` (unique, 2–32 chars, lowercase + `_-`) |
| `projects` | A single-location trip / story. URL is `/<handle>/<slug>`. | `owner_id` → `users.id` (cascade); `cover_asset_id` → `assets.id` (set null) | `status` (draft / in_progress / publishing / published / unlisted / archived), `visibility`, `tags[]`, `published_at`, `legacy_id` |
| `stops` | Ordered scenes inside a project. Sparse `order_index` (10, 20, 30…) for cheap reorders; deferrable unique on `(project_id, order_index)` for bulk moves. | `project_id` → `projects.id` (cascade); `hero_asset_id` → `assets.id` (set null); `asset_ids` uuid[] | `body_blocks` jsonb (preserves `BodyBlock[]` from `web/lib/seed.ts`), `status_json` jsonb, `legacy_n` ("01".."12") |
| `postcards` | One postcard per stop: front art + back text + recipient. | `stop_id` → `stops.id` (cascade, unique); `front_asset_id` → `assets.id` (set null) | `style_id` (text, e.g. `inkwash` — kept text not enum because catalogue is still evolving), `orientation`, recipient_* fields |
| `assets` | All binaries (photos, AI output, exports). Bytes live in Supabase Storage bucket `assets`; this table is the metadata index. | `owner_id` → `users.id` (cascade); `project_id` → `projects.id` (set null — loose pool survives a project delete); `source_asset_id` → `assets.id` (set null) for "this generated image came from that photo" | `kind` (photo / video / voice / text / generated-image / generated-video / postcard-export), `tone`, `storage_path`, `exif_json`, `prompt`, `style_id`, `legacy_id` |

**Storage bucket:** `assets` (public read for SSR; owner-scoped writes via path prefix `{users.id}/{project_id|"loose"}/{asset_id}.{ext}`).

**RLS posture (M1 baseline):**
- Anonymous SELECT on `published + public` projects and their children (stops, postcards, assets-attached-to-public-projects).
- Owner-scoped ALL on everything they own (`users.auth_user_id = auth.uid()` resolved through `users.id`).
- M2 tightens: private project access, signed unlisted URLs, invite-gated INSERT, `daily_quotas` enforcement, full `assets` Storage policy hardening.

**Legacy id preservation:** `projects.legacy_id`, `stops.legacy_id` (+ `legacy_n`), `assets.legacy_id` are nullable text columns. The one-time migration script writes the M-fast string ids ("se1-01", "seed-a-year-in-se1") into these columns alongside the new UUID PKs so anything that was bookmarked or referenced in seed data still resolves.

---

## 2. Owner action items (in order)

The owner must do steps 1–4 before Claude can ship the storage seam. Steps are sequenced so each one fails fast if the previous one wasn't right.

1. **Create the Supabase project.**
   - Go to <https://supabase.com> → New project. Region: closest to the owner (London / Frankfurt for UK latency). Name: `london-cuts` (or whatever the renamed product becomes — fine to rename later).
   - Database password: generate + store in 1Password. Won't be needed for app code (anon + service role keys are separate) but the Supabase CLI prompts for it.

2. **Collect three keys from the project settings.**
   - `NEXT_PUBLIC_SUPABASE_URL` (Settings → API → Project URL — looks like `https://abcdefgh.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API → Project API keys → `anon` `public`)
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → Project API keys → `service_role` `secret` — **server-only, never ship to client**)

3. **Paste the keys into both Vercel and `web/.env.local`.**
   - Vercel: dashboard → project `london-cuts` → Settings → Environment Variables. Add all three for **Development + Preview + Production**. The service-role key must be marked "secret" (Vercel does this automatically for `*_SERVICE_ROLE_KEY`).
   - Local: append to `web/.env.local` (gitignored — confirm with `git check-ignore web/.env.local`).
   - After updating Vercel env vars, redeploy the most recent prod build so the new env reaches the running app.

4. **Run the migration.** Two options, both fine:
   - **Dashboard SQL editor (one-shot, no CLI):** Supabase dashboard → SQL Editor → paste `web/supabase/migrations/0001_initial.sql` → Run. Confirm in Table Editor that `users`, `projects`, `stops`, `postcards`, `assets` exist + the `assets` bucket appears in Storage.
   - **Supabase CLI (preferred long-term):** `cd web && pnpm supabase link --project-ref <ref>`, then `pnpm supabase db push`. This requires installing the `supabase` CLI separately (it's not currently in `web/package.json` — owner can `brew install supabase/tap/supabase` first).
   - Either way, when the migration succeeds, manually `INSERT` one row into `users` for the owner so RLS policies have something to bind to:
     ```sql
     insert into users (auth_user_id, handle, display_name)
     values (auth.uid(), 'yx', 'Yixiao');
     -- Run this from the SQL Editor while signed in as the owner; M2 replaces
     -- this with a sign-in trigger.
     ```

5. **Sanity check.** Owner pings Claude with "Supabase is ready — env keys are in Vercel, migration ran, owner row exists." Claude can verify by hitting the Supabase REST API once with the anon key.

---

## 3. Claude action items (in order, post-owner-setup)

These run after step 5 above. Each is a separate commit; the seam swap is the centre of gravity.

1. **Rewrite `web/lib/storage.ts` against `@supabase/supabase-js`.**
   - Add `@supabase/supabase-js` to `web/package.json` (one new dep — flag to owner before installing per the "no new deps without asking" rule).
   - Two clients: an anon client for browser/SSR reads, a service-role client gated to server-only routes (`web/lib/storage.server.ts` if separation is cleaner).
   - Implement: `getProject`, `getProjectByHandleAndSlug`, `listProjects`, `createProject`, `updateProject`, `softDeleteProject`, `hardDeleteProject` (admin only), plus the corresponding stop / postcard / asset helpers that today live as Zustand actions.
   - Keep the function signatures from the current stub identical. Callers should not change. Where the new schema needs more (e.g. `cover_asset_id` is now a real FK), translate inside this file.
   - Where Zustand still owns ephemeral UI state (drawer open, active stop, mode), leave it alone — only persistence moves.

2. **Migrate the IDB asset bucket → Supabase Storage `assets/`.**
   - New file `web/lib/asset-storage.ts` (or fold into `storage.ts` if it's small) wrapping `supabase.storage.from('assets')`.
   - Path convention: `{users.id}/{project_id|"loose"}/{asset_id}.{ext}` (matches the M1 RLS policy).
   - On asset write, upload bytes → write the metadata row → store the bucket key as `assets.storage_path`. Reads use `getPublicUrl()` (bucket is public for M1).
   - Replace `idbPutAsset` / `idbGetAsset` call-sites in `web/stores/root.ts` with the new helpers. Keep IDB present as a fallback during the cutover so an offline tab doesn't lose data mid-write; remove after the migration banner (step 4) hits 0% remaining users.

3. **One-time data migration script: localStorage `lc_store_v5` → Supabase.**
   - New file `web/lib/migrate-from-local.ts` (client-side) plus a UI entry point on the dashboard: "We've upgraded — import your local trips" button that runs:
     1. Read `lc_store_v5` JSON from `localStorage`.
     2. For each project + stops + assets, POST through the new storage seam (preserving `legacy_id`, `legacy_n` so URLs survive).
     3. For each asset binary in IDB, upload bytes to Supabase Storage and write the asset row.
     4. Mark the migration done with a flag in `localStorage` so it never reruns.
   - Should be idempotent: rerunning it with already-migrated data is a no-op (`on conflict (legacy_id) do nothing`).
   - The seed projects (Year in SE1 + Week in Reykjavík) seed via `web/supabase/seed.sql` instead — this script is for real user-created projects only.

4. **Add a "migration banner" UI hint.**
   - Small `<MigrationBanner />` in `web/components/studio/` shown when `localStorage.lc_store_v5` exists AND `localStorage.lc_migrated_at` is missing.
   - Two CTAs: "Import now" (runs the script from step 3) and "Dismiss". Persists dismissal in `localStorage` so we don't nag.
   - Telemetry hook into `lib/analytics.ts` so we can see how many friends still need to migrate before we delete the IDB fallback.

5. **Regenerate TS types from the live schema.**
   - `pnpm supabase gen types typescript --linked > web/types/database.generated.ts` (M1-P001 in the original plan).
   - Wire the generated `Database` type into the new storage seam so a schema drift breaks `pnpm typecheck`.

6. **Update `web/.env.example`** to document the three new env vars (with placeholder values).

---

## 4. Risks & edge cases

**Things that could go wrong:**

- **RLS lockout.** If the M1 INSERT into `users` is missed, the owner will be authenticated but can't create projects (every owner-scoped policy resolves through `users.auth_user_id = auth.uid()`). Mitigation: the owner sanity-check in §2.4 explicitly inserts that row.
- **Circular FKs trip a strict importer.** `assets.project_id` ↔ `projects.cover_asset_id` is a two-way reference. The migration handles it by adding `assets.project_id` after both tables exist; if the owner runs the SQL through a tool that wraps each statement in its own transaction (some GUIs), it will still work because pgcrypto + `add constraint` are idempotent. If using `psql` interactively, run as a single file.
- **Supabase Storage bucket "public" leaks unlisted/private projects.** M1 deliberately lets anyone GET any object in `assets/`. As long as the M-preview password gate is in front of the app, no one but trusted friends sees the URLs. M2 must flip the bucket to private + use signed URLs once unlisted/private projects ship for real users.
- **Storage path collisions on legacy_id reuse.** `assets.legacy_id` is unique, but the storage path is built from the new UUID. If the migration script reruns, it could orphan binaries in Storage. Mitigation: idempotent insert + check if `storage_path` already returns metadata before reuploading.
- **`stops.body_blocks` jsonb shape drift.** Today `BodyBlock` is a discriminated union in `web/lib/seed.ts`. If we add a new block kind in the future without a migration, old rows still parse but new fields are missing on read. Mitigation: keep a `body_schema_version` field if the union grows beyond ~8 variants (not yet — flag for future).
- **Vercel cold-start cost of two Supabase clients.** Anon + service-role clients instantiated per request. If serverless cold-start time creeps, memoise via module-level singletons (standard pattern with supabase-js).
- **Owner's `handle` "yx" is hardcoded today.** PublishDialog uses the literal string. After M1 the URL becomes `users.handle`-driven. Needs a coordinated change in the publish dialog when the seam swap lands — flagged in M-iter backlog.

**M2 (not M1):**
- `invites` + `invite_uses` tables, invite-code sign-up flow.
- `daily_quotas` table + AI quota enforcement (currently lives in `lib/ai-provider.ts` as a global env-driven cap).
- `ai_generations` audit table + caching by `(source_hash, style)`.
- `profiles` extended fields (display_name, avatar, bio) — M1 inlines a stub `display_name` on `users`; M2 splits it out.
- `feedback` table + form.
- Storage bucket flip to private + signed URLs.
- Real Supabase Auth wiring in `web/lib/auth.ts` (magic link, sign-in trigger that creates the `users` row).
- Tightened RLS for unlisted projects (per-project share token).

---

## 5. Estimated scope

Per the project memory: **no time estimates**. Scope is given in concrete units instead.

- **Files written by this task (M1 schema + plan):** 2 (`web/supabase/migrations/0001_initial.sql`, `tasks/M1-PLAN.md`).
- **Files Claude will touch in the implementation phase:** ~8.
  - Rewrite: `web/lib/storage.ts`.
  - New: `web/lib/asset-storage.ts`, `web/lib/migrate-from-local.ts`, `web/components/studio/MigrationBanner.tsx`, `web/types/database.generated.ts`.
  - Edit: `web/stores/root.ts` (swap IDB calls), `web/.env.example` (new vars), `web/package.json` (`@supabase/supabase-js`).
- **New tests Claude will add:** ~5 Vitest specs.
  - `tests/storage.crud.test.ts` — round-trip create/read/update/soft-delete a project against a local Supabase (Docker).
  - `tests/storage.rls.test.ts` — anon client cannot read a private project; can read a public one.
  - `tests/asset-storage.test.ts` — upload + getPublicUrl path convention.
  - `tests/migrate-from-local.test.ts` — idempotence (run twice, second is a no-op).
  - `tests/migration-banner.test.tsx` — shows when `lc_store_v5` exists and no `lc_migrated_at` flag.
- **Existing tests that may need updating:** the 51 already green; most are UI / store-level so they should be untouched if the seam contract holds. The `safeLocalStorage` shim stays.
- **New npm dependencies:** 1 (`@supabase/supabase-js`). Owner approval per repo rule.
- **Migrations to run:** 1 (`0001_initial.sql`). Future schema changes will be `0002_*`, `0003_*` etc.; never edit `0001`.

---

## 6. Owner checkpoint before M2 starts

After Claude lands the seam swap + migration banner + tests, the owner should:

1. Open Supabase Dashboard → Table Editor and confirm rows landing in `projects` / `stops` / `postcards` / `assets` after creating + saving a trip in the deployed preview.
2. Open Storage → `assets` bucket and confirm uploaded photos appear under the expected path prefix.
3. Sign out / open an incognito tab and confirm: published+public projects load; the studio dashboard 401s (M1 keeps the password gate; real auth lands in M2).
4. Approve M2 start.
