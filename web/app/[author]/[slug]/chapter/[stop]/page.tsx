import { ChapterPage } from "@/components/public/chapter-page";
import { fetchPublicProjectByHandleAndSlug } from "@/lib/public-lookup";
import { getPublicStopParams } from "@/lib/static-params";

export const dynamicParams = true;
export const revalidate = 60;

export function generateStaticParams() {
  return getPublicStopParams();
}

export default async function Page({
  params,
}: {
  params: Promise<{ author: string; slug: string; stop: string }>;
}) {
  const { author, slug, stop } = await params;
  const payload = await fetchPublicProjectByHandleAndSlug(author, slug);
  const initialData = payload ? { ...payload, isCurrent: false } : null;
  return (
    <ChapterPage
      authorHandle={author}
      slug={slug}
      stopSlug={stop}
      initialData={initialData}
    />
  );
}
