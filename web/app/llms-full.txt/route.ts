import { getAppBaseUrl, listPublicProjects } from "@/lib/public-content";

export const revalidate = 300;

export async function GET() {
  const base = getAppBaseUrl();
  const projects = await listPublicProjects();
  const lines = [
    "# London Cuts AI and Agent Guide",
    "",
    "## Product",
    "",
    "London Cuts is a public-beta creator tool for documenting a single-location trip with photos, written story stops, maps, AI-generated postcards, and shareable public reader pages.",
    "",
    "## Read Surfaces",
    "",
    `- Public project list API: ${base}/api/v1/projects`,
    `- OpenAPI: ${base}/api/openapi.json`,
    `- MCP: ${base}/mcp`,
    `- Sitemap: ${base}/sitemap.xml`,
    "",
    "## Authenticated Agent Actions",
    "",
    "Authenticated AI/write actions require a London Cuts browser session or a Bearer token with prefix lc_pat_. Scopes are public:read, ai:run, and project:write. Public read endpoints do not require auth.",
    "",
    "## Public Project Index",
    "",
    ...projects.flatMap((project) => [
      `### ${project.title}`,
      "",
      `- Author: ${project.authorName} (@${project.handle})`,
      `- Canonical: ${project.canonicalUrl}`,
      `- API: ${project.apiUrl}`,
      `- Markdown: ${project.markdownUrl}`,
      `- Description: ${project.description}`,
      "",
    ]),
    "## Safety",
    "",
    "Do not request or reveal API keys, service-role keys, invite codes, magic links, emails, private drafts, or studio-only state. Use public DTOs and markdown packs for citation.",
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
