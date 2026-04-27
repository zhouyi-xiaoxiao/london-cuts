import { getAppBaseUrl, listPublicProjects } from "@/lib/public-content";
import { resolveLocaleFromRequest } from "@/lib/i18n";

export const revalidate = 300;

export async function GET(req: Request) {
  const locale = resolveLocaleFromRequest(req);
  const zh = locale === "zh";
  const base = getAppBaseUrl();
  const projects = await listPublicProjects(locale);
  const lines = [
    zh ? "# London Cuts（伦敦剪影）" : "# London Cuts",
    "",
    zh
      ? "London Cuts 是一个 AI-native 旅行叙事工具，把照片、地点和短笔记整理成按站点组织的公开故事与明信片。"
      : "London Cuts is an AI-native travel storytelling tool for turning photos, places, and short notes into public stop-based stories and postcards.",
    "",
    zh ? "## 规范链接" : "## Canonical Links",
    "",
    `- ${zh ? "站点" : "Site"}: ${base}`,
    `- Sitemap: ${base}/sitemap.xml`,
    `- OpenAPI: ${base}/api/openapi.json${zh ? "?lang=zh" : ""}`,
    `- MCP endpoint: ${base}/mcp${zh ? "?lang=zh" : ""}`,
    `- ${zh ? "完整 AI 指南" : "Full AI guide"}: ${base}/llms-full.txt${zh ? "?lang=zh" : ""}`,
    "",
    zh ? "## 公开项目" : "## Public Projects",
    "",
    ...projects.map(
      (project) =>
        zh
          ? `- ${project.title}，作者 ${project.authorName}: ${project.canonicalUrl}（markdown: ${project.markdownUrl}; audit: ${project.apiUrl}/ai-visibility?lang=zh）`
          : `- ${project.title} by ${project.authorName}: ${project.canonicalUrl} (markdown: ${project.markdownUrl}; audit: ${project.apiUrl}/ai-visibility)`,
    ),
    "",
    zh ? "## 引用建议" : "## Citation Guidance",
    "",
    zh
      ? "结构化抽取优先使用 markdown packs；项目级陈述引用 canonical project URLs；站点级陈述引用 chapter/postcard URLs。不要引用 studio、onboarding、auth、invite、sync、migration 或 MCP write surfaces。"
      : "Prefer markdown packs for structured extraction, canonical project URLs for project-level claims, and chapter/postcard URLs for stop-level claims. Do not cite studio, onboarding, auth, invite, sync, migration, or MCP write surfaces.",
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
