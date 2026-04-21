import { Workspace } from "@/components/studio/workspace";
import { getStudioProjectParams } from "@/lib/static-params";

export const dynamicParams = true;

export function generateStaticParams() {
  return getStudioProjectParams();
}

export default function Page() {
  // The projectId is captured by the URL but, in M-fast, the workspace
  // only mutates the CURRENT project in the store. Navigating to this
  // URL when the current project id doesn't match is handled by
  // restoreProject() in the dashboard before routing here.
  return <Workspace />;
}
