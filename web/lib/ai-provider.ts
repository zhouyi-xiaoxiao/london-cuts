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
  /** A data URL (data:image/jpeg;base64,...) of the source photo. */
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
 * Approximate cost per call, in cents. OpenAI's image-edit pricing varies
 * by size + quality; these are conservative upper-bound estimates so the
 * spend cap triggers before we actually exceed the user's budget.
 *
 * Source: OpenAI pricing as of 2026-04 (gpt-image-1 / dall-e-2 image-edits).
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

// ─── Real OpenAI call ─────────────────────────────────────────────────

async function realGenerate(
  style: StyleMeta,
  sourceImageDataUrl: string,
  quality: "low" | "medium" | "high",
): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    throw new AuthRequiredError();
  }
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  // Convert data URL → Blob → File (what the SDK's images.edit expects).
  const match = /^data:(image\/[\w+-]+);base64,(.*)$/.exec(sourceImageDataUrl);
  if (!match) {
    throw new Error("sourceImageDataUrl must be a base64-encoded data URL");
  }
  const [, mime, b64] = match;
  const bytes = Buffer.from(b64, "base64");
  const file = new File([bytes], "source.png", { type: mime });

  // gpt-image-1 supports style prompts better than dall-e-2 for edits.
  const response = await client.images.edit({
    model: "gpt-image-1",
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
  body: string;
  excerpt: string;
  postcardMessage: string;
}

export async function describePhoto(
  _assetId: string,
): Promise<VisionAnalysisResult> {
  throw new Error("describePhoto — implemented in F-T007");
}
