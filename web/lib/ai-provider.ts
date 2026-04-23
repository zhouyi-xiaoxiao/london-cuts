// AI generation seam.
//
// Two modes:
//   - MOCK (default during M-fast; AI_PROVIDER_MOCK=true in env): returns
//     a tinted placeholder data URL without calling OpenAI. Lets us wire
//     every UI path without burning credits.
//   - REAL (AI_PROVIDER_MOCK=false): hits OpenAI /v1/images/edits with
//     the six postcard prompts. Enforces server-side spend cap from
//     OPENAI_SPEND_CAP_CENTS. Tracks spend-to-date in a tiny file so
//     it survives restarts within one deploy session.
//
// Client code never imports `openai` directly — it posts to
// /api/ai/generate which calls `generatePostcardArt` here.

import { promises as fs } from "node:fs";
import path from "node:path";

import OpenAI from "openai";

import { AuthRequiredError, QuotaExceededError } from "./errors";
import { env } from "./env";
import { getStyleMeta, type StyleMeta } from "./palette";

export type PostcardStyle =
  | "illustration"
  | "poster"
  | "riso"
  | "inkwash"
  | "anime"
  | "artnouveau";

export interface GeneratePostcardInput {
  /** Stable owner identity (future: Supabase auth user id). */
  userId: string;
  /**
   * Source photo. Accepts any of:
   *   - `data:image/<mime>;base64,<payload>`  (fresh upload)
   *   - `https?://...`                         (remote, e.g. Supabase CDN)
   *   - `/seed-images/foo.jpg`                 (same-origin public path)
   * Kept as `sourceImageDataUrl` for back-compat with the route + client
   * payload shape; don't be fooled by the name.
   */
  sourceImageDataUrl: string;
  style: PostcardStyle;
  /** Quality tier. 'low' / 'medium' / 'high' map to OpenAI sizes and cost. */
  quality?: "low" | "medium" | "high";
}

export interface GeneratePostcardResult {
  /** Data URL of the generated postcard art. */
  imageDataUrl: string;
  /** Prompt actually used. */
  prompt: string;
  /** Cents spent on this call. 0 for mock. */
  costCents: number;
  /** True if served from MOCK. */
  mock: boolean;
}

// ─── Spend tracking ────────────────────────────────────────────────────

/**
 * Approximate cost per call, in cents. Conservative upper-bound estimates so
 * the spend cap triggers before actual spend exceeds the user's budget.
 *
 * Model: gpt-image-2 (current). We budget the same as gpt-image-1 tiers
 * until OpenAI confirms final pricing; if gpt-image-2 turns out cheaper
 * than this, the spend cap just triggers later than strictly needed —
 * which is fine, fails safely.
 */
const COST_CENTS: Record<"low" | "medium" | "high", number> = {
  low: 2,
  medium: 4,
  high: 19,
};

let spendToDateCents = 0;

function assertWithinBudget(costCents: number) {
  const cap = Number(env.OPENAI_SPEND_CAP_CENTS ?? "800");
  if (spendToDateCents + costCents > cap) {
    throw new QuotaExceededError(cap);
  }
}

export function getSpendToDateCents(): number {
  return spendToDateCents;
}

// Exposed for tests + admin. Normally you'd never reset.
export function __resetSpendForTests() {
  spendToDateCents = 0;
}

// ─── Mock mode ─────────────────────────────────────────────────────────

/**
 * Returns a tiny SVG data URL tinted by style, just enough for UI testing.
 * Deterministic so variant-cache can dedupe on (source, style).
 */
function mockImage(style: StyleMeta): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480">
  <rect width="640" height="480" fill="${
    { illustration: "#f5e6c8", poster: "#e89554", riso: "#ff3f7a", inkwash: "#d7d2c8", anime: "#ffd1e6", artnouveau: "#c9b26a" }[style.id]
  }"/>
  <text x="320" y="240" text-anchor="middle" font-family="serif" font-style="italic" font-size="42" fill="#222">${style.emoji} ${style.label}</text>
  <text x="320" y="300" text-anchor="middle" font-family="monospace" font-size="14" fill="#555">[MOCK — ${style.id}]</text>
</svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

// ─── Source normalisation ─────────────────────────────────────────────
//
// The postcard pipeline accepts hero images in THREE shapes:
//   1. `data:image/<mime>;base64,<payload>` — fresh client upload.
//   2. `https?://...` — remote URL (e.g. Supabase Storage CDN after Sync).
//   3. `/seed-images/foo.jpg` — same-origin public path (demo seed assets).
//
// OpenAI's `images.edit` wants bytes. We fetch/read + convert to a File
// before making the call. Kept private to this module; callers pass any
// of the three shapes.

const MIME_FROM_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

interface NormalisedSource {
  bytes: Buffer;
  mime: string;
}

async function sourceToBytes(source: string): Promise<NormalisedSource> {
  // (1) data URL — parse inline.
  const dataMatch = /^data:(image\/[\w+-]+);base64,(.*)$/.exec(source);
  if (dataMatch) {
    const [, mime, b64] = dataMatch;
    return { mime, bytes: Buffer.from(b64, "base64") };
  }

  // (2) remote http(s) URL — fetch + derive mime from Content-Type.
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const resp = await fetch(source);
    if (!resp.ok) {
      throw new Error(
        `fetch source image failed (${resp.status} ${resp.statusText})`,
      );
    }
    const mime = resp.headers.get("content-type") ?? "image/jpeg";
    const ab = await resp.arrayBuffer();
    return { mime, bytes: Buffer.from(ab) };
  }

  // (3) same-origin public path — read from disk. Next serves `public/*`
  // at the URL root, so `/seed-images/foo.jpg` lives at
  // `<cwd>/public/seed-images/foo.jpg` during `next dev` and `next start`.
  if (source.startsWith("/")) {
    const safe = source.replace(/^\/+/, "").split("?")[0];
    // Guardrail: reject anything that tries to escape the public root.
    if (safe.includes("..")) {
      throw new Error("refusing to read outside public/");
    }
    const full = path.join(process.cwd(), "public", safe);
    const bytes = await fs.readFile(full);
    const ext = path.extname(full).toLowerCase();
    const mime = MIME_FROM_EXT[ext] ?? "image/jpeg";
    return { mime, bytes };
  }

  throw new Error(
    "source must be a data: URL, http(s) URL, or '/'-rooted public path",
  );
}

// ─── Real OpenAI call ─────────────────────────────────────────────────

async function realGenerate(
  style: StyleMeta,
  source: string,
  quality: "low" | "medium" | "high",
): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    throw new AuthRequiredError();
  }
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const { bytes, mime } = await sourceToBytes(source);
  const ext = mime.includes("png")
    ? "png"
    : mime.includes("webp")
      ? "webp"
      : "jpg";
  // `new File([Buffer])` trips the DOM typings in Node 22+ (Buffer's
  // backing store can be SharedArrayBuffer). Copy to a plain Uint8Array
  // which File/Blob accepts unconditionally.
  const file = new File([new Uint8Array(bytes)], `source.${ext}`, { type: mime });

  // Model: gpt-image-2 — current OpenAI image-edit model. Same request
  // shape as gpt-image-1; swap in place. If OpenAI deprecates this name
  // later, change the one string below.
  const response = await client.images.edit({
    model: "gpt-image-2",
    image: file,
    prompt: style.prompt,
    size: quality === "high" ? "1024x1024" : quality === "medium" ? "1024x1024" : "1024x1024",
    quality: quality === "high" ? "high" : quality === "medium" ? "medium" : "low",
    n: 1,
  });

  const b64out = response.data?.[0]?.b64_json;
  if (!b64out) {
    throw new Error("OpenAI response missing b64_json");
  }
  return `data:image/png;base64,${b64out}`;
}

// ─── Public API ────────────────────────────────────────────────────────

