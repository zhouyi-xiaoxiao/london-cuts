import type { Metadata } from "next";

import { PublicProjectPage } from "@/components/public/public-project-page";
import {
  getPublicProject,
  projectJsonLd,
  projectMetadata,
} from "@/lib/public-content";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ author: string; slug: string }>;
}): Promise<Metadata> {
  const { author, slug } = await params;
  const project = await getPublicProject(author, slug);
  return project
    ? projectMetadata(project)
    : {
        title: "Public project not found | London Cuts",
      };
}

export default async function Page({
  params,
}: {
  params: Promise<{ author: string; slug: string }>;
}) {
  const { author, slug } = await params;
  const payload = await fetchPublicProjectByHandleAndSlug(author, slug);
  const publicProject = await getPublicProject(author, slug);
  // `isCurrent` is a client-only signal ("this is the Zustand-editable
  // project") — server-fetched data is never current.
  const initialData = payload ? { ...payload, isCurrent: false } : null;
  return (
    <>
      {publicProject ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(projectJsonLd(publicProject)),
          }}
        />
      ) : null}
      <PublicProjectPage
        authorHandle={author}
        slug={slug}
        initialData={initialData}
      />
    </>
  );
}
