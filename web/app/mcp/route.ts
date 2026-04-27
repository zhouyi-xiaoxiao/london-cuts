import { NextResponse } from "next/server";

import {
  AgentAuthError,
  requireAgentAccess,
  type AgentScope,
} from "@/lib/agent-auth";
import { auditPublicProjectVisibility } from "@/lib/ai-visibility";
import {
  getAppBaseUrl,
  getPublicProject,
  getPublicStop,
  listPublicProjects,
  normalizeHandle,
} from "@/lib/public-content";
import {
  composeProject,
  describePhoto,
  generatePostcardArt,
  getSpendToDateCents,
  type ComposePhotoInput,
  type PostcardStyle,
} from "@/lib/ai-provider";
import {
  normalizeLocale,
  resolveLocaleFromRequest,
  type Locale,
} from "@/lib/i18n";

export const runtime = "nodejs";

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc?: "2.0";
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, unknown>;
}

const PROTOCOL_VERSION = "2025-11-25";
const VALID_STYLES: readonly PostcardStyle[] = [
  "illustration",
  "poster",
  "riso",
  "inkwash",
  "anime",
  "artnouveau",
];

export async function GET(req: Request) {
  const locale = resolveLocaleFromRequest(req);
  const zh = locale === "zh";
  return NextResponse.json({
    name: "London Cuts MCP",
    locale,
    endpoint: `${getAppBaseUrl()}/mcp`,
    protocolVersion: PROTOCOL_VERSION,
    resources: zh
      ? ["公开项目", "公开站点", "Markdown 引用包"]
      : ["public projects", "public stops", "markdown citation packs"],
    tools: [
      "search_public_projects",
      "get_public_project",
      "get_public_stop",
      "audit_public_project_visibility",
      "describe_photo",
      "compose_project",
      "generate_postcard",
      "sync_project",
    ],
  });
}

export async function POST(req: Request) {
  let body: JsonRpcRequest;
  try {
    body = (await req.json()) as JsonRpcRequest;
  } catch {
    return rpcResponse(null, rpcError(-32700, "Parse error"));
  }

  const id = body.id ?? null;
  const requestLocale = localeFromParams(body.params) ?? resolveLocaleFromRequest(req);
  if (body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return rpcResponse(id, rpcError(-32600, "Invalid Request"));
  }

  try {
    switch (body.method) {
      case "initialize":
        return rpcResponse(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {
            resources: {},
            tools: {},
            prompts: {},
          },
          serverInfo: {
            name: "London Cuts",
            version: "1.0.0",
          },
        });
      case "resources/list":
        return rpcResponse(id, await listResources(requestLocale));
      case "resources/read":
        return rpcResponse(id, await readResource(body.params, requestLocale));
      case "tools/list":
        return rpcResponse(id, { tools: toolDefinitions(requestLocale) });
      case "tools/call":
        return rpcResponse(id, await callTool(req, body.params, requestLocale));
      case "prompts/list":
        return rpcResponse(id, { prompts: promptDefinitions(requestLocale) });
      case "prompts/get":
        return rpcResponse(id, getPrompt(body.params, requestLocale));
      default:
        return rpcResponse(id, rpcError(-32601, "Method not found"));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "MCP request failed";
    const code = err instanceof AgentAuthError ? -32001 : -32000;
    return rpcResponse(id, rpcError(code, message));
  }
}

async function listResources(locale: Locale) {
  const projects = await listPublicProjects(locale);
  return {
    resources: projects.flatMap((project) => [
      {
        uri: projectResourceUri(project.handle, project.slug),
        name: project.title,
        description: project.description,
        mimeType: "application/json",
      },
      {
        uri: projectMarkdownResourceUri(project.handle, project.slug),
        name: `${project.title} markdown`,
        description:
          locale === "zh" ? "适合引用的 Markdown 包" : "Citation-friendly markdown pack",
        mimeType: "text/markdown",
      },
    ]),
  };
}

