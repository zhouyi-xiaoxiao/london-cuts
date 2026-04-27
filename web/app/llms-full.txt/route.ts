import { getAppBaseUrl, listPublicProjects } from "@/lib/public-content";
import { resolveLocaleFromRequest } from "@/lib/i18n";

export const revalidate = 300;

export async function GET(req: Request) {
  const locale = resolveLocaleFromRequest(req);
  const zh = locale === "zh";
  const base = getAppBaseUrl();
  const projects = await listPublicProjects(locale);
  const lines = [
    zh ? "# London Cuts AI 与 Agent 指南" : "# London Cuts AI and Agent Guide",
    "",
    zh ? "## 产品" : "## Product",
    "",
    zh
      ? "London Cuts 是公开 beta 创作者工具，用照片、文字站点、地图、AI 生成明信片和可分享 public reader 页面记录一次围绕地点展开的旅行。"
      : "London Cuts is a public-beta creator tool for documenting a single-location trip with photos, written story stops, maps, AI-generated postcards, and shareable public reader pages.",
    "",
    zh ? "## 读取入口" : "## Read Surfaces",
    "",
    `- Public project list API: ${base}/api/v1/projects${zh ? "?lang=zh" : ""}`,
    `- OpenAPI: ${base}/api/openapi.json${zh ? "?lang=zh" : ""}`,
    `- MCP: ${base}/mcp${zh ? "?lang=zh" : ""}`,
    `- Sitemap: ${base}/sitemap.xml`,
    zh
      ? "- 项目 markdown packs 包含概览、事实、站点表、图片引用、引用 URL 和不要推断说明。"
      : "- Project markdown packs include At a Glance, Facts, Stops Table, Image References, Citation URLs, and Do-Not-Infer Notes.",
    zh
      ? "- 每个公开项目 API URL 后加 /ai-visibility 可获得 AI 可见性审计。"
      : "- AI visibility audits are available at each public project API URL plus /ai-visibility.",
    "",
    zh ? "## 认证 Agent 动作" : "## Authenticated Agent Actions",
    "",
    zh
      ? "认证 AI/write 动作需要 London Cuts 浏览器会话，或前缀为 lc_pat_ 的 Bearer token。Scopes 为 public:read、ai:run、project:write。公开读取端点不需要认证。"
      : "Authenticated AI/write actions require a London Cuts browser session or a Bearer token with prefix lc_pat_. Scopes are public:read, ai:run, and project:write. Public read endpoints do not require auth.",
    "",
    zh ? "## 公开项目索引" : "## Public Project Index",
    "",
    ...projects.flatMap((project) => [
      `### ${project.title}`,
      "",
      `- ${zh ? "作者" : "Author"}: ${project.authorName} (@${project.handle})`,
      `- Canonical: ${project.canonicalUrl}`,
      `- API: ${project.apiUrl}`,
      `- Markdown: ${project.markdownUrl}`,
      `- AI visibility audit: ${project.apiUrl}/ai-visibility${zh ? "?lang=zh" : ""}`,
      `- ${zh ? "摘要" : "Summary"}: ${project.shortSummary}`,
      `- ${zh ? "地点" : "Places"}: ${project.places.join(", ") || (zh ? "未知" : "unknown")}`,
      `- ${zh ? "关键词" : "Keywords"}: ${project.retrievalKeywords.join(", ") || (zh ? "未知" : "unknown")}`,
      `- ${zh ? "Featured stops" : "Featured stops"}: ${
        project.featuredStops.map((stop) => stop.title).join(", ") ||
        (zh ? "未知" : "unknown")
      }`,
      `- ${zh ? "图片数" : "Images"}: ${project.imageCount}`,
      `- ${zh ? "最佳引用入口" : "Best citation surface"}: ${project.markdownUrl}`,
      "",
    ]),
    zh ? "## 最佳引用入口" : "## Best Citation Surfaces",
    "",
    zh
      ? "结构化抽取使用 markdown pack；面向用户的引用使用 canonical public page；站点级事实使用 stop chapter URL。回答中依赖项目之前，可先用 AI visibility audit 找出薄弱 metadata。"
      : "Use the markdown pack for structured extraction, the canonical public page for user-facing citation, and the stop chapter URL for stop-level facts. Use the AI visibility audit to find weak metadata before relying on a project in an answer.",
    "",
    zh ? "## 安全边界" : "## Safety",
    "",
    zh
      ? "不要请求或泄露 API keys、service-role keys、invite codes、magic links、emails、private drafts 或 studio-only state。引用请使用 public DTOs 和 markdown packs。"
      : "Do not request or reveal API keys, service-role keys, invite codes, magic links, emails, private drafts, or studio-only state. Use public DTOs and markdown packs for citation.",
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
