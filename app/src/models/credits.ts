/**
 * Model Credits — metadata about 3D models used in the app.
 *
 * Each entry is keyed by filename as it appears in the `/models/` directory.
 * All fields are optional — an entry may omit author, source, or license.
 *
 * When adding a new model, add an entry here so users can see attribution
 * directly in the settings panel.
 */

export interface ModelCredit {
  /** Name of the author/creator of the 3D model. */
  author?: string;
  /** URL where the model was obtained. */
  source?: string;
  /** License under which the model is distributed. */
  license?: string;
}

/**
 * Credits lookup table, keyed by model filename.
 *
 * Lookup is case-sensitive and matches the exact filename in `/models/`.
 */
const credits: Record<string, ModelCredit> = {
  'skull.obj': {
    author: 'deater07',
    source: 'https://free3d.com/3d-model/skull-human-anatomy-82445.html',
    license: 'CC0',
  },
  'head.obj': {
    author: 'Ron lemen',
    source: 'Planes of the Head.blend',
    license: 'CC0',
  },
};

/**
 * Returns the credit metadata for a given model filename, or `null`
 * if no credits are registered for that file.
 */
export function getModelCredit(filename: string): ModelCredit | null {
  return credits[filename] ?? null;
}