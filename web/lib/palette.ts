// Postcard style presets — ported verbatim from
// archive/app-html-prototype-2026-04-20/src/postcard-editor.jsx
//
// Each prompt pushes toward a distinct visual language so the user can
// pick a postcard that reads as illustration / poster / print rather than
// "same photo with a filter". Curated to 6 so pre-generating a whole
// project is ~13 stops × 6 styles × $0.02 ≈ $1.56.
import type { PostcardStyle } from "./ai-provider";

export interface StyleMeta {
  id: PostcardStyle;
  label: string;
  emoji: string;
  prompt: string;
}

export const POSTCARD_STYLES: readonly StyleMeta[] = [
  {
    id: "illustration",
    label: "Watercolour illustration",
    emoji: "🎨",
    prompt:
      "Reimagine this scene as a hand-painted watercolour illustration for a travel postcard. Use loose brush strokes, wet-on-wet washes, visible paper grain, muted sky tones, soft pigment bleeds. Simplify detail — this should feel like an illustration INSPIRED by the photo, not a filter on it. Keep the overall composition and landmarks but rework textures and forms as painted marks.",
  },
  {
    id: "poster",
    label: "Vintage travel poster",
    emoji: "🗺️",
    prompt:
      "Reinterpret this scene as a mid-century vintage travel poster (think 1950s Shell / airline posters). Flat gouache-style colour blocks, bold geometric shapes, 3-5 colour limited palette, visible screenprint grain, stylised skies. Simplify faces and crowds into silhouettes. Keep the landmark shape recognisable but heavily stylise everything else.",
  },
  {
    id: "riso",
    label: "Risograph 2-colour",
    emoji: "🟥",
    prompt:
      "Reimagine as a risograph print using only two colours (eg fluorescent pink and navy). Visible mis-registration, halftone dots, grainy texture, simplified shapes, slight colour offset. Flat forms, no photographic detail. Punk-zine energy.",
  },
  {
    id: "inkwash",
    label: "Ink + watercolour",
    emoji: "🖋️",
    prompt:
      "Reimagine as a loose ink-line sketch over light watercolour washes. Quick confident brushwork, some pencil guidelines left visible, small splash accents. Urban-sketcher travel-journal feel. Simplify all non-essential detail.",
  },
  {
    id: "anime",
    label: "Anime background",
    emoji: "🌸",
    prompt:
      "Reimagine this scene as a warm animated-film background painting for a travel postcard. Use soft atmospheric perspective, luminous clouds, saturated but painterly colours, simplified architecture, and gentle magical-realistic lighting. No characters, no text, no logos, not photorealistic.",
  },
  {
    id: "artnouveau",
    label: "Art nouveau print",
    emoji: "🪻",
    prompt:
      "Reinterpret as an Art Nouveau print (Mucha / fin-de-siècle poster). Thick flowing organic outlines, decorative borders, flat muted palette with golds, stylised plant forms framing the scene. Almost graphic. Heavy artistic licence — this should not look like the source photo.",
  },
] as const;

export function getStyleMeta(id: PostcardStyle): StyleMeta {
  const meta = POSTCARD_STYLES.find((s) => s.id === id);
  if (!meta) throw new Error(`Unknown postcard style: ${id}`);
  return meta;
}
