// Server-side endpoint that wraps `lib/ai-provider.generatePostcardArt`.
// Purpose: keep OPENAI_API_KEY off the client. The postcard editor
// POSTs here; this route calls the seam; seam calls OpenAI or returns
// mock depending on env.
//
// In M-fast there's no auth yet. M2 will add `requireUser()` + daily
// quota enforcement at this entry point.

import { NextResponse } from "next/server";

import {
  generatePostcardArt,
  getSpendToDateCents,
  type GeneratePostcardInput,
  type PostcardStyle,
} from "@/lib/ai-provider";
import {
  AuthRequiredError,
  QuotaExceededError,
} from "@/lib/errors";

const VALID_STYLES: readonly PostcardStyle[] = [
  "illustration",
  "poster",
  "riso",
  "inkwash",
  "anime",
  "artnouveau",
];

export async function POST(req: Request) {
  let body: Partial<GeneratePostcardInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body" },
      { status: 400 },
    );
  }

  const { userId, sourceImageDataUrl, style, quality } = body;

  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (
    typeof sourceImageDataUrl !== "string" ||
    !sourceImageDataUrl.startsWith("data:image/")
  ) {
    return NextResponse.json(
      { error: "sourceImageDataUrl must be a base64 image data URL" },
      { status: 400 },
    );
  }
  if (
    typeof style !== "string" ||
    !(VALID_STYLES as readonly string[]).includes(style)
  ) {
    return NextResponse.json(
      { error: `style must be one of ${VALID_STYLES.join(" | ")}` },
      { status: 400 },
    );
  }

  try {
    const result = await generatePostcardArt({
      userId,
      sourceImageDataUrl,
      style: style as PostcardStyle,
      quality: (quality ?? "low") as "low" | "medium" | "high",
    });
    return NextResponse.json({
      imageDataUrl: result.imageDataUrl,
      prompt: result.prompt,
      costCents: result.costCents,
      mock: result.mock,
      spendToDateCents: getSpendToDateCents(),
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
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
