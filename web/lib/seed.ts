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
  n: string;              // "01".."13" — legacy ordering key
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
  /** Optional static asset path served from `web/public/`. Extended by the
   * live `Asset` type (stores/types.ts) which narrows this to
   * `string | null` (nullable for loaded assets that haven't hydrated yet). */
  imageUrl?: string | null;
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

// ─── The current London/Windsor seed project ──────────────────────────

export const SEED_PROJECT: SeedProject = {
  title: "A Year Around London",
  author: "Ana Ishii",
  subtitle: "Thirteen EXIF-grounded frames across London, Windsor and the in-between.",
  coverLabel: "LONDON · WINDSOR · HEATHROW",
  tags: ["London", "Windsor", "Photo diary"],
  published: "24 APR 2026",
  reads: 2487,
  saves: 214,
  duration: "48 min read",
  slug: "a-year-in-se1",
  visibility: "public",
  defaultMode: "fashion",
  status: "published",
};

export const SEED_STOPS: readonly SeedStop[] = [
  { n: "01", code: "W1B 4NF", title: "Regent Street Illuminations", time: "20:50", mood: "Festive", tone: "warm", lat: 51.51360833333333, lng: -0.14111944444444444, label: "MAGICAL LIGHTS OF MAYFAIR", status: { upload: true, hero: true, body: true, media: "done" } },
  { n: "02", code: "N6 5UL", title: "Through the Glass", time: "13:51", mood: "Serene", tone: "warm", lat: 51.581452777777784, lng: -0.14645555555555556, label: "MUSWELL HILL VIEW", status: { upload: true, hero: true, body: true, media: null } },
  { n: "03", code: "N19 5AA", title: "Tufnell Park Underground", time: "13:35", mood: "Transit", tone: "warm", lat: 51.55670555555555, lng: -0.1380611111111111, label: "TUFNELL PARK STATION", status: { upload: true, hero: true, body: true, media: "running" } },
  { n: "04", code: "SL4 1QF", title: "Guarding Tradition", time: "08:39", mood: "Historic", tone: "warm", lat: 51.48426111111111, lng: -0.6037972222222222, label: "WINDSOR GUARDS IN ACTION", status: { upload: true, hero: true, body: true, media: "done" } },
  { n: "05", code: "SL4 1LB", title: "A Serene Retreat", time: "10:23", mood: "Calm", tone: "warm", lat: 51.48416388888889, lng: -0.6025944444444444, label: "CORNWALL TOWER", status: { upload: true, hero: true, body: true, media: "done" } },
  { n: "06", code: "WC2N 6PB", title: "Celebration of Achievement", time: "15:05", mood: "Joyful", tone: "warm", lat: 51.50695, lng: -0.12066666666666667, label: "GRADUATION CEREMONY", status: { upload: true, hero: true, body: true, media: null } },
  { n: "07", code: "TW5 9GX", title: "Urban Expressions", time: "17:08", mood: "Colour", tone: "warm", lat: 51.49140277777778, lng: -0.4110138888888889, label: "STREET ART IN HOUNSLOW", status: { upload: true, hero: true, body: true, media: null } },
  { n: "08", code: "SE10 0JH", title: "City Lights at Night", time: "18:31", mood: "Serene", tone: "cool", lat: 51.50199166666667, lng: -0.001152777777777778, label: "GREENWICH PENINSULA", status: { upload: true, hero: true, body: true, media: "running" } },
  { n: "09", code: "TW6 1FB", title: "Arrival at Heathrow", time: "18:03", mood: "Busy", tone: "warm", lat: 51.46995555555556, lng: -0.4474222222222222, label: "UK BORDER CROWD", status: { upload: true, hero: true, body: true, media: null } },
  { n: "10", code: "N1C 4DQ", title: "Culinary Delights at King's Cross", time: "17:14", mood: "Warm", tone: "cool", lat: 51.535888888888884, lng: -0.12680833333333333, label: "REGENT'S CANAL EATS", status: { upload: true, hero: true, body: true, media: "done" } },
  { n: "11", code: "W1J 9HA", title: "Night Lights of Piccadilly", time: "22:05", mood: "Vibrant", tone: "warm", lat: 51.50875555555555, lng: -0.1374138888888889, label: "NIGHTTIME IN MAYFAIR", status: { upload: true, hero: true, body: true, media: null } },
  { n: "12", code: "WC1H 0AH", title: "Strength in the City", time: "18:23", mood: "Energetic", tone: "cool", lat: 51.525013888888886, lng: -0.13278055555555557, label: "PULSE FITNESS GYM", status: { upload: true, hero: true, body: true, media: null } },
  { n: "13", code: "N4 3NP", title: "Sunset Serenity", time: "02:05", mood: "Tranquil", tone: "warm", lat: 51.56256388888889, lng: -0.10915277777777778, label: "COLERIDGE ROAD", status: { upload: true, hero: true, body: true, media: "done" } },
] as const;

