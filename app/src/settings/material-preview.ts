/**
 * Material Preview — off-screen thumbnail generation
 *
 * For each material preset, renders a small thumbnail of the model
 * with that preset's material applied. Thumbnails are generated
 * using the **same scene composition** as the main viewer so that
 * lighting, background, glossiness, and camera angle match the
 * user's current settings exactly.
 *
 * Thumbnails differ from the main scene only in:
 *   - Material preset (varies per thumbnail)
 *   - No shadows (off-screen render target)
 *   - Square aspect ratio (1:1)
 *
 * Instead of cloning the already-loaded scene model, this module
 * reloads the model from scratch (using the same load → normalise
 * pipeline as the main scene) and renders it into an off-screen
 * render target.
 *
 * (See docs/004.material.md → Preview Generation)
 */

import * as THREE from 'three';
import type { LightValue } from './registry';
import type { MaterialPreset } from './material-preset';
import { PRESET_NAMES } from './material-preset';
import { loadModelFromName } from '../models/loader';
import { normalizeModel } from '../models/normalize';
import { createFallbackCube } from '../models/fallback';
import { composeScene } from '../viewer/composition';
import { get } from './store';
import type { CameraState } from '../camera/state';

/* ── Constants ─────────────────────────────────────── */

/** Thumbnail size in pixels (square). */
const THUMB_SIZE = 120;

/* ── Cache ─────────────────────────────────────────── */

/**
 * Cache of generated thumbnails.
 *
 * Key format: `${cacheKey}:${presetName}`
 *   cacheKey = modelName (or `'__fallback__'` when null)
 * Value: data URL of the PNG thumbnail
 */
const thumbnailCache = new Map<string, string>();

let cachedModelKey: string | null = null;

/* ── Public API ────────────────────────────────────── */

/**
 * Generates thumbnail previews for all material presets.
 *
 * Reloads the model from scratch using the same {@link loadModelFromName}
 * → {@link normalizeModel} pipeline as the main scene, then composes a
 * scene using {@link composeScene} with the **current** settings from the
 * store so that every thumbnail reflects the user's lighting, background,
 * glossiness, and camera angle.
 *
 * @param modelName - The model identifier (e.g. `"skull3.obj"`), or
 *                    `null` to use the fallback cube.
 * @param renderer  - The main WebGLRenderer (used for off-screen rendering)
 * @param camState  - Current camera state captured from the main viewer.
 *                    The thumbnail camera mirrors this viewpoint.
 * @returns A Map of preset → data URL
 */
