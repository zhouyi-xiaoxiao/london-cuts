import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

function rpc(method: string, params?: Record<string, unknown>) {
  return new Request("http://localhost:3000/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
}

describe("MCP endpoint", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lists tools", async () => {
    const { POST } = await import("@/app/mcp/route");
    const res = await POST(rpc("tools/list"));
    const json = await res.json();
    expect(json.result.tools.map((tool: { name: string }) => tool.name)).toContain(
      "get_public_project",
    );
    expect(json.result.tools.map((tool: { name: string }) => tool.name)).toContain(
      "audit_public_project_visibility",
    );
    expect(json.result.tools.map((tool: { name: string }) => tool.name)).toContain(
      "generate_postcard",
    );
  });

  it("reads a public project through a tool call without auth", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.test");
    const { POST } = await import("@/app/mcp/route");
    const res = await POST(
      rpc("tools/call", {
        name: "get_public_project",
        arguments: { handle: "@ana-ishii", slug: "a-year-in-se1" },
      }),
    );
    const json = await res.json();
    expect(json.result.content[0].text).toContain("A Year Around London");
  });

  it("audits public project visibility through a tool call without auth", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.test");
    const { POST } = await import("@/app/mcp/route");
    const res = await POST(
      rpc("tools/call", {
        name: "audit_public_project_visibility",
        arguments: { handle: "@ana-ishii", slug: "a-year-in-se1" },
      }),
    );
    const json = await res.json();
    expect(json.result.content[0].text).toContain("ai_visibility_audit");
    expect(json.result.content[0].text).toContain("suggestedQueries");
  });

  it("localizes public MCP tool results through locale arguments", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.test");
    const { POST } = await import("@/app/mcp/route");
    const res = await POST(
      rpc("tools/call", {
        name: "get_public_project",
        arguments: { handle: "@ana-ishii", slug: "a-year-in-se1", locale: "zh" },
      }),
    );
    const json = await res.json();
    expect(json.result.content[0].text).toContain('"locale": "zh"');
    expect(json.result.content[0].text).toContain("伦敦");
  });
});