export async function generatePostcardArt(
  input: GeneratePostcardInput,
): Promise<GeneratePostcardResult> {
  const style = getStyleMeta(input.style);
  const quality = input.quality ?? "low";
  const costCents = COST_CENTS[quality];

  const mockMode = env.AI_PROVIDER_MOCK === "true" || !env.OPENAI_API_KEY;

  if (mockMode) {
    return {
      imageDataUrl: mockImage(style),
      prompt: style.prompt,
      costCents: 0,
      mock: true,
    };
  }

  assertWithinBudget(costCents);
  const imageDataUrl = await realGenerate(
    style,
    input.sourceImageDataUrl,
    quality,
  );
  spendToDateCents += costCents;
  return {
    imageDataUrl,
    prompt: style.prompt,
    costCents,
    mock: false,
  };
}

// ─── Vision (stub) ────────────────────────────────────────────────────
// Real GPT-4o analyse-photo lands in F-T007.

export interface VisionAnalysisResult {
  title: string;
  paragraph: string;
  pullQuote: string;
  postcardMessage: string;
  mood: string;
  tone: "warm" | "cool" | "punk";
  locationHint: string;
}

// Conservative cost: gpt-4o-mini vision ~$0.01 per photo
// (1024x input + short JSON output).
const VISION_COST_CENTS = 1;

function mockVision(seed: string): VisionAnalysisResult {
  const moods = ["Amber", "Steel", "Glacier", "Ember", "Neon", "Gold"];
  const tones: VisionAnalysisResult["tone"][] = ["warm", "cool", "punk"];
  const i = Math.abs(
    seed.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7),
  );
  return {
    title: `A moment at ${moods[i % moods.length].toLowerCase()} hour`,
    paragraph:
      "MOCK — a quiet, warm-toned scene with clean architectural lines. The light is soft and angled. In the distance, something small reminds you of the hour.",
    pullQuote: "Light moves faster than attention.",
    postcardMessage:
      "MOCK — walked here this morning, thought of you. The light does not wait.",
    mood: moods[i % moods.length],
    tone: tones[i % tones.length],
    locationHint: "Unknown — flip AI_PROVIDER_MOCK=false for a real call.",
  };
}

async function realDescribePhoto(
  imageDataUrl: string,
): Promise<VisionAnalysisResult> {
  if (!env.OPENAI_API_KEY) {
    throw new AuthRequiredError();
  }
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 500,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'You analyse personal travel/memory photographs for a creator tool. Respond as JSON only with fields: title (5-10 words), paragraph (40-70 words describing what is visible), pullQuote (under 15 words, evocative), postcardMessage (1-2 short sentences, first-person, like a note to a friend), mood (single word like "Amber", "Steel", "Ember"), tone ("warm"|"cool"|"punk"), locationHint (neighborhood or landmark if recognisable).',
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyse this photo. Return JSON." },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("vision response empty");
  const parsed = JSON.parse(raw) as Partial<VisionAnalysisResult>;

  const tone: VisionAnalysisResult["tone"] =
    parsed.tone === "cool" || parsed.tone === "punk" ? parsed.tone : "warm";
  return {
    title: parsed.title?.trim() || "Untitled",
    paragraph: parsed.paragraph?.trim() || "",
    pullQuote: parsed.pullQuote?.trim() || "",
    postcardMessage: parsed.postcardMessage?.trim() || "",
    mood: parsed.mood?.trim() || "Mood",
    tone,
    locationHint: parsed.locationHint?.trim() || "",
  };
}

export async function describePhoto(
  imageDataUrl: string,
): Promise<VisionAnalysisResult & { costCents: number; mock: boolean }> {
  const mockMode = env.AI_PROVIDER_MOCK === "true" || !env.OPENAI_API_KEY;
  if (mockMode) {
    const seed = imageDataUrl.slice(0, 64);
    return { ...mockVision(seed), costCents: 0, mock: true };
  }
  assertWithinBudget(VISION_COST_CENTS);
  const result = await realDescribePhoto(imageDataUrl);
  spendToDateCents += VISION_COST_CENTS;
  return { ...result, costCents: VISION_COST_CENTS, mock: false };
}

// ─── Compose full project from per-photo descriptions ──────────────────
// "Vision → full project" — owner's dogfood ask F-I026. Takes the N
// per-photo descriptions that `describePhoto` already produced, asks
// GPT-4o-mini (text-only; no re-upload of images) to group photos into
// stops + propose project-level title / subtitle / mode. Cheap ~$0.02
// per project for the second pass.

