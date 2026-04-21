import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin workspace root so (a) Turbopack stops warning about the stray
  // package-lock.json in the user's home dir locally, and (b) Vercel
  // stops warning about outputFileTracingRoot !== turbopack.root when
  // Vercel auto-injects outputFileTracingRoot. We set BOTH to the same
  // absolute path.
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: __dirname,
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
