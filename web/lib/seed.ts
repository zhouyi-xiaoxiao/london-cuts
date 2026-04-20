// Seed data for local dev.
// Ported verbatim from archive/app-html-prototype-2026-04-20/src/data.jsx.
// Used by the projects dashboard (F-T003) + storage seam fallback when
// localStorage is empty. Do not modify without updating lib/storage.ts callers.

import type {
  NarrativeMode,
  ProjectStatus,
  ProjectVisibility,
} from "./storage";

// ─── Types ─────────────────────────────────────────────────────────────

export type StopTone = "warm" | "cool" | "punk";

export interface StopStatus {
  upload: boolean;
  hero: boolean;
  body: boolean;
  media: "done" | "running" | "queued" | "failed" | null;
}

export interface SeedStop {
  n: string;              // "01".."12" — legacy ordering key
  code: string;           // postcode
  title: string;
  time: string;           // "HH:MM"
  mood: string;
  tone: StopTone;
  lat: number;
  lng: number;
  label: string;          // display caption
  status: StopStatus;
}

export interface BodyMetaRow   { type: "metaRow"; content: readonly string[] }
export interface BodyParagraph { type: "paragraph"; content: string }
export interface BodyPullQuote { type: "pullQuote"; content: string }
export interface BodyHeroImage {
  type: "heroImage";
  assetId: string;
  caption: string;
}
export interface BodyInlineImage {
  type: "inlineImage";
  assetId: string;
  caption: string;
  align: "left" | "right" | "center";
}
export interface BodyMediaEmbed {
  type: "mediaEmbed";
  taskId: string;
  caption: string;
}

export type BodyBlock =
  | BodyMetaRow
  | BodyParagraph
  | BodyPullQuote
  | BodyHeroImage
  | BodyInlineImage
  | BodyMediaEmbed;

export interface PostcardRecipient {
  name: string;
  line1: string;
  line2: string;
  country: string;
}

export interface SeedPostcard {
  message: string;
  recipient: PostcardRecipient;
}

export interface SeedProject {
  title: string;
  author: string;
  subtitle: string;
  coverLabel: string;
  tags: readonly string[];
  published: string;
  reads: number;
  saves: number;
  duration: string;
  slug: string;
  visibility: ProjectVisibility;
  defaultMode: NarrativeMode;
  status: ProjectStatus;
}

export interface SeedAsset {
  id: string;
  stop: string | null;
  tone: StopTone;
}

export interface SeedMediaTask {
  id: string;
  kind: "img2img" | "img2vid";
  stopId: string;
  mode: NarrativeMode;
  state: "queued" | "running" | "done" | "failed";
  progress: number;       // 0..1
  prompt: string;
}

export interface FeedEntry {
  id: number;
  title: string;
  author: string;
  stops: number;
  mode: NarrativeMode;
  label: string;
  reads: string;
  updated: string;
}

// ─── The "A Year in SE1" seed project ─────────────────────────────────

export const SEED_PROJECT: SeedProject = {
  title: "A Year in SE1",
  author: "Ana Ishii",
  subtitle: "Twelve walks between Bermondsey and Waterloo, 2025–2026",
  coverLabel: "SOUTHWARK · GOLDEN HOUR",
  tags: ["SE1", "Walking", "Thames"],
  published: "14 APR 2026",
  reads: 2487,
  saves: 214,
  duration: "48 min read",
  slug: "a-year-in-se1",
  visibility: "public",
  defaultMode: "fashion",
  status: "published",
};

