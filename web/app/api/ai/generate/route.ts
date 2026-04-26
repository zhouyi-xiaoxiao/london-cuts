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
import { gateApiRequest } from "@/lib/api-auth";
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
  const gate = await gateApiRequest(req, "ai:run");
  if (!gate.allowed) return gate.response;

  let body: Partial<GeneratePostcardInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body" },
      { status: 400 },
    );
  }

  const { sourceImageDataUrl, style, quality } = body;
  // Session profile id (when M2 auth active) wins over client-supplied
  // userId — clients can't forge someone else's identity.
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
