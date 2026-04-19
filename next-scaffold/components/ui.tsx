"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { atlasPath, chapterPath, postcardPath, projectPath, studioProjectPath } from "@/lib/routes";
import type {
  Asset,
  AssetTone,
  NarrativeMode,
  Project,
  StoryStop,
} from "@/lib/types";

const MODES: NarrativeMode[] = ["punk", "fashion", "cinema"];

export function Roundel() {
  return <span className="lc-roundel" aria-hidden="true" />;
}

export function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: NarrativeMode;
  onChange: (mode: NarrativeMode) => void;
}) {
  return (
    <div className="lc-mode-switcher" role="radiogroup" aria-label="Narrative mode">
      {MODES.map((item) => (
        <button
          key={item}
          type="button"
          role="radio"
          aria-checked={mode === item}
          data-active={mode === item}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function DisplayAsset({
  asset,
  ratio = "3 / 2",
  meta,
}: {
  asset: Asset;
  ratio?: string;
  meta?: string;
}) {
  const tone: AssetTone = asset.tone ?? "neutral";
  return (
    <div className="lc-asset" data-tone={tone} style={{ aspectRatio: ratio }}>
      {asset.kind === "video" || asset.kind === "generated-video" ? (
        asset.src ? (
          <video src={asset.src} muted playsInline />
        ) : null
      ) : asset.src ? (
        <img src={asset.src} alt={asset.title} />
      ) : null}
      <div className="lc-asset__overlay">
        <div className="lc-asset__label">{asset.label}</div>
        <div className="lc-asset__meta">{meta ?? asset.caption ?? asset.title}</div>
      </div>
    </div>
  );
}

export function PublicNav({
  mode,
  onModeChange,
  current,
  project,
  studioProjectId,
}: {
  mode: NarrativeMode;
  onModeChange: (mode: NarrativeMode) => void;
  current: "landing" | "atlas" | "project" | "chapter" | "postcard";
  project: Pick<Project, "authorHandle" | "slug">;
  studioProjectId?: string;
}) {
  const projectHref = projectPath(project);
  return (
    <header className="lc-public-nav">
      <div className="lc-container lc-public-nav__inner">
        <div className="lc-toolbar-row" style={{ gap: "0.9rem" }}>
          <Roundel />
          <Link href="/" className="lc-mono" style={{ fontSize: "0.9rem" }}>
            London Cuts
          </Link>
          <span className="lc-mono" style={{ opacity: 0.45 }}>
            Ed. 01
          </span>
        </div>
        <div className="lc-toolbar-row" style={{ gap: "0.9rem" }}>
          <NavLink href="/" active={current === "landing"}>
            Index
          </NavLink>
          <NavLink href={atlasPath()} active={current === "atlas"}>
            Atlas
          </NavLink>
          <NavLink href={projectHref} active={current === "project" || current === "chapter"}>
            Story
          </NavLink>
          <NavLink
            href={postcardPath(project, { slug: "waterloo-bridge-facing-east" })}
            active={current === "postcard"}
          >
            Postcard
          </NavLink>
          <ModeSwitcher mode={mode} onChange={onModeChange} />
          <Link
            href={studioProjectPath(studioProjectId ?? "project-se1")}
            className="lc-button lc-button--solid"
            style={{ paddingBlock: "0.7rem" }}
          >
            Studio
          </Link>
        </div>
      </div>
    </header>
  );
}

export function StudioShell({
  title,
  eyebrow,
  actions,
  project,
  children,
  current,
}: {
  title: string;
  eyebrow: string;
  actions?: React.ReactNode;
  project: Project;
  children: React.ReactNode;
  current:
    | "dashboard"
    | "new"
    | "upload"
    | "organize"
    | "editor"
    | "media"
    | "publish";
}) {
  const base = studioProjectPath(project.id);
  const navItems = [
    { id: "dashboard", label: "Projects", href: "/studio" },
    { id: "new", label: "New Project", href: "/studio/new" },
    { id: "upload", label: "Upload Memories", href: `${base}/upload` },
    { id: "organize", label: "Organize Stops", href: `${base}/organize` },
    { id: "editor", label: "Story Editor", href: `${base}/editor` },
    { id: "media", label: "Media Panel", href: `${base}/media` },
    { id: "publish", label: "Publish", href: `${base}/publish` },
  ] as const;

  return (
    <div className="lc-studio-shell">
      <aside className="lc-studio-sidebar">
        <div className="lc-stack" style={{ gap: "1.5rem" }}>
          <div className="lc-stack" style={{ gap: "0.35rem" }}>
            <div className="lc-toolbar-row" style={{ gap: "0.75rem" }}>
              <Roundel />
              <div className="lc-mono">Studio</div>
            </div>
            <div className="lc-mono" style={{ opacity: 0.5 }}>
              {project.authorName} · {project.title}
            </div>
          </div>
          <div className="lc-stack" style={{ gap: "0.5rem" }}>
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="lc-editorial-panel"
                style={{
                  padding: "0.9rem 1rem",
                  background: current === item.id ? "white" : "transparent",
                  borderColor:
                    current === item.id ? "color-mix(in oklab, var(--ink) 26%, transparent)" : "transparent",
                }}
              >
                <div className="lc-mono" style={{ opacity: current === item.id ? 1 : 0.62 }}>
                  {item.label}
                </div>
              </Link>
            ))}
          </div>
          <Link href={projectPath(project)} className="lc-button">
            Open public story
          </Link>
        </div>
      </aside>
      <main className="lc-studio-main">
        <div className="lc-studio-topbar">
          <div
            className="lc-container"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              minHeight: "4.6rem",
              alignItems: "center",
            }}
          >
            <div className="lc-stack" style={{ gap: "0.3rem" }}>
              <div className="lc-eyebrow">{eyebrow}</div>
              <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>{title}</div>
            </div>
            <div className="lc-toolbar-row" style={{ gap: "0.75rem" }}>
              {actions}
            </div>
          </div>
        </div>
        <div className="lc-container" style={{ paddingBlock: "1.8rem 3rem" }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="lc-card" style={{ padding: "1.25rem 1.4rem" }}>
      <div className="lc-eyebrow">{label}</div>
      <div
        className="lc-title"
        style={{ fontSize: "2rem", marginTop: "0.35rem", letterSpacing: "-0.04em" }}
      >
        {value}
      </div>
      {note ? (
        <div style={{ marginTop: "0.25rem", color: "var(--ink-3)", fontSize: "0.9rem" }}>{note}</div>
      ) : null}
    </div>
  );
}

export function StoryCard({
  href,
  asset,
  title,
  eyebrow,
  meta,
}: {
  href: string;
  asset: Asset;
  title: string;
  eyebrow: string;
  meta: string;
}) {
  return (
    <motion.article whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
      <Link href={href} className="lc-stack" style={{ gap: "0.75rem" }}>
        <DisplayAsset asset={asset} ratio="4 / 3" meta={meta} />
        <div className="lc-eyebrow">{eyebrow}</div>
        <div className="lc-title" style={{ fontSize: "1.8rem", lineHeight: 0.95 }}>
          {title}
        </div>
      </Link>
    </motion.article>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="lc-mono"
      style={{ opacity: active ? 1 : 0.58, fontSize: "0.74rem" }}
    >
      {children}
    </Link>
  );
}

export function StopInlineLink({
  project,
  stop,
  children,
}: {
  project: Pick<Project, "authorHandle" | "slug">;
  stop: Pick<StoryStop, "slug">;
  children: React.ReactNode;
}) {
  return <Link href={chapterPath(project, stop)}>{children}</Link>;
}
