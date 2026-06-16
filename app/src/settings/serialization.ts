/**
 * URL Serialization
 *
 * Serializes and deserialises the full application state (version, model,
 * camera, and all registered settings) to/from URL search parameters.
 *
 * Contract (see docs/002.settings.md):
 *
 *   ?v=1
 *   &model=skull.obj
 *   &cam=45,30,2.5
 *   &btn=br
 *
 * - `v`          — state schema version (required to parse)
 * - `model`      — model identifier (filename, name, or relative path)
 * - `cam`        — camera spherical coords: theta(°), phi(°), radius
 * - `setting...` — one per registered setting; omitted when equal to default
 *
 * Default values are omitted for cleaner URLs.
 * Missing parameters imply defaults.
 */

import { SETTINGS } from './registry';
import { get } from './store';
import {
  getCameraState,
  type CameraState,
} from '../camera/state';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PerspectiveCamera } from 'three';

/* ── Constants ────────────────────────────────────── */

const CURRENT_VERSION = 1;

/* ── Types ────────────────────────────────────────── */

/**
 * The full application state parsed from the URL.
 *
 * - `version`  — always `1` for the current schema.
 * - `model`    — the model identifier (null means "use default").
 * - `camera`   — spherical camera coords (null means "auto-fit").
 * - `settings` — values for every registered setting (already run through
 *                each setting's `deserialize`, so invalid values are
 *                already replaced with defaults).
 */
export type URLState = {
  version: number;
  model: string | null;
  camera: CameraState | null;
  settings: Record<string, unknown>;
};

/* ── serializeState ───────────────────────────────── */

/**
 * Converts the current application state into a URL query string.
 *
 * @param model    - The currently loaded model identifier (e.g. `"skull.obj"`).
 *                   Pass `null` to omit from the URL (use default on reload).
 * @param controls - The active OrbitControls instance (reads camera position).
 * @param camera   - The active PerspectiveCamera instance.
 *
 * @returns A query-string fragment (without leading `?`) ready to append.
 *
 * Example output:
 *   ```
 *   v=1&model=hand.obj&cam=45,30,2.5&btn=br
 *   ```
 */
export function serializeState(
  model: string | null,
  controls: OrbitControls,
  camera: PerspectiveCamera,
): string {
  const params = new URLSearchParams();

  /* ── Version ──────────────────────────────────── */
  params.set('v', String(CURRENT_VERSION));

  /* ── Model ────────────────────────────────────── */
  if (model && model.length > 0) {
    params.set('model', model);
  }

  /* ── Camera ───────────────────────────────────── */
  const camState = getCameraState(controls, camera);
  params.set('cam', `${camState.theta},${camState.phi},${camState.radius}`);

  /* ── Settings (omit defaults) ─────────────────── */
  for (const def of SETTINGS) {
    // The `model` setting is handled by the explicit `model` parameter
    // above — skip it here to avoid duplicate query parameters.
    if (def.id === 'model') {
      continue;
    }

    const value = get(def.id);

    // Omit values equal to the default — shorter, cleaner URLs.
    if (value === def.defaultValue) {
      continue;
    }

    params.set(def.id, def.serialize(value as never));
  }

  return params.toString();
}

/* ── deserializeState ─────────────────────────────── */

/**
 * Parses application state from URL search parameters.
 *
 * If `search` is provided it is used directly; otherwise the function reads
 * from `window.location.search`.
 *
 * When no `v` parameter is present the function assumes a clean start and
 * returns defaults (model = null, camera = null, settings all default).
 *
 * When an unsupported version is encountered the function returns `null`
 * (caller should use all-defaults as a safe fallback).
 *
 * @param search - Optional query string (e.g. `"?v=1&model=skull.obj&cam=…"`).
 *                 Omit to read from `window.location.search`.
 *
 * @returns A fully-parsed URLState, or `null` if the version is unrecognized.
 */
export function deserializeState(search?: string): URLState | null {
  const params = new URLSearchParams(search ?? window.location.search);

  /* ── Version ──────────────────────────────────── */
  const versionStr = params.get('v');

  if (versionStr === null) {
    // No version parameter at all — clean start, use all defaults.
    return {
      version: CURRENT_VERSION,
      model: null,
      camera: null,
      settings: {},
    };
  }

  const version = parseInt(versionStr, 10);
  if (isNaN(version)) {
    return null;
  }

  // Currently only version 1 is supported.
  // Future versions should add migration logic here.
  if (version !== 1) {
    return null;
  }

  /* ── Model ────────────────────────────────────── */
  const model = params.get('model') || null;

  /* ── Camera ────────────────────────────────────── */
  let camera: CameraState | null = null;
  const camStr = params.get('cam');

  if (camStr) {
    const parts = camStr.split(',').map((s) => s.trim()).map(Number);
    if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
      camera = { theta: parts[0], phi: parts[1], radius: parts[2] };
    }
    // Invalid camera values → leave as null → caller auto-fits.
  }

  /* ── Settings ──────────────────────────────────── */
  const settings: Record<string, unknown> = {};

  for (const def of SETTINGS) {
    // Each setting's deserializer validates internally and falls back
    // to its own default when the value is missing or invalid.
    settings[def.id] = def.deserialize(params.get(def.id));
  }

  // Ensure the model setting matches the explicitly parsed model value.
  // This keeps the settings store in sync when the URL has a `model` param.
  if (model !== null) {
    settings['model'] = model;
  }

  return { version, model, camera, settings };
}