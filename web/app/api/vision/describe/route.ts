// Server-side endpoint for GPT-4o vision description.
// Wraps `lib/ai-provider.describePhoto`. Keeps OPENAI_API_KEY off the
// client. Accepts the same three source shapes as the postcard
// generator (data: URL / http(s) URL / `/`-rooted public path) so the
// "✨ Describe from hero" button in the studio can work with seed
// images and Supabase-CDN-backed heroes too, not just fresh uploads.

import { NextResponse } from "next/server";

import { describePhoto, getSpendToDateCents } from "@/lib/ai-provider";
import { AuthRequiredError, QuotaExceededError } from "@/lib/errors";

export async function POST(req: Request) {
  let body: { imageDataUrl?: string; hint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { imageDataUrl, hint } = body;
  if (typeof imageDataUrl !== "string" || !imageDataUrl) {
    return NextResponse.json(
      { error: "imageDataUrl is required" },
      { status: 400 },
    );
  }
  const validSource =
    imageDataUrl.startsWith("data:image/") ||
    imageDataUrl.startsWith("http://") ||
    imageDataUrl.startsWith("https://") ||
    imageDataUrl.startsWith("/");
  if (!validSource) {
    return NextResponse.json(
      {
        error:
          "imageDataUrl must be a data: URL, an http(s) URL, or a '/'-rooted public path",
      },
      { status: 400 },
    );
  }
  const cleanHint =
    typeof hint === "string" && hint.trim().length > 0
      ? hint.trim().slice(0, 400)
      : null;

  try {
    const result = await describePhoto(imageDataUrl, { hint: cleanHint });
    return NextResponse.json({
      ...result,
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
    const msg = err instanceof Error ? err.message : "vision call failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
