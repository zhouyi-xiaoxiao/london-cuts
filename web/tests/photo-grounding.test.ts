// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  codeFromLocationHint,
  coordinateForPhoto,
  coordinateForPhotos,
  earliestCaptureIso,
  sortPhotosByCapture,
  timeLabelFromCapture,
  type GroundedPhoto,
} from "@/lib/photo-grounding";
import { SEED_ASSETS } from "@/lib/seed";

function photo(
  id: string,
  lat: number | null,
  lng: number | null,
  capturedAtIso: string | null,
): GroundedPhoto {
  return {
    id,
    fileName: `${id}.jpg`,
    description: {
      title: id,
      paragraph: "",
      pullQuote: "",
      postcardMessage: "",
      mood: "Amber",
      tone: "warm",
      locationHint: "London SE1",
    },
    grounding: { lat, lng, capturedAtIso },
  };
}

describe("photo grounding", () => {
  it("keeps the SE1 demo asset set at 13 photos", () => {
    expect(SEED_ASSETS).toHaveLength(13);
  });

  it("extracts usable coordinates and averages grouped photos", () => {
    const a = photo("a", 51.5, -0.1, null);
    const b = photo("b", 51.7, -0.3, null);
    const missing = photo("missing", null, null, null);

    expect(coordinateForPhoto(a)).toEqual({ lat: 51.5, lng: -0.1 });
    expect(coordinateForPhoto(missing)).toBeNull();
    expect(coordinateForPhotos([a, b, missing])).toEqual({
      lat: 51.6,
      lng: -0.2,
    });
  });

  it("sorts and formats capture times", () => {
    const late = photo("late", null, null, "2026-04-25T20:15:00.000Z");
    const early = photo("early", null, null, "2026-04-25T07:05:00.000Z");
    const none = photo("none", null, null, null);

    expect(sortPhotosByCapture([none, late, early]).map((p) => p.id)).toEqual([
      "early",
      "late",
      "none",
    ]);
    expect(earliestCaptureIso([late, early])).toBe(
      "2026-04-25T07:05:00.000Z",
    );
    expect(timeLabelFromCapture("2026-04-25T07:05:00.000Z")).toBe("07:05");
  });

  it("normalises location hints into compact stop codes", () => {
    expect(codeFromLocationHint("Borough Market, London")).toBe("BOROUGH");
    expect(codeFromLocationHint("")).toBe("-");
  });
});
