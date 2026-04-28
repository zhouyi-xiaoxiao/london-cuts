"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createContext, useContext } from "react";

import {
  DEFAULT_LOCALE,
  type Locale,
  localizePath,
  t,
} from "@/lib/i18n";

const I18nContext = createContext<Locale>(DEFAULT_LOCALE);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <I18nContext.Provider value={locale}>{children}</I18nContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(I18nContext);
}

export function useT() {
  const locale = useLocale();
  return (key: Parameters<typeof t>[1], vars?: Parameters<typeof t>[2]) =>
    t(locale, key, vars);
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  // Read pathname + search through Next routing context, not window.location.
  // The previous `typeof window === "undefined"` branch evaluated to "/" during
  // SSR but to the real path on the client, so each <Link> got a different
  // href across the hydration boundary and React logged a mismatch.
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams?.toString() ?? "");
  params.delete("lang");
  const cleanSearch = params.toString();

  return (
    <div
      className="language-switcher"
      role="group"
      aria-label={t(locale, "language.label")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        border: "1px solid var(--rule)",
        padding: 3,
        fontFamily: "var(--f-mono, monospace)",
        fontSize: compact ? 10 : 11,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {(["en", "zh"] as const).map((next) => {
        const href = `${localizePath(pathname, next)}${
          cleanSearch ? `?${cleanSearch}` : ""
        }`;
        const active = locale === next;
        return (
          <Link
            key={next}
            href={href}
            hrefLang={next === "zh" ? "zh-CN" : "en"}
            aria-current={active ? "true" : undefined}
            style={{
              color: active ? "var(--paper)" : "inherit",
              background: active ? "var(--ink)" : "transparent",
              padding: compact ? "4px 6px" : "5px 8px",
              textDecoration: "none",
              minHeight: 28,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {next === "zh" ? t(locale, "language.zh") : t(locale, "language.en")}
          </Link>
        );
      })}
    </div>
  );
}
