import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getPublicProject,
  getPublicStop,
  listPublicProjects,
} from "@/lib/public-content";

describe("public-content DTO seam", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lists only public citation-safe project summaries", async () => {
    const projects = await listPublicProjects();
    expect(projects.length).toBeGreaterThan(0);
    expect(projects[0]).toMatchObject({
      handle: "ana-ishii",
      canonicalUrl: expect.stringContaining("https://example.test/@ana-ishii/"),
      apiUrl: expect.stringContaining("/api/v1/projects/"),
      markdownUrl: expect.stringContaining("/markdown"),
    });
    expect(JSON.stringify(projects)).not.toContain("authUserId");
    expect(JSON.stringify(projects)).not.toContain("email");
    expect(JSON.stringify(projects)).not.toContain("service_role");
  });

  it("returns project markdown with stop-level citation URLs", async () => {
    const project = await getPublicProject("@ana-ishii", "a-year-in-se1");
    expect(project).not.toBeNull();
    expect(project?.stops).toHaveLength(13);
    expect(project?.markdown).toContain("# A Year Around London");
    expect(project?.markdown).toContain("Canonical URL:");
    expect(project?.markdown).toContain("/chapter/regent-street-illuminations");
  });

  it("returns an individual public stop by slug", async () => {
    const result = await getPublicStop(
      "@ana-ishii",
      "a-year-in-se1",
      "regent-street-illuminations",
    );
    expect(result?.stop.title).toBe("Regent Street Illuminations");
    expect(result?.stop.heroImageUrl).toBe(
      "https://example.test/seed-images/IMG_0294.jpg",
    );
  });
});