export const SEED_STOPS: readonly SeedStop[] = [
  { n: "01", code: "SE1 9DT", title: "Borough Market at opening",    time: "07:12", mood: "Amber",    tone: "warm", lat: 51.5055, lng: -0.0910, label: "BOROUGH MKT · MORNING",   status: { upload: true,  hero: true,  body: true,  media: "done" } },
  { n: "02", code: "SE1 2AA", title: "The Shard from Crucifix Lane", time: "08:04", mood: "Steel",    tone: "cool", lat: 51.5050, lng: -0.0867, label: "CRUCIFIX LN · GLASS",     status: { upload: true,  hero: true,  body: true,  media: "done" } },
  { n: "03", code: "SE1 9DA", title: "Tate Modern turbine hall",     time: "10:27", mood: "Rust",     tone: "punk", lat: 51.5076, lng: -0.0991, label: "TATE · TURBINE HALL",     status: { upload: true,  hero: true,  body: true,  media: "running" } },
  { n: "04", code: "SE1 8XX", title: "Thames at low tide",           time: "11:48", mood: "Mud",      tone: "warm", lat: 51.5074, lng: -0.1161, label: "SOUTH BANK · MUDLARK",    status: { upload: true,  hero: true,  body: false, media: null } },
  { n: "05", code: "SE1 7PB", title: "Waterloo bridge, facing east", time: "17:19", mood: "Gold",     tone: "warm", lat: 51.5090, lng: -0.1164, label: "WATERLOO BR · DUSK",      status: { upload: true,  hero: true,  body: true,  media: "done" } },
  { n: "06", code: "SE1 8UP", title: "The National Theatre façade",  time: "19:02", mood: "Concrete", tone: "cool", lat: 51.5068, lng: -0.1148, label: "NATIONAL · BRUTALIST",    status: { upload: true,  hero: false, body: true,  media: null } },
  { n: "07", code: "SE1 9PX", title: "A pub off Southwark Street",   time: "20:15", mood: "Ember",    tone: "warm", lat: 51.5037, lng: -0.0974, label: "SOUTHWARK · PINT",        status: { upload: true,  hero: true,  body: false, media: null } },
  { n: "08", code: "SE1 2SD", title: "Bermondsey Street by night",   time: "22:40", mood: "Neon",     tone: "punk", lat: 51.4992, lng: -0.0812, label: "BERMONDSEY ST · NEON",    status: { upload: true,  hero: true,  body: true,  media: "running" } },
  { n: "09", code: "SE1 3UN", title: "The walk home",                time: "23:51", mood: "Blue",     tone: "cool", lat: 51.4964, lng: -0.0754, label: "GRANGE RD · STREETLIGHT", status: { upload: true,  hero: false, body: false, media: null } },
  { n: "10", code: "SE1 5EN", title: "Morning after, Tower Bridge",  time: "06:34", mood: "Silver",   tone: "cool", lat: 51.5055, lng: -0.0754, label: "TOWER BR · FIRST LIGHT",  status: { upload: true,  hero: true,  body: true,  media: "done" } },
  { n: "11", code: "SE1 6TH", title: "Guy’s chapel, raining",        time: "14:08", mood: "Stone",    tone: "cool", lat: 51.5037, lng: -0.0870, label: "GUY’S · CHAPEL",          status: { upload: false, hero: false, body: false, media: null } },
  { n: "12", code: "SE1 1AA", title: "Elephant & Castle roundabout", time: "16:45", mood: "Brick",    tone: "warm", lat: 51.4944, lng: -0.1000, label: "ELEPHANT · ROUNDABOUT",   status: { upload: false, hero: false, body: false, media: null } },
] as const;

// Sample body (nodes for stop 05), used as the canvas demo.
export const SEED_BODY_05: readonly BodyBlock[] = [
  { type: "metaRow",    content: ["17:19", "28 OCT 2025", "8°C · SW", "WATERLOO BR · DUSK"] },
  { type: "heroImage",  assetId: "a-wb-hero", caption: "WATERLOO BRIDGE, FACING EAST · 17:19" },
  { type: "paragraph",  content: "The river is the only thing in London that tells the time. Everything else lies — the sky, the lamps on the embankment, the hour on your phone — but the Thames knows exactly where the sun is." },
  { type: "pullQuote",  content: "Six minutes of gold, then nothing." },
  { type: "paragraph",  content: "I walked from the South Bank side, from the National, and by the time I was halfway across the bridge the light had already shifted once. It does not wait." },
  { type: "inlineImage", assetId: "a-wb-02", caption: "The near railings catch last; the far side is gone first.", align: "left" },
  { type: "paragraph",  content: "A man was leaning on the rail taking a photo with both hands, like he was trying to hold the bridge still." },
  { type: "mediaEmbed", taskId: "tk_w05_vid", caption: "img2vid · 3s pan, camera still" },
  { type: "paragraph",  content: "By the time I got off the bridge the lamps were on and it was just a city again." },
] as const;

export const SEED_POSTCARD_05: SeedPostcard = {
  message:
    "M — walked home across Waterloo last night. The river caught. Thought of you in Lisbon. Six minutes of gold, then nothing.\n— A.",
  recipient: {
    name: "Matteo Ricci",
    line1: "Rua das Flores 28",
    line2: "1200-195 Lisboa",
    country: "Portugal",
  },
};

