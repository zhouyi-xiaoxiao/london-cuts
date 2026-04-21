import { ChapterPage } from "@/components/public/chapter-page";
import { getPublicStopParams } from "@/lib/static-params";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublicStopParams();
}

export default async function Page({
  params,
}: {
  params: Promise<{ author: string; slug: string; stop: string }>;
}) {
  const { author, slug, stop } = await params;
  return <ChapterPage authorHandle={author} slug={slug} stopSlug={stop} />;
}
