// Narrative mode hook.
// Applied to <html data-mode={mode}> by F-P001's ModeSwitcher. CSS in
// web/app/globals.css reacts via [data-mode="…"] selectors.
"use client";

import { useRootStore } from "./root";
import type { NarrativeMode } from "@/lib/storage";

export const NARRATIVE_MODES: readonly NarrativeMode[] = [
  "fashion",
  "punk",
  "cinema",
] as const;

export function useMode(): NarrativeMode {
  return useRootStore((s) => s.mode);
}

export function useSetMode() {
  return useRootStore((s) => s.setMode);
}
