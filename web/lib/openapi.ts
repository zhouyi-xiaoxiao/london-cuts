import { getAppBaseUrl } from "@/lib/public-content";
import type { Locale } from "@/lib/i18n";

export function buildOpenApiDocument(locale: Locale = "en") {
  const zh = locale === "zh";
  const localeParameter = {
    name: "lang",
    in: "query",
    required: false,
    schema: { type: "string", enum: ["en", "zh"] },
    description: zh
      ? "响应语言。优先级高于 cookie 和 Accept-Language。"
      : "Response locale. Takes precedence over cookie and Accept-Language.",
  };
  return {
    openapi: "3.1.0",
    info: {
      title: "London Cuts API",
      version: "1.0.0",
      summary: zh
        ? "London Cuts 的公开发现与认证 AI/action API。"
        : "Public discovery and authenticated AI/action API for London Cuts.",
      description:
        zh
          ? "通过稳定、agent 友好的端点读取已发布的公开旅行故事，并调用需要认证的 AI/创作室动作。"
          : "Read published public travel stories and call authenticated AI/studio actions through stable agent-friendly endpoints.",
    },
    servers: [{ url: getAppBaseUrl() }],
    security: [{ bearerAuth: [] }],
    paths: {
      "/api/v1/projects": {
        get: {
          operationId: "listPublicProjects",
          summary: zh ? "列出已发布的公开项目" : "List published public projects",
          security: [],
          parameters: [localeParameter],
          responses: {
            "200": {
              description: zh ? "已发布公开项目摘要" : "Published public project summaries",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      object: { const: "list" },
                      locale: { type: "string", enum: ["en", "zh"] },
                      availableLocales: {
                        type: "array",
                        items: { type: "string", enum: ["en", "zh"] },
                      },
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/PublicProjectSummary" },
                      },
                    },
                    required: ["object", "locale", "availableLocales", "data"],
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/projects/{handle}/{slug}": {
        get: {
          operationId: "getPublicProject",
          summary: zh ? "获取包含站点和资产的公开项目" : "Fetch a public project with stops and assets",
          security: [],
          parameters: [
            { name: "handle", in: "path", required: true, schema: { type: "string" } },
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
            localeParameter,
          ],
          responses: {
            "200": {
              description: zh ? "一个公开项目" : "A public project",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PublicProject" },
                },
              },
            },
            "404": { description: zh ? "未找到或不是公开内容" : "Not found or not public" },
          },
        },
      },
      "/api/v1/projects/{handle}/{slug}/stops/{stop}": {
        get: {
          operationId: "getPublicStop",
          summary: zh ? "获取一个公开站点/章节" : "Fetch one public stop/chapter",
          security: [],
          parameters: [
            { name: "handle", in: "path", required: true, schema: { type: "string" } },
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
            { name: "stop", in: "path", required: true, schema: { type: "string" } },
            localeParameter,
          ],
          responses: {
            "200": { description: zh ? "一个公开站点" : "A public stop" },
            "404": { description: zh ? "未找到或不是公开内容" : "Not found or not public" },
          },
        },
      },
      "/api/v1/projects/{handle}/{slug}/markdown": {
        get: {
          operationId: "getPublicProjectMarkdown",
          summary: zh ? "获取适合 AI/引用的 Markdown 项目包" : "Fetch an AI/citation-friendly markdown project pack",
          security: [],
          parameters: [
            { name: "handle", in: "path", required: true, schema: { type: "string" } },
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
            localeParameter,
          ],
          responses: {
            "200": {
              description: zh ? "Markdown 引用包" : "Markdown citation pack",
              content: { "text/markdown": { schema: { type: "string" } } },
            },
            "404": { description: zh ? "未找到或不是公开内容" : "Not found or not public" },
          },
        },
      },
      "/api/v1/projects/{handle}/{slug}/ai-visibility": {
        get: {
          operationId: "auditPublicProjectVisibility",
          summary: zh ? "审计一个公开项目的 AI/搜索可见性" : "Audit AI/search visibility for one public project",
          security: [],
          parameters: [
            { name: "handle", in: "path", required: true, schema: { type: "string" } },
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
            localeParameter,
          ],
          responses: {
            "200": {
              description: zh ? "确定性的 AI 可见性审计" : "Deterministic AI visibility audit",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AiVisibilityAudit" },
                },
              },
            },
            "404": { description: zh ? "未找到或不是公开内容" : "Not found or not public" },
          },
        },
      },
      "/api/v1/ai/describe-photo": {
        post: {
          operationId: "describePhoto",
          summary: zh ? "为创建项目描述一张照片" : "Describe one photo for project creation",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    imageDataUrl: { type: "string" },
                    hint: { type: "string" },
                    locale: { type: "string", enum: ["en", "zh"] },
                    outputLocale: { type: "string", enum: ["en", "zh"] },
                  },
                  required: ["imageDataUrl"],
                },
              },
            },
          },
          responses: {
            "200": { description: zh ? "视觉描述" : "Vision description" },
            "401": { description: zh ? "缺少会话或 API token" : "Missing session or API token" },
            "403": { description: zh ? "缺少 ai:run scope 或未完成 onboarding" : "Missing ai:run scope or onboarding" },
            "429": { description: zh ? "额度已用尽" : "Quota exceeded" },
          },
        },
      },
      "/api/v1/ai/compose-project": {
        post: {
          operationId: "composeProject",
          summary: zh ? "把已描述照片组合成项目草稿" : "Group described photos into a draft project",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    photos: { type: "array", items: { type: "object" } },
                    locale: { type: "string", enum: ["en", "zh"] },
                    outputLocale: { type: "string", enum: ["en", "zh"] },
                  },
                  required: ["photos"],
                },
              },
            },
          },
          responses: { "200": { description: zh ? "项目草稿大纲" : "Draft project outline" } },
        },
      },
      "/api/v1/ai/generate-postcard": {
        post: {
          operationId: "generatePostcard",
          summary: zh ? "从源照片生成明信片图片" : "Generate a postcard image from a source photo",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: zh ? "生成的明信片图片" : "Generated postcard image" } },
        },
      },
      "/api/v1/projects/sync": {
        post: {
          operationId: "syncProject",
          summary: zh ? "把认证项目 payload 同步到 Supabase" : "Sync an authenticated project payload to Supabase",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: zh ? "项目同步结果" : "Project sync result" } },
        },
      },
      "/mcp": {
        post: {
          operationId: "mcpJsonRpc",
          summary: zh ? "London Cuts MCP JSON-RPC 端点" : "London Cuts MCP JSON-RPC endpoint",
          description:
            zh
              ? "实现 initialize、tools/list、tools/call、resources/list、resources/read、prompts/list 和 prompts/get。"
              : "Implements initialize, tools/list, tools/call, resources/list, resources/read, prompts/list, and prompts/get.",
          parameters: [localeParameter],
          responses: { "200": { description: zh ? "JSON-RPC 响应" : "JSON-RPC response" } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description:
            "Use a London Cuts personal access token with prefix lc_pat_ or an existing browser session cookie.",
        },
      },
      schemas: {
        PublicProjectSummary: {
          type: "object",
          properties: {
            id: { type: "string" },
            handle: { type: "string" },
            slug: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            canonicalUrl: { type: "string", format: "uri" },
            apiUrl: { type: "string", format: "uri" },
            markdownUrl: { type: "string", format: "uri" },
            stopCount: { type: "integer" },
            shortSummary: { type: "string" },
            retrievalKeywords: { type: "array", items: { type: "string" } },
            featuredStops: {
              type: "array",
              items: { $ref: "#/components/schemas/PublicFeaturedStop" },
            },
            places: { type: "array", items: { type: "string" } },
            imageCount: { type: "integer" },
            locale: { type: "string", enum: ["en", "zh"] },
            availableLocales: { type: "array", items: { type: "string", enum: ["en", "zh"] } },
            alternateUrls: {
              type: "object",
              properties: {
                en: { type: "string", format: "uri" },
                zh: { type: "string", format: "uri" },
              },
              required: ["en", "zh"],
            },
            translationStatus: { type: "string", enum: ["source", "translated", "fallback"] },
            citationGuidance: {
              type: "object",
              properties: {
                project: { type: "string" },
                markdown: { type: "string" },
                stops: { type: "array", items: { type: "string" } },
                doNotInfer: { type: "array", items: { type: "string" } },
              },
              required: ["project", "markdown", "stops", "doNotInfer"],
            },
          },
          required: [
            "id",
            "handle",
            "slug",
            "title",
            "description",
            "canonicalUrl",
            "apiUrl",
            "markdownUrl",
            "stopCount",
            "shortSummary",
            "retrievalKeywords",
            "featuredStops",
            "places",
            "imageCount",
            "locale",
            "availableLocales",
            "alternateUrls",
            "translationStatus",
            "citationGuidance",
          ],
        },
        PublicFeaturedStop: {
          type: "object",
          properties: {
            n: { type: "string" },
            title: { type: "string" },
            slug: { type: "string" },
            mood: { type: "string" },
            location: { type: "string" },
            canonicalUrl: { type: "string", format: "uri" },
            heroImageUrl: { type: ["string", "null"], format: "uri" },
          },
          required: [
            "n",
            "title",
            "slug",
            "mood",
            "location",
            "canonicalUrl",
            "heroImageUrl",
          ],
        },
        PublicProject: {
          allOf: [
            { $ref: "#/components/schemas/PublicProjectSummary" },
            {
              type: "object",
              properties: {
                stops: {
                  type: "array",
                  items: { $ref: "#/components/schemas/PublicStop" },
                },
                assets: { type: "array", items: { type: "object" } },
                markdown: { type: "string" },
              },
              required: ["stops", "assets", "markdown"],
            },
          ],
        },
        PublicStop: {
          type: "object",
          properties: {
            n: { type: "string" },
            slug: { type: "string" },
            title: { type: "string" },
            bodyText: { type: "string" },
            canonicalUrl: { type: "string", format: "uri" },
            heroImageUrl: { type: ["string", "null"], format: "uri" },
          },
          required: ["n", "slug", "title", "bodyText", "canonicalUrl"],
        },
        AiVisibilityAudit: {
          type: "object",
          properties: {
            object: { const: "ai_visibility_audit" },
            locale: { type: "string", enum: ["en", "zh"] },
            generatedAt: { type: "string", format: "date-time" },
            score: { type: "integer", minimum: 0, maximum: 100 },
            project: {
              type: "object",
              properties: {
                handle: { type: "string" },
                slug: { type: "string" },
                title: { type: "string" },
                canonicalUrl: { type: "string", format: "uri" },
                markdownUrl: { type: "string", format: "uri" },
                apiUrl: { type: "string", format: "uri" },
              },
              required: [
                "handle",
                "slug",
                "title",
                "canonicalUrl",
                "markdownUrl",
                "apiUrl",
              ],
            },
            suggestedQueries: { type: "array", items: { type: "string" } },
            answerCards: { type: "array", items: { type: "object" } },
            missingMetadata: { type: "array", items: { type: "string" } },
            weakCitations: { type: "array", items: { type: "string" } },
            imageAltGaps: { type: "array", items: { type: "string" } },
            issues: { type: "array", items: { type: "object" } },
            strengths: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "object" } },
          },
          required: [
            "object",
            "locale",
            "generatedAt",
            "score",
            "project",
            "suggestedQueries",
            "answerCards",
            "missingMetadata",
            "weakCitations",
            "imageAltGaps",
            "issues",
            "strengths",
            "recommendations",
          ],
        },
      },
    },
  };
}
