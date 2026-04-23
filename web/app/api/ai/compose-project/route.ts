// Server-side endpoint wrapping `lib/ai-provider.composeProject`.
//
// Takes an array of per-photo descriptions (the output of
// /api/vision/describe — already generated client-side for each photo)
// and returns a grouped project structure: project-level title +
// subtitle + defaultMode, plus 3–8 stops each with assigned photo ids,
// a hero, title, mood, tone, paragraphs, pullQuote, postcardMessage.
//
// Real mode: one text-only call to gpt-4o-mini, ~$0.02 per project.
// Mock mode: deterministic "group in pairs" fallback for UI testing.
//
// M2 will add per-user daily quota at this entry point.

import { NextResponse } from "next/server";

import {
  composeProject,
  getSpendToDateCents,
  type ComposePhotoInput,
} from "@/lib/ai-provider";
import { AuthRequiredError, QuotaExceededError } from "@/lib/errors";

interface RequestBody {
  photos?: readonly ComposePhotoInput[];
}

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const photos = body.photos;
  if (!Array.isArray(photos) || photos.length === 0) {
    return NextResponse.json(
      { error: "photos array is required" },
      { status: 400 },
    );
  }
  // Cap to prevent a 500-photo payload from blowing up spend.
  if (photos.length > 40) {
    return NextResponse.json(
      { error: "max 40 photos per compose-project call" },
      { status: 400 },
    );
  }
  // Minimal shape validation — reject if description fields missing.
  for (const p of photos) {
    if (!p?.id || !p?.description) {
      return NextResponse.json(
        { error: "each photo needs {id, description}" },
        { status: 400 },
      );
    }
  }

  try {
    const result = await composeProject(photos);
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
    const msg = err instanceof Error ? err.message : "compose failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