// ─── The "A Week in Reykjavík" seed project ──────────────────────────
// Second demo project — proves the product scope is "any single-location
// trip", not London-only. Not wired into the store yet (F-T003 will
// decide which project to hydrate); this just makes the data available.

export const SEED_PROJECT_REYKJAVIK: SeedProject = {
  title: "A Week in Reykjavík",
  author: "Sigrún Jónsdóttir",
  subtitle: "Seven walks between the harbour and the hot pots, winter 2026",
  coverLabel: "REYKJAVÍK · AURORA",
  tags: ["Reykjavík", "Iceland", "Winter"],
  published: "08 MAR 2026",
  reads: 1843,
  saves: 147,
  duration: "32 min read",
  slug: "a-week-in-reykjavik",
  visibility: "public",
  defaultMode: "cinema",
  status: "published",
};

export const SEED_STOPS_REYKJAVIK: readonly SeedStop[] = [
  { n: "01", code: "101 RVK", title: "Hallgrímskirkja at the top of the hill", time: "09:18", mood: "Stone",    tone: "cool", lat: 64.1417, lng: -21.9266, label: "HALLGRÍMSKIRKJA · BASALT",  status: { upload: true,  hero: true,  body: true,  media: "done" } },
  { n: "02", code: "101 RVK", title: "Harpa, glass diamond by the harbour",    time: "11:02", mood: "Glacier",  tone: "cool", lat: 64.1504, lng: -21.9326, label: "HARPA · HARBOUR GLASS",    status: { upload: true,  hero: true,  body: true,  media: "done" } },
  { n: "03", code: "101 RVK", title: "Sólfar, the Sun Voyager at dawn",        time: "07:44", mood: "Steel",    tone: "cool", lat: 64.1476, lng: -21.9224, label: "SÓLFAR · COLD STEEL",     status: { upload: true,  hero: true,  body: false, media: "running" } },
  { n: "04", code: "101 RVK", title: "Kolaportið on a Saturday",               time: "12:30", mood: "Wool",     tone: "warm", lat: 64.1486, lng: -21.9406, label: "KOLAPORTIÐ · FLEA MKT",   status: { upload: true,  hero: false, body: true,  media: null } },
  { n: "05", code: "101 RVK", title: "Nauthólsvík geothermal beach",           time: "14:15", mood: "Volcanic", tone: "warm", lat: 64.1239, lng: -21.9619, label: "NAUTHÓLSVÍK · HOT SAND",  status: { upload: true,  hero: true,  body: true,  media: "done" } },
  { n: "06", code: "101 RVK", title: "Laugavegur after dark",                  time: "22:08", mood: "Neon",     tone: "punk", lat: 64.1438, lng: -21.9230, label: "LAUGAVEGUR · NEON",       status: { upload: true,  hero: true,  body: true,  media: "running" } },
  { n: "07", code: "107 RVK", title: "Vesturbæjarlaug, blue hour from the hot tub", time: "16:52", mood: "Aurora",   tone: "cool", lat: 64.1463, lng: -21.9534, label: "VESTURBÆJARLAUG · BLUE HOUR", status: { upload: true,  hero: true,  body: false, media: null } },
] as const;

