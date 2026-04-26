import type { MetadataRoute } from "next";

import { getAppBaseUrl } from "@/lib/public-content";

export default function robots(): MetadataRoute.Robots {
  const base = getAppBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/@",
          "/atlas",
          "/api/v1/projects",
          "/api/openapi.json",
          "/llms.txt",
          "/llms-full.txt",
        ],
        disallow: [
          "/studio",
          "/onboarding",
          "/sign-in",
          "/gate",
          "/api/ai",
          "/api/auth",
          "/api/invites",
          "/api/me",
          "/api/migrate",
          "/api/sync",
          "/mcp",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
