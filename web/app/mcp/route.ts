import { NextResponse } from "next/server";

import {
  AgentAuthError,
  requireAgentAccess,
  type AgentScope,
} from "@/lib/agent-auth";
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

export async function GET() {
  return NextResponse.json({
    name: "London Cuts MCP",
    endpoint: `${getAppBaseUrl()}/mcp`,
    protocolVersion: PROTOCOL_VERSION,
    resources: ["public projects", "public stops", "markdown citation packs"],
    tools: [
      "search_public_projects",
      "get_public_project",
      "get_public_stop",
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
        return rpcResponse(id, await listResources());
      case "resources/read":
        return rpcResponse(id, await readResource(body.params));
      case "tools/list":
        return rpcResponse(id, { tools: toolDefinitions() });
      case "tools/call":
        return rpcResponse(id, await callTool(req, body.params));
      case "prompts/list":
        return rpcResponse(id, { prompts: promptDefinitions() });
      case "prompts/get":
        return rpcResponse(id, getPrompt(body.params));
      default:
        return rpcResponse(id, rpcError(-32601, "Method not found"));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "MCP request failed";
    const code = err instanceof AgentAuthError ? -32001 : -32000;
    return rpcResponse(id, rpcError(code, message));
  }
}

async function listResources() {
  const projects = await listPublicProjects();
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
        description: "Citation-friendly markdown pack",
        mimeType: "text/markdown",
      },
    ]),
  };
}

async function readResource(params: Record<string, unknown> | undefined) {
  const uri = requireString(params?.uri, "uri");
  const parsed = parseResourceUri(uri);
  if (!parsed) throw new Error(`Unsupported resource URI: ${uri}`);

  if (parsed.kind === "project" || parsed.kind === "markdown") {
    const project = await getPublicProject(parsed.handle, parsed.slug);
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
  const result = await getPublicStop(parsed.handle, parsed.slug, parsed.stop);
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

async function callTool(req: Request, params: Record<string, unknown> | undefined) {
  const name = requireString(params?.name, "name");
  const args = (params?.arguments ?? {}) as Record<string, unknown>;

  switch (name) {
    case "search_public_projects": {
      const query = typeof args.query === "string" ? args.query.toLowerCase() : "";
      const projects = await listPublicProjects();
      const data = query
        ? projects.filter((p) =>
            [p.title, p.description, p.locationName, p.authorName, ...p.tags]
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
      );
      if (!project) throw new Error("Public project not found");
      return toolText(project);
    }
    case "get_public_stop": {
      const result = await getPublicStop(
        requireString(args.handle, "handle"),
        requireString(args.slug, "slug"),
        requireString(args.stop, "stop"),
      );
      if (!result) throw new Error("Public stop not found");
      return toolText(result);
    }
    case "describe_photo": {
      await requireMcpWriteAccess(req, "ai:run");
      const result = await describePhoto(requireString(args.imageDataUrl, "imageDataUrl"), {
        hint: typeof args.hint === "string" ? args.hint : null,
      });
      return toolText({ ...result, spendToDateCents: getSpendToDateCents() });
    }
    case "compose_project": {
      await requireMcpWriteAccess(req, "ai:run");
      const photos = args.photos;
      if (!Array.isArray(photos)) throw new Error("photos must be an array");
      const result = await composeProject(photos as readonly ComposePhotoInput[]);
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

function toolDefinitions() {
  return [
    {
      name: "search_public_projects",
      description: "Search published public London Cuts projects.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" } },
      },
    },
    {
      name: "get_public_project",
      description: "Read one public project by handle and slug.",
      inputSchema: projectHandleSchema(),
    },
    {
      name: "get_public_stop",
      description: "Read one public stop/chapter.",
      inputSchema: {
        type: "object",
        properties: {
          handle: { type: "string" },
          slug: { type: "string" },
          stop: { type: "string" },
        },
        required: ["handle", "slug", "stop"],
      },
    },
    {
      name: "describe_photo",
      description: "Authenticated AI vision description for one photo. Requires ai:run.",
      inputSchema: {
        type: "object",
        properties: {
          imageDataUrl: { type: "string" },
          hint: { type: "string" },
        },
        required: ["imageDataUrl"],
      },
    },
    {
      name: "compose_project",
      description: "Authenticated AI grouping/copy draft from described photos. Requires ai:run.",
      inputSchema: {
        type: "object",
        properties: { photos: { type: "array", items: { type: "object" } } },
        required: ["photos"],
      },
    },
    {
      name: "generate_postcard",
      description: "Authenticated AI postcard generation. Requires ai:run.",
      inputSchema: {
        type: "object",
        properties: {
          sourceImageDataUrl: { type: "string" },
          style: { type: "string", enum: VALID_STYLES },
          quality: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["sourceImageDataUrl", "style"],
      },
    },
    {
      name: "sync_project",
      description: "Authenticated project sync to Supabase. Requires project:write.",
      inputSchema: {
        type: "object",
        properties: { payload: { type: "object" } },
        required: ["payload"],
      },
    },
  ];
}

function promptDefinitions() {
  return [
    {
      name: "draft_travel_story",
      description: "Draft a London Cuts story from photo notes and a location.",
      arguments: [
        { name: "location", description: "Trip location", required: true },
        { name: "voice", description: "Desired narrative voice", required: false },
      ],
    },
    {
      name: "polish_stop_copy",
      description: "Polish one stop while preserving facts and structure.",
      arguments: [{ name: "stop_json", description: "Stop DTO JSON", required: true }],
    },
    {
      name: "publish_readiness_check",
      description: "Check whether a project has enough public/citation material.",
      arguments: [{ name: "project_json", description: "Project DTO JSON", required: true }],
    },
  ];
}

function getPrompt(params: Record<string, unknown> | undefined) {
  const name = requireString(params?.name, "name");
  const args = (params?.arguments ?? {}) as Record<string, unknown>;
  if (name === "draft_travel_story") {
    return {
      description: "Draft a London Cuts travel story.",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Draft a London Cuts project for ${args.location ?? "the provided location"}. Keep it visual, factual, and stop-based. Voice: ${args.voice ?? "cinematic but concise"}.`,
          },
        },
      ],
    };
  }
  if (name === "polish_stop_copy") {
    return {
      description: "Polish one stop.",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Polish this stop without adding facts or changing structure:\n\n${args.stop_json ?? ""}`,
          },
        },
      ],
    };
  }
  if (name === "publish_readiness_check") {
    return {
      description: "Check project publish readiness.",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Review this London Cuts project for publish readiness, citation quality, missing media, and AI-search clarity:\n\n${args.project_json ?? ""}`,
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
    properties: {
      handle: { type: "string" },
      slug: { type: "string" },
    },
    required: ["handle", "slug"],
  };
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
