---
id: M0-P003
title: Update web/next.config.ts for production
milestone: M0
kind: parallel
status: TODO
blocked_by: [M0-T001]
blocks: []
parallel_safe: true
touches:
  - web/next.config.ts
  - .github/workflows/deploy-pages.yml
owner: null
started_at: null
completed_at: null
---

# M0-P003 — Update `web/next.config.ts` for production

## Why
The current `next-scaffold/` was configured for GitHub Pages static export. We're moving to Vercel, which supports full SSR + API routes. The current config will prevent server-side features (auth, API routes) from working.

## Acceptance criteria
- [ ] `web/next.config.ts` no longer has `output: 'export'` or static-export flags
- [ ] Image optimization is enabled (default Next behavior)
- [ ] Supabase Storage domain is whitelisted for `next/image`
- [ ] `.github/workflows/deploy-pages.yml` is either removed or neutered — Vercel will handle deploy, and we don't want both running
- [ ] `cd web && pnpm build` succeeds
- [ ] `cd web && pnpm dev` serves API routes (even stub ones) correctly

## Steps

### 1. Inspect current config
```bash
cat web/next.config.ts
```
Note what's there, including any `output:`, `assetPrefix:`, `basePath:`, `trailingSlash:`, `images:` config.

### 2. Rewrite `web/next.config.ts`

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Allow map tile providers for atlas previews
      {
        protocol: 'https',
        hostname: 'basemaps.cartocdn.com',
      },
    ],
  },
  experimental: {
    // enable as needed later
  },
};

export default nextConfig;
```

### 3. Remove or disable GitHub Pages deploy workflow
The GitHub Pages workflow at `.github/workflows/deploy-pages.yml` was for static export. With Vercel taking over:

Option A (recommended): **Delete** the file.
```bash
git rm .github/workflows/deploy-pages.yml
```

Option B: **Rename** to `deploy-pages.yml.disabled` and add a comment. (Preserves history visibly but less clean.)

Either way, add an entry to `tasks/LOG.md` noting the decision.

### 4. Remove `web/public/CNAME` if present
CNAME was for GitHub Pages. Vercel handles DNS differently.
```bash
rm -f web/public/CNAME
```
Note: git status already shows this was deleted — just confirm and commit.

### 5. Verify
```bash
cd web && pnpm build
# expect: success, with "ƒ (Dynamic)" or similar next to API routes,
# not "○ (Static)"
```

## Verification
```bash
# No static export
grep -c "output.*export" web/next.config.ts
# expect: 0

# Vercel deploy workflow absent or disabled
ls .github/workflows/ | grep -i pages
# expect: empty (if deleted) or ends in .disabled

# Build succeeds
cd web && pnpm build
```

## Notes
- Vercel deploy itself is configured later in **M6-T001 / M6-T002**. This task just prepares the codebase.
- If you need to preview builds locally before Vercel is set up: `cd web && pnpm build && pnpm start`.

## Trace