export async function generateMaterialPreviews(
  modelName: string | null,
  renderer: THREE.WebGLRenderer,
  camState?: CameraState,
): Promise<Map<MaterialPreset, string>> {
  const cacheKey = modelName ?? '__fallback__';

  // If we already have cached thumbnails for this model, return them
  if (cachedModelKey === cacheKey) {
    const cached = new Map<MaterialPreset, string>();
    for (const preset of PRESET_NAMES) {
      const dataUrl = thumbnailCache.get(`${cacheKey}:${preset}`);
      if (dataUrl) {
        cached.set(preset, dataUrl);
      }
    }
    if (cached.size === PRESET_NAMES.length) {
      return cached;
    }
  }

  // Yield to the main thread so the UI stays responsive
  await new Promise((resolve) => setTimeout(resolve, 0));

  /* ── Reload the model fresh (same pipeline as main scene) ── */

  let model: THREE.Object3D;
  if (modelName) {
    model = await loadModelFromName(modelName);
  } else {
    model = createFallbackCube();
  }
  normalizeModel(model, 1);

  /* ── Read current settings from the store ────────── */

  const keylight = get('keylight') as LightValue;
  const fill = get('fill') as LightValue;
  const rim = get('rim') as LightValue;
  const glossiness = get('gloss') as number;
  const ambient = get('ambient') as number;

  // Match the main scene's dynamic background
  const bg = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-primary')
    .trim() || '#111111';

  const result = new Map<MaterialPreset, string>();

  // Save renderer state so we can restore it after off-screen rendering
  const prevRenderTarget = renderer.getRenderTarget();
  const prevAutoClear = renderer.autoClear;
  const prevViewport = new THREE.Vector4();
  renderer.getViewport(prevViewport);
  const prevScissor = new THREE.Vector4();
  renderer.getScissor(prevScissor);
  const prevScissorTest = renderer.getScissorTest();

  // Off-screen render target
  const target = new THREE.WebGLRenderTarget(THUMB_SIZE, THUMB_SIZE);

  // For each preset, compose a fresh scene (so materials don't bleed)
  for (const preset of PRESET_NAMES) {
    // Dispose the model's current materials (from previous iteration or
    // original loader) before applyMaterialPreset replaces them in-place.
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    // Compose the scene with current settings — same as the main viewer,
    // except material varies per thumbnail and shadows are disabled.
    const { scene, camera } = composeScene({
      model,
      background: bg,
      ambient,
      keylight,
      fill,
      rim,
      glossiness,
      material: preset,
      cameraState: camState,
      aspect: 1,
      enableShadows: false,
    });

    // Render to off-screen target
    renderer.autoClear = true;
    renderer.setRenderTarget(target);
    // renderer.setViewport(-THUMB_SIZE * off * scale, -THUMB_SIZE * off * scale, THUMB_SIZE* scale, THUMB_SIZE* scale);
    renderer.setScissor(0, 0, THUMB_SIZE, THUMB_SIZE);
    renderer.setScissorTest(false);
    renderer.render(scene, camera);

    // Read pixels (flipped Y — Three.js uses bottom-left origin)
    const pixels = new Uint8Array(THUMB_SIZE * THUMB_SIZE * 4);
    renderer.readRenderTargetPixels(
      target,
      0,
      0,
      THUMB_SIZE,
      THUMB_SIZE,
      pixels,
    );

    // Flip vertically (canvas uses top-left origin)
    flipPixelsVertically(pixels, THUMB_SIZE);

    // Create a data URL from the pixel data
    const dataUrl = pixelsToDataUrl(pixels, THUMB_SIZE);
    result.set(preset, dataUrl);

    // Cache it
    thumbnailCache.set(`${cacheKey}:${preset}`, dataUrl);

    // Remove the model from this iteration's scene (model is reused).
    // The scene and its lights will be garbage collected.
    scene.remove(model);
  }

  // Dispose the loaded model (geometry + final materials)
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
  target.dispose();

  // Restore renderer state (viewport, scissor, and render target)
  renderer.setRenderTarget(prevRenderTarget);
  renderer.setViewport(prevViewport);
  renderer.setScissor(prevScissor);
  renderer.setScissorTest(prevScissorTest);
  renderer.autoClear = prevAutoClear;

  // Update cached model key
  cachedModelKey = cacheKey;

  return result;
}

/**
 * Invalidates the thumbnail cache, forcing regeneration on the next call.
 * Should be called when preset definitions change.
 */
export function clearPreviewCache(): void {
  thumbnailCache.clear();
  cachedModelKey = null;
}

/* ── Pixel Helpers ─────────────────────────────────── */

/**
 * Flips pixel data vertically in-place.
 *
 * Three.js readRenderTargetPixels returns rows from bottom to top,
 * while canvas ImageData expects top to bottom.
 */
function flipPixelsVertically(
  pixels: Uint8Array,
  size: number,
): void {
  const rowBytes = size * 4;
  const temp = new Uint8Array(rowBytes);
  for (let y = 0; y < size / 2; y++) {
    const topOffset = y * rowBytes;
    const bottomOffset = (size - 1 - y) * rowBytes;
    // Swap rows
    temp.set(pixels.slice(topOffset, topOffset + rowBytes));
    pixels.copyWithin(topOffset, bottomOffset, bottomOffset + rowBytes);
    pixels.set(temp, bottomOffset);
  }
}

/**
 * Converts raw RGBA pixel data to a PNG data URL using an off-screen canvas.
 */
function pixelsToDataUrl(
  pixels: Uint8Array,
  size: number,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(size, size);
  imageData.data.set(pixels);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/* ── Reset Cache on Model Change ───────────────────── */

/**
 * Should be called when a new model is loaded to invalidate the cache
 * and force regeneration of preview thumbnails for the new geometry.
 */
export function invalidateModelPreviews(): void {
  thumbnailCache.clear();
  cachedModelKey = null;
}
