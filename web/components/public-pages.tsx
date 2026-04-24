"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";

import { atlasPath, chapterPath, postcardPath, projectPath, studioProjectPath } from "@/lib/routes";
import type { ExploreProject, NarrativeMode, Project, StoryStop } from "@/lib/types";
import {
  DisplayAsset,
  MetricCard,
  ModeSwitcher,
  PublicNav,
  StopInlineLink,
  StoryCard,
} from "@/components/ui";
import { useLegacyStudioAdapter } from "@/components/studio-pages.adapter";

// ─── Scaffold-only browsing data ──────────────────────────────────────
// Used to exist in `lib/seed-data.ts` — inlined here so the dead-code
// cleanup can remove that file. These are the "explore" cards shown on
// the landing + atlas pages. Replaced by real published projects in M4.

const EXPLORE_PROJECTS: ExploreProject[] = [
  {
    id: "seed-a-year-in-se1",
    title: "A Year Around London",
    author: "Ana Ishii",
    authorHandle: "@ana-ishii",
    slug: "a-year-in-se1",
    stops: 13,
    mode: "fashion",
    label: "LONDON · WINDSOR",
    reads: "2.4k",
    borough: "London / Windsor",
    tone: "warm",
    summary: "Thirteen EXIF-grounded frames across London, Windsor and the in-between.",
    lat: 51.514,
    lng: -0.141,
  },
  {
    id: "project-mudlark",
    title: "Mudlark Diaries",
    author: "Ty Okafor",
    authorHandle: "@ty-okafor",
    slug: "mudlark-diaries",
    stops: 14,
    mode: "punk",
    label: "THAMES · FORESHORE",
    reads: "891",
    borough: "SE1 Southwark",
    tone: "punk",
    summary: "A rough-cut walk through low tide finds and river residue.",
    lat: 51.503,
    lng: -0.106,
  },
  {
    id: "project-e8",
    title: "48 Hours in E8",
    author: "Priya Shah",
    authorHandle: "@priya-shah",
    slug: "48-hours-in-e8",
    stops: 8,
    mode: "cinema",
    label: "HACKNEY · NIGHT",
    reads: "4.1k",
    borough: "E8 Hackney",
    tone: "dark",
    summary: "Two sleepless days staged like a low-budget film.",
    lat: 51.546,
    lng: -0.075,
  },
  {
    id: "project-jubilee",
    title: "The Jubilee Walk",
    author: "Lena Park",
    authorHandle: "@lena-park",
    slug: "the-jubilee-walk",
    stops: 12,
    mode: "fashion",
    label: "WESTMINSTER · DAY",
    reads: "1.2k",
    borough: "SW1 Westminster",
    tone: "warm",
    summary: "River landmarks rendered as a polished editorial essay.",
    lat: 51.5007,
    lng: -0.1246,
  },
  {
    id: "project-last-trains",
    title: "Last Trains",
    author: "Marco Reed",
    authorHandle: "@marco-reed",
    slug: "last-trains",
    stops: 7,
    mode: "cinema",
    label: "UNDERGROUND · 00:47",
    reads: "3.6k",
    borough: "W1 Soho / Fitzrovia",
    tone: "dark",
    summary: "A night transport diary told as scene cards and subtitles.",
    lat: 51.515,
    lng: -0.141,
  },
  {
    id: "project-brick-lane",
    title: "Brick Lane after rain",
    author: "Yui Tanaka",
    authorHandle: "@yui-tanaka",
    slug: "brick-lane-after-rain",
    stops: 9,
    mode: "punk",
    label: "E1 · WET ASPHALT",
    reads: "624",
    borough: "E1 Whitechapel",
    tone: "punk",
    summary: "Stickered shutters, wet signs and a camera that stays too close.",
    lat: 51.521,
    lng: -0.071,
  },
];

function getProjectBySlug(
  authorHandle: string,
  slug: string,
  projects: Project[],
): Project | undefined {
  return projects.find(
    (project) => project.authorHandle === authorHandle && project.slug === slug,
  );
}

function getStopBySlug(slug: string, stops: StoryStop[]): StoryStop | undefined {
  return stops.find((stop) => stop.slug === slug);
}

function useResolvedProject(authorHandle?: string, slug?: string): Project {
  const { state } = useLegacyStudioAdapter();
  return (
    (authorHandle && slug ? getProjectBySlug(authorHandle, slug, state.projects) : undefined) ??
    state.projects.find((project) => project.id === state.activeProjectId) ??
    state.projects[0]
  );
}

function useProjectAssets(project: Project) {
  const { state } = useLegacyStudioAdapter();
  const stopMap = new Map(state.stops.map((stop) => [stop.id, stop]));
  const assetMap = new Map(state.assets.map((asset) => [asset.id, asset]));
  const stops = project.stopIds
    .map((stopId) => stopMap.get(stopId))
    .filter((stop): stop is StoryStop => Boolean(stop));
  const coverAsset = assetMap.get(stops[0]?.coverAssetId ?? project.uploadAssetIds[0]) ?? state.assets[0];
  return { stops, coverAsset, assetMap };
}

export function LandingPage() {
  const { currentMode, setMode, state } = useLegacyStudioAdapter();
  const project = state.projects[0];
  const { coverAsset, assetMap } = useProjectAssets(project);
  const featuredStories = EXPLORE_PROJECTS.slice(0, 3);

  const masthead = {
    punk: (
      <>
        <span style={{ display: "inline-block", background: "black", color: "white", paddingInline: "0.2em" }}>
          London
        </span>{" "}
        Cuts
      </>
    ),
    fashion: (
      <>
        London, <br />
        <em>in pieces</em>
      </>
    ),
    cinema: (
      <>
        London Cuts
        <br />
        <span className="lc-mono" style={{ fontSize: "0.28em", opacity: 0.72 }}>
          A city, in frames
        </span>
      </>
    ),
  } as const;

  const descriptions = {
    punk: "Zine energy, raw cut-outs, taped moments and a city that won't sit still.",
    fashion: "Editorial layouts, sculpted whitespace and picture-led storytelling from street level.",
    cinema: "Scene cards, subtitle rhythm and a public story shaped like a London film diary.",
  } as const;

  return (
    <div className="lc-page" data-mode={currentMode}>
      <PublicNav
        mode={currentMode}
        onModeChange={setMode}
        current="landing"
        project={project}
        studioProjectId={project.id}
      />

      <section className="lc-container lc-masthead">
        <div className="lc-row" style={{ justifyContent: "space-between", gap: "1rem", marginBottom: "2rem" }}>
          <div className="lc-mono">Issue 01 · Stories from the city</div>
          <div className="lc-mono">Hackathon MVP Demo</div>
        </div>
        <div className="lc-grid-2" style={{ alignItems: "end" }}>
          <div className="lc-stack" style={{ gap: "1.5rem" }}>
            <div
              className="lc-title"
              style={{
                fontSize: "clamp(4.5rem, 14vw, 11rem)",
                lineHeight: 0.86,
                textTransform: currentMode === "punk" ? "uppercase" : "none",
                fontStyle: currentMode === "fashion" ? "italic" : "normal",
              }}
            >
              {masthead[currentMode]}
            </div>
            <p style={{ maxWidth: "44rem", fontSize: "1.15rem", lineHeight: 1.6, opacity: 0.86 }}>
              London Cuts turns photos, places, time stamps and fragments into a mode-switchable
              public story experience. Browse the atlas, read a finished project, or jump into the
              creator studio happy path.
            </p>
            <div className="lc-row" style={{ gap: "0.8rem", flexWrap: "wrap" }}>
              <Link href={projectPath(project)} className="lc-button lc-button--solid">
                Read the featured story
              </Link>
              <Link href={atlasPath()} className="lc-button">
                Open the atlas
              </Link>
              <Link href={studioProjectPath(project.id)} className="lc-button">
                Enter studio
              </Link>
            </div>
          </div>
          <div className="lc-stack" style={{ gap: "1rem" }}>
            <DisplayAsset asset={coverAsset} ratio="4 / 5" meta={descriptions[currentMode]} />
            <div className="lc-editorial-panel">
              <div className="lc-eyebrow">Current mode</div>
              <div className="lc-title" style={{ fontSize: "2.2rem", marginTop: "0.4rem" }}>
                {currentMode}
              </div>
              <p style={{ marginTop: "0.55rem", color: "var(--ink-2)", lineHeight: 1.6 }}>
                The mode switch changes typography, layout grammar and media treatment across the
                entire public experience.
              </p>
              <div style={{ marginTop: "1rem" }}>
                <ModeSwitcher mode={currentMode} onChange={setMode} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lc-container" style={{ paddingBottom: "3rem" }}>
        <div className="lc-rule" />
      </section>

      <section className="lc-container" style={{ paddingBottom: "4rem" }}>
        <div className="lc-row" style={{ justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div className="lc-eyebrow">Featured this week</div>
          <Link href={atlasPath()} className="lc-mono">
            See all through atlas
          </Link>
        </div>
        <div className="lc-grid-3">
          {featuredStories.map((item) => {
            const asset =
              assetMap.get(item.id === project.id ? coverAsset.id : project.uploadAssetIds[0]) ??
              coverAsset;
            return (
              <StoryCard
                key={item.id}
                href={item.id === project.id ? projectPath(project) : atlasPath()}
                asset={asset}
                eyebrow={`${item.author} · ${item.stops} stops · ${item.borough}`}
                title={item.title}
                meta={item.summary}
              />
            );
          })}
        </div>
      </section>

      <section className="lc-container" style={{ paddingBottom: "4rem" }}>
        <div className="lc-grid-3">
          {[
            {
              title: "Punk",
              body: "Cut-ups, tape, noise, raw street energy and anti-establishment headlines.",
            },
            {
              title: "Fashion",
              body: "Lux editorial pacing, bold crops, elegant serif display and controlled whitespace.",
            },
            {
              title: "Cinema",
              body: "Scene cards, letterbox staging, subtitle cadence and shadow-led sequencing.",
            },
          ].map((item, index) => (
            <motion.button
              key={item.title}
              type="button"
              whileHover={{ y: -4 }}
              onClick={() => setMode(["punk", "fashion", "cinema"][index] as NarrativeMode)}
              className="lc-editorial-panel"
              style={{ textAlign: "left", cursor: "pointer" }}
            >
              <div className="lc-eyebrow">Narrative mode</div>
              <div className="lc-title" style={{ fontSize: "2.4rem", marginTop: "0.55rem" }}>
                {item.title}
              </div>
              <p style={{ marginTop: "0.55rem", color: "var(--ink-2)", lineHeight: 1.65 }}>
                {item.body}
              </p>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AtlasPage() {
  const { currentMode, setMode, state } = useLegacyStudioAdapter();
  const project = state.projects[0];
  const [selectedId, setSelectedId] = useState(EXPLORE_PROJECTS[0]?.id ?? "");

  const selectedProject =
    EXPLORE_PROJECTS.find((item) => item.id === selectedId) ?? EXPLORE_PROJECTS[0];

  return (
    <div className="lc-page" data-mode={currentMode}>
      <PublicNav
        mode={currentMode}
        onModeChange={setMode}
        current="atlas"
        project={project}
        studioProjectId={project.id}
      />

      <section className="lc-container" style={{ paddingBlock: "2.4rem 2rem" }}>
        <div className="lc-row" style={{ justifyContent: "space-between", gap: "1rem", marginBottom: "1.8rem" }}>
          <div className="lc-stack" style={{ gap: "0.65rem" }}>
            <div className="lc-eyebrow">The Atlas</div>
            <div className="lc-title" style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)", lineHeight: 0.94 }}>
              Every cut of London, placed.
            </div>
          </div>
          <div className="lc-editorial-panel" style={{ maxWidth: "26rem" }}>
            <div className="lc-eyebrow">Story overview</div>
            <p style={{ marginTop: "0.65rem", lineHeight: 1.7, color: "var(--ink-2)" }}>
              The atlas is not a utilitarian street map. It is an overview of published narratives,
              clustered around boroughs and river-adjacent moments, with modes as editorial lenses.
            </p>
          </div>
        </div>
        <div className="lc-grid-2" style={{ alignItems: "start" }}>
          <div className="lc-card" style={{ padding: "1rem", position: "relative", overflow: "hidden" }}>
            <svg viewBox="0 0 860 640" style={{ width: "100%", display: "block" }}>
              <rect width="860" height="640" fill="color-mix(in oklab, var(--mode-bg) 75%, white)" />
              {Array.from({ length: 8 }).map((_, index) => (
                <line
                  key={`h-${index}`}
                  x1="0"
                  x2="860"
                  y1={80 + index * 70}
                  y2={80 + index * 70}
                  stroke="color-mix(in oklab, var(--mode-ink) 10%, transparent)"
                  strokeWidth="1"
                />
              ))}
              {Array.from({ length: 10 }).map((_, index) => (
                <line
                  key={`v-${index}`}
                  x1={70 + index * 80}
                  x2={70 + index * 80}
                  y1="0"
                  y2="640"
                  stroke="color-mix(in oklab, var(--mode-ink) 10%, transparent)"
                  strokeWidth="1"
                />
              ))}
              <path
                d="M 0 350 C 150 330, 230 260, 360 305 S 510 430, 660 395 S 760 300, 860 342 L 860 424 C 760 404, 668 360, 574 430 S 372 485, 248 416 S 120 392, 0 430 Z"
                fill="oklch(0.82 0.04 240)"
                opacity="0.42"
              />
              {EXPLORE_PROJECTS.map((item) => {
                const x = 100 + (item.lng + 0.16) * 2600;
                const y = 570 - (item.lat - 51.48) * 2600;
                const active = item.id === selectedProject.id;
                const accent =
                  item.mode === "punk"
                    ? "oklch(0.62 0.24 25)"
                    : item.mode === "fashion"
                      ? "oklch(0.45 0.12 25)"
                      : "oklch(0.22 0.02 250)";
                return (
                  <g
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle cx={x} cy={y} r={active ? 16 : 11} fill="white" stroke={accent} strokeWidth="3" />
                    <circle cx={x} cy={y} r={active ? 5 : 4} fill={accent} />
                    {active ? (
                      <g transform={`translate(${x + 22} ${y - 16})`}>
                        <rect width="222" height="62" fill="white" stroke={accent} />
                        <text x="12" y="22" fontFamily="Bodoni Moda, serif" fontSize="15">
                          {item.title}
                        </text>
                        <text
                          x="12"
                          y="42"
                          fontFamily="JetBrains Mono, monospace"
                          fontSize="10"
                          letterSpacing="1.4"
                          opacity="0.66"
                        >
                          {item.borough.toUpperCase()} · {item.stops} STOPS
                        </text>
                      </g>
                    ) : null}
                  </g>
                );
              })}
              <text x="112" y="118" fontFamily="JetBrains Mono, monospace" fontSize="11">
                SW1
              </text>
              <text x="255" y="490" fontFamily="JetBrains Mono, monospace" fontSize="11">
                SE1
              </text>
              <text x="620" y="250" fontFamily="JetBrains Mono, monospace" fontSize="11">
                E8
              </text>
              <text x="500" y="160" fontFamily="JetBrains Mono, monospace" fontSize="11">
                E1
              </text>
            </svg>
          </div>
          <div className="lc-stack">
            <div className="lc-card" style={{ padding: "1.3rem" }}>
              <div className="lc-eyebrow">Selected borough story</div>
              <div className="lc-title" style={{ fontSize: "2.2rem", marginTop: "0.5rem" }}>
                {selectedProject.title}
              </div>
              <div className="lc-mono" style={{ opacity: 0.65, marginTop: "0.5rem" }}>
                {selectedProject.author} · {selectedProject.mode} · {selectedProject.reads} reads
              </div>
              <p style={{ lineHeight: 1.7, marginTop: "0.85rem", color: "var(--ink-2)" }}>
                {selectedProject.summary}
              </p>
              <div className="lc-row" style={{ gap: "0.8rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <Link
                  href={
                    selectedProject.id === project.id ? projectPath(project) : atlasPath()
                  }
                  className="lc-button lc-button--solid"
                >
                  Open story
                </Link>
                <span className="lc-chip">{selectedProject.borough}</span>
              </div>
            </div>
            <div className="lc-card" style={{ padding: "1.3rem" }}>
              <div className="lc-eyebrow" style={{ marginBottom: "0.8rem" }}>
                Borough index
              </div>
              <div className="lc-stack" style={{ gap: "0.7rem" }}>
                {EXPLORE_PROJECTS.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className="lc-row"
                    style={{
                      justifyContent: "space-between",
                      gap: "1rem",
                      padding: "0.85rem 0",
                      border: 0,
                      borderBottom: "1px solid color-mix(in oklab, var(--mode-ink) 12%, transparent)",
                      background: "transparent",
                      color: "inherit",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div className="lc-row" style={{ gap: "0.9rem" }}>
                      <span className="lc-mono" style={{ opacity: 0.42 }}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <div className="lc-title" style={{ fontSize: "1.25rem" }}>
                          {item.borough}
                        </div>
                        <div style={{ fontSize: "0.95rem", color: "var(--ink-3)" }}>
                          {item.title}
                        </div>
                      </div>
                    </div>
                    <span className="lc-mono" style={{ opacity: 0.58 }}>
                      {item.reads}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lc-container" style={{ paddingBottom: "4rem" }}>
        <div className="lc-row" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
          <div className="lc-eyebrow">Stories in view</div>
          <div className="lc-mono">2,487 projects · 31 boroughs</div>
        </div>
        <div className="lc-grid-4">
          {EXPLORE_PROJECTS.map((item) => (
            <StoryCard
              key={item.id}
              href={item.id === project.id ? projectPath(project) : atlasPath()}
              asset={state.assets.find((asset) => asset.id === project.uploadAssetIds[0]) ?? state.assets[0]}
              eyebrow={`${item.author} · ${item.mode}`}
              title={item.title}
              meta={item.summary}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export function PublicProjectPage({
  authorHandle,
  slug,
}: {
  authorHandle: string;
  slug: string;
}) {
  const { currentMode, setMode } = useLegacyStudioAdapter();
  const project = useResolvedProject(authorHandle, slug);
  const { stops, coverAsset, assetMap } = useProjectAssets(project);

  return (
    <div className="lc-page" data-mode={currentMode}>
      <PublicNav
        mode={currentMode}
        onModeChange={setMode}
        current="project"
        project={project}
        studioProjectId={project.id}
      />
      {currentMode === "punk" ? (
        <PunkProject project={project} stops={stops} coverAssetId={coverAsset.id} />
      ) : currentMode === "cinema" ? (
        <CinemaProject project={project} stops={stops} coverAssetId={coverAsset.id} />
      ) : (
        <FashionProject project={project} stops={stops} coverAssetId={coverAsset.id} />
      )}
      <section className="lc-container" style={{ paddingBottom: "4rem" }}>
        <div className="lc-grid-4">
          <MetricCard label="Reads" value={project.reads.toLocaleString()} note="stable public demo seed" />
          <MetricCard label="Saves" value={project.saves.toString()} note="reader bookmarks" />
          <MetricCard label="Stops" value={project.stopIds.length.toString()} note={project.area} />
          <MetricCard label="Default mode" value={project.defaultMode} note="reader can override" />
        </div>
      </section>
      <section className="lc-container" style={{ paddingBottom: "5rem" }}>
        <div className="lc-row" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
          <div className="lc-eyebrow">All chapters</div>
          <Link href={studioProjectPath(project.id)} className="lc-button">
            See creator studio
          </Link>
        </div>
        <div className="lc-grid-2">
          {stops.map((stop) => (
            <StopInlineLink key={stop.id} project={project} stop={stop}>
              <motion.article whileHover={{ y: -4 }} className="lc-editorial-panel">
                <div className="lc-mono">{stop.number}</div>
                <div className="lc-title" style={{ fontSize: "2rem", marginTop: "0.6rem" }}>
                  {stop.title}
                </div>
                <div className="lc-mono" style={{ opacity: 0.58, marginTop: "0.5rem" }}>
                  {stop.code} · {stop.time} · {stop.mood}
                </div>
                <p style={{ lineHeight: 1.7, marginTop: "0.8rem", color: "var(--ink-2)" }}>
                  {stop.excerpt}
                </p>
                <div style={{ marginTop: "1rem" }}>
                  <DisplayAsset
                    asset={assetMap.get(stop.coverAssetId) ?? coverAsset}
                    ratio="16 / 10"
                    meta={stop.place}
                  />
                </div>
              </motion.article>
            </StopInlineLink>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ChapterPage({
  authorHandle,
  slug,
  stopSlug,
}: {
  authorHandle: string;
  slug: string;
  stopSlug: string;
}) {
  const { currentMode, setMode } = useLegacyStudioAdapter();
  const project = useResolvedProject(authorHandle, slug);
  const { stops, assetMap } = useProjectAssets(project);
  const stop = getStopBySlug(stopSlug, stops) ?? stops[4] ?? stops[0];
  const index = stops.findIndex((item) => item.id === stop.id);
  const previous = index > 0 ? stops[index - 1] : undefined;
  const next = index < stops.length - 1 ? stops[index + 1] : undefined;
  const coverAsset = assetMap.get(stop.coverAssetId) ?? assetMap.values().next().value;

  return (
    <div className="lc-page" data-mode={currentMode}>
      <PublicNav
        mode={currentMode}
        onModeChange={setMode}
        current="chapter"
        project={project}
        studioProjectId={project.id}
      />
      {currentMode === "punk" ? (
        <PunkChapter project={project} stop={stop} />
      ) : currentMode === "cinema" ? (
        <CinemaChapter project={project} stop={stop} />
      ) : (
        <FashionChapter project={project} stop={stop} />
      )}

      <section className="lc-container" style={{ paddingBlock: "2rem 4rem" }}>
        <div className="lc-row" style={{ justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div className="lc-stack" style={{ gap: "0.4rem" }}>
            {previous ? (
              <Link href={chapterPath(project, previous)} className="lc-mono">
                ← Stop {previous.number} · {previous.title}
              </Link>
            ) : (
              <Link href={projectPath(project)} className="lc-mono">
                ← Back to full story
              </Link>
            )}
          </div>
          <Link href={postcardPath(project, stop)} className="lc-button lc-button--solid">
            Open postcard
          </Link>
          <div className="lc-stack" style={{ gap: "0.4rem", textAlign: "right" }}>
            {next ? (
              <Link href={chapterPath(project, next)} className="lc-mono">
                Stop {next.number} · {next.title} →
              </Link>
            ) : (
              <span className="lc-mono" style={{ opacity: 0.54 }}>
                Last stop
              </span>
            )}
          </div>
        </div>
        {coverAsset ? (
          <div style={{ marginTop: "1.4rem" }}>
            <DisplayAsset asset={coverAsset} ratio="21 / 9" meta={stop.excerpt} />
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function PostcardPage({
  authorHandle,
  slug,
  stopSlug,
}: {
  authorHandle: string;
  slug: string;
  stopSlug: string;
}) {
  const adapter = useLegacyStudioAdapter();
  const { currentMode, setMode, state, setActivePostcardVersion } = adapter;
  const project = useResolvedProject(authorHandle, slug);
  const { stops, assetMap } = useProjectAssets(project);
  const stop = getStopBySlug(stopSlug, stops) ?? stops[4] ?? stops[0];
  const [flipped, setFlipped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const asset =
    assetMap.get(
      stop.postcardVersions.find((version) => version.id === stop.activePostcardVersionId)?.sourceAssetId ??
        stop.coverAssetId,
    ) ?? assetMap.get(stop.coverAssetId) ?? state.assets[0];

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://demo.londoncuts.local${postcardPath(project, stop)}`;

  async function downloadPng() {
    if (!stageRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(stageRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${project.slug}-${stop.slug}-postcard.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="lc-page" data-mode={currentMode}>
      <PublicNav
        mode={currentMode}
        onModeChange={setMode}
        current="postcard"
        project={project}
        studioProjectId={project.id}
      />
      <section className="lc-container" style={{ paddingBlock: "2.4rem 4rem" }}>
        <div className="lc-row" style={{ justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <div className="lc-stack" style={{ gap: "0.5rem" }}>
            <div className="lc-eyebrow">Postcard · Stop {stop.number}</div>
            <div className="lc-title" style={{ fontSize: "3.5rem", lineHeight: 0.95 }}>
              Greetings from {stop.place}.
            </div>
          </div>
          <div className="lc-row" style={{ gap: "0.7rem", flexWrap: "wrap" }}>
            <button type="button" className="lc-button" onClick={() => setFlipped((value) => !value)}>
              Flip card
            </button>
            <button type="button" className="lc-button" onClick={downloadPng} disabled={downloading}>
              {downloading ? "Exporting…" : "Download PNG"}
            </button>
            <button
              type="button"
              className="lc-button lc-button--solid"
              onClick={() => navigator.clipboard.writeText(shareUrl)}
            >
              Copy share link
            </button>
          </div>
        </div>

        <div className="lc-grid-2" style={{ alignItems: "start" }}>
          <div className="lc-card" style={{ padding: "2rem" }}>
            <div ref={stageRef} className="lc-postcard-stage">
              <div className="lc-postcard-card" data-flipped={flipped}>
                <div className="lc-postcard-face">
                  <PostcardFront mode={currentMode} stop={stop} asset={asset} />
                </div>
                <div className="lc-postcard-face lc-postcard-face--back">
                  <PostcardBack project={project} stop={stop} shareUrl={shareUrl} />
                </div>
              </div>
            </div>
            <div className="lc-row" style={{ justifyContent: "center", gap: "0.6rem", marginTop: "1rem" }}>
              <span className="lc-mono">{flipped ? "Back" : "Front"}</span>
              <span className="lc-mono" style={{ opacity: 0.35 }}>
                ·
              </span>
              <span className="lc-mono">PNG export ready</span>
            </div>
          </div>

          <div className="lc-stack">
            <div className="lc-card" style={{ padding: "1.35rem" }}>
              <div className="lc-eyebrow">Generated from</div>
              <div className="lc-title" style={{ fontSize: "2rem", marginTop: "0.5rem" }}>
                {stop.title}
              </div>
              <div className="lc-mono" style={{ opacity: 0.6, marginTop: "0.5rem" }}>
                {project.title} · {project.authorName}
              </div>
              <p style={{ lineHeight: 1.7, marginTop: "0.8rem", color: "var(--ink-2)" }}>
                {stop.excerpt}
              </p>
            </div>
            <div className="lc-card" style={{ padding: "1.35rem" }}>
              <div className="lc-eyebrow">Versions</div>
              <div className="lc-stack" style={{ gap: "0.7rem", marginTop: "0.8rem" }}>
                {stop.postcardVersions.length ? (
                  stop.postcardVersions
                    .slice()
                    .reverse()
                    .map((version) => (
                      <button
                        key={version.id}
                        type="button"
                        onClick={() => setActivePostcardVersion(stop.id, version.id)}
                        className="lc-editorial-panel"
                        style={{
                          textAlign: "left",
                          cursor: "pointer",
                          background:
                            version.id === stop.activePostcardVersionId ? "white" : "var(--mode-surface)",
                        }}
                      >
                        <div className="lc-row" style={{ justifyContent: "space-between", gap: "1rem" }}>
                          <div className="lc-mono">{version.label}</div>
                          {version.id === stop.activePostcardVersionId ? (
                            <span className="lc-chip">active</span>
                          ) : null}
                        </div>
                        <div style={{ marginTop: "0.35rem", color: "var(--ink-2)" }}>{version.note}</div>
                      </button>
                    ))
                ) : (
                  <div className="lc-editorial-panel">
                    <div className="lc-mono">Missing postcard</div>
                    <div style={{ marginTop: "0.4rem", color: "var(--ink-3)" }}>
                      This stop is intentionally left missing to exercise the publish checklist.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PunkProject({
  project,
  stops,
  coverAssetId,
}: {
  project: Project;
  stops: StoryStop[];
  coverAssetId: string;
}) {
  const { state } = useLegacyStudioAdapter();
  const asset = state.assets.find((item) => item.id === coverAssetId) ?? state.assets[0];
  return (
    <section className="lc-container" style={{ paddingBlock: "2.2rem 4rem" }}>
      <div className="lc-stack" style={{ gap: "2rem" }}>
        <div style={{ position: "relative", minHeight: "25rem" }}>
          <div className="lc-mono" style={{ background: "black", color: "white", display: "inline-block", padding: "0.5rem 0.75rem", transform: "rotate(-3deg)" }}>
            Issue 01 // SE1
          </div>
          <div
            className="lc-title"
            style={{
              fontSize: "clamp(4rem, 12vw, 9rem)",
              textTransform: "uppercase",
              lineHeight: 0.82,
              marginTop: "1rem",
            }}
          >
            <span style={{ background: "black", color: "white", paddingInline: "0.15em" }}>A Year</span>
            <br />
            <span style={{ display: "inline-block", transform: "rotate(-1deg)", marginLeft: "0.8em" }}>
              in
            </span>{" "}
            <span style={{ background: "var(--mode-accent)", color: "white", paddingInline: "0.15em" }}>
              SE1!!
            </span>
          </div>
          <div style={{ position: "absolute", right: 0, top: "3rem", width: "min(18rem, 36vw)", transform: "rotate(4deg)" }}>
            <DisplayAsset asset={asset} ratio="3 / 4" meta={`${project.authorName} · 10 cuts`} />
          </div>
        </div>
        <div className="lc-grid-2" style={{ alignItems: "start" }}>
          <div className="lc-stack" style={{ gap: "0.7rem" }}>
            {stops.map((stop) => (
              <Link
                key={stop.id}
                href={chapterPath(project, stop)}
                className="lc-row"
                style={{
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  paddingBlock: "0.9rem",
                  borderBottom: "1px dashed currentColor",
                }}
              >
                <div className="lc-row" style={{ gap: "0.9rem", alignItems: "baseline" }}>
                  <span className="lc-title" style={{ fontSize: "2rem" }}>
                    {stop.number}
                  </span>
                  <span style={{ fontFamily: "var(--f-hand)", fontSize: "1.9rem" }}>{stop.title}</span>
                </div>
                <span className="lc-mono">{stop.code} · {stop.time}</span>
              </Link>
            ))}
          </div>
          <div className="lc-editorial-panel" style={{ background: "white" }}>
            <div className="lc-title" style={{ fontSize: "2.2rem", textTransform: "uppercase" }}>
              A year. Ten walks.
            </div>
            <p style={{ marginTop: "0.75rem", lineHeight: 1.7 }}>
              {project.description}
            </p>
            <p style={{ marginTop: "1rem", lineHeight: 1.7 }}>
              Not a list. Not a guide. A zine about staying inside a place long enough for it to
              start answering back.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FashionProject({
  project,
  stops,
  coverAssetId,
}: {
  project: Project;
  stops: StoryStop[];
  coverAssetId: string;
}) {
  const { state } = useLegacyStudioAdapter();
  const asset = state.assets.find((item) => item.id === coverAssetId) ?? state.assets[0];
  return (
    <section className="lc-container" style={{ paddingBlock: "4rem 4.5rem" }}>
      <div className="lc-grid-2" style={{ alignItems: "center" }}>
        <div className="lc-stack" style={{ gap: "1rem" }}>
          <div className="lc-eyebrow">Cover story</div>
          <div className="lc-title" style={{ fontSize: "clamp(4.4rem, 10vw, 7.8rem)", fontStyle: "italic", lineHeight: 0.92 }}>
            {project.title}
          </div>
          <div style={{ maxWidth: "28rem", fontSize: "1.1rem", lineHeight: 1.7, color: "var(--ink-2)" }}>
            {project.subtitle}
          </div>
          <div className="lc-row" style={{ gap: "0.8rem", flexWrap: "wrap" }}>
            <Link href={chapterPath(project, stops[4] ?? stops[0])} className="lc-button lc-button--solid">
              Read the walk
            </Link>
            <span className="lc-chip">{project.duration}</span>
          </div>
        </div>
        <DisplayAsset asset={asset} ratio="4 / 5" meta={project.coverLabel} />
      </div>

      <div className="lc-grid-4" style={{ marginTop: "2rem" }}>
        <MetricCard label="Author" value={project.authorName} />
        <MetricCard label="Stops" value={`${project.stopIds.length}`} note={project.area} />
        <MetricCard label="Mode" value="Fashion" note="Reader can switch live" />
        <MetricCard label="Reading time" value={project.duration} />
      </div>

      <div style={{ paddingBlock: "4.5rem 2rem", textAlign: "center" }}>
        <div className="lc-title" style={{ fontSize: "clamp(2.8rem, 5vw, 4.4rem)", fontStyle: "italic", maxWidth: "56rem", margin: "0 auto", lineHeight: 1.12 }}>
          “The river is the only thing in London that tells the time.”
        </div>
      </div>
    </section>
  );
}

function CinemaProject({
  project,
  stops,
  coverAssetId,
}: {
  project: Project;
  stops: StoryStop[];
  coverAssetId: string;
}) {
  const { state } = useLegacyStudioAdapter();
  const asset = state.assets.find((item) => item.id === coverAssetId) ?? state.assets[0];
  return (
    <section style={{ background: "var(--mode-bg)" }}>
      <div className="lc-container" style={{ paddingBlock: "2rem 3rem" }}>
        <div className="lc-card" style={{ background: "black", padding: "1rem", overflow: "hidden" }}>
          <div style={{ position: "relative" }}>
            <DisplayAsset asset={asset} ratio="21 / 9" meta="Cold open · SE1 · 06:34" />
            <div style={{ position: "absolute", insetInline: 0, top: 0, height: "3rem", background: "black" }} />
            <div style={{ position: "absolute", insetInline: 0, bottom: 0, height: "4rem", background: "black" }} />
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <div style={{ textAlign: "center", color: "white" }}>
                <div className="lc-mono" style={{ opacity: 0.65, marginBottom: "1rem" }}>
                  London Cuts presents
                </div>
                <div className="lc-title" style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}>
                  {project.title}
                </div>
                <div className="lc-mono" style={{ opacity: 0.65, marginTop: "1rem" }}>
                  Directed by {project.authorName} · {stops.length} scenes
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lc-stack" style={{ gap: "1rem", marginTop: "2rem" }}>
          {stops.map((stop) => (
            <Link
              key={stop.id}
              href={chapterPath(project, stop)}
              className="lc-card"
              style={{
                display: "grid",
                gridTemplateColumns: "96px 280px minmax(0, 1fr)",
                gap: "1.25rem",
                padding: "1rem",
                background: "color-mix(in oklab, var(--mode-surface) 86%, black)",
              }}
            >
              <div>
                <div className="lc-mono" style={{ opacity: 0.6 }}>
                  Scene
                </div>
                <div className="lc-title" style={{ fontSize: "2rem", marginTop: "0.35rem" }}>
                  {stop.number}
                </div>
              </div>
              <DisplayAsset
                asset={state.assets.find((item) => item.id === stop.coverAssetId) ?? asset}
                ratio="16 / 9"
                meta={stop.place}
              />
              <div>
                <div className="lc-title" style={{ fontSize: "2rem" }}>
                  {stop.title}
                </div>
                <div className="lc-mono" style={{ opacity: 0.58, marginTop: "0.45rem" }}>
                  EXT · {stop.code} · {stop.time} · {stop.mood.toUpperCase()}
                </div>
                <p style={{ lineHeight: 1.7, marginTop: "0.8rem", color: "color-mix(in oklab, var(--mode-ink) 78%, transparent)" }}>
                  {stop.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PunkChapter({ project, stop }: { project: Project; stop: StoryStop }) {
  const { state } = useLegacyStudioAdapter();
  const asset = state.assets.find((item) => item.id === stop.coverAssetId) ?? state.assets[0];
  return (
    <section className="lc-container" style={{ paddingBlock: "2.4rem 3rem" }}>
      <div className="lc-row" style={{ justifyContent: "space-between", marginBottom: "1rem", gap: "1rem" }}>
        <div className="lc-mono" style={{ background: "black", color: "white", padding: "0.4rem 0.6rem" }}>
          Stop {stop.number} / {project.stopIds.length}
        </div>
        <div className="lc-mono">{stop.code} · {stop.time} · {stop.mood}</div>
      </div>
      <div className="lc-title" style={{ fontSize: "clamp(4rem, 10vw, 7rem)", textTransform: "uppercase", lineHeight: 0.9 }}>
        <span style={{ background: "var(--mode-accent)", color: "white", paddingInline: "0.15em" }}>
          {stop.place}
        </span>
        <br />
        <span style={{ marginLeft: "0.8em" }}>{stop.title.replace(`${stop.place}, `, "")}</span>
      </div>
      <div className="lc-grid-2" style={{ marginTop: "2rem", alignItems: "start" }}>
        <DisplayAsset asset={asset} ratio="16 / 10" meta={stop.label} />
        <div className="lc-editorial-panel" style={{ fontFamily: "var(--f-mono)", lineHeight: 1.8 }}>
          <p>{stop.story}</p>
          <div className="lc-title" style={{ fontSize: "2rem", textTransform: "uppercase", marginTop: "1rem" }}>
            {stop.excerpt}
          </div>
        </div>
      </div>
    </section>
  );
}

function FashionChapter({ project: _project, stop }: { project: Project; stop: StoryStop }) {
  const { state } = useLegacyStudioAdapter();
  const asset = state.assets.find((item) => item.id === stop.coverAssetId) ?? state.assets[0];
  return (
    <section className="lc-container" style={{ paddingBlock: "4rem 3rem" }}>
      <div style={{ maxWidth: "46rem", margin: "0 auto", textAlign: "center" }}>
        <div className="lc-mono" style={{ opacity: 0.58 }}>
          Chapter {stop.number} · {stop.code} · {stop.time}
        </div>
        <div className="lc-title" style={{ fontSize: "clamp(3.6rem, 9vw, 6rem)", fontStyle: "italic", marginTop: "1rem", lineHeight: 1 }}>
          {stop.title}
        </div>
      </div>
      <div style={{ marginTop: "2.2rem" }}>
        <DisplayAsset asset={asset} ratio="21 / 9" meta={stop.place} />
      </div>
      <div style={{ maxWidth: "46rem", margin: "3rem auto 0" }}>
        <div className="lc-title" style={{ fontSize: "2rem", fontStyle: "italic", color: "var(--ink-2)", lineHeight: 1.35 }}>
          {stop.excerpt}
        </div>
        <p style={{ marginTop: "1.25rem", lineHeight: 1.8 }}>{stop.story}</p>
      </div>
    </section>
  );
}

function CinemaChapter({ project: _project, stop }: { project: Project; stop: StoryStop }) {
  const { state } = useLegacyStudioAdapter();
  const asset = state.assets.find((item) => item.id === stop.coverAssetId) ?? state.assets[0];
  const shots = [
    "Wide · South look · dusk",
    "Mid · St Paul's through rail",
    "Insert · Bridge lamp · on",
    "Tracking · Following her",
  ];
  return (
    <section className="lc-container" style={{ paddingBlock: "2.4rem 3rem" }}>
      <div className="lc-card" style={{ padding: "1rem 1.2rem", background: "color-mix(in oklab, var(--mode-surface) 84%, black)" }}>
        <div className="lc-grid-4">
          {[
            ["Scene", stop.number],
            ["Location", stop.place],
            ["Time", stop.time],
            ["Mood", stop.mood],
          ].map(([key, value]) => (
            <div key={key}>
              <div className="lc-mono" style={{ opacity: 0.55 }}>{key}</div>
              <div className="lc-title" style={{ fontSize: "1.5rem", marginTop: "0.3rem" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="lc-title" style={{ fontSize: "clamp(3.4rem, 8vw, 5.6rem)", marginTop: "1.4rem" }}>
        {stop.title}
      </div>
      <div className="lc-stack" style={{ gap: "2rem", marginTop: "2rem" }}>
        {shots.map((shot, index) => (
          <div key={shot}>
            <div className="lc-row" style={{ justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <div className="lc-mono">Shot {String(index + 1).padStart(2, "0")}</div>
              <div className="lc-mono">{shot}</div>
            </div>
            <div style={{ position: "relative" }}>
              <DisplayAsset asset={asset} ratio="21 / 9" meta={shot} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: "1.4rem", display: "flex", justifyContent: "center" }}>
                <div className="lc-mono" style={{ background: "rgb(0 0 0 / 0.62)", color: "var(--mode-accent)", padding: "0.55rem 0.8rem" }}>
                  {index === 2 ? stop.excerpt : stop.story}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PostcardFront({
  mode,
  stop,
  asset,
}: {
  mode: NarrativeMode;
  stop: StoryStop;
  asset: { id: string; label: string; title: string; tone: string; kind: string; src?: string; caption?: string };
}) {
  if (mode === "punk") {
    return (
      <div style={{ height: "100%", background: "black", position: "relative" }}>
        <DisplayAsset asset={asset as Parameters<typeof DisplayAsset>[0]["asset"]} ratio="7 / 5" meta={stop.place} />
        <div style={{ position: "absolute", top: "1rem", left: "1rem", background: "var(--mode-accent)", color: "white", padding: "0.45rem 0.6rem", fontFamily: "var(--f-display)", transform: "rotate(-4deg)" }}>
          {stop.code}
        </div>
        <div style={{ position: "absolute", bottom: "1rem", left: "1rem", right: "1rem", color: "white" }}>
          <div className="lc-title" style={{ fontSize: "3rem", textTransform: "uppercase", lineHeight: 0.85 }}>
            Greetings
            <br />
            from {stop.place}
          </div>
        </div>
      </div>
    );
  }

  if (mode === "cinema") {
    return (
      <div style={{ height: "100%", background: "black", position: "relative" }}>
        <DisplayAsset asset={asset as Parameters<typeof DisplayAsset>[0]["asset"]} ratio="7 / 5" meta={stop.place} />
        <div style={{ position: "absolute", insetInline: 0, top: 0, height: "2rem", background: "black" }} />
        <div style={{ position: "absolute", insetInline: 0, bottom: 0, height: "2.5rem", background: "black" }} />
        <div style={{ position: "absolute", left: "1rem", top: "2.5rem" }} className="lc-mono">
          {stop.code} · Scene {stop.number}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: "3.1rem", display: "flex", justifyContent: "center" }}>
          <div className="lc-mono" style={{ background: "rgb(0 0 0 / 0.6)", color: "var(--mode-accent)", padding: "0.45rem 0.7rem" }}>
            {stop.excerpt}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", height: "100%", background: "var(--mode-bg)" }}>
      <div style={{ padding: "1.4rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div className="lc-mono">{stop.code}</div>
        <div>
          <div className="lc-title" style={{ fontSize: "3rem", fontStyle: "italic", lineHeight: 0.95 }}>
            {stop.place}
          </div>
          <div className="lc-mono" style={{ opacity: 0.56, marginTop: "0.5rem" }}>
            {stop.time} · Stop {stop.number}
          </div>
        </div>
      </div>
      <DisplayAsset asset={asset as Parameters<typeof DisplayAsset>[0]["asset"]} ratio="7 / 5" meta={stop.label} />
    </div>
  );
}

function PostcardBack({
  project,
  stop,
  shareUrl,
}: {
  project: Project;
  stop: StoryStop;
  shareUrl: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.25fr 0.95fr",
        gap: "1rem",
        height: "100%",
        padding: "1.4rem",
        background: "var(--paper-2)",
        color: "var(--ink)",
      }}
    >
      <div style={{ borderRight: "1px solid var(--rule)", paddingRight: "1rem", display: "grid", gap: "0.8rem" }}>
        <div style={{ fontFamily: "var(--f-hand)", fontSize: "1.65rem", lineHeight: 1.45 }}>
          Matteo —
          <br />
          walked home across {stop.place} last night. The river caught. Six minutes of gold, then
          nothing.
          <br />
          <br />
          — A.
        </div>
        <div className="lc-qrcode">
          <QRCodeSVG value={shareUrl} size={88} />
        </div>
        <div className="lc-mono" style={{ opacity: 0.6 }}>
          QR back-link to {project.title}
        </div>
      </div>
      <div style={{ display: "grid", alignContent: "space-between" }}>
        <div className="lc-stack" style={{ gap: "0.45rem" }}>
          <div className="lc-mono">London Cuts · Ed. 01</div>
          <AddressLine text="Matteo Ricci" />
          <AddressLine text="Rua das Flores 28" />
          <AddressLine text="1200-195 Lisboa" />
          <AddressLine text="Portugal" />
        </div>
        <div
          className="lc-mono"
          style={{
            width: "4.5rem",
            justifySelf: "end",
            textAlign: "center",
            border: "1px dashed var(--ink-3)",
            padding: "0.45rem",
          }}
        >
          1st
          <br />
          class
          <br />
          {stop.code}
        </div>
      </div>
    </div>
  );
}

function AddressLine({ text }: { text: string }) {
  return (
    <div
      style={{
        borderBottom: "1px solid color-mix(in oklab, var(--ink) 22%, transparent)",
        paddingBottom: "0.3rem",
      }}
    >
      {text}
    </div>
  );
}