const DEFAULT_SEED_RECIPIENT: PostcardRecipient = {
  name: "M.",
  line1: "Somewhere warm",
  line2: "Poste restante",
  country: "World",
};

export const SEED_BODIES: Readonly<Record<string, readonly BodyBlock[]>> = {
  "01": [
    { type: "metaRow", content: ["20:50", "01 JAN 2026", "W1B 4NF", "MAGICAL LIGHTS OF MAYFAIR"] },
    { type: "heroImage", assetId: "se1-01", caption: "REGENT STREET'S STUNNING CHRISTMAS LIGHTS ILLUMINATE THE NIGHT." },
    { type: "paragraph", content: "As night falls over Regent Street, the dazzling Christmas lights come to life, creating a magical atmosphere. The angelic figures adorned with twinkling lights soar above the bustling street, inviting both locals and visitors to embrace the holiday spirit in the heart of London." },
    { type: "pullQuote", content: "A festive wonderland in the heart of London." },
  ],
  "02": [
    { type: "metaRow", content: ["13:51", "21 AUG 2025", "N6 5UL", "MUSWELL HILL VIEW"] },
    { type: "heroImage", assetId: "se1-02", caption: "A SERENE VIEW THROUGH A TEXTURED WINDOW." },
    { type: "paragraph", content: "A tranquil moment captured through a textured window, revealing the lush greenery outside. The soft light filters through, creating a peaceful ambiance that invites reflection. Muswell Hill's charm is evident, blending nature with the warmth of home." },
    { type: "pullQuote", content: "Nature's beauty framed perfectly." },
  ],
  "03": [
    { type: "metaRow", content: ["13:35", "23 AUG 2025", "N19 5AA", "TUFNELL PARK STATION"] },
    { type: "heroImage", assetId: "se1-03", caption: "TUFNELL PARK STATION: A VIBRANT HUB IN LONDON." },
    { type: "paragraph", content: "Amid the bustle of Tufnell Park, the underground station pauses around a waiting train. Commuters stand under bright platform panels, half absorbed by their own routes. The ads and tiled edges keep the frame busy, but the moment still feels held." },
    { type: "pullQuote", content: "A pause inside the city's rhythm." },
  ],
  "04": [
    { type: "metaRow", content: ["08:39", "09 SEP 2025", "SL4 1QF", "WINDSOR GUARDS IN ACTION"] },
    { type: "heroImage", assetId: "se1-04", caption: "THE ICONIC GUARDS OF WINDSOR CASTLE ON DUTY." },
    { type: "paragraph", content: "As the sun shines over Windsor, the guards move through the castle court with ceremony and precision. Their red tunics and bearskin hats cut a vivid line against the stone walls, turning a tourist morning into something suddenly formal and old." },
    { type: "pullQuote", content: "Tradition marches on." },
  ],
  "05": [
    { type: "metaRow", content: ["10:23", "09 SEP 2025", "SL4 1LB", "CORNWALL TOWER"] },
    { type: "heroImage", assetId: "se1-05", caption: "INSIDE THE TRANQUIL CORNWALL TOWER, WINDSOR." },
    { type: "paragraph", content: "Inside the Windsor grounds, stone arches and soft light make a sheltered pause after the parade outside. Tables gather beneath old brick and vaulted openings, turning the tower into a quiet room between spectacle and lunch." },
    { type: "pullQuote", content: "A peaceful escape in Windsor." },
  ],
  "06": [
    { type: "metaRow", content: ["15:05", "11 SEP 2025", "WC2N 6PB", "GRADUATION CEREMONY"] },
    { type: "heroImage", assetId: "se1-06", caption: "A CELEBRATORY CROWD NEAR GOLDEN JUBILEE BRIDGE." },
    { type: "paragraph", content: "Near the Golden Jubilee Bridge, a formal crowd gathers in bright daylight. Gowns, suits and phones make the pavement feel ceremonial, while the river corridor keeps London moving around the moment. It reads like a celebration caught between crossings." },
    { type: "pullQuote", content: "A moment to cherish forever." },
  ],
  "07": [
    { type: "metaRow", content: ["17:08", "13 SEP 2025", "TW5 9GX", "STREET ART IN HOUNSLOW"] },
    { type: "heroImage", assetId: "se1-07", caption: "COLORFUL GRAFFITI BRIGHTENS THIS HOUNSLOW PASSAGE." },
    { type: "paragraph", content: "In Hounslow, a graffiti-covered passage bursts with colour and private marks. The walls turn an ordinary route into a small urban gallery, with sprayed names, layered paint and hard edges pulling the eye deeper into the frame." },
    { type: "pullQuote", content: "Art speaks where words are silent." },
  ],
  "08": [
    { type: "metaRow", content: ["18:31", "27 SEP 2025", "SE10 0JH", "GREENWICH PENINSULA"] },
    { type: "heroImage", assetId: "se1-08", caption: "A STUNNING NIGHT VIEW OF GREENWICH PENINSULA'S SKYLINE." },
    { type: "paragraph", content: "At Greenwich Peninsula, the city lights skim the water after dark. Towers and reflections stack into a bright edge along the river, while the foreground stays quiet enough for an evening walk. The skyline feels close, but not intrusive." },
    { type: "pullQuote", content: "The city sparkles under the night sky." },
  ],
  "09": [
    { type: "metaRow", content: ["18:03", "20 NOV 2025", "TW6 1FB", "UK BORDER CROWD"] },
    { type: "heroImage", assetId: "se1-09", caption: "A BUSY SCENE AT THE UK BORDER, HEATHROW AIRPORT." },
    { type: "paragraph", content: "Heathrow compresses the first minutes of arrival into a queue of bags, coats and passport checks. The crowd is tired but alert, carrying the particular energy of being almost through the threshold and not quite in the city yet." },
    { type: "pullQuote", content: "Excitement fills the air." },
  ],
  "10": [
    { type: "metaRow", content: ["17:14", "30 MAY 2025", "N1C 4DQ", "REGENT'S CANAL EATS"] },
    { type: "heroImage", assetId: "se1-10", caption: "SAVORING THE FLAVORS ALONG REGENT'S CANAL." },
    { type: "paragraph", content: "Along the Regent's Canal at King's Cross, a restaurant counter becomes the whole scene: handwritten specials, cold water, steel shelves and a server moving through service. The room is warm, close and alive with the small choreography of dinner." },
    { type: "pullQuote", content: "A feast for the senses." },
  ],
  "11": [
    { type: "metaRow", content: ["22:05", "18 APR 2026", "W1J 9HA", "NIGHTTIME IN MAYFAIR"] },
    { type: "heroImage", assetId: "se1-11", caption: "THE VIBRANT STREETS OF MAYFAIR AT NIGHT." },
    { type: "paragraph", content: "Piccadilly at night turns traffic into a moving light table. Buses, cars and shopfront glow gather around BAFTA's facade, making Mayfair feel both polished and restless. It is the city after dark, still dressed for somewhere else." },
    { type: "pullQuote", content: "London's nightlife is a vibrant spectacle." },
  ],
  "12": [
    { type: "metaRow", content: ["18:23", "18 APR 2026", "WC1H 0AH", "PULSE FITNESS GYM"] },
    { type: "heroImage", assetId: "se1-12", caption: "PULSE FITNESS GYM: A HUB OF STRENGTH AND COMMUNITY." },
    { type: "paragraph", content: "Near Gordon Street, the gym scene is bright, practical and full of repeated motion. Equipment, mirrors and bodies make a compact city interior where everyone seems focused on a private target, sharing the same room without sharing the same rhythm." },
    { type: "pullQuote", content: "Where strength meets community." },
  ],
  "13": [
    { type: "metaRow", content: ["02:05", "06 JUL 2025", "N4 3NP", "COLERIDGE ROAD"] },
    { type: "heroImage", assetId: "se1-13", caption: "A TRANQUIL SUNSET OVER COLERIDGE ROAD, FINSBURY PARK." },
    { type: "paragraph", content: "On Coleridge Road, a soft cloud catches the last colour above brick buildings and parked cars. The street is plain, almost empty, which lets the sky do the work. It is a quiet London ending: domestic, pink and temporary." },
    { type: "pullQuote", content: "A moment of calm in the city." },
  ],
} as const;

