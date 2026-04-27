"use client";

// F-T009 — public postcard reader view.
//
// Full-screen flip card (PostcardCard) rendering the current stop's
// postcard. The front uses the stored `frontAssetId` (the latest AI
// variant picked in the studio); the back uses the stop's recipient +
// message, rendered in readOnly mode so no inputs appear.
//
// Reader actions: flip, download front PNG, download back PNG, and
// export a 2-page PDF. All exports reuse the existing lib/export/*
// utilities — no new logic here, just prominent buttons.

import Link from "next/link";
import { useRef, useState } from "react";

import { LanguageSwitcher, useT } from "@/components/i18n-provider";
import { ModeSwitcher } from "@/components/mode-switcher";
import { PostcardBack } from "@/components/postcard/postcard-back";
import {
  PostcardCard,
  type PostcardCardHandle,
} from "@/components/postcard/postcard-card";
import { PostcardFront } from "@/components/postcard/postcard-front";
import { exportPostcardPdf } from "@/lib/export/pdf";
import {
  exportNodeToPng,
  suggestPostcardFilename,
} from "@/lib/export/png";
import type { Asset, Postcard } from "@/stores/types";

import { NotFoundCard } from "./not-found-card";
import {
  findStopBySlug,
  stopSlugFrom,
  usePublicProjectLookup,
  type PublicProjectLookup,
} from "./use-public-project";

export interface PostcardPageProps {
  authorHandle: string;
  slug: string;
  stopSlug: string;
  initialData?: PublicProjectLookup | null;
}

export function PostcardPage({
  authorHandle,
  slug,
  stopSlug,
  initialData,
}: PostcardPageProps) {
  // M1 Phase 2: prefer server-fetched initialData; local Zustand as fallback.
  const localLookup = usePublicProjectLookup(authorHandle, slug);
  const lookup = initialData ?? localLookup;
  const cardRef = useRef<PostcardCardHandle>(null);
  const t = useT();
  const [busy, setBusy] = useState<"png-front" | "png-back" | "pdf" | null>(
    null,
  );
  const [err, setErr] = useState<string | null>(null);

  if (!lookup) {
    return (
      <NotFoundCard what="This postcard" hint={`slug=${slug}`} />
    );
  }

  const { project, stops, assets } = lookup;
  const stop = findStopBySlug(stops, stopSlug);
  if (!stop) {
    return (
      <NotFoundCard
        what="This postcard"
        hint={`project=${slug} · stop=${stopSlug}`}
      />
    );
  }

  // Capture narrowed non-null references so arrow-function closures below
  // don't lose the narrow across function boundaries (TS 18048).
  const stopN = stop.n;
  const stopMessage = stop.postcard.message;
  const stopRecipient = stop.postcard.recipient;
  const frontAssetId = stop.postcard.frontAssetId ?? null;
  const frontAsset: Asset | null = frontAssetId
    ? assets.find((a) => a.id === frontAssetId) ?? null
    : null;
  const frontUrl = frontAsset?.imageUrl ?? null;
  const styleLabel = frontAsset?.styleLabel ?? null;
  const orientation = stop.postcard.orientation ?? "landscape";

  const onDownloadPng = async (side: "front" | "back") => {
    const node =
      side === "front"
        ? cardRef.current?.frontNode()
        : cardRef.current?.backNode();
    if (!node) return;
    setBusy(side === "front" ? "png-front" : "png-back");
    setErr(null);
    try {
      const filename = suggestPostcardFilename(project.slug, stopN, side);
      await exportNodeToPng(node, filename);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "PNG export failed");
    } finally {
      setBusy(null);
    }
  };

  const onDownloadPdf = async () => {
    if (!frontUrl) {
      setErr(t("public.noPostcardFront"));
      return;
    }
    setBusy("pdf");
    setErr(null);
    try {
      await exportPostcardPdf({
        frontImageUrl: frontUrl,
        backMessage: stopMessage,
        recipient: stopRecipient,
        orientation,
        filename: `${project.slug}_${stopN}_postcard.pdf`,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main
      style={{ minHeight: "100vh", background: "var(--mode-bg, var(--paper))" }}
    >
      {/* Top bar — back to chapter + mode switcher + exports */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "var(--mode-bg, var(--paper))",
          borderBottom:
            "1px solid color-mix(in oklab, currentColor 15%, transparent)",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "14px clamp(20px, 6vw, 40px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Link
            href={`/${authorHandle}/${project.slug}/chapter/${stopSlugFrom(stop.title)}`}
            style={{
              fontFamily: "var(--mode-display-font, var(--f-serif, serif))",
              fontStyle: "var(--mode-italic, italic)",
              fontSize: 20,
              textDecoration: "none",
              color: "inherit",
              display: "inline-flex",
              alignItems: "center",
              minHeight: 40,
            }}
          >
            ← {t("public.backToChapter")}
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onDownloadPng("front")}
              disabled={!frontUrl || busy !== null}
              title="Download front (PNG, 2x pixel density)"
            >
              {busy === "png-front" ? t("public.exporting") : `↓ ${t("public.pngFront")}`}
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onDownloadPng("back")}
              disabled={busy !== null}
              title="Download back (PNG, 2x pixel density)"
            >
              {busy === "png-back" ? t("public.exporting") : `↓ ${t("public.pngBack")}`}
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={onDownloadPdf}
              disabled={!frontUrl || busy !== null}
              title="Download 2-page PDF (front + back)"
            >
              {busy === "pdf" ? t("public.exporting") : `↓ ${t("public.pdf")}`}
            </button>
            <LanguageSwitcher compact />
            <ModeSwitcher />
          </div>
        </div>
      </header>

      {/* Card stage */}
      <section
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding:
            "clamp(36px, 9vw, 56px) clamp(20px, 6vw, 40px) 80px",
        }}
      >
        <div
          className="eyebrow"
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.7,
            marginBottom: 12,
          }}
        >
          {t("public.postcard")} · {t("public.stop")} {stop.n} · {project.title}
        </div>
        <h1
          style={{
            fontFamily: "var(--mode-display-font, var(--f-serif, serif))",
            fontSize: "clamp(32px, 5vw, 52px)",
            lineHeight: 1.02,
            margin: "0 0 36px",
            overflowWrap: "break-word",
          }}
        >
          {stop.title}
        </h1>

        <PostcardCard
          ref={cardRef}
          orientation={orientation}
          front={
            <PostcardFront
              imageUrl={frontUrl}
              stopNumber={stop.n}
              totalStops={stops.length}
              styleLabel={styleLabel}
            />
          }
          back={
            <PostcardBack
              postcard={stop.postcard as Postcard}
              onUpdate={noop}
              readOnly
            />
          }
        />

        {err && (
          <div
            role="alert"
            className="mono-sm"
            style={{
              marginTop: 20,
              padding: "10px 14px",
              border: "1px solid var(--mode-accent)",
              color: "var(--mode-accent)",
              fontSize: 12,
            }}
          >
            {err}
          </div>
        )}
      </section>
    </main>
  );
}

// PostcardBack.onUpdate is required even in readOnly mode; supply a
// no-op so the contract stays intact without rewiring the prop to
// optional (which would widen the type for the studio editor too).
function noop() {
  /* read-only: no writes */
}
