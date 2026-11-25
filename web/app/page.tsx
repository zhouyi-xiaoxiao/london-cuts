// Front page. Says what London Cuts is, how far along it is, and opens
// the public demo stories and the atlas. Laid out like the contents
// page of an issue rather than a product landing page; the mode switch
// under the introduction re-cuts this page the same way it re-cuts a story.

import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { LanguageSwitcher } from "@/components/i18n-provider";
import { ModeSwitcher } from "@/components/mode-switcher";
import { resolveLocaleFromHeaders, t } from "@/lib/i18n";
import {
  handlePath,
  listPublicProjects,
  type PublicProjectSummaryDTO,
} from "@/lib/public-content";

const REPO_URL = "https://github.com/zhouyi-xiaoxiao/london-cuts";
const MAKER_URL = "https://zhouyixiaoxiao.com/";

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveLocaleFromHeaders(await headers());
  return {
    title: t(locale, "home.metaTitle"),
    description: t(locale, "home.metaDescription"),
  };
}

function storyPath(p: PublicProjectSummaryDTO): string {
  return `/${handlePath(p.handle)}/${p.slug}`;
}

export default async function Page() {
  const locale = resolveLocaleFromHeaders(await headers());
  const tr = (key: Parameters<typeof t>[1], vars?: Parameters<typeof t>[2]) =>
    t(locale, key, vars);
  // The Chinese title breaks after its comma on phones (see globals.css)
  // so that "剪辑" is never split across lines.
  const title = tr("home.title");
  const titleBreak = locale === "zh" ? title.indexOf("，") : -1;
  const projects = (await listPublicProjects(locale)).slice(0, 6);
  // Stories with photos first; a text-only sample reads better second.
  const stories = [...projects].sort(
    (a, b) => Number(Boolean(b.coverImageUrl)) - Number(Boolean(a.coverImageUrl)),
  );

  return (
    <main className="lc-home">
      <header className="lc-home-bar">
        <span className="lc-home-wordmark">London Cuts</span>
        <LanguageSwitcher compact />
      </header>

      <section className="lc-home-intro">
        <p className="eyebrow">{tr("home.eyebrow")}</p>
        <h1 className="lc-home-title">
          {titleBreak > 0 ? (
            <>
              <span className="lc-home-title-first">
                {title.slice(0, titleBreak + 1)}
              </span>
              <span className="lc-home-title-second">
                {title.slice(titleBreak + 1)}
              </span>
            </>
          ) : (
            title
          )}
        </h1>
        <p className="lc-home-lede">{tr("home.lede")}</p>
        <div className="lc-home-cut">
          <span className="mono-sm">{tr("home.tryCut")}</span>
          <ModeSwitcher />
        </div>
      </section>

      <section className="lc-home-contents" aria-labelledby="lc-home-contents">
        <h2 id="lc-home-contents" className="eyebrow">
          {tr("home.contents")}
        </h2>
        <ol>
          {stories.map((p, i) => (
            <li key={p.id}>
              <Link href={storyPath(p)} className="lc-home-entry">
                <span className="lc-home-n mono-sm">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {p.coverImageUrl ? (
                  <img
                    className="lc-home-thumb"
                    src={p.coverImageUrl}
                    alt=""
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                ) : (
                  <span className="lc-home-thumb lc-home-thumb-text mono-sm">
                    {p.locationName ?? p.title}
                  </span>
                )}
                <span className="lc-home-text">
                  <span className="lc-home-entry-title">{p.title}</span>
                  {p.subtitle ? (
                    <span className="lc-home-entry-sub">{p.subtitle}</span>
                  ) : null}
                  <span className="lc-home-entry-meta mono-sm">
                    {tr("home.stopsCount", { count: p.stopCount })}
                    {" · "}
                    {p.imageCount > 0
                      ? tr("home.photosCount", { count: p.imageCount })
                      : tr("home.textOnly")}
                  </span>
                </span>
                <span className="lc-home-go mono-sm" aria-hidden>
                  {tr("home.read")} →
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/atlas" className="lc-home-entry">
              <span className="lc-home-n mono-sm">
                {String(stories.length + 1).padStart(2, "0")}
              </span>
              <span className="lc-home-thumb lc-home-thumb-text mono-sm">
                {tr("home.atlasMeta")}
              </span>
              <span className="lc-home-text">
                <span className="lc-home-entry-title">{tr("home.atlasTitle")}</span>
                <span className="lc-home-entry-sub">{tr("home.atlasBody")}</span>
              </span>
              <span className="lc-home-go mono-sm" aria-hidden>
                {tr("home.open")} →
              </span>
            </Link>
          </li>
        </ol>
      </section>

      <section className="lc-home-status">
        <h2 className="eyebrow">{tr("home.statusLabel")}</h2>
        <p>{tr("home.status")}</p>
      </section>

      <footer className="lc-home-foot mono-sm">
        <span>
          {tr("home.agentsLabel")}:{" "}
          <a href="/llms.txt">llms.txt</a> · <a href="/api/openapi.json">OpenAPI</a> ·{" "}
          <Link href="/mcp" prefetch={false}>
            MCP
          </Link>
        </span>
        <a href={REPO_URL}>{tr("home.source")}</a>
        <a href={MAKER_URL}>Xiaoxiao Zhouyi · zhouyixiaoxiao.com</a>
      </footer>
    </main>
  );
}