export const SEED_BODY_05 = SEED_BODIES["05"];

export const SEED_POSTCARDS: Readonly<Record<string, SeedPostcard>> = {
  "01": { message: "I loved wandering through the festive lights. The atmosphere was enchanting.", recipient: DEFAULT_SEED_RECIPIENT },
  "02": { message: "I found a quiet spot to enjoy the view. It is so peaceful here.", recipient: DEFAULT_SEED_RECIPIENT },
  "03": { message: "I loved the energy at Tufnell Park. The underground is always its own small theatre.", recipient: DEFAULT_SEED_RECIPIENT },
  "04": { message: "I saw the guards in their full glory today. Such a memorable morning.", recipient: DEFAULT_SEED_RECIPIENT },
  "05": { message: "I found a quiet spot to pause in Windsor. The architecture does half the talking.", recipient: DEFAULT_SEED_RECIPIENT },
  "06": { message: "I passed a ceremony by the bridge today. The whole pavement felt proud.", recipient: DEFAULT_SEED_RECIPIENT },
  "07": { message: "I found an alley filled with colour. It felt like a small hidden gallery.", recipient: DEFAULT_SEED_RECIPIENT },
  "08": { message: "I walked by the river at night. The lights were doing all the work.", recipient: DEFAULT_SEED_RECIPIENT },
  "09": { message: "Just arrived through Heathrow. The city starts before you even leave the queue.", recipient: DEFAULT_SEED_RECIPIENT },
  "10": { message: "I ate by the canal and watched the counter move around dinner. The room was electric.", recipient: DEFAULT_SEED_RECIPIENT },
  "11": { message: "London after dark still has so much charge. Piccadilly looked dressed up for itself.", recipient: DEFAULT_SEED_RECIPIENT },
  "12": { message: "Found a pocket of focus near Gordon Street. Everyone was moving in their own rhythm.", recipient: DEFAULT_SEED_RECIPIENT },
  "13": { message: "I stopped for the sky on Coleridge Road. It was ordinary and beautiful at once.", recipient: DEFAULT_SEED_RECIPIENT },
} as const;

