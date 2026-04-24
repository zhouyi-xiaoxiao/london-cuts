// Batch variant pre-generation endpoint.
//
// Why this exists vs. N calls to /api/ai/generate:
//   • Atomic spend-cap: we charge the full estimated batch against
//     `OPENAI_SPEND_CAP_CENTS` before firing ANY OpenAI call. Parallel
//     client-side calls to /generate can race past the cap because each
//     individual check passes before any of them have credited spend yet.
//   • One round-trip for N styles — useful for the VariantsRow "pregen
//     all 6" button.
//
// The endpoint hardcodes `quality = "low"` by convention (the only caller,
// VariantsRow, only pregens at low quality) but accepts an override so
// future callers can choose.
//
// M2 PR 4: env-gated `requireUser` via `gateApiRequest`. Behaviour
// unchanged when M2_AUTH_ENABLED is not "true".

import { NextResponse } from "next/server";

import {
  generateVariantSet,
  getSpendToDateCents,
  type GenerateVariantSetInput,
  type PostcardStyle,
} from "@/lib/ai-provider";
import { gateApiRequest } from "@/lib/api-auth";
import { AuthRequiredError, QuotaExceededError } from "@/lib/errors";

const VALID_STYLES: readonly PostcardStyle[] = [
  "illustration",
  "poster",
  "riso",
  "inkwash",
  "anime",
  "artnouveau",
];

export async function POST(req: Request) {
  const gate = await gateApiRequest();
  if (!gate.allowed) return gate.response;

  let body: Partial<GenerateVariantSetInput>;
  try {
    body = (await req.json()) as Partial<GenerateVariantSetInput>;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { sourceImageDataUrl, styles, quality } = body;
  const userId = gate.profileId ?? body.userId;

  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (typeof sourceImageDataUrl !== "string" || !sourceImageDataUrl) {
    return NextResponse.json(
      { error: "sourceImageDataUrl is required" },
      { status: 400 },
    );
  }
  const validSource =
    sourceImageDataUrl.startsWith("data:image/") ||
    sourceImageDataUrl.startsWith("http://") ||
    sourceImageDataUrl.startsWith("https://") ||
    sourceImageDataUrl.startsWith("/");
  if (!validSource) {
    return NextResponse.json(
      {
        error:
          "sourceImageDataUrl must be a data: URL, an http(s) URL, or a '/'-rooted public path",
      },
      { status: 400 },
    );
  }

  if (!Array.isArray(styles) || styles.length === 0) {
    return NextResponse.json(
      { error: "styles must be a non-empty array" },
      { status: 400 },
    );
  }
  const invalid = styles.filter(
    (s) => typeof s !== "string" || !(VALID_STYLES as readonly string[]).includes(s),
  );
  if (invalid.length > 0) {
    return NextResponse.json(
      {
        error: `unknown style(s): ${invalid.join(", ")}. Must be one of ${VALID_STYLES.join(" | ")}`,
      },
      { status: 400 },
    );
  }
  // Defensive: cap batch size at 6 (the preset count) so a bug or
  // malicious client can't blow the budget with a 1000-style request.
  if (styles.length > VALID_STYLES.length) {
    return NextResponse.json(
      { error: `at most ${VALID_STYLES.length} styles per batch` },
      { status: 400 },
    );
  }

  try {
    const result = await generateVariantSet({
      userId,
      sourceImageDataUrl,
      styles: styles as readonly PostcardStyle[],
      quality: (quality ?? "low") as "low" | "medium" | "high",
    });
    return NextResponse.json({
      variants: result.variants,
      totalCostCents: result.totalCostCents,
      spendToDateCents: result.spendToDateCents,
      mock: result.mock,
    });
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured on server" },
        { status: 503 },
      );
    }
    if (err instanceof QuotaExceededError) {
      return NextResponse.json(
        { error: err.message, spendToDateCents: getSpendToDateCents() },
        { status: 429 },
      );
    }
    const msg = err instanceof Error ? err.message : "generation failed";
    const maybeOpenAI = err as {
      status?: number;
      code?: string;
      type?: string;
      request_id?: string;
    };
    return NextResponse.json(
      {
        error: msg,
        code: maybeOpenAI.code,
        type: maybeOpenAI.type,
        requestId: maybeOpenAI.request_id,
      },
      { status: maybeOpenAI.status ?? 500 },
    );
  }
}
