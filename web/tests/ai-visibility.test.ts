import { afterEach, describe, expect, it, vi } from "vitest";

import { auditPublicProjectVisibility } from "@/lib/ai-visibility";
import { getPublicProject } from "@/lib/public-content";

describe("AI visibility audit", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns deterministic read-only guidance for public projects", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.test");
    const project = await getPublicProject("@ana-ishii", "a-year-in-se1");
    expect(project).not.toBeNull();

    const audit = auditPublicProjectVisibility(project!);
    expect(audit.object).toBe("ai_visibility_audit");
    expect(audit.project).toMatchObject({
      handle: "ana-ishii",
      slug: "a-year-in-se1",
      markdownUrl: expect.stringContaining("/markdown"),
    });
    expect(audit.suggestedQueries).toContain("A Year Around London");
    expect(audit.answerCards.length).toBeGreaterThan(0);
    expect(JSON.stringify(audit)).not.toContain("service_role");
    expect(JSON.stringify(audit)).not.toContain("OPENAI_API_KEY");
  });
});
