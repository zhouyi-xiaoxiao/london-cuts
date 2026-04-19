import { EditorPage } from "@/components/studio-pages";
import { getStudioProjectParams } from "@/lib/static-params";

export const dynamicParams = false;

export function generateStaticParams() {
  return getStudioProjectParams();
}

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <EditorPage projectId={projectId} />;
}