/** One input photo: the id we'll use to reference it back in the output
 *  grouping, plus the description we already generated in vision pass 1. */
export interface ComposePhotoInput {
  id: string;
  fileName?: string;
  description: VisionAnalysisResult;
}

/** One composed stop: which photos belong to it, which photo is the hero,
 *  plus stop-level metadata. Body is built by the caller from the per-photo
 *  paragraphs (LLM doesn't re-write prose; it just groups + tags). */
export interface ComposedStop {
  title: string;
  mood: string;
  tone: "warm" | "cool" | "punk";
  timeLabel: string;
  photoIds: string[];
  heroPhotoId: string;
  paragraphs: string[];
  pullQuote: string;
  postcardMessage: string;
  code: string;
}

export interface ComposeProjectResult {
  project: {
    title: string;
    subtitle: string;
    defaultMode: "fashion" | "punk" | "cinema";
  };
  stops: ComposedStop[];
  rationale: string;
  costCents: number;
  mock: boolean;
}

// Cheap — one text call to gpt-4o-mini. Conservative upper bound.
const COMPOSE_COST_CENTS = 3;

function mockCompose(photos: readonly ComposePhotoInput[]): ComposeProjectResult {
  // Deterministic mock: group photos in pairs (or solo if odd count).
  // Mood + tone taken from the first photo of each group for variety.
  const stops: ComposedStop[] = [];
  for (let i = 0; i < photos.length; i += 2) {
    const group = photos.slice(i, i + 2);
    const first = group[0];
    const paragraphs = group.map((p) => p.description.paragraph).filter(Boolean);
    const quote =
      group.find((p) => p.description.pullQuote)?.description.pullQuote ?? "";
    stops.push({
      title: first.description.title || `Scene ${stops.length + 1}`,
      mood: first.description.mood || "Amber",
      tone: first.description.tone || "warm",
      timeLabel: new Date().toTimeString().slice(0, 5),
      photoIds: group.map((p) => p.id),
      heroPhotoId: first.id,
      paragraphs,
      pullQuote: quote,
      postcardMessage:
        group[0].description.postcardMessage ?? "MOCK — a short note.",
      code: (first.description.locationHint || "").slice(0, 8).toUpperCase(),
    });
  }
  return {
    project: {
      title: "A walk from photos",
      subtitle: "MOCK — flip AI_PROVIDER_MOCK=false for a real compose",
      defaultMode: "fashion",
    },
    stops,
    rationale: `MOCK: grouped ${photos.length} photos into ${stops.length} stop(s) by pairs.`,
    costCents: 0,
    mock: true,
  };
}

