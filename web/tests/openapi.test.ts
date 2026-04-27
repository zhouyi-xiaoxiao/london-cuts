import { afterEach, describe, expect, it, vi } from "vitest";

import { buildOpenApiDocument } from "@/lib/openapi";

describe("OpenAPI document", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("describes public and authenticated agent endpoints", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.test");
    const doc = buildOpenApiDocument();
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.paths["/api/v1/projects"]).toBeTruthy();
    expect(doc.paths["/api/v1/projects/{handle}/{slug}/markdown"]).toBeTruthy();
    expect(doc.paths["/api/v1/projects/{handle}/{slug}/ai-visibility"]).toBeTruthy();
    expect(doc.paths["/api/v1/ai/generate-postcard"]).toBeTruthy();
    expect(doc.paths["/mcp"]).toBeTruthy();
    expect(doc.components.schemas.PublicProjectSummary.properties).toHaveProperty(
      "retrievalKeywords",
    );
    expect(doc.components.schemas.AiVisibilityAudit).toBeTruthy();
    expect(doc.components.securitySchemes.bearerAuth).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
  });

  it("localizes human-readable OpenAPI text while preserving identifiers", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.test");
    const doc = buildOpenApiDocument("zh");
    expect(doc.info.summary).toContain("公开");
    expect(doc.paths["/api/v1/projects"].get.operationId).toBe("listPublicProjects");
    expect(doc.paths["/api/v1/projects"].get.summary).toContain("列出");
    expect(
      doc.paths["/api/v1/ai/describe-photo"].post.requestBody.content[
        "application/json"
      ].schema.properties,
    ).toHaveProperty("outputLocale");
    expect(doc.components.schemas.PublicProjectSummary.properties.locale).toBeTruthy();
  });
});
