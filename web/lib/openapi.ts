import { getAppBaseUrl } from "@/lib/public-content";

export function buildOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "London Cuts API",
      version: "1.0.0",
      summary: "Public discovery and authenticated AI/action API for London Cuts.",
      description:
        "Read published public travel stories and call authenticated AI/studio actions through stable agent-friendly endpoints.",
    },
    servers: [{ url: getAppBaseUrl() }],
    security: [{ bearerAuth: [] }],
    paths: {
      "/api/v1/projects": {
        get: {
          operationId: "listPublicProjects",
          summary: "List published public projects",
          security: [],
          responses: {
            "200": {
              description: "Published public project summaries",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      object: { const: "list" },
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/PublicProjectSummary" },
                      },
                    },
                    required: ["object", "data"],
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
          summary: "Fetch a public project with stops and assets",
          security: [],
          parameters: [
            { name: "handle", in: "path", required: true, schema: { type: "string" } },
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "A public project",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PublicProject" },
                },
              },
            },
            "404": { description: "Not found or not public" },
          },
        },
      },
      "/api/v1/projects/{handle}/{slug}/stops/{stop}": {
        get: {
          operationId: "getPublicStop",
          summary: "Fetch one public stop/chapter",
          security: [],
          parameters: [
            { name: "handle", in: "path", required: true, schema: { type: "string" } },
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
            { name: "stop", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "A public stop" },
            "404": { description: "Not found or not public" },
          },
        },
      },
      "/api/v1/projects/{handle}/{slug}/markdown": {
        get: {
          operationId: "getPublicProjectMarkdown",
          summary: "Fetch an AI/citation-friendly markdown project pack",
          security: [],
          parameters: [
            { name: "handle", in: "path", required: true, schema: { type: "string" } },
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Markdown citation pack",
              content: { "text/markdown": { schema: { type: "string" } } },
            },
            "404": { description: "Not found or not public" },
          },
        },
      },
      "/api/v1/projects/{handle}/{slug}/ai-visibility": {
        get: {
          operationId: "auditPublicProjectVisibility",
          summary: "Audit AI/search visibility for one public project",
          security: [],
          parameters: [
            { name: "handle", in: "path", required: true, schema: { type: "string" } },
            { name: "slug", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Deterministic AI visibility audit",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AiVisibilityAudit" },
                },
              },
            },
            "404": { description: "Not found or not public" },
          },
        },
      },
      "/api/v1/ai/describe-photo": {
        post: {
          operationId: "describePhoto",
          summary: "Describe one photo for project creation",
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
                  },
                  required: ["imageDataUrl"],
                },
              },
            },
          },
          responses: {
            "200": { description: "Vision description" },
            "401": { description: "Missing session or API token" },
            "403": { description: "Missing ai:run scope or onboarding" },
            "429": { description: "Quota exceeded" },
          },
        },
      },
      "/api/v1/ai/compose-project": {
        post: {
          operationId: "composeProject",
          summary: "Group described photos into a draft project",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Draft project outline" } },
        },
      },
      "/api/v1/ai/generate-postcard": {
        post: {
          operationId: "generatePostcard",
          summary: "Generate a postcard image from a source photo",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Generated postcard image" } },
        },
      },
      "/api/v1/projects/sync": {
        post: {
          operationId: "syncProject",
          summary: "Sync an authenticated project payload to Supabase",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Project sync result" } },
        },
      },
      "/mcp": {
        post: {
          operationId: "mcpJsonRpc",
          summary: "London Cuts MCP JSON-RPC endpoint",
          description:
            "Implements initialize, tools/list, tools/call, resources/list, resources/read, prompts/list, and prompts/get.",
          responses: { "200": { description: "JSON-RPC response" } },
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