async function readResource(
  params: Record<string, unknown> | undefined,
  requestLocale: Locale,
) {
  const locale = localeFromParams(params) ?? requestLocale;
  const uri = requireString(params?.uri, "uri");
  const parsed = parseResourceUri(uri);
  if (!parsed) throw new Error(`Unsupported resource URI: ${uri}`);

  if (parsed.kind === "project" || parsed.kind === "markdown") {
    const project = await getPublicProject(parsed.handle, parsed.slug, locale);
    if (!project) throw new Error("Public project not found");
    return {
      contents: [
        {
          uri,
          mimeType: parsed.kind === "markdown" ? "text/markdown" : "application/json",
          text:
            parsed.kind === "markdown"
              ? project.markdown
              : JSON.stringify(project, null, 2),
        },
      ],
    };
  }

  if (parsed.kind !== "stop") throw new Error(`Unsupported resource URI: ${uri}`);
  const result = await getPublicStop(parsed.handle, parsed.slug, parsed.stop, locale);
  if (!result) throw new Error("Public stop not found");
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function callTool(
  req: Request,
  params: Record<string, unknown> | undefined,
  requestLocale: Locale,
) {
  const name = requireString(params?.name, "name");
  const args = (params?.arguments ?? {}) as Record<string, unknown>;
  const locale = localeFromParams(args) ?? localeFromParams(params) ?? requestLocale;

  switch (name) {
    case "search_public_projects": {
      const query = typeof args.query === "string" ? args.query.toLowerCase() : "";
      const projects = await listPublicProjects(locale);
      const data = query
        ? projects.filter((p) =>
            [
              p.title,
              p.description,
              p.shortSummary,
              p.locationName,
              p.authorName,
              ...p.tags,
              ...p.places,
              ...p.retrievalKeywords,
              ...p.featuredStops.map((stop) => stop.title),
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(query),
          )
        : projects;
      return toolText({ data });
    }
    case "get_public_project": {
      const project = await getPublicProject(
        requireString(args.handle, "handle"),
        requireString(args.slug, "slug"),
        locale,
      );
      if (!project) throw new Error("Public project not found");
      return toolText(project);
    }
    case "get_public_stop": {
      const result = await getPublicStop(
        requireString(args.handle, "handle"),
        requireString(args.slug, "slug"),
        requireString(args.stop, "stop"),
        locale,
      );
      if (!result) throw new Error("Public stop not found");
      return toolText(result);
    }
    case "audit_public_project_visibility": {
      const project = await getPublicProject(
        requireString(args.handle, "handle"),
        requireString(args.slug, "slug"),
        locale,
      );
      if (!project) throw new Error("Public project not found");
      return toolText(auditPublicProjectVisibility(project, locale));
    }
    case "describe_photo": {
      await requireMcpWriteAccess(req, "ai:run");
      const result = await describePhoto(requireString(args.imageDataUrl, "imageDataUrl"), {
        hint: typeof args.hint === "string" ? args.hint : null,
        locale,
      });
      return toolText({ ...result, spendToDateCents: getSpendToDateCents() });
    }
    case "compose_project": {
      await requireMcpWriteAccess(req, "ai:run");
      const photos = args.photos;
      if (!Array.isArray(photos)) throw new Error("photos must be an array");
      const result = await composeProject(photos as readonly ComposePhotoInput[], { locale });
      return toolText({ ...result, spendToDateCents: getSpendToDateCents() });
    }
    case "generate_postcard": {
      const access = await requireMcpWriteAccess(req, "ai:run");
      const style = requireString(args.style, "style");
      if (!(VALID_STYLES as readonly string[]).includes(style)) {
        throw new Error(`style must be one of ${VALID_STYLES.join(" | ")}`);
      }
      const result = await generatePostcardArt({
        userId: access.ownerId,
        sourceImageDataUrl: requireString(args.sourceImageDataUrl, "sourceImageDataUrl"),
        style: style as PostcardStyle,
        quality: (args.quality === "medium" || args.quality === "high"
          ? args.quality
          : "low") as "low" | "medium" | "high",
      });
      return toolText({ ...result, spendToDateCents: getSpendToDateCents() });
    }
    case "sync_project": {
      await requireMcpWriteAccess(req, "project:write");
      const payload = args.payload;
      if (!payload || typeof payload !== "object") {
        throw new Error("payload object is required");
      }
      const response = await fetch(new URL("/api/v1/projects/sync", req.url), {
        method: "POST",
        headers: forwardAuthHeaders(req),
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      return toolText({ status: response.status, data });
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function requireMcpWriteAccess(req: Request, scope: AgentScope) {
  assertAllowedOrigin(req);
  return requireAgentAccess(req, scope);
}

function assertAllowedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const allowed = new Set([
    getAppBaseUrl(),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);
  if (!allowed.has(origin.replace(/\/+$/, ""))) {
    throw new AgentAuthError("Origin is not allowed for MCP write/AI tools", 403);
  }
}

function forwardAuthHeaders(req: Request): Headers {
  const headers = new Headers({ "content-type": "application/json" });
  const authorization = req.headers.get("authorization");
  const cookie = req.headers.get("cookie");
  if (authorization) headers.set("authorization", authorization);
  if (cookie) headers.set("cookie", cookie);
  return headers;
}

function toolDefinitions(locale: Locale) {
  const zh = locale === "zh";
  return [
    {
      name: "search_public_projects",
      description: zh
        ? "搜索已发布的公开 London Cuts 项目。"
        : "Search published public London Cuts projects.",
      inputSchema: {
        type: "object",
        properties: localeProperties({ query: { type: "string" } }),
      },
    },
    {
      name: "get_public_project",
      description: zh
        ? "按 handle 和 slug 读取一个公开项目。"
        : "Read one public project by handle and slug.",
      inputSchema: projectHandleSchema(),
    },
    {
      name: "get_public_stop",
      description: zh ? "读取一个公开站点/章节。" : "Read one public stop/chapter.",
      inputSchema: {
        type: "object",
        properties: localeProperties({
          handle: { type: "string" },
          slug: { type: "string" },
          stop: { type: "string" },
        }),
        required: ["handle", "slug", "stop"],
      },
    },
    {
      name: "audit_public_project_visibility",
      description:
        zh
          ? "读取一个公开项目的确定性 AI 可见性审计。"
          : "Read a deterministic AI visibility audit for one public project.",
      inputSchema: projectHandleSchema(),
    },
    {
      name: "describe_photo",
      description: zh
        ? "认证 AI 视觉接口：描述一张照片。需要 ai:run。"
        : "Authenticated AI vision description for one photo. Requires ai:run.",
      inputSchema: {
        type: "object",
        properties: localeProperties({
          imageDataUrl: { type: "string" },
          hint: { type: "string" },
          outputLocale: { type: "string", enum: ["en", "zh"] },
        }),
        required: ["imageDataUrl"],
      },
    },
    {
      name: "compose_project",
      description: zh
        ? "认证 AI：把已描述照片组合成项目草稿。需要 ai:run。"
        : "Authenticated AI grouping/copy draft from described photos. Requires ai:run.",
      inputSchema: {
        type: "object",
        properties: localeProperties({
          photos: { type: "array", items: { type: "object" } },
          outputLocale: { type: "string", enum: ["en", "zh"] },
        }),
        required: ["photos"],
      },
    },
    {
      name: "generate_postcard",
      description: zh
        ? "认证 AI：生成明信片图片。需要 ai:run。"
        : "Authenticated AI postcard generation. Requires ai:run.",
      inputSchema: {
        type: "object",
        properties: localeProperties({
          sourceImageDataUrl: { type: "string" },
          style: { type: "string", enum: VALID_STYLES },
          quality: { type: "string", enum: ["low", "medium", "high"] },
        }),
        required: ["sourceImageDataUrl", "style"],
      },
    },
    {
      name: "sync_project",
      description: zh
        ? "认证项目同步到 Supabase。需要 project:write。"
        : "Authenticated project sync to Supabase. Requires project:write.",
      inputSchema: {
        type: "object",
        properties: { payload: { type: "object" } },
        required: ["payload"],
      },
    },
  ];
}

function promptDefinitions(locale: Locale) {
  const zh = locale === "zh";
  return [
    {
      name: "draft_travel_story",
      description: zh
        ? "根据照片笔记和地点起草 London Cuts 故事。"
        : "Draft a London Cuts story from photo notes and a location.",
      arguments: [
        {
          name: "location",
          description: zh ? "旅行地点" : "Trip location",
          required: true,
        },
        {
          name: "voice",
          description: zh ? "希望的叙事声音" : "Desired narrative voice",
          required: false,
        },
        {
          name: "locale",
          description: zh ? "输出语言 en 或 zh" : "Output locale en or zh",
          required: false,
        },
      ],
    },
    {
      name: "polish_stop_copy",
      description: zh
        ? "在保留事实和结构的前提下润色一个站点。"
        : "Polish one stop while preserving facts and structure.",
      arguments: [
        { name: "stop_json", description: "Stop DTO JSON", required: true },
        {
          name: "locale",
          description: zh ? "输出语言 en 或 zh" : "Output locale en or zh",
          required: false,
        },
      ],
    },
    {
      name: "publish_readiness_check",
      description: zh
        ? "检查项目是否具备足够公开/引用材料。"
        : "Check whether a project has enough public/citation material.",
      arguments: [
        { name: "project_json", description: "Project DTO JSON", required: true },
        {
          name: "locale",
          description: zh ? "输出语言 en 或 zh" : "Output locale en or zh",
          required: false,
        },
      ],
    },
    {
      name: "improve_ai_visibility_pack",
      description: zh
        ? "把 AI 可见性审计转成具体 public copy/API 改进。"
        : "Turn an AI visibility audit into concrete public copy/API improvements.",
      arguments: [
        { name: "audit_json", description: "AI visibility audit JSON", required: true },
        {
          name: "locale",
          description: zh ? "输出语言 en 或 zh" : "Output locale en or zh",
          required: false,
        },
      ],
    },
  ];
}

function getPrompt(params: Record<string, unknown> | undefined, requestLocale: Locale) {
  const name = requireString(params?.name, "name");
  const args = (params?.arguments ?? {}) as Record<string, unknown>;
  const locale = localeFromParams(args) ?? localeFromParams(params) ?? requestLocale;
  const zh = locale === "zh";
  if (name === "draft_travel_story") {
    return {
      description: zh ? "起草 London Cuts 旅行故事。" : "Draft a London Cuts travel story.",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: zh
              ? `为 ${args.location ?? "给定地点"} 起草一个 London Cuts 项目。保持画面感、事实性和站点结构。声音：${args.voice ?? "电影感但简洁"}。请用简体中文输出。`
              : `Draft a London Cuts project for ${args.location ?? "the provided location"}. Keep it visual, factual, and stop-based. Voice: ${args.voice ?? "cinematic but concise"}.`,
          },
        },
      ],
    };
  }
  if (name === "polish_stop_copy") {
    return {
      description: zh ? "润色一个站点。" : "Polish one stop.",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: zh
              ? `在不添加事实、不改变结构的前提下润色这个站点。请用简体中文输出：\n\n${args.stop_json ?? ""}`
              : `Polish this stop without adding facts or changing structure:\n\n${args.stop_json ?? ""}`,
          },
        },
      ],
    };
  }
  if (name === "publish_readiness_check") {
    return {
      description: zh ? "检查项目发布准备度。" : "Check project publish readiness.",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: zh
              ? `检查这个 London Cuts 项目的发布准备度、引用质量、缺失媒体和 AI 搜索清晰度。请用简体中文输出：\n\n${args.project_json ?? ""}`
              : `Review this London Cuts project for publish readiness, citation quality, missing media, and AI-search clarity:\n\n${args.project_json ?? ""}`,
          },
        },
      ],
    };
  }
  if (name === "improve_ai_visibility_pack") {
    return {
      description: zh ? "根据审计改进 AI 可见性。" : "Improve AI visibility from an audit.",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: zh
              ? `根据这个 London Cuts AI 可见性审计，提出具体的 public DTO、markdown、metadata、image-alt 和 citation-copy 改进。保留事实，不要编造私有数据。请用简体中文输出：\n\n${args.audit_json ?? ""}`
              : `Use this London Cuts AI visibility audit to propose concrete public DTO, markdown, metadata, image-alt, and citation-copy improvements. Preserve facts and do not invent private data:\n\n${args.audit_json ?? ""}`,
          },
        },
      ],
    };
  }
  throw new Error(`Unknown prompt: ${name}`);
}

