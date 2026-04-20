---
id: M0-P001
title: Create seam file stubs in web/lib/
milestone: M0
kind: parallel
status: TODO
blocked_by: [M0-T001]
blocks: []
parallel_safe: true
touches:
  - web/lib/
owner: null
started_at: null
completed_at: null
---

# M0-P001 — Create seam file stubs in `web/lib/`

## Why
The architecture requires that all external services (DB, Auth, AI, email, analytics) be accessed only through files in `web/lib/`. These files don't exist yet. Create them as stubs that throw `NotImplemented` so:
1. The architecture is physically enforced from day 1 (importing `lib/storage` already works, even if empty).
2. Future milestones fill in real implementations without needing to scaffold.
3. Type signatures are declared upfront so callers can be written first.

See `docs/architecture.md#4-the-seam-layers` for what each should expose.

## Acceptance criteria
- [ ] `web/lib/storage.ts` exists with typed exports (functions throw `NotImplemented`)
- [ ] `web/lib/auth.ts` exists with typed exports
- [ ] `web/lib/ai-provider.ts` exists with typed exports
- [ ] `web/lib/email.ts` exists with typed exports
- [ ] `web/lib/analytics.ts` exists with typed exports (no-ops OK since it's non-critical)
- [ ] `web/lib/env.ts` exists and exports a typed `env` object from `process.env` (Zod validation in M1)
- [ ] `web/lib/errors.ts` exists with custom error classes
- [ ] `cd web && pnpm typecheck` passes with no errors
- [ ] Each file has a header comment explaining its purpose and pointing to `docs/architecture.md`

## Steps

### 1. `web/lib/errors.ts`
Start here — other seams reference these errors.

```ts
// Typed error classes used across all seams.
// See docs/architecture.md#errors
export class NotImplementedError extends Error {
  constructor(fn: string) {
    super(`Not implemented: ${fn}`);
    this.name = 'NotImplementedError';
  }
}
export class InviteInvalidError extends Error {
  constructor(msg = 'Invite code is invalid or used') {
    super(msg);
    this.name = 'InviteInvalidError';
  }
}
export class QuotaExceededError extends Error {
  constructor(limit: number) {
    super(`Daily quota exceeded (${limit})`);
    this.name = 'QuotaExceededError';
  }
}
export class AuthRequiredError extends Error {
  constructor() {
    super('Authentication required');
    this.name = 'AuthRequiredError';
  }
}
```

### 2. `web/lib/env.ts`
Stub that reads from `process.env` directly for now. Real Zod validation in M1-P003.

```ts
// Environment variables. Real validation lands in M1-P003.
// See docs/architecture.md#6-environment-variables
export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
  POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '',
  SENTRY_DSN: process.env.SENTRY_DSN ?? '',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
};
```

### 3. `web/lib/storage.ts`
Type signatures for all CRUD. Implementations throw `NotImplementedError`.

```ts
// Data access seam. All DB reads/writes go through here.
// Implementations land in M1-T005.
// See docs/architecture.md#4-the-seam-layers and docs/data-model.md
import { NotImplementedError } from './errors';

export type ProjectStatus = 'draft' | 'published';
export type ProjectVisibility = 'public' | 'unlisted' | 'private';
export type NarrativeMode = 'fashion' | 'punk' | 'cinema';

export interface Project {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  subtitle: string | null;
  locationName: string | null;
  defaultMode: NarrativeMode;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  coverAssetId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getProject(id: string): Promise<Project | null> {
  throw new NotImplementedError('getProject');
}
export async function getProjectByHandleAndSlug(handle: string, slug: string): Promise<Project | null> {
  throw new NotImplementedError('getProjectByHandleAndSlug');
}
export async function listProjects(args: { ownerId: string }): Promise<Project[]> {
  throw new NotImplementedError('listProjects');
}
export async function createProject(input: Partial<Project> & { ownerId: string; title: string; slug: string }): Promise<Project> {
  throw new NotImplementedError('createProject');
}
export async function updateProject(id: string, patch: Partial<Project>): Promise<Project> {
  throw new NotImplementedError('updateProject');
}
export async function softDeleteProject(id: string): Promise<void> {
  throw new NotImplementedError('softDeleteProject');
}

// Stops, Postcards, Assets — to be filled in M1-T005.
// Leave stubs for now so tests can mock.
```

### 4. `web/lib/auth.ts`

```ts
// Authentication seam. Wraps Supabase Auth.
// Implementations land in M2-T001.
import { NotImplementedError } from './errors';

export interface Session {
  userId: string;
  email: string;
  handle: string;
}

export async function getCurrentUser(): Promise<Session | null> {
  throw new NotImplementedError('getCurrentUser');
}
export async function requireUser(): Promise<Session> {
  throw new NotImplementedError('requireUser');
}
export async function sendMagicLink(email: string): Promise<void> {
  throw new NotImplementedError('sendMagicLink');
}
export async function signOut(): Promise<void> {
  throw new NotImplementedError('signOut');
}
export async function verifyInvite(code: string): Promise<{ valid: boolean; reason?: string }> {
  throw new NotImplementedError('verifyInvite');
}
```

### 5. `web/lib/ai-provider.ts`

```ts
// AI generation seam (OpenAI today; wrapper so we can swap).
// Implementations land in M3-T005.
import { NotImplementedError } from './errors';

export type PostcardStyle =
  | 'watercolour'
  | 'vintage_poster'
  | 'risograph'
  | 'ink_watercolour'
  | 'anime'
  | 'art_nouveau';

export interface GeneratePostcardInput {
  userId: string;
  sourceAssetId: string;
  style: PostcardStyle;
  prompt?: string;
}

export interface GeneratePostcardResult {
  resultAssetId: string;
  cached: boolean;
}

export async function generatePostcardArt(input: GeneratePostcardInput): Promise<GeneratePostcardResult> {
  throw new NotImplementedError('generatePostcardArt');
}

export interface VisionAnalysisResult {
  title: string;
  body: string;
  excerpt: string;
  postcardMessage: string;
}

export async function describePhoto(assetId: string): Promise<VisionAnalysisResult> {
  throw new NotImplementedError('describePhoto');
}
```

### 6. `web/lib/email.ts`

```ts
// Email sending seam. Wraps Resend.
// Implementations land in M2-P001.
import { NotImplementedError } from './errors';

export async function sendInviteEmail(email: string, code: string): Promise<void> {
  throw new NotImplementedError('sendInviteEmail');
}
// Magic-link email is sent by Supabase Auth itself (via Resend SMTP).
// We only use this seam for invite-specific emails and future transactional mail.
```

### 7. `web/lib/analytics.ts`

```ts
// Product analytics seam. Wraps PostHog.
// Implementations land in M5-T002. For now, no-op gracefully.
export function track(event: string, props?: Record<string, unknown>) {
  // no-op until M5
  if (process.env.NODE_ENV === 'development') {
    console.log('[analytics]', event, props);
  }
}

export function identify(userId: string, props?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[analytics] identify', userId, props);
  }
}
```

### 8. Verify
```bash
cd web && pnpm typecheck
```

## Verification
```bash
ls web/lib/
# expect: analytics.ts  ai-provider.ts  auth.ts  email.ts  env.ts  errors.ts  storage.ts

cd web && pnpm typecheck
# expect: success
```

## Trace