export const SEED_POSTCARD_05 = SEED_POSTCARDS["05"];

// The 13 seed photos that ship as static assets under
// `web/public/seed-images/`. All are bound 1-per-stop as heroAssetId;
// `se1-13` also acts as the project cover.
// Filenames preserved verbatim from the legacy app/seed-images/ directory
// so future AI tools can correlate.
export const SEED_ASSETS: readonly SeedAsset[] = [
  { id: "se1-01", stop: "01", tone: "warm", imageUrl: "/seed-images/IMG_0294.jpg" },
  { id: "se1-02", stop: "02", tone: "cool", imageUrl: "/seed-images/IMG_3083.jpg" },
  { id: "se1-03", stop: "03", tone: "punk", imageUrl: "/seed-images/IMG_3162.jpg" },
  { id: "se1-04", stop: "04", tone: "warm", imageUrl: "/seed-images/IMG_3837.jpg" },
  { id: "se1-05", stop: "05", tone: "warm", imageUrl: "/seed-images/IMG_3884.jpg" },
  { id: "se1-06", stop: "06", tone: "cool", imageUrl: "/seed-images/IMG_4151.jpg" },
  { id: "se1-07", stop: "07", tone: "warm", imageUrl: "/seed-images/IMG_4566.jpg" },
  { id: "se1-08", stop: "08", tone: "punk", imageUrl: "/seed-images/IMG_5577.jpg" },
  { id: "se1-09", stop: "09", tone: "cool", imageUrl: "/seed-images/IMG_7711.jpg" },
  { id: "se1-10", stop: "10", tone: "cool", imageUrl: "/seed-images/IMG_8469.jpg" },
  { id: "se1-11", stop: "11", tone: "cool", imageUrl: "/seed-images/IMG_8745.jpg" },
  { id: "se1-12", stop: "12", tone: "warm", imageUrl: "/seed-images/IMG_8774.jpg" },
  { id: "se1-13", stop: "13", tone: "warm", imageUrl: "/seed-images/IMG_9931.jpg" },
] as const;