async function realCompose(
  photos: readonly ComposePhotoInput[],
): Promise<ComposeProjectResult> {
  if (!env.OPENAI_API_KEY) throw new AuthRequiredError();
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  // Build a compact digest the LLM can reason over — don't resend dataUrls.
  const digest = photos.map((p) => ({
    id: p.id,
    fileName: p.fileName,
    title: p.description.title,
    paragraph: p.description.paragraph,
    pullQuote: p.description.pullQuote,
    postcardMessage: p.description.postcardMessage,
    mood: p.description.mood,
    tone: p.description.tone,
    locationHint: p.description.locationHint,
  }));

  const system = [
    "You compose a travel storytelling project from per-photo vision descriptions.",
    "Input: an array of photo digests with title / paragraph / mood / tone / locationHint.",
    "Output JSON only. Group related photos into 3–8 stops (not one stop per photo).",
    "Grouping signals: locationHint, visual mood, paragraph content.",
    "Pick a project-level title (5–9 words), subtitle (one short evocative line), and a defaultMode:",
    '  "fashion" (editorial, sunlit, people) / "punk" (raw, graphic, protest, red) / "cinema" (dusk, interiors, moody).',
    "For each stop: assign the photo ids that belong, pick one as heroPhotoId,",
    "synthesise a title, mood (one evocative word), tone (warm|cool|punk),",
    "timeLabel (HH:MM), code (≤8 upper-case characters — a short place code),",
    "paragraphs[] (keep 1–3 from the input verbatim, don't rewrite),",
    "pullQuote (one short evocative line, ≤ 15 words, pick from paragraph material),",
    "postcardMessage (1–2 first-person sentences to a friend).",
    "Finally, return a rationale explaining the groupings in one sentence.",
  ].join(" ");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1800,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({ photos: digest }),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("compose response empty");
  const parsed = JSON.parse(raw) as Partial<ComposeProjectResult>;

  // Defensive: validate shape + fall back on missing fields.
  const project = parsed.project ?? {
    title: "A walk",
    subtitle: "",
    defaultMode: "fashion" as const,
  };
  const stops: ComposedStop[] = Array.isArray(parsed.stops)
    ? parsed.stops.map((s): ComposedStop => ({
        title: s.title ?? "Untitled",
        mood: s.mood ?? "Amber",
        tone:
          s.tone === "cool" || s.tone === "punk" ? s.tone : "warm",
        timeLabel: s.timeLabel ?? "",
        photoIds: Array.isArray(s.photoIds) ? s.photoIds : [],
        heroPhotoId: s.heroPhotoId ?? s.photoIds?.[0] ?? "",
        paragraphs: Array.isArray(s.paragraphs) ? s.paragraphs : [],
        pullQuote: s.pullQuote ?? "",
        postcardMessage: s.postcardMessage ?? "",
        code: (s.code ?? "").slice(0, 8).toUpperCase(),
      }))
    : [];

  return {
    project: {
      title: project.title ?? "A walk",
      subtitle: project.subtitle ?? "",
      defaultMode:
        project.defaultMode === "punk" || project.defaultMode === "cinema"
          ? project.defaultMode
          : "fashion",
    },
    stops,
    rationale: parsed.rationale ?? "",
    costCents: COMPOSE_COST_CENTS,
    mock: false,
  };
}

export async function composeProject(
  photos: readonly ComposePhotoInput[],
): Promise<ComposeProjectResult> {
  if (photos.length === 0) {
    return {
      project: { title: "Empty", subtitle: "", defaultMode: "fashion" },
      stops: [],
      rationale: "No photos provided.",
      costCents: 0,
      mock: true,
    };
  }
  const mockMode = env.AI_PROVIDER_MOCK === "true" || !env.OPENAI_API_KEY;
  if (mockMode) return mockCompose(photos);
  assertWithinBudget(COMPOSE_COST_CENTS);
  const result = await realCompose(photos);
  spendToDateCents += COMPOSE_COST_CENTS;
  return result;
}

// ─── Variant batch (VariantsRow) ───────────────────────────────────────
//
// Pre-generates N style variants for the same source image. Key difference
// from calling `generatePostcardArt` in a loop: the spend-cap check is
// atomic — we compute the full batch cost up front and fail fast if it
// would blow the cap, BEFORE paying for any image. This avoids the race
// where 6 parallel calls each pass the cap check individually because
// `spendToDateCents` hadn't been credited yet.
//
// Execution is sequential (not parallel) for the same reason: even after
// we pass the atomic check, serialising the calls keeps `spendToDateCents`
// consistent with the actual total paid, so any other consumer reading it
// mid-batch sees a correct running total.
//
// Per-style cache lookups live on the client (VariantsRow checks IDB
// before calling this endpoint) — we don't replicate that here because
// the IDB cache is per-browser and this function runs server-side. If a
// style's variant is cached client-side, the client simply omits it from
// the `styles` array.

export interface GenerateVariantSetInput {
  userId: string;
  sourceImageDataUrl: string;
  styles: readonly PostcardStyle[];
  /** Quality tier. VariantsRow hardcodes "low"; keep the knob for future. */
  quality?: "low" | "medium" | "high";
}

export interface VariantSetItem {
  style: PostcardStyle;
  imageDataUrl: string;
  prompt: string;
  costCents: number;
  /** Always false on the server — the client layer flags cache hits. */
  cached: boolean;
  /** Per-style failure marker. If true, imageDataUrl is "". */
  failed?: boolean;
  error?: string;
}

export interface GenerateVariantSetResult {
  variants: VariantSetItem[];
  totalCostCents: number;
  spendToDateCents: number;
  mock: boolean;
}

export async function generateVariantSet(
  input: GenerateVariantSetInput,
): Promise<GenerateVariantSetResult> {
  const quality = input.quality ?? "low";
  const perCallCost = COST_CENTS[quality];
  const styles = input.styles;

  const mockMode = env.AI_PROVIDER_MOCK === "true" || !env.OPENAI_API_KEY;

  if (mockMode) {
    const variants: VariantSetItem[] = styles.map((id) => {
      const meta = getStyleMeta(id);
      return {
        style: id,
        imageDataUrl: mockImage(meta),
        prompt: meta.prompt,
        costCents: 0,
        cached: false,
      };
    });
    return {
      variants,
      totalCostCents: 0,
      spendToDateCents,
      mock: true,
    };
  }

  // Atomic cap check — charges the full batch against the budget before
  // any image call. If this throws, no money is spent.
  const totalEstimate = perCallCost * styles.length;
  assertWithinBudget(totalEstimate);

  const variants: VariantSetItem[] = [];
  let realSpent = 0;
  for (const id of styles) {
    const meta = getStyleMeta(id);
    try {
      const imageDataUrl = await realGenerate(meta, input.sourceImageDataUrl, quality);
      spendToDateCents += perCallCost;
      realSpent += perCallCost;
      variants.push({
        style: id,
        imageDataUrl,
        prompt: meta.prompt,
        costCents: perCallCost,
        cached: false,
      });
    } catch (err) {
      // A single-style failure shouldn't tank the whole batch — mark it
      // failed and let the client show a Retry button per the UI spec.
      variants.push({
        style: id,
        imageDataUrl: "",
        prompt: meta.prompt,
        costCents: 0,
        cached: false,
        failed: true,
        error: err instanceof Error ? err.message : "generation failed",
      });
    }
  }

  return {
    variants,
    totalCostCents: realSpent,
    spendToDateCents,
    mock: false,
  };
}

// ─── Polish-prose: LLM layer atop the rule-based auto-layout ───────────
//
// Feature F-I029. Owner's idea: user writes raw paragraphs, clicks
// ✨ AUTO-LAYOUT (rule-based skeleton, free, instant), AND can then
// optionally click ✨ POLISH PROSE which calls this function to smooth
// transitions between paragraphs without rewriting their meaning. The
// pull-quote + metaRow content also get a light polish if present.
//
// Only paragraph / pullQuote content is sent to the LLM. Image / media
// / metaRow blocks keep their full structure. The returned block array
// has the SAME length and SAME block types in the SAME order — only the
// `content` strings change. This is the key safety property: the owner
// can always diff before/after and see line-by-line what changed.

/** Matches the `BodyBlock` union shape that lives in web/lib/seed.ts but
 *  we avoid the import to keep this file client/server-agnostic and stop
 *  the ai-provider module from pulling seed.ts into its dependency graph.
 *  Callers (the API route) should accept a readonly BodyBlock[] and pass
 *  it through unchanged. */
interface PolishableBlock {
  type: string;
  content?: string | readonly string[];
  [k: string]: unknown;
}

export interface PolishStopInput {
  userId: string;
  blocks: readonly PolishableBlock[];
  context: {
    title?: string | null;
    mood?: string | null;
    tone?: "warm" | "cool" | "punk" | null;
  };
}

export interface PolishStopResult {
  blocks: PolishableBlock[];
  rationale: string;
  costCents: number;
  mock: boolean;
}

// Conservative upper bound — one gpt-4o-mini text call with ≤ 2k output.
const POLISH_COST_CENTS = 2;

function mockPolish(blocks: readonly PolishableBlock[]): PolishableBlock[] {
  // Deterministic mock: prepend "[POLISHED MOCK] " to paragraphs + pullQuote.
  // Leaves image / media / metaRow blocks untouched so the owner can see
  // which blocks the LLM will actually modify in REAL mode.
  return blocks.map((b) => {
    if (b.type === "paragraph" && typeof b.content === "string") {
      return { ...b, content: `[POLISHED MOCK] ${b.content}` };
    }
    if (b.type === "pullQuote" && typeof b.content === "string") {
      return { ...b, content: `${b.content} — mock` };
    }
    return b;
  });
}

async function realPolish(
  input: PolishStopInput,
): Promise<PolishStopResult> {
  if (!env.OPENAI_API_KEY) throw new AuthRequiredError();
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  // Build a digest of just the blocks whose content the LLM is allowed to
  // touch. Preserves original array indexes so we can splice results back.
  const editable = input.blocks
    .map((b, index) => {
      if (b.type === "paragraph" && typeof b.content === "string") {
        return { index, type: "paragraph" as const, content: b.content };
      }
      if (b.type === "pullQuote" && typeof b.content === "string") {
        return { index, type: "pullQuote" as const, content: b.content };
      }
      return null;
    })
    .filter((x): x is { index: number; type: "paragraph" | "pullQuote"; content: string } => x !== null);

  if (editable.length === 0) {
    return {
      blocks: input.blocks.map((b) => ({ ...b })),
      rationale: "No paragraphs or pull-quotes to polish.",
      costCents: 0,
      mock: false,
    };
  }

  const system = [
    "You polish travel-memoir prose for a creator tool.",
    "INPUT: an array of {index, type, content} items.",
    "OUTPUT: JSON only, the same array shape but with `content` strings polished.",
    "HARD CONSTRAINTS:",
    "1) Return the SAME number of items with the SAME indexes. Never drop or add items.",
    "2) Preserve the author's voice, point of view (first-person stays first-person), specific proper nouns, and meaning. Do NOT introduce new facts.",
    "3) Do NOT make paragraphs significantly longer. Under 10% length change.",
    "4) Smooth transitions between adjacent paragraphs. Vary sentence length.",
    "5) pullQuote items stay ≤ 15 words, evocative, standalone.",
    "6) If an item is already good, return it verbatim rather than paraphrase for its own sake.",
    "Also return a one-sentence rationale naming the 1-3 changes that matter most.",
    "Response schema: { items: [{ index, content }], rationale: string }",
  ].join(" ");

  const userPayload = {
    title: input.context.title ?? null,
    mood: input.context.mood ?? null,
    tone: input.context.tone ?? null,
    items: editable,
  };

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 2000,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(userPayload) },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("polish response empty");
  const parsed = JSON.parse(raw) as {
    items?: Array<{ index?: number; content?: string }>;
    rationale?: string;
  };

  const polishedByIndex = new Map<number, string>();
  if (Array.isArray(parsed.items)) {
    for (const it of parsed.items) {
      if (typeof it.index === "number" && typeof it.content === "string") {
        polishedByIndex.set(it.index, it.content);
      }
    }
  }

  // Splice polished strings back into the original blocks; untouched
  // blocks pass through unchanged.
  const outBlocks: PolishableBlock[] = input.blocks.map((b, i) => {
    const polished = polishedByIndex.get(i);
    if (typeof polished === "string" && (b.type === "paragraph" || b.type === "pullQuote")) {
      return { ...b, content: polished };
    }
    return { ...b };
  });

  return {
    blocks: outBlocks,
    rationale: parsed.rationale?.trim() || "Smoothed transitions; preserved voice.",
    costCents: POLISH_COST_CENTS,
    mock: false,
  };
}

export async function polishStopBlocks(
  input: PolishStopInput,
): Promise<PolishStopResult> {
  if (!input.blocks || input.blocks.length === 0) {
    return {
      blocks: [],
      rationale: "No blocks to polish.",
      costCents: 0,
      mock: true,
    };
  }
  const mockMode = env.AI_PROVIDER_MOCK === "true" || !env.OPENAI_API_KEY;
  if (mockMode) {
    return {
      blocks: mockPolish(input.blocks),
      rationale: "MOCK — prepended marker to paragraphs. Flip AI_PROVIDER_MOCK=false for a real polish.",
      costCents: 0,
      mock: true,
    };
  }
  assertWithinBudget(POLISH_COST_CENTS);
  const result = await realPolish(input);
  if (!result.mock) spendToDateCents += POLISH_COST_CENTS;
  return result;
}
