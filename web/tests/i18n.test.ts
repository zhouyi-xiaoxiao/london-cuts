import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cookieLocale,
  localeFromAcceptLanguage,
  localizePath,
  resolveLocaleFromRequest,
  stripLocalePrefix,
  t,
} from "@/lib/i18n";
import { getPublicProject, getPublicStop } from "@/lib/public-content";

describe("i18n locale negotiation and seed content", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves locale by query, cookie, Accept-Language, then English fallback", () => {
    expect(
      resolveLocaleFromRequest(
        new Request("https://example.test/api/v1/projects?lang=zh", {
          headers: { cookie: "lc_locale=en", "accept-language": "en-GB" },
        }),
      ),
    ).toBe("zh");
    expect(cookieLocale("foo=bar; lc_locale=zh-CN")).toBe("zh");
    expect(localeFromAcceptLanguage("fr-FR,zh-CN;q=0.8,en;q=0.7")).toBe("zh");
    expect(resolveLocaleFromRequest(new Request("https://example.test/"))).toBe("en");
  });

  it("handles explicit locale URL prefixes without changing stable slugs", () => {
    expect(stripLocalePrefix("/zh/@ana-ishii/a-year-in-se1")).toEqual({
      locale: "zh",
      pathname: "/@ana-ishii/a-year-in-se1",
    });
    expect(localizePath("/@ana-ishii/a-year-in-se1", "zh")).toBe(
      "/zh/@ana-ishii/a-year-in-se1",
    );
    expect(localizePath("/en/@ana-ishii/a-year-in-se1", "zh")).toBe(
      "/zh/@ana-ishii/a-year-in-se1",
    );
  });

  it("serves Simplified Chinese public project and stop DTOs with English identifiers", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.test");

    const project = await getPublicProject("@ana-ishii", "a-year-in-se1", "zh");
    expect(project?.locale).toBe("zh");
    expect(project?.slug).toBe("a-year-in-se1");
    expect(project?.title).toContain("伦敦");
    expect(project?.markdown).toContain("## 概览");
    expect(project?.translationStatus).toBe("translated");
    expect(project?.alternateUrls.zh).toBe(
      "https://example.test/zh/@ana-ishii/a-year-in-se1",
    );

    const stop = await getPublicStop(
      "@ana-ishii",
      "a-year-in-se1",
      "regent-street-illuminations",
      "zh",
    );
    expect(stop?.stop.locale).toBe("zh");
    expect(stop?.stop.slug).toBe("regent-street-illuminations");
    expect(stop?.stop.title).toContain("摄政街");
  });

  it("keeps dictionary values available in both locales", () => {
    expect(t("en", "studio.publish")).toBe("Publish");
    expect(t("zh", "studio.publish")).toBe("发布");
  });
});
