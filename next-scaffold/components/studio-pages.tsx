"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { chapterPath, projectPath } from "@/lib/routes";
import { useDemoStore } from "@/providers/demo-store-provider";
import type { NarrativeMode, StoryStop, Visibility } from "@/lib/types";
import { DisplayAsset, MetricCard, ModeSwitcher, StudioShell } from "@/components/ui";

function useStudioProject(projectId?: string) {
  const store = useDemoStore();
  const syncProject = useEffectEvent((id: string) => {
    store.selectProject(id);
  });

  useEffect(() => {
    if (projectId) {
      syncProject(projectId);
    }
  }, [projectId]);

  return store;
}

export function StudioDashboardPage() {
  const { state, activeProject, currentMode, setMode } = useStudioProject();
  const published = state.projects.filter((project) => project.status === "published");
  const recentJobs = state.mediaJobs.slice(0, 6);

  return (
    <StudioShell
      title="Projects"
      eyebrow="Studio"
      project={activeProject}
      current="dashboard"
      actions={
        <>
          <ModeSwitcher mode={currentMode} onChange={setMode} />
          <Link href="/studio/new" className="lc-button lc-button--solid">
            + New project
          </Link>
        </>
      }
    >
      <div className="lc-grid-4">
        <MetricCard label="Active projects" value={`${state.projects.length}`} />
        <MetricCard label="Drafts" value={`${state.projects.filter((project) => project.status === "draft").length}`} />
        <MetricCard label="Published" value={`${published.length}`} />
        <MetricCard
          label="Media jobs"
          value={`${state.mediaJobs.length}`}
          note={`${state.mediaJobs.filter((job) => job.state === "running").length} running`}
        />
      </div>

      <section style={{ marginTop: "2.4rem" }}>
        <div className="lc-row" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
          <div className="lc-title" style={{ fontSize: "2rem" }}>
            In progress
          </div>
          <div className="lc-mono">Happy path demo state</div>
        </div>
        <div className="lc-grid-3">
          {state.projects.map((project) => (
            <motion.article key={project.id} whileHover={{ y: -4 }} className="lc-card" style={{ padding: "1.2rem" }}>
              <div className="lc-row" style={{ justifyContent: "space-between", gap: "1rem" }}>
                <div>
                  <div className="lc-title" style={{ fontSize: "1.8rem" }}>
                    {project.title}
                  </div>
                  <div className="lc-mono" style={{ opacity: 0.6, marginTop: "0.4rem" }}>
                    {project.area} · {project.defaultMode}
                  </div>
                </div>
                <span className="lc-chip">{project.status.replace("_", " ")}</span>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <div style={{ height: "0.4rem", background: "var(--paper-3)" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(96, 28 + project.stopIds.length * 6)}%`,
                      background: "var(--ink)",
                    }}
                  />
                </div>
              </div>
              <div className="lc-row" style={{ gap: "0.7rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <Link href={`/studio/${project.id}/editor`} className="lc-button lc-button--solid">
                  Open editor
                </Link>
                <Link href={`/studio/${project.id}/publish`} className="lc-button">
                  Publish
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "2.4rem" }}>
        <div className="lc-grid-2">
          <div className="lc-card" style={{ padding: "1.25rem" }}>
            <div className="lc-title" style={{ fontSize: "1.8rem" }}>
              Recent media activity
            </div>
            <div className="lc-stack" style={{ gap: "0.75rem", marginTop: "1rem" }}>
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="lc-row"
                  style={{
                    justifyContent: "space-between",
                    gap: "1rem",
                    paddingBottom: "0.7rem",
                    borderBottom: "1px solid var(--rule)",
                  }}
                >
                  <div>
                    <div className="lc-mono">{job.kind}</div>
                    <div style={{ marginTop: "0.35rem" }}>{job.prompt}</div>
                  </div>
                  <span className="lc-chip">{job.state}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lc-card" style={{ padding: "1.25rem" }}>
            <div className="lc-title" style={{ fontSize: "1.8rem" }}>
              Published
            </div>
            <div className="lc-stack" style={{ gap: "0.75rem", marginTop: "1rem" }}>
              {published.length ? (
                published.map((project) => (
                  <Link
                    key={project.id}
                    href={projectPath(project)}
                    className="lc-row"
                    style={{
                      justifyContent: "space-between",
                      gap: "1rem",
                      paddingBottom: "0.7rem",
                      borderBottom: "1px solid var(--rule)",
                    }}
                  >
                    <div>
                      <div className="lc-title" style={{ fontSize: "1.4rem" }}>
                        {project.title}
                      </div>
                      <div className="lc-mono" style={{ opacity: 0.58, marginTop: "0.3rem" }}>
                        {project.publishedAt}
                      </div>
                    </div>
                    <span className="lc-chip">{project.visibility}</span>
                  </Link>
                ))
              ) : (
                <div className="lc-editorial-panel">
                  Nothing published yet from this demo state. Use the publish page to flip the
                  active project live.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </StudioShell>
  );
}

export function CreateProjectPage() {
  const router = useRouter();
  const { activeProject, currentMode, setMode, createProject } = useStudioProject();
  const [title, setTitle] = useState("A Weekend in W1");
  const [subtitle, setSubtitle] = useState("Four midnight-to-morning cuts between Soho and Fitzrovia");
  const [area, setArea] = useState("W1 — Soho / Fitzrovia");
  const [mode, setLocalMode] = useState<NarrativeMode>("cinema");

  return (
    <StudioShell
      title="New project"
      eyebrow="Studio › New project"
      project={activeProject}
      current="new"
      actions={
        <>
          <ModeSwitcher mode={currentMode} onChange={setMode} />
          <button
            type="button"
            className="lc-button lc-button--solid"
            onClick={() => {
              const projectId = createProject({ title, subtitle, area, defaultMode: mode });
              router.push(`/studio/${projectId}/upload`);
            }}
          >
            Continue to upload
          </button>
        </>
      }
    >
      <div style={{ maxWidth: "60rem", margin: "0 auto" }}>
        <div className="lc-row" style={{ gap: "0.8rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          {["Details", "Mode", "Cover", "Review"].map((step, index) => (
            <div key={step} className="lc-row" style={{ gap: "0.6rem", alignItems: "center" }}>
              <span className="lc-chip">{index + 1}</span>
              <span className="lc-mono">{step}</span>
            </div>
          ))}
        </div>
        <div className="lc-title" style={{ fontSize: "3.2rem", marginBottom: "0.8rem" }}>
          Start a new cut of London.
        </div>
        <p style={{ maxWidth: "44rem", color: "var(--ink-2)", lineHeight: 1.7, marginBottom: "2rem" }}>
          This page creates a real project record in the demo store, sets its default mode, and
          immediately routes the user into the upload / organize / editor happy path.
        </p>
        <div className="lc-stack" style={{ gap: "1.4rem" }}>
          <Field label="Working title">
            <input value={title} onChange={(event) => setTitle(event.target.value)} style={fieldStyle} />
          </Field>
          <Field label="One-line description">
            <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} style={fieldStyle} />
          </Field>
          <Field label="Primary area">
            <input value={area} onChange={(event) => setArea(event.target.value)} style={fieldStyle} />
          </Field>
          <Field label="Narrative mode">
            <div className="lc-grid-3">
              {(["punk", "fashion", "cinema"] as NarrativeMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className="lc-editorial-panel"
                  onClick={() => setLocalMode(item)}
                  style={{
                    textAlign: "left",
                    background: mode === item ? "white" : "var(--paper-2)",
                    borderColor: mode === item ? "var(--ink)" : "var(--rule)",
                  }}
                >
                  <div className="lc-title" style={{ fontSize: "1.8rem", textTransform: item === "punk" ? "uppercase" : "none" }}>
                    {item}
                  </div>
                  <p style={{ marginTop: "0.55rem", color: "var(--ink-2)", lineHeight: 1.65 }}>
                    {item === "punk"
                      ? "Zine energy, sharper copy, noisier image treatment."
                      : item === "fashion"
                        ? "Editorial luxury, slower rhythm, whitespace-driven spreads."
                        : "Scene sequencing, subtitle rhythm, darker motion language."}
                  </p>
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>
    </StudioShell>
  );
}

export function UploadPage({ projectId }: { projectId: string }) {
  const { activeProject, currentMode, setMode, addUploads, uploadSummary, state } =
    useStudioProject(projectId);

  const uploadAssets = useMemo(
    () =>
      activeProject.uploadAssetIds
        .map((assetId) => state.assets.find((asset) => asset.id === assetId))
        .filter((asset) => Boolean(asset)),
    [activeProject.uploadAssetIds, state.assets],
  );

  return (
    <StudioShell
      title="Upload memory set"
      eyebrow={`${activeProject.title} › Upload`}
      project={activeProject}
      current="upload"
      actions={
        <>
          <ModeSwitcher mode={currentMode} onChange={setMode} />
          <Link href={`/studio/${activeProject.id}/organize`} className="lc-button lc-button--solid">
            Continue to organize
          </Link>
        </>
      }
    >
      <div className="lc-grid-2" style={{ alignItems: "start" }}>
        <div className="lc-stack">
          <label
            htmlFor="upload-memory"
            className="lc-card"
            style={{
              padding: "2.4rem",
              borderStyle: "dashed",
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            <div>
              <div className="lc-title" style={{ fontSize: "2.6rem" }}>
                Drop your memory set here.
              </div>
              <p style={{ maxWidth: "34rem", lineHeight: 1.7, color: "var(--ink-2)", marginTop: "0.8rem" }}>
                Real local file handling is wired for the demo. Images, video, audio and text files
                are accepted and added to the active project.
              </p>
              <div className="lc-button lc-button--solid" style={{ display: "inline-flex", marginTop: "1rem" }}>
                Browse files
              </div>
            </div>
          </label>
          <input
            id="upload-memory"
            type="file"
            multiple
            hidden
            onChange={(event) => {
              if (event.target.files) {
                void addUploads(event.target.files);
              }
            }}
          />
          <div className="lc-grid-4">
            <MetricCard label="Items" value={`${uploadSummary.total}`} />
            <MetricCard label="Photos" value={`${uploadSummary.photos}`} />
            <MetricCard label="Videos" value={`${uploadSummary.videos}`} />
            <MetricCard label="Voice/Text" value={`${uploadSummary.voices + uploadSummary.texts}`} />
          </div>
          <div className="lc-grid-3">
            {uploadAssets.slice(0, 12).map((asset) => (
              <div key={asset!.id}>
                <DisplayAsset asset={asset!} ratio="1 / 1" meta={asset!.kind} />
              </div>
            ))}
          </div>
        </div>
        <div className="lc-stack">
          <Panel title="What the system will do">
            <Checklist
              items={[
                "Read timestamps and lightweight metadata from uploaded items.",
                "Group nearby moments into candidate stops.",
                "Surface cover candidates and excerpt seeds in the editor.",
                "Prepare source assets for the mock media provider.",
              ]}
            />
          </Panel>
          <Panel title="Detected so far">
            <div className="lc-stack" style={{ gap: "0.75rem" }}>
              <InlineMeta label="Primary area" value={activeProject.area} />
              <InlineMeta label="Time range" value="Feb 2025 – Apr 2026" />
              <InlineMeta label="Candidate stops" value={`${activeProject.stopIds.length}`} />
              <InlineMeta label="Missing geo" value="4 images" />
            </div>
          </Panel>
          <Panel title="Warning">
            <p style={{ lineHeight: 1.7, color: "var(--ink-2)" }}>
              Missing geotags are fine for the MVP. The organize page lets the creator reorder and
              correct the route manually.
            </p>
          </Panel>
        </div>
      </div>
    </StudioShell>
  );
}

export function OrganizePage({ projectId }: { projectId: string }) {
  const { activeProject, activeStops, currentMode, setMode, reorderStop, state } =
    useStudioProject(projectId);
  const [selectedStopId, setSelectedStopId] = useState(activeStops[0]?.id ?? "");
  const selectedStop = activeStops.find((stop) => stop.id === selectedStopId) ?? activeStops[0];
  const selectedAsset = state.assets.find((asset) => asset.id === selectedStop?.coverAssetId) ?? state.assets[0];

  return (
    <StudioShell
      title="Organize stops"
      eyebrow={`${activeProject.title} › Organize`}
      project={activeProject}
      current="organize"
      actions={
        <>
          <ModeSwitcher mode={currentMode} onChange={setMode} />
          <Link href={`/studio/${activeProject.id}/editor`} className="lc-button lc-button--solid">
            Continue to editor
          </Link>
        </>
      }
    >
      <div className="lc-studio-layout-3">
        <div style={{ background: "var(--paper-2)", borderRight: "1px solid var(--rule)" }}>
          <div className="lc-editorial-panel" style={{ borderInline: 0, borderTop: 0 }}>
            <div className="lc-eyebrow">Stops · {activeStops.length}</div>
          </div>
          {activeStops.map((stop) => (
            <button
              key={stop.id}
              type="button"
              onClick={() => setSelectedStopId(stop.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "0.9rem 1rem",
                border: 0,
                borderBottom: "1px solid var(--rule)",
                background: selectedStop?.id === stop.id ? "white" : "transparent",
                cursor: "pointer",
              }}
            >
              <div className="lc-row" style={{ justifyContent: "space-between", gap: "0.7rem" }}>
                <span className="lc-mono">{stop.number}</span>
                <div className="lc-row" style={{ gap: "0.35rem" }}>
                  <button
                    type="button"
                    className="lc-chip"
                    onClick={(event) => {
                      event.stopPropagation();
                      reorderStop(stop.id, "up");
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="lc-chip"
                    onClick={(event) => {
                      event.stopPropagation();
                      reorderStop(stop.id, "down");
                    }}
                  >
                    ↓
                  </button>
                </div>
              </div>
              <div style={{ marginTop: "0.45rem" }}>{stop.title}</div>
              <div className="lc-mono" style={{ opacity: 0.52, marginTop: "0.35rem" }}>
                {stop.place} · {stop.time}
              </div>
            </button>
          ))}
        </div>

        <div style={{ background: "var(--paper)", borderRight: "1px solid var(--rule)", padding: "1rem" }}>
          <div className="lc-card" style={{ padding: "1rem", height: "100%" }}>
            <div className="lc-row" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
              <div className="lc-eyebrow">Route map</div>
              <div className="lc-mono">SE1 · {activeStops.length} stops</div>
            </div>
            <svg viewBox="0 0 640 420" style={{ width: "100%", display: "block" }}>
              <rect width="640" height="420" fill="#ece6dc" />
              <path
                d="M 0 240 C 110 228, 175 175, 250 200 S 420 302, 560 270 S 620 198, 640 220"
                fill="none"
                stroke="#9caecc"
                strokeWidth="42"
                strokeLinecap="round"
              />
              <path
                d={activeStops
                  .map((stop, index) => {
                    const x = 78 + index * 52;
                    const y = 155 + Math.sin(index / 1.4) * 58 + index * 8;
                    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#7b2d1f"
                strokeWidth="2"
                strokeDasharray="6 6"
              />
              {activeStops.map((stop, index) => {
                const x = 78 + index * 52;
                const y = 155 + Math.sin(index / 1.4) * 58 + index * 8;
                return (
                  <g key={stop.id} onClick={() => setSelectedStopId(stop.id)} style={{ cursor: "pointer" }}>
                    <circle cx={x} cy={y} r={selectedStop?.id === stop.id ? 13 : 9} fill="white" stroke="#1c1815" strokeWidth="2" />
                    <text x={x} y={y + 4} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10">
                      {index + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div style={{ marginTop: "1.2rem" }}>
              <div className="lc-eyebrow">Time of day</div>
              <div style={{ position: "relative", marginTop: "0.8rem", height: "3.2rem", background: "linear-gradient(90deg, #aec1df 0%, #f7df99 50%, #402e4e 100%)" }}>
                {activeStops.map((stop) => {
                  const [hours, minutes] = stop.time.split(":").map(Number);
                  const pct = (((hours + minutes / 60) - 6) / 18) * 100;
                  return (
                    <button
                      key={stop.id}
                      type="button"
                      onClick={() => setSelectedStopId(stop.id)}
                      style={{
                        position: "absolute",
                        left: `${pct}%`,
                        top: "-0.2rem",
                        border: 0,
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ width: "2px", height: "3.5rem", background: selectedStop?.id === stop.id ? "black" : "rgb(255 255 255 / 0.8)" }} />
                      <div className="lc-mono" style={{ fontSize: "0.62rem", transform: "translateX(-45%)", marginTop: "0.25rem" }}>
                        {stop.time}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "var(--paper-2)", padding: "1rem" }}>
          {selectedStop ? (
            <div className="lc-stack">
              <div className="lc-eyebrow">Stop inspector</div>
              <DisplayAsset asset={selectedAsset} ratio="16 / 10" meta={selectedStop.label} />
              <div className="lc-title" style={{ fontSize: "2rem" }}>
                {selectedStop.title}
              </div>
              <div className="lc-mono" style={{ opacity: 0.6 }}>
                {selectedStop.place} · {selectedStop.code} · {selectedStop.time}
              </div>
              <p style={{ lineHeight: 1.7, color: "var(--ink-2)" }}>{selectedStop.excerpt}</p>
              <div className="lc-editorial-panel">
                <div className="lc-eyebrow">Cluster confidence</div>
                <div style={{ marginTop: "0.7rem", height: "0.4rem", background: "var(--paper-3)" }}>
                  <div style={{ width: "88%", height: "100%", background: "#3f7f53" }} />
                </div>
                <div className="lc-mono" style={{ opacity: 0.6, marginTop: "0.45rem" }}>
                  88% · time and geo match
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </StudioShell>
  );
}

export function EditorPage({ projectId }: { projectId: string }) {
  const { activeProject, activeStops, currentMode, setMode, updateStop, state } =
    useStudioProject(projectId);
  const [selectedStopId, setSelectedStopId] = useState(activeStops[0]?.id ?? "");
  const stop = activeStops.find((item) => item.id === selectedStopId) ?? activeStops[0];
  const stopAssets = (stop?.galleryAssetIds ?? [])
    .map((assetId) => state.assets.find((asset) => asset.id === assetId))
    .filter((asset) => Boolean(asset));
  const coverAsset = state.assets.find((asset) => asset.id === stop?.coverAssetId) ?? state.assets[0];

  if (!stop) return null;

  return (
    <StudioShell
      title="Story editor"
      eyebrow={`${activeProject.title} › Editor`}
      project={activeProject}
      current="editor"
      actions={
        <>
          <ModeSwitcher mode={currentMode} onChange={setMode} />
          <Link href={projectPath(activeProject)} className="lc-button">
            Preview public
          </Link>
          <Link href={`/studio/${activeProject.id}/publish`} className="lc-button lc-button--solid">
            Publish
          </Link>
        </>
      }
    >
      <div className="lc-studio-layout-3">
        <div style={{ background: "var(--paper-2)", borderRight: "1px solid var(--rule)" }}>
          <div className="lc-editorial-panel" style={{ borderInline: 0, borderTop: 0 }}>
            <div className="lc-eyebrow">Chapters</div>
          </div>
          {activeStops.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedStopId(item.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "0.85rem 1rem",
                border: 0,
                borderBottom: "1px solid var(--rule)",
                background: item.id === stop.id ? "white" : "transparent",
                cursor: "pointer",
              }}
            >
              <div className="lc-mono" style={{ opacity: 0.6 }}>{item.number}</div>
              <div style={{ marginTop: "0.35rem" }}>{item.title}</div>
            </button>
          ))}
        </div>

        <div style={{ padding: "1rem", background: "white", borderRight: "1px solid var(--rule)" }}>
          <div className="lc-stack" style={{ gap: "1rem" }}>
            <div className="lc-mono" style={{ opacity: 0.6 }}>
              Stop {stop.number} · {stop.code} · {stop.time}
            </div>
            <input
              value={stop.title}
              onChange={(event) => updateStop(stop.id, { title: event.target.value })}
              style={{ ...fieldStyle, fontSize: "2rem", fontFamily: "var(--f-serif)" }}
            />
            <div className="lc-grid-2">
              <Field label="Place">
                <input
                  value={stop.place}
                  onChange={(event) => updateStop(stop.id, { place: event.target.value })}
                  style={fieldStyle}
                />
              </Field>
              <Field label="Time">
                <input
                  value={stop.time}
                  onChange={(event) => updateStop(stop.id, { time: event.target.value })}
                  style={fieldStyle}
                />
              </Field>
            </div>
            <Field label="Cover image">
              <select
                value={stop.coverAssetId}
                onChange={(event) => updateStop(stop.id, { coverAssetId: event.target.value })}
                style={fieldStyle}
              >
                {stopAssets.map((asset) => (
                  <option key={asset!.id} value={asset!.id}>
                    {asset!.title}
                  </option>
                ))}
              </select>
            </Field>
            <DisplayAsset asset={coverAsset} ratio="16 / 9" meta={stop.label} />
            <Field label="Excerpt">
              <textarea
                value={stop.excerpt}
                onChange={(event) => updateStop(stop.id, { excerpt: event.target.value })}
                style={{ ...fieldStyle, minHeight: "6rem" }}
              />
            </Field>
            <Field label="Story">
              <textarea
                value={stop.story}
                onChange={(event) => updateStop(stop.id, { story: event.target.value })}
                style={{ ...fieldStyle, minHeight: "14rem" }}
              />
            </Field>
          </div>
        </div>

        <div style={{ background: "var(--paper-2)", padding: "1rem" }}>
          <div className="lc-stack">
            <div className="lc-eyebrow">Inspector</div>
            <div className="lc-editorial-panel">
              <div className="lc-eyebrow">Applied mode</div>
              <div style={{ marginTop: "0.8rem" }}>
                <ModeSwitcher mode={currentMode} onChange={setMode} />
              </div>
              <p style={{ lineHeight: 1.7, color: "var(--ink-2)", marginTop: "0.8rem" }}>
                The editor writes one content model. The public route renders it using the currently
                selected narrative grammar.
              </p>
            </div>
            <div className="lc-editorial-panel">
              <div className="lc-eyebrow">Postcard</div>
              <div className="lc-title" style={{ fontSize: "1.5rem", marginTop: "0.5rem" }}>
                {stop.postcardVersions.length ? `${stop.postcardVersions.length} saved versions` : "Missing"}
              </div>
              <div className="lc-row" style={{ gap: "0.7rem", marginTop: "0.9rem", flexWrap: "wrap" }}>
                <Link href={chapterPath(activeProject, stop)} className="lc-button">
                  View chapter
                </Link>
                <Link href={`/studio/${activeProject.id}/media`} className="lc-button">
                  Open media panel
                </Link>
              </div>
            </div>
            <div className="lc-editorial-panel">
              <div className="lc-eyebrow">Generated media</div>
              <div className="lc-stack" style={{ gap: "0.6rem", marginTop: "0.9rem" }}>
                {stop.generatedAssetIds.length ? (
                  stop.generatedAssetIds.map((assetId) => {
                    const asset = state.assets.find((item) => item.id === assetId);
                    return asset ? <DisplayAsset key={asset.id} asset={asset} ratio="16 / 9" meta={asset.title} /> : null;
                  })
                ) : (
                  <div className="lc-mono" style={{ opacity: 0.58 }}>
                    Nothing attached yet. Use the media panel to create and save results.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudioShell>
  );
}

export function MediaPage({ projectId }: { projectId: string }) {
  const { activeProject, activeStops, currentMode, setMode, createMediaJob, state } =
    useStudioProject(projectId);
  const [selectedStopId, setSelectedStopId] = useState(activeStops[4]?.id ?? activeStops[0]?.id ?? "");
  const stop = activeStops.find((item) => item.id === selectedStopId) ?? activeStops[0];
  const sourceAsset = state.assets.find((asset) => asset.id === stop?.coverAssetId) ?? state.assets[0];
  const jobs = state.mediaJobs.filter((job) => job.projectId === activeProject.id);
  const generatedAssets = state.assets.filter(
    (asset) => asset.kind === "generated-image" || asset.kind === "generated-video",
  );

  if (!stop) return null;

  return (
    <StudioShell
      title="Media integration panel"
      eyebrow={`${activeProject.title} › Media`}
      project={activeProject}
      current="media"
      actions={
        <>
          <ModeSwitcher mode={currentMode} onChange={setMode} />
          <Link href={`/studio/${activeProject.id}/editor`} className="lc-button">
            Back to editor
          </Link>
        </>
      }
    >
      <div className="lc-grid-2" style={{ alignItems: "start" }}>
        <div className="lc-stack">
          <div className="lc-card" style={{ padding: "1.25rem" }}>
            <div className="lc-row" style={{ justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <div className="lc-title" style={{ fontSize: "2rem" }}>
                  Start a media task
                </div>
                <div className="lc-mono" style={{ opacity: 0.6, marginTop: "0.35rem" }}>
                  Provider: mock-media-provider
                </div>
              </div>
              <span className="lc-chip">adapter ready</span>
            </div>
            <div className="lc-grid-2">
              <button
                type="button"
                className="lc-editorial-panel"
                onClick={() =>
                  void createMediaJob({
                    stopId: stop.id,
                    sourceAssetId: stop.coverAssetId,
                    kind: "image-to-image",
                    prompt: `restyle ${stop.place} into ${currentMode} mode`,
                  })
                }
                style={{ textAlign: "left", cursor: "pointer" }}
              >
                <div className="lc-mono">Image → Image</div>
                <div className="lc-title" style={{ fontSize: "1.6rem", marginTop: "0.45rem" }}>
                  Restyle current frame
                </div>
                <p style={{ lineHeight: 1.65, color: "var(--ink-2)", marginTop: "0.45rem" }}>
                  Produces a generated still that the editor can attach back to this stop.
                </p>
              </button>
              <button
                type="button"
                className="lc-editorial-panel"
                onClick={() =>
                  void createMediaJob({
                    stopId: stop.id,
                    sourceAssetId: stop.coverAssetId,
                    kind: "image-to-video",
                    prompt: `animate ${stop.place} as a short ${currentMode} beat`,
                  })
                }
                style={{ textAlign: "left", cursor: "pointer" }}
              >
                <div className="lc-mono">Image → Video</div>
                <div className="lc-title" style={{ fontSize: "1.6rem", marginTop: "0.45rem" }}>
                  Animate current frame
                </div>
                <p style={{ lineHeight: 1.65, color: "var(--ink-2)", marginTop: "0.45rem" }}>
                  Produces a short mock motion output so the integration shell can be demoed.
                </p>
              </button>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <Field label="Current stop">
                <select
                  value={selectedStopId}
                  onChange={(event) => setSelectedStopId(event.target.value)}
                  style={fieldStyle}
                >
                  {activeStops.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.number} · {item.title}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <DisplayAsset asset={sourceAsset} ratio="16 / 9" meta={stop.label} />
            </div>
          </div>

          <div className="lc-card" style={{ padding: "1.25rem" }}>
            <div className="lc-row" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
              <div className="lc-title" style={{ fontSize: "1.8rem" }}>
                Jobs
              </div>
              <div className="lc-mono">{jobs.length} total</div>
            </div>
            <div className="lc-stack" style={{ gap: "0.7rem" }}>
              {jobs.map((job) => (
                <div key={job.id} className="lc-editorial-panel">
                  <div className="lc-row" style={{ justifyContent: "space-between", gap: "1rem" }}>
                    <div>
                      <div className="lc-mono">{job.kind}</div>
                      <div style={{ marginTop: "0.35rem" }}>{job.prompt}</div>
                    </div>
                    <span className="lc-chip">{job.state}</span>
                  </div>
                  <div style={{ marginTop: "0.85rem", height: "0.38rem", background: "var(--paper-3)" }}>
                    <div style={{ height: "100%", width: `${job.progress}%`, background: "var(--ink)" }} />
                  </div>
                  <div className="lc-row" style={{ justifyContent: "space-between", marginTop: "0.45rem" }}>
                    <span className="lc-mono" style={{ opacity: 0.58 }}>
                      seed {job.seed}
                    </span>
                    <span className="lc-mono" style={{ opacity: 0.58 }}>
                      {job.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lc-stack">
          <Panel title="Saved results">
            <div className="lc-grid-2">
              {generatedAssets.length ? (
                generatedAssets.map((asset) => <DisplayAsset key={asset.id} asset={asset} ratio="1 / 1" meta={asset.kind} />)
              ) : (
                <div className="lc-mono" style={{ opacity: 0.6 }}>
                  No generated assets yet.
                </div>
              )}
            </div>
          </Panel>
          <Panel title="Provider contract">
            <Checklist
              items={[
                "createImageToImageJob(input) returns a queued job.",
                "createImageToVideoJob(input) returns a queued job.",
                "getJobStatus(job) returns progress, state and optional result asset.",
                "Swapping the real teammate provider only requires replacing the adapter implementation.",
              ]}
            />
          </Panel>
        </div>
      </div>
    </StudioShell>
  );
}

export function PublishPage({ projectId }: { projectId: string }) {
  const { activeProject, activeStops, currentMode, setMode, updateProject, setDefaultMode } =
    useStudioProject(projectId);
  const [visibility, setVisibility] = useState<Visibility>(activeProject.visibility);
  const previewHref = projectPath(activeProject);
  const checklist = [
    { label: "All stops have a cover image", ok: activeStops.every((stop) => Boolean(stop.coverAssetId)) },
    { label: "All stops have an excerpt", ok: activeStops.every((stop) => stop.excerpt.trim().length > 0) },
    { label: "All stops have body copy", ok: activeStops.every((stop) => stop.story.trim().length > 0) },
    { label: "Postcards exist for each stop", ok: activeStops.every((stop) => stop.postcardVersions.length > 0) },
    { label: "Default mode set", ok: Boolean(activeProject.defaultMode) },
  ];
  const readyToPublish = checklist.every((item) => item.ok);

  return (
    <StudioShell
      title="Publish"
      eyebrow={`${activeProject.title} › Publish`}
      project={activeProject}
      current="publish"
      actions={
        <>
          <ModeSwitcher mode={currentMode} onChange={setMode} />
          <button
            type="button"
            className="lc-button lc-button--solid"
            onClick={() =>
              updateProject({
                visibility,
                status: readyToPublish ? (visibility === "public" ? "published" : "unlisted") : "draft",
              })
            }
          >
            {readyToPublish ? "Publish now" : "Save draft"}
          </button>
        </>
      }
    >
      <div className="lc-grid-2" style={{ alignItems: "start" }}>
        <div className="lc-stack">
          <Panel title="Pre-flight checks">
            <div className="lc-stack" style={{ gap: "0.8rem" }}>
              {checklist.map((item) => (
                <div key={item.label} className="lc-row" style={{ justifyContent: "space-between", gap: "1rem" }}>
                  <span>{item.label}</span>
                  <span className="lc-chip">{item.ok ? "ok" : "needs work"}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Field label="Visibility">
            <div className="lc-row" style={{ gap: "0.7rem", flexWrap: "wrap" }}>
              {(["public", "unlisted", "private"] as Visibility[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`lc-button${visibility === item ? " lc-button--solid" : ""}`}
                  onClick={() => setVisibility(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Default public mode">
            <ModeSwitcher mode={activeProject.defaultMode} onChange={setDefaultMode} />
          </Field>
          <Field label="Public URL">
            <div className="lc-editorial-panel">
              <code>{previewHref}</code>
            </div>
          </Field>
          <Field label="Tags">
            <div className="lc-row" style={{ gap: "0.6rem", flexWrap: "wrap" }}>
              {activeProject.tags.map((tag) => (
                <span key={tag} className="lc-chip">
                  {tag}
                </span>
              ))}
            </div>
          </Field>
        </div>

        <div className="lc-stack">
          <Panel title="Public preview">
            <div className="lc-card" data-mode={activeProject.defaultMode} style={{ overflow: "hidden" }}>
              <div style={{ padding: "1.4rem", background: "var(--mode-bg)", color: "var(--mode-ink)" }}>
                <div className="lc-mono">{activeProject.area}</div>
                <div
                  className="lc-title"
                  style={{
                    fontSize: "3rem",
                    marginTop: "0.8rem",
                    fontStyle: activeProject.defaultMode === "fashion" ? "italic" : "normal",
                    textTransform: activeProject.defaultMode === "punk" ? "uppercase" : "none",
                  }}
                >
                  {activeProject.title}
                </div>
                <p style={{ lineHeight: 1.7, marginTop: "0.8rem" }}>{activeProject.subtitle}</p>
                <div className="lc-row" style={{ gap: "0.7rem", marginTop: "1rem", flexWrap: "wrap" }}>
                  <span className="lc-chip">{visibility}</span>
                  <span className="lc-chip">{activeProject.defaultMode}</span>
                </div>
              </div>
            </div>
            <Link href={previewHref} className="lc-button lc-button--solid" style={{ alignSelf: "start" }}>
              Open preview
            </Link>
          </Panel>
        </div>
      </div>
    </StudioShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="lc-card" style={{ padding: "1.25rem" }}>
      <div className="lc-title" style={{ fontSize: "1.7rem" }}>
        {title}
      </div>
      <div style={{ marginTop: "1rem" }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="lc-stack" style={{ gap: "0.5rem" }}>
      <span className="lc-eyebrow">{label}</span>
      {children}
    </label>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <div className="lc-stack" style={{ gap: "0.7rem" }}>
      {items.map((item) => (
        <div key={item} className="lc-row" style={{ gap: "0.7rem", alignItems: "start" }}>
          <RoundBullet />
          <span style={{ lineHeight: 1.65 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

function InlineMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="lc-row" style={{ justifyContent: "space-between", gap: "1rem" }}>
      <span className="lc-mono" style={{ opacity: 0.58 }}>
        {label}
      </span>
      <span>{value}</span>
    </div>
  );
}

function RoundBullet() {
  return (
    <span
      style={{
        width: "0.55rem",
        height: "0.55rem",
        marginTop: "0.45rem",
        borderRadius: "999px",
        background: "var(--ink)",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.85rem 1rem",
  border: "1px solid var(--rule)",
  background: "white",
  color: "var(--ink)",
};
