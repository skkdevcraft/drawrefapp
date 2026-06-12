/**
 * Material Preview — off-screen thumbnail generation
 *
 * For each material preset, renders a small thumbnail of the model
 * with that preset's material applied. Thumbnails are generated
 * using a fixed camera and fixed lighting so that materials can be
 * compared consistently.
 *
 * The generated thumbnails are cached keyed by model identity and
 * preset name, so they are only regenerated when the model changes
 * or preset definitions change.
 *
 * (See docs/004.material.md → Preview Generation)
 */

import * as THREE from 'three';
import type { MaterialPreset } from './material-preset';
import { getPresetMaterial, PRESET_NAMES } from './material-preset';

/* ── Constants ─────────────────────────────────────── */

/** Thumbnail size in pixels (square). */
const THUMB_SIZE = 120;

/** Background color for the preview render. */
const PREVIEW_BG = 0x2a2a2e;

/* ── Preview Camera Setup ──────────────────────────── */

/**
 * Creates a fixed camera for preview rendering.
 *
 * View: Three-Quarter View
 *   - Azimuth: 45°
 *   - Elevation: 30°
 *   - Distance: computed to fit a unit-radius model comfortably
 */
function createPreviewCamera(aspect: number = 1): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 20);

  const azRad = 45 * (Math.PI / 180);
  const elRad = 30 * (Math.PI / 180);
  const dist = 3.5;

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
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
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
  const ambient = new THREE.AmbientLight(0xffffff, 0.1);
  lights.push(ambient);

  return lights;
}

/* ── Model Cloning ─────────────────────────────────── */

/**
 * Creates a shallow clone of the model where geometry is shared but
 * each Mesh gets a fresh material array. This avoids duplicating
 * large vertex buffers while still letting us assign unique materials.
 *
 * The clone preserves the full transform hierarchy of the original.
 */
function cloneForPreview(model: THREE.Object3D): THREE.Group {
  const root = new THREE.Group();
  root.name = 'preview-clone-root';

  // Map original objects to their clones to preserve transforms
  const cloneMap = new Map<THREE.Object3D, THREE.Object3D>();

  model.traverse((child) => {
    let clone: THREE.Object3D;

    if (child instanceof THREE.Mesh) {
      const mesh = child as THREE.Mesh;
      clone = new THREE.Mesh(mesh.geometry, []);
      clone.castShadow = true;
      clone.receiveShadow = true;
    } else if (child instanceof THREE.Group) {
      clone = new THREE.Group();
    } else {
      // Skip non-Mesh, non-Group objects (lights, helpers, etc.)
      return;
    }

    // Copy transform
    clone.position.copy(child.position);
    clone.quaternion.copy(child.quaternion);
    clone.scale.copy(child.scale);
    clone.name = child.name;

    cloneMap.set(child, clone);
  });

  // Rebuild hierarchy
  model.traverse((child) => {
    const clone = cloneMap.get(child);
    if (!clone) return;

    if (child === model) {
      // Attach to root
      clone.position.set(0, 0, 0);
      clone.quaternion.identity();
      clone.scale.set(1, 1, 1);
      root.add(clone);
    } else {
      const parentClone = cloneMap.get(child.parent!);
      if (parentClone) {
        parentClone.add(clone);
      }
    }
  });

  return root;
}

/* ── Thumbnail Generation ──────────────────────────── */

/**
 * Cache of generated thumbnails.
 *
 * Key format: `${modelUid}:${presetName}`
 * Value: data URL of the PNG thumbnail
 */
const thumbnailCache = new Map<string, string>();

let cachedModelUid: string | null = null;

/**
 * Generates thumbnail previews for all material presets.
 *
 * Renders each preset variant into an off-screen canvas and returns
 * a Map from preset name to data URL.
 *
 * Thumbnails are cached so they are only regenerated when the model
 * reference changes.
 *
 * @param model    - The current scene model (will be cloned for rendering)
 * @param renderer - The main WebGLRenderer (used for off-screen rendering)
 * @returns A Map of preset → data URL
 */
export async function generateMaterialPreviews(
  model: THREE.Object3D,
  renderer: THREE.WebGLRenderer,
): Promise<Map<MaterialPreset, string>> {
  const modelUid = model.uuid;

  // If we already have cached thumbnails for this model, return them
  if (cachedModelUid === modelUid) {
    const cached = new Map<MaterialPreset, string>();
    for (const preset of PRESET_NAMES) {
      const dataUrl = thumbnailCache.get(`${modelUid}:${preset}`);
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

  const result = new Map<MaterialPreset, string>();

  // Save the current render target so we can restore it
  const prevRenderTarget = renderer.getRenderTarget();
  const prevAutoClear = renderer.autoClear;

  // Off-screen render target
  const target = new THREE.WebGLRenderTarget(THUMB_SIZE, THUMB_SIZE, {
    samples: 4, // MSAA for nicer thumbnails
  });

  // Preview scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PREVIEW_BG);

  // Camera
  const camera = createPreviewCamera();

  // Lights
  const lights = createPreviewLights();
  for (const light of lights) {
    scene.add(light);
  }

  // Clone the model once (geometry is shared)
  const cloneRoot = cloneForPreview(model);
  scene.add(cloneRoot);

  // For each preset, apply the material and render
  for (const preset of PRESET_NAMES) {
    const mat = getPresetMaterial(preset);

    // Apply preset material to all meshes in the clone, using the
    // same material class (Standard / Physical) as the main viewer
    cloneRoot.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const params: THREE.MeshStandardMaterialParameters = {
          color: mat.color,
          roughness: mat.roughness,
          metalness: mat.metalness,
        };

        switch (mat.materialClass) {
          case 'physical':
            child.material = new THREE.MeshPhysicalMaterial(params);
            break;
          case 'standard':
          default:
            child.material = new THREE.MeshStandardMaterial(params);
            break;
        }
      }
    });

    // Render to off-screen target
    renderer.autoClear = true;
    renderer.setRenderTarget(target);
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
    thumbnailCache.set(`${modelUid}:${preset}`, dataUrl);
  }

  // Clean up preview scene
  scene.remove(cloneRoot);
  scene.clear();
  target.dispose();

  // Restore renderer state
  renderer.setRenderTarget(prevRenderTarget);
  renderer.autoClear = prevAutoClear;

  // Update cached model UID
  cachedModelUid = modelUid;

  return result;
}

/**
 * Invalidates the thumbnail cache, forcing regeneration on the next call.
 * Should be called when preset definitions change.
 */
export function clearPreviewCache(): void {
  thumbnailCache.clear();
  cachedModelUid = null;
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
  cachedModelUid = null;
}