export const SEED_ASSETS: readonly SeedAsset[] = [
  { id: "a-wb-hero", stop: "05", tone: "warm" },
  { id: "a-wb-02",   stop: "05", tone: "warm" },
  { id: "a-wb-03",   stop: "05", tone: "cool" },
  { id: "a-bm-01",   stop: "01", tone: "warm" },
  { id: "a-bm-02",   stop: "01", tone: "warm" },
  { id: "a-sh-01",   stop: "02", tone: "cool" },
  { id: "a-tt-01",   stop: "03", tone: "punk" },
  { id: "a-tt-02",   stop: "03", tone: "punk" },
  { id: "a-nt-01",   stop: "06", tone: "cool" },
  { id: "a-nt-02",   stop: "06", tone: "cool" },
  { id: "a-pb-01",   stop: "07", tone: "warm" },
  { id: "a-bs-01",   stop: "08", tone: "punk" },
  { id: "a-bs-02",   stop: "08", tone: "punk" },
  { id: "a-bs-03",   stop: "08", tone: "punk" },
  { id: "a-tw-01",   stop: "10", tone: "cool" },
  { id: "a-tw-02",   stop: "10", tone: "cool" },
  { id: "a-gr-01",   stop: null, tone: "warm" },
  { id: "a-x-02",    stop: null, tone: "cool" },
  { id: "a-x-03",    stop: null, tone: "warm" },
  { id: "a-x-04",    stop: null, tone: "punk" },
  { id: "a-x-05",    stop: null, tone: "cool" },
  { id: "a-x-06",    stop: null, tone: "warm" },
] as const;

export const SEED_TASKS: readonly SeedMediaTask[] = [
  { id: "tk_w05_vid", kind: "img2vid", stopId: "05", mode: "fashion", state: "done",     progress: 1.0,  prompt: "dolly 3s, golden hour, camera still" },
  { id: "tk_w03_img", kind: "img2img", stopId: "03", mode: "punk",    state: "running",  progress: 0.62, prompt: "ransom, high-contrast newsprint, paper grain" },
  { id: "tk_w08_img", kind: "img2img", stopId: "08", mode: "cinema",  state: "running",  progress: 0.34, prompt: "noir neon, subtitle framing, letterbox" },
  { id: "tk_w01_img", kind: "img2img", stopId: "01", mode: "fashion", state: "done",     progress: 1.0,  prompt: "amber morning, editorial crop, grain preserved" },
  { id: "tk_w10_img", kind: "img2img", stopId: "10", mode: "cinema",  state: "done",     progress: 1.0,  prompt: "first light, still camera, subtitle composition" },
  { id: "tk_w07_img", kind: "img2img", stopId: "07", mode: "fashion", state: "queued",   progress: 0.0,  prompt: "pub interior, warm tungsten, ember glow" },
  { id: "tk_w04_img", kind: "img2img", stopId: "04", mode: "fashion", state: "failed",   progress: 1.0,  prompt: "mud, low tide, editorial — retry w/ strength 0.5" },
] as const;

export const PROJECTS_FEED: readonly FeedEntry[] = [
  { id: 1, title: "A Year in SE1",         author: "Ana Ishii",   stops: 12, mode: "fashion", label: "SOUTHWARK · COVER",    reads: "2.4k", updated: "2d" },
  { id: 2, title: "Mudlark Diaries",       author: "Ty Okafor",   stops: 14, mode: "punk",    label: "THAMES · FORESHORE",   reads: "891",  updated: "5d" },
  { id: 3, title: "48 Hours in E8",        author: "Priya Shah",  stops: 8,  mode: "cinema",  label: "HACKNEY · NIGHT",      reads: "4.1k", updated: "1w" },
  { id: 4, title: "The Jubilee Walk",      author: "Lena Park",   stops: 12, mode: "fashion", label: "WESTMINSTER · DAY",    reads: "1.2k", updated: "2w" },
  { id: 5, title: "Last Trains",           author: "Marco Reed",  stops: 7,  mode: "cinema",  label: "UNDERGROUND · 00:47",  reads: "3.6k", updated: "3w" },
  { id: 6, title: "Brick Lane after rain", author: "Yui Tanaka",  stops: 9,  mode: "punk",    label: "E1 · WET ASPHALT",     reads: "624",  updated: "1m" },
] as const;

// Derived summary — used by spine + publish pre-flight (F-T008).
export function projectSummary(stops: readonly SeedStop[]): {
  missingHeroes: number;
  missingBodies: number;
  missingUploads: number;
  totalComplete: number;
  total: number;
} {
  const missingHeroes = stops.filter((s) => !s.status.hero).length;
  const missingBodies = stops.filter((s) => !s.status.body).length;
  const missingUploads = stops.filter((s) => !s.status.upload).length;
  const totalComplete = stops.filter(
    (s) => s.status.upload && s.status.hero && s.status.body,
  ).length;
  return {
    missingHeroes,
    missingBodies,
    missingUploads,
    totalComplete,
    total: stops.length,
  };
}
