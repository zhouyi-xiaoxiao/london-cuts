// Small shared constants used across more than one component.
// Prefer importing from HERE rather than a component file so the import
// arrow stays sane (components depend on lib, not the other way around).

/**
 * Drag-drop MIME type carrying a stop asset's id.
 * Shared contract between drag sources (drawer cells, asset strip cells)
 * and drop targets (hero slot, spine rows). See tasks/HANDOFF.md
 * → "Drag-drop network" for the full map.
 */
export const MIME_ASSET_ID = "text/lc-asset-id";

/**
 * Default focus coordinate for a hero image (centered 50/50).
 * `Stop.heroFocus` is optional; when missing or null, callers should
 * substitute this via `?? DEFAULT_HERO_FOCUS`. Storing defaults inline
 * also sidesteps a persist-schema bump — existing localStorage entries
 * without the field keep working.
 */
export const DEFAULT_HERO_FOCUS = { x: 50, y: 50 } as const;