function projectHandleSchema() {
  return {
    type: "object",
    properties: localeProperties({
      handle: { type: "string" },
      slug: { type: "string" },
    }),
    required: ["handle", "slug"],
  };
}

function localeProperties(properties: Record<string, unknown>) {
  return {
    ...properties,
    locale: { type: "string", enum: ["en", "zh"] },
  };
}

function localeFromParams(params: Record<string, unknown> | undefined): Locale | null {
  const outputLocale =
    typeof params?.outputLocale === "string" ? params.outputLocale : null;
  const locale = typeof params?.locale === "string" ? params.locale : null;
  return (
    normalizeLocale(outputLocale) ??
    normalizeLocale(locale) ??
    null
  );
}

function projectResourceUri(handle: string, slug: string) {
  return `londoncuts://projects/${normalizeHandle(handle)}/${slug}`;
}

function projectMarkdownResourceUri(handle: string, slug: string) {
  return `londoncuts://projects/${normalizeHandle(handle)}/${slug}/markdown`;
}

function parseResourceUri(uri: string):
  | { kind: "project" | "markdown"; handle: string; slug: string }
  | { kind: "stop"; handle: string; slug: string; stop: string }
  | null {
  const match = uri.match(
    /^londoncuts:\/\/projects\/([^/]+)\/([^/]+)(?:\/(?:(markdown)|stops\/([^/]+)))?$/,
  );
  if (!match) return null;
  const [, handle, slug, markdown, stop] = match;
  if (markdown) return { kind: "markdown", handle, slug };
  if (stop) return { kind: "stop", handle, slug, stop };
  return { kind: "project", handle, slug };
}

function requireString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

function toolText(data: unknown) {
  return {
    content: [
      {
        type: "text",
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

function rpcResponse(id: JsonRpcId, resultOrError: unknown) {
  const isError =
    resultOrError !== null &&
    typeof resultOrError === "object" &&
    "error" in resultOrError;
  return NextResponse.json({
    jsonrpc: "2.0",
    id,
    ...(isError ? resultOrError : { result: resultOrError }),
  });
}

function rpcError(code: number, message: string) {
  return { error: { code, message } };
}
