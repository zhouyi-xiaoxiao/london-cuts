import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin Turbopack root to silence the local warning about the stray
  // package-lock.json in the user's home directory.
  //
  // Do NOT set outputFileTracingRoot here — when Vercel's Root Directory
  // is `web/`, Vercel's post-build step looks for manifests at
  // `/vercel/path0/.next/` (repo root) while a custom tracing root
  // redirects output to `web/.next/`, causing an ENOENT on
  // `routes-manifest-deterministic.json`. Let Vercel auto-infer it.
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "basemaps.cartocdn.com",
      },
    ],
  },
};

export default nextConfig;
