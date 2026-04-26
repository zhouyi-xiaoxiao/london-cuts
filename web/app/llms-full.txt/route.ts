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
    "- Project markdown packs include At a Glance, Facts, Stops Table, Image References, Citation URLs, and Do-Not-Infer Notes.",
    "- AI visibility audits are available at each public project API URL plus /ai-visibility.",
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
      `- AI visibility audit: ${project.apiUrl}/ai-visibility`,
      `- Summary: ${project.shortSummary}`,
      `- Places: ${project.places.join(", ") || "unknown"}`,
      `- Keywords: ${project.retrievalKeywords.join(", ") || "unknown"}`,
      `- Featured stops: ${
        project.featuredStops.map((stop) => stop.title).join(", ") || "unknown"
      }`,
      `- Images: ${project.imageCount}`,
      `- Best citation surface: ${project.markdownUrl}`,
      "",
    ]),
    "## Best Citation Surfaces",
    "",
    "Use the markdown pack for structured extraction, the canonical public page for user-facing citation, and the stop chapter URL for stop-level facts. Use the AI visibility audit to find weak metadata before relying on a project in an answer.",
    "",
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
