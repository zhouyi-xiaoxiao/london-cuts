import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin workspace root — silences Turbopack's warning about the stray
  // package-lock.json sitting in the user's home directory.
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
