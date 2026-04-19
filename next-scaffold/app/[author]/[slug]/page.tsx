import { PublicProjectPage } from "@/components/public-pages";
import { getPublicProjectParams } from "@/lib/static-params";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublicProjectParams();
}

export default async function Page({
  params,
}: {
  params: Promise<{ author: string; slug: string }>;
}) {
  const { author, slug } = await params;
  return <PublicProjectPage authorHandle={author} slug={slug} />;
}
