/**
 * Material Preview — off-screen thumbnail generation
 *
 * For each material preset, renders a small thumbnail of the model
 * with that preset's material applied. Thumbnails are generated
 * using a fixed camera and fixed lighting so that materials can be
 * compared consistently.
 *
 * Instead of cloning the already-loaded scene model, this module
 * reloads the model from scratch (using the same load → normalise
 * pipeline as the main scene) and renders it into an off-screen
 * render target. This avoids sharing GPU resources with the live
 * scene and keeps thumbnail generation self-contained.
 *
 * The generated thumbnails are cached keyed by model name and
 * preset name, so they are only regenerated when the model changes
 * or preset definitions change.
 *
 * (See docs/004.material.md → Preview Generation)
 */

import * as THREE from 'three';
import type { MaterialPreset } from './material-preset';
import { getPresetMaterial, PRESET_NAMES, createMaterialForPreset } from './material-preset';
import { loadModelFromName } from '../models/loader';
import { normalizeModel } from '../models/normalize';
import { createFallbackCube } from '../models/fallback';
import type { CameraState } from '../camera/state';

/* ── Constants ─────────────────────────────────────── */

/** Thumbnail size in pixels (square). */
const THUMB_SIZE = 120;

/** Background color for the preview render. */
// const PREVIEW_BG = 0x2a2a2e;
const PREVIEW_BG = 0xffffff;

/* ── Preview Camera Setup ──────────────────────────── */

/**
 * Creates a camera for preview rendering positioned using the current
 * camera state (theta = azimuth, phi = elevation, radius = distance).
 *
 * When no camera state is provided, falls back to a fixed three-quarter
 * view (azimuth 45°, elevation 30°, distance 3.5) so thumbnails are
 * consistent before the user interacts with the scene.
 */
function createPreviewCamera(
  aspect: number = 1,
  camState?: CameraState,
): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 20);

  const azRad =
    camState !== undefined ? camState.theta * (Math.PI / 180) : 45 * (Math.PI / 180);
  const elRad =
    camState !== undefined ? camState.phi * (Math.PI / 180) : 30 * (Math.PI / 180);
  const dist = camState !== undefined ? camState.radius : 3.5;

  camera.position.set(
    dist * Math.cos(elRad) * Math.sin(azRad),
    dist * Math.sin(elRad),
    dist * Math.cos(elRad) * Math.cos(azRad),
  );
  camera.lookAt(0, 0, 0);

  return camera;
}

/* ── Preview Lighting Setup ────────────────────────── */

/**
 * Creates a fixed lighting setup for preview rendering.
 *
 * Light config:
 *   - Azimuth: 45°
 *   - Elevation: 45°
 *   - Intensity: 1.5
 *   - Softness: 0.5
 *
 * Plus a subtle fill light to avoid pure-black shadows.
 */
function createPreviewLights(): THREE.Light[] {
  const lights: THREE.Light[] = [];

  // Key light
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
  const kAzRad = 45 * (Math.PI / 180);
  const kElRad = 45 * (Math.PI / 180);
  keyLight.position.set(
    5 * Math.cos(kElRad) * Math.sin(kAzRad),
    5 * Math.sin(kElRad),
    5 * Math.cos(kElRad) * Math.cos(kAzRad),
  );
  lights.push(keyLight);

  // Fill light
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
  fillLight.position.set(-3, 1, -2);
  lights.push(fillLight);

  // Ambient light for base illumination
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  lights.push(ambient);

  return lights;
}

/* ── Thumbnail Generation ──────────────────────────── */

/**
 * Cache of generated thumbnails.
 *
 * Key format: `${cacheKey}:${presetName}`
 *   cacheKey = modelName (or `'__fallback__'` when null)
 * Value: data URL of the PNG thumbnail
 */
const thumbnailCache = new Map<string, string>();

let cachedModelKey: string | null = null;

/**
 * Generates thumbnail previews for all material presets.
 *
 * Reloads the model from scratch using the same {@link loadModelFromName}
 * → {@link normalizeModel} pipeline as the main scene, then renders
 * each preset variant into an off-screen render target.
 *
 * Thumbnails are cached by model name so they are only regenerated
 * when the model changes.
 *
 * @param modelName - The model identifier (e.g. `"skull3.obj"`), or
 *                    `null` to use the fallback cube.
 * @param renderer  - The main WebGLRenderer (used for off-screen rendering)
 * @param camState  - Current camera state to use for the preview viewpoint.
 *                    When omitted, a fixed three-quarter view is used.
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

  const result = new Map<MaterialPreset, string>();

  // Save renderer state so we can restore it after off-screen rendering
  const prevRenderTarget = renderer.getRenderTarget();
  const prevAutoClear = renderer.autoClear;
  const prevViewport = new THREE.Vector4();
  renderer.getViewport(prevViewport);
  const prevScissor = new THREE.Vector4();
  renderer.getScissor(prevScissor);
  const prevScissorTest = renderer.getScissorTest();

  // Off-screen render target (no MSAA — readRenderTargetPixels is
  // unreliable with MSAA across GPU/driver combinations, and 120×120
  // thumbnails don't need it — the CSS display will smooth them).
  const target = new THREE.WebGLRenderTarget(THUMB_SIZE, THUMB_SIZE);

  // Preview scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PREVIEW_BG);

  // Camera (use current scene camera orientation when available)
  const camera = createPreviewCamera(1, camState);

  // Lights
  const lights = createPreviewLights();
  for (const light of lights) {
    scene.add(light);
  }

  // Add the freshly-loaded model to the preview scene
  scene.add(model);

  // For each preset, apply the material and render
  for (const preset of PRESET_NAMES) {
    const mat = getPresetMaterial(preset);

    // Dispose previous preset materials
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    // Apply preset material to all meshes, using the same material
    // creation path as the main viewer (carries over vertexColors,
    // map, side, transparent, opacity from the original material).
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = createMaterialForPreset(mat, child);
      }
    });

    // Render to off-screen target
    renderer.autoClear = true;
    renderer.setRenderTarget(target);
    renderer.setViewport(0, 0, THUMB_SIZE, THUMB_SIZE);
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
  }

  // Clean up preview scene and dispose the loaded model
  scene.remove(model);
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
  scene.clear();
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
