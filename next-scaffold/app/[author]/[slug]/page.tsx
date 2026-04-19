import { PublicProjectPage } from "@/components/public-pages";

export default async function Page({
  params,
}: {
  params: Promise<{ author: string; slug: string }>;
}) {
  const { author, slug } = await params;
  return <PublicProjectPage authorHandle={author} slug={slug} />;
}
