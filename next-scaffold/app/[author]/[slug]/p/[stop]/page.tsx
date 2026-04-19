import { PostcardPage } from "@/components/public-pages";

export default async function Page({
  params,
}: {
  params: Promise<{ author: string; slug: string; stop: string }>;
}) {
  const { author, slug, stop } = await params;
  return <PostcardPage authorHandle={author} slug={slug} stopSlug={stop} />;
}
