#!/usr/bin/env node
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const webRoot = path.join(repoRoot, "web");
const requireFromWeb = createRequire(path.join(webRoot, "package.json"));
const OpenAI = requireFromWeb("openai").default;
const manifestPath = path.join(repoRoot, "tasks/generated/seed-photo-exif-geocode.json");
const outputPath = path.join(repoRoot, "tasks/generated/seed-photo-copy.json");

await loadDotEnv(path.join(webRoot, ".env.local"));

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY is missing; cannot build seed copy.");
}

const client = new OpenAI({ apiKey });
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));

const existing = await readJsonIfExists(outputPath);
const copyByFile = new Map((existing ?? []).map((row) => [row.file, row]));
const results = [];

for (const item of manifest) {
  if (copyByFile.has(item.file) && !process.argv.includes("--force")) {
    results.push(copyByFile.get(item.file));
    console.log(`cached ${item.file}`);
    continue;
  }
  const imagePath = path.join(webRoot, "public/seed-images", item.file);
  const image = await fs.readFile(imagePath);
  const place = compactPlace(item.place?.address ?? {});
  const hint = [
    `File: ${item.file}`,
    `EXIF date: ${item.date}`,
    `GPS: ${item.lat}, ${item.lng}`,
    `Reverse geocode: ${place || item.place?.display_name || "unknown"}`,
  ].join("\n");

  console.log(`describing ${item.file}`);
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.35,
    max_tokens: 450,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You write concise seed content for London Cuts, a travel photo story tool.",
          "Use the supplied EXIF GPS/time as ground truth for location and date.",
          "Use the image itself for visible scene details. Do not identify private people.",
          "Return JSON only with keys:",
          "title, code, label, mood, tone, paragraph, pullQuote, postcardMessage, caption.",
          "Constraints: code <= 8 uppercase characters; label <= 32 uppercase characters;",
          "tone must be warm, cool, or punk; paragraph 35-60 words; pullQuote <= 12 words;",
          "postcardMessage 1-2 first-person sentences; caption <= 70 chars.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          { type: "text", text: hint },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${image.toString("base64")}`,
              detail: "low",
            },
          },
        ],
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error(`empty response for ${item.file}`);
  const parsed = JSON.parse(raw);
  const row = {
    file: item.file,
    lat: item.lat,
    lng: item.lng,
    date: item.date,
    place,
    title: clean(parsed.title, fallbackTitle(item.file)),
    code: clean(parsed.code, placeCode(item)).slice(0, 8).toUpperCase(),
    label: clean(parsed.label, placeCode(item)).slice(0, 32).toUpperCase(),
    mood: clean(parsed.mood, "Amber"),
    tone: ["cool", "punk"].includes(parsed.tone) ? parsed.tone : "warm",
    paragraph: clean(parsed.paragraph, ""),
    pullQuote: clean(parsed.pullQuote, ""),
    postcardMessage: clean(parsed.postcardMessage, ""),
    caption: clean(parsed.caption, ""),
  };
  results.push(row);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2) + "\n");
}

await fs.writeFile(outputPath, JSON.stringify(results, null, 2) + "\n");
console.log(`wrote ${path.relative(repoRoot, outputPath)}`);

async function loadDotEnv(file) {
  const text = await fs.readFile(file, "utf8").catch(() => "");
  for (const line of text.split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!match) continue;
    const [, key, value] = match;
    if (!process.env[key]) process.env[key] = value.replace(/^"|"$/g, "");
  }
}

async function readJsonIfExists(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
}

function clean(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function fallbackTitle(file) {
  return file.replace(/\.[^.]+$/, "").replace(/_/g, " ");
}

function compactPlace(address) {
  const parts = [
    address.amenity,
    address.shop,
    address.man_made,
    address.railway,
    address.road,
    address.suburb || address.quarter || address.neighbourhood,
    address.town || address.city_district || address.city,
    address.postcode,
  ].filter(Boolean);
  return [...new Set(parts)].join(", ");
}

function placeCode(item) {
  const address = item.place?.address ?? {};
  return (
    address.postcode ||
    address.amenity ||
    address.shop ||
    address.road ||
    address.suburb ||
    "LONDON"
  )
    .toString()
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .slice(0, 8)
    .toUpperCase();
}
