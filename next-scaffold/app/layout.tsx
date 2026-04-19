import type { Metadata } from "next";

import { RootProviders } from "@/providers/root-providers";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "London Cuts",
  description:
    "An AI-native London storytelling demo with public stories, atlas browsing, creator studio, postcards, and a swappable media adapter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
