"use client";

import { DEFAULT_LOCALE, localizedField, localizeBodyBlocks, type Locale } from "@/lib/i18n";
import type { Project, Stop } from "@/stores/types";

export function currentClientLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const htmlLang = document.documentElement.lang.toLowerCase();
  if (htmlLang.startsWith("zh")) return "zh";
  if (htmlLang.startsWith("en")) return "en";
  if (location.pathname === "/zh" || location.pathname.startsWith("/zh/")) {
    return "zh";
  }
  if (location.pathname === "/en" || location.pathname.startsWith("/en/")) {
    return "en";
  }
  return DEFAULT_LOCALE;
}

export function localizeProjectForClient(project: Project): Project {
  const locale = currentClientLocale();
  if (locale === "en") return project;
  const translations = project.translations;
  return {
    ...project,
    title: localizedField(locale, project.title, translations, "title") as string,
    subtitle: localizedField(
      locale,
      project.subtitle,
      translations,
      "subtitle",
    ) as string | null,
    locationName: localizedField(
      locale,
      project.locationName,
      translations,
      "locationName",
    ) as string | null,
    tags: localizedField(locale, project.tags, translations, "tags") as readonly string[],
  };
}

export function localizeStopForClient(stop: Stop): Stop {
  const locale = currentClientLocale();
  if (locale === "en") return stop;
  const translations = stop.translations;
  const postcardTranslations = stop.postcard.translations;
  return {
    ...stop,
    title: localizedField(locale, stop.title, translations, "title") as string,
    time: localizedField(locale, stop.time, translations, "time") as string,
    mood: localizedField(locale, stop.mood, translations, "mood") as string,
    label: localizedField(locale, stop.label, translations, "label") as string,
    code: localizedField(locale, stop.code, translations, "code") as string,
    body: localizeBodyBlocks(locale, stop.body, translations),
    postcard: {
      ...stop.postcard,
      message: localizedField(
        locale,
        stop.postcard.message,
        postcardTranslations,
        "message",
      ) as string,
    },
  };
}
