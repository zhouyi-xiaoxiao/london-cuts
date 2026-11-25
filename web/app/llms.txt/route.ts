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
      ? "London Cuts 是一个能用的原型（不是已上线的产品），把一次围绕单一地点的旅行整理成由照片、短文、地图和 AI 明信片组成的按站点故事。工作室只对受邀用户开放。"
      : "London Cuts is a working prototype (not a launched product) for turning a single-location trip into a stop-based story with photos, short texts, maps and AI-made postcards. The studio is invite-only.",
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
