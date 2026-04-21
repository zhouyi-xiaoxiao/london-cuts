import type { Metadata } from "next";

import { HtmlModeAttr } from "@/components/mode-switcher";
import { RootProviders } from "@/providers/root-providers";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "London Cuts",
  description:
    "An AI-native London storytelling demo with public stories, atlas browsing, creator studio, postcards, and a swappable media adapter.",
};

// Google Fonts matching the legacy prototype (was loaded via a <link>
// in archive/app-html-prototype-2026-04-20/index.html:14). These power
// the design tokens in globals.css (--f-display, --f-serif, --f-fashion,
// --f-sans, --f-mono, --f-hand).
const GOOGLE_FONTS =
  "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Archivo+Black&family=Instrument+Serif:ital@0;1&family=Bodoni+Moda:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Caveat:wght@400;500;600&display=swap";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link rel="stylesheet" href={GOOGLE_FONTS} />
      </head>
      <body>
        {/* Mirrors the Zustand `mode` slice onto <html data-mode=…> so
            the [data-mode="punk"] { … } rules in globals.css apply
            globally. Client-only; renders nothing in the tree. */}
        <HtmlModeAttr />
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
