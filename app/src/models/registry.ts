/**
 * Models Registry — defines all available 3D models in the application.
 *
 * Each entry describes a model file, its display label, and a thumbnail
 * SVG used as the button icon in the model selection UI.
 *
 * Adding a new model requires:
 *   1. Placing the model file in `/public/models/`
 *   2. Adding an entry in this registry
 *   3. Adding credit metadata in `./credits.ts`
 */

/* ── Types ────────────────────────────────────────── */

export type ModelEntry = {
  /** Filename as it appears in `/public/models/` (e.g. `"skull.obj"`). */
  id: string;
  /** Human-readable label for the model. */
  label: string;
  /** Inline SVG string used as the button icon (no text label shown). */
  thumbnail: string;
};

import { SKULL_THUMBNAIL, HEAD_THUMBNAIL } from '../ui/icons';

/* ── Registry ─────────────────────────────────────── */

const MODELS: ModelEntry[] = [
  {
    id: 'skull.obj',
    label: 'Skull',
    thumbnail: SKULL_THUMBNAIL,
  },
  {
    id: 'head.obj',
    label: 'Head',
    thumbnail: HEAD_THUMBNAIL,
  },
  {
    id: 'anime-head.obj',
    label: 'Anime Head',
    thumbnail: HEAD_THUMBNAIL,
  },

];

/* ── Lookup Helpers ───────────────────────────────── */

/**
 * Returns the model entry for a given model id (filename), or `undefined`
 * if no model with that id is registered.
 */
export function getModelEntry(id: string): ModelEntry | undefined {
  return MODELS.find((m) => m.id === id);
}

/**
 * Returns all registered model entries.
 */
export function getModelEntries(): ModelEntry[] {
  return MODELS;
}

/**
 * Returns the default model id (the first entry in the registry).
 */
export function getDefaultModelId(): string {
  return MODELS[0]?.id ?? 'skull.obj';
}