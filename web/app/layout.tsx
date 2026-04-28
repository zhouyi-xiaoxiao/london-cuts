import type { Metadata } from "next";
import { headers } from "next/headers";

import { I18nProvider } from "@/components/i18n-provider";
import { HtmlModeAttr } from "@/components/mode-switcher";
import { resolveLocaleFromHeaders } from "@/lib/i18n";
import { getAppBaseUrl } from "@/lib/public-content";

import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: "London Cuts",
  description:
    "An AI-native London storytelling demo with public stories, atlas browsing, creator studio, postcards, and a swappable media adapter.",
  alternates: {
    canonical: getAppBaseUrl(),
  },
};

// Google Fonts powering the design tokens in globals.css (--f-display,
// --f-serif, --f-fashion, --f-sans, --f-mono, --f-hand). Latin set
// matches the legacy prototype (archive/app-html-prototype-2026-04-20/
// index.html:14). CJK weights capped at 400/700/900 — Google's unicode-
// range chunking serves the most common ~1000 hanzi first (~280KB), rest
// stream as encountered.
const GOOGLE_FONTS = [
  "family=Archivo:wght@400;500;600;700",
  "family=Archivo+Black",
  "family=Instrument+Serif:ital@0;1",
  "family=Bodoni+Moda:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600",
  "family=JetBrains+Mono:wght@400;500;600",
  "family=Caveat:wght@400;500;600",
  "family=Noto+Serif+SC:wght@400;700;900",
  "family=Noto+Sans+SC:wght@400;700;900",
].join("&");
const GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?${GOOGLE_FONTS}&display=swap`;

// LXGW WenKai — Cinema CJK display (open-source 楷体, brush-feel).
// Eagerly loaded because Cinema is a top-level mode; gating behind
// data-mode would cost a FOUT on mode switch.
const LXGW_WENKAI_URL =
  "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = resolveLocaleFromHeaders(await headers());
  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"}>
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
        <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
        <link rel="stylesheet" href={LXGW_WENKAI_URL} />
      </head>
      <body>
        {/* Mirrors the Zustand `mode` slice onto <html data-mode=…> so
            the [data-mode="punk"] { … } rules in globals.css apply
            globally. Client-only; renders nothing in the tree. */}
        <HtmlModeAttr />
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
