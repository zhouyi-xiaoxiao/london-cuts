// Server-side endpoint for GPT-4o vision description.
// Wraps `lib/ai-provider.describePhoto`. Keeps OPENAI_API_KEY off the client.

import { NextResponse } from "next/server";

import { describePhoto, getSpendToDateCents } from "@/lib/ai-provider";
import { AuthRequiredError, QuotaExceededError } from "@/lib/errors";

export async function POST(req: Request) {
  let body: { imageDataUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { imageDataUrl } = body;
  if (
    typeof imageDataUrl !== "string" ||
    !imageDataUrl.startsWith("data:image/")
  ) {
    return NextResponse.json(
      { error: "imageDataUrl must be a base64 image data URL" },
      { status: 400 },
    );
  }

  try {
    const result = await describePhoto(imageDataUrl);
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