export const SEED_TASKS: readonly SeedMediaTask[] = [
  { id: "tk_w05_vid", kind: "img2vid", stopId: "05", mode: "fashion", state: "done",     progress: 1.0,  prompt: "slow interior drift, old stone, quiet lunch" },
  { id: "tk_w03_img", kind: "img2img", stopId: "03", mode: "punk",    state: "running",  progress: 0.62, prompt: "ransom, high-contrast newsprint, paper grain" },
  { id: "tk_w08_img", kind: "img2img", stopId: "08", mode: "cinema",  state: "running",  progress: 0.34, prompt: "noir neon, subtitle framing, letterbox" },
  { id: "tk_w01_img", kind: "img2img", stopId: "01", mode: "fashion", state: "done",     progress: 1.0,  prompt: "festive Regent Street, editorial night crop" },
  { id: "tk_w10_img", kind: "img2img", stopId: "10", mode: "cinema",  state: "done",     progress: 1.0,  prompt: "restaurant counter, warm service, still camera" },
  { id: "tk_w07_img", kind: "img2img", stopId: "07", mode: "fashion", state: "queued",   progress: 0.0,  prompt: "pub interior, warm tungsten, ember glow" },
  { id: "tk_w04_img", kind: "img2img", stopId: "04", mode: "fashion", state: "done",     progress: 1.0,  prompt: "Windsor guards, formal red, stone court" },
] as const;

export const PROJECTS_FEED: readonly FeedEntry[] = [
  { id: 1, title: "A Year Around London", author: "Ana Ishii",     stops: 13, mode: "fashion", label: "LONDON · WINDSOR",     reads: "2.4k", updated: "now" },
  { id: 2, title: "Mudlark Diaries",       author: "Ty Okafor",     stops: 14, mode: "punk",    label: "THAMES · FORESHORE",   reads: "891",  updated: "5d" },
  { id: 3, title: "48 Hours in E8",        author: "Priya Shah",    stops: 8,  mode: "cinema",  label: "HACKNEY · NIGHT",      reads: "4.1k", updated: "1w" },
  { id: 4, title: "The Jubilee Walk",      author: "Lena Park",     stops: 12, mode: "fashion", label: "WESTMINSTER · DAY",    reads: "1.2k", updated: "2w" },
  { id: 5, title: "Last Trains",           author: "Marco Reed",    stops: 7,  mode: "cinema",  label: "UNDERGROUND · 00:47",  reads: "3.6k", updated: "3w" },
  { id: 6, title: "Brick Lane after rain", author: "Yui Tanaka",    stops: 9,  mode: "punk",    label: "E1 · WET ASPHALT",     reads: "624",  updated: "1m" },
  { id: 7, title: "A Week in Reykjavík",   author: "Sigrún Jónsdóttir", stops: 7,  mode: "cinema",  label: "REYKJAVÍK · AURORA",   reads: "1.8k", updated: "4d" },
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
