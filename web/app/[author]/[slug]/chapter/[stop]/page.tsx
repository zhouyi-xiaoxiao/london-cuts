import type { Metadata } from "next";
import { headers } from "next/headers";

import { ChapterPage } from "@/components/public/chapter-page";
import {
  getPublicStop,
  publicProjectToRuntimeLookup,
  stopJsonLd,
  stopMetadata,
} from "@/lib/public-content";
import { fetchPublicProjectByHandleAndSlug } from "@/lib/public-lookup";
import { getPublicStopParams } from "@/lib/static-params";
import { resolveLocaleFromHeaders } from "@/lib/i18n";

export const dynamicParams = true;
export const revalidate = 60;

export function generateStaticParams() {
  return getPublicStopParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ author: string; slug: string; stop: string }>;
}): Promise<Metadata> {
  const { author, slug, stop } = await params;
  const locale = resolveLocaleFromHeaders(await headers());
  const result = await getPublicStop(author, slug, stop, locale);
  return result
    ? stopMetadata(result.project, result.stop, "chapter")
    : { title: "Public chapter not found | London Cuts" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ author: string; slug: string; stop: string }>;
}) {
  const { author, slug, stop } = await params;
  const locale = resolveLocaleFromHeaders(await headers());
  const payload = await fetchPublicProjectByHandleAndSlug(author, slug);
  const publicStop = await getPublicStop(author, slug, stop, locale);
  const initialData = publicStop
    ? publicProjectToRuntimeLookup(publicStop.project)
    : payload
      ? { ...payload, isCurrent: false }
      : null;
  return (
    <>
      {publicStop ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              stopJsonLd(publicStop.project, publicStop.stop),
            ),
          }}
        />
      ) : null}
      <ChapterPage
        authorHandle={author}
        slug={slug}
        stopSlug={stop}
        initialData={initialData}
      />
    </>
  );
}
