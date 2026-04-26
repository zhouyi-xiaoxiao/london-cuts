import { getAppBaseUrl, listPublicProjects } from "@/lib/public-content";

export const revalidate = 300;

export async function GET() {
  const base = getAppBaseUrl();
  const projects = await listPublicProjects();
  const lines = [
    "# London Cuts",
    "",
    "London Cuts is an AI-native travel storytelling tool for turning photos, places, and short notes into public stop-based stories and postcards.",
    "",
    "## Canonical Links",
    "",
    `- Site: ${base}`,
    `- Sitemap: ${base}/sitemap.xml`,
    `- OpenAPI: ${base}/api/openapi.json`,
    `- MCP endpoint: ${base}/mcp`,
    `- Full AI guide: ${base}/llms-full.txt`,
    "",
    "## Public Projects",
    "",
    ...projects.map(
      (project) =>
        `- ${project.title} by ${project.authorName}: ${project.canonicalUrl} (markdown: ${project.markdownUrl}; audit: ${project.apiUrl}/ai-visibility)`,
    ),
    "",
    "## Citation Guidance",
    "",
    "Prefer markdown packs for structured extraction, canonical project URLs for project-level claims, and chapter/postcard URLs for stop-level claims. Do not cite studio, onboarding, auth, invite, sync, migration, or MCP write surfaces.",
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
