// Server-side endpoint for the "✨ Polish prose" button (F-I029).
//
// Receives the current body blocks + a light stop context, sends the
// paragraph / pullQuote content to gpt-4o-mini for a conservative polish
// (smooth transitions, keep voice, no new facts), returns blocks with
// the SAME shape + length — only polished `content` strings.
//
// The name is `/api/ai/layout-stop` (not `polish-stop`) because the
// deferred doc reserved this URL for both the (deferred) LLM-driven
// full layout and this lighter polish; we only ship polish now.
//
// Mock mode prepends "[POLISHED MOCK] " to paragraphs so UI state
// transitions are still testable without burning credits.

import { NextResponse } from "next/server";

import {
  polishStopBlocks,
  getSpendToDateCents,
  type PolishStopInput,
} from "@/lib/ai-provider";
import { gateApiRequest } from "@/lib/api-auth";
import { AuthRequiredError, QuotaExceededError } from "@/lib/errors";
import { normalizeLocale, resolveLocaleFromRequest } from "@/lib/i18n";

interface RequestBody {
  userId?: string;
  blocks?: unknown;
  context?: {
    title?: string | null;
    mood?: string | null;
    tone?: "warm" | "cool" | "punk" | null;
    locale?: string | null;
  };
  locale?: string;
  outputLocale?: string;
}

export async function POST(req: Request) {
  const gate = await gateApiRequest(req, "ai:run");
  if (!gate.allowed) return gate.response;

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (typeof body.userId !== "string" || !body.userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 },
    );
  }
  if (!Array.isArray(body.blocks)) {
    return NextResponse.json(
      { error: "blocks[] is required" },
      { status: 400 },
    );
  }
  if (body.blocks.length > 40) {
    return NextResponse.json(
      { error: "max 40 blocks per polish call" },
      { status: 400 },
    );
  }

  const input: PolishStopInput = {
    userId: body.userId,
    blocks: body.blocks as PolishStopInput["blocks"],
    context: {
      title: body.context?.title ?? null,
      mood: body.context?.mood ?? null,
      tone: body.context?.tone ?? null,
      locale:
        normalizeLocale(body.outputLocale) ??
        normalizeLocale(body.locale) ??
        normalizeLocale(body.context?.locale) ??
        resolveLocaleFromRequest(req),
    },
  };

  try {
    const result = await polishStopBlocks(input);
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
    const msg = err instanceof Error ? err.message : "polish failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
