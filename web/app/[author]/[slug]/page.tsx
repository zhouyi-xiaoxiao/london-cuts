import { PublicProjectPage } from "@/components/public/public-project-page";
import { fetchPublicProjectByHandleAndSlug } from "@/lib/public-lookup";
import { getPublicProjectParams } from "@/lib/static-params";

// M1 Phase 2: allow dynamic params so user-created projects (post-Phase 3)
// get an SSR shell without rebuilding. Seeded slugs still get prerendered
// via generateStaticParams below for fast first paint.
export const dynamicParams = true;
export const revalidate = 60;

export function generateStaticParams() {
  return getPublicProjectParams();
}

export default async function Page({
  params,
}: {
  params: Promise<{ author: string; slug: string }>;
}) {
  const { author, slug } = await params;
  const payload = await fetchPublicProjectByHandleAndSlug(author, slug);
  // `isCurrent` is a client-only signal ("this is the Zustand-editable
  // project") — server-fetched data is never current.
  const initialData = payload ? { ...payload, isCurrent: false } : null;
  return (
    <PublicProjectPage
      authorHandle={author}
      slug={slug}
      initialData={initialData}
    />
  );
}
