/**
 * Scene Composition — reusable scene setup routine.
 *
 * Creates a fully composed Three.js scene containing the model, lights,
 * and camera, all configured from the provided settings. Used by both
 * the main viewer (persistent, with shadows) and material-preview
 * thumbnail generation (one-shot, without shadows).
 *
 * The same routine ensures that thumbnails reflect the user's current
 * lighting, background, glossiness, and camera angle — not hard-coded
 * defaults that differ from the main scene.
 */

import * as THREE from 'three';
import type { LightValue } from '../settings/registry';
import type { MaterialPreset } from '../settings/material-preset';
import type { CameraState } from '../camera/state';
import { applyMaterialPreset } from '../settings/material-preset';
import { createScene, addLights, type LightSet } from './scene';
import { createFittedCamera } from './camera';

/* ── Composition Options ──────────────────────────── */

export interface CompositionOptions {
  /** The model to display (already loaded and normalised). */
  model: THREE.Object3D;

  /** Background colour (CSS hex, e.g. `'#111111'`). Default: `'#111111'`. */
  background?: string;

  /** Key light parameters. Omit to use hard-coded defaults. */
  keylight?: LightValue;

  /** Fill light parameters. Omit to use hard-coded defaults. */
  fill?: LightValue;

  /** Rim light parameters. Omit to use hard-coded defaults. */
  rim?: LightValue;

  /** Glossiness value 0–1 applied to all model materials. */
  glossiness?: number;

  /** Material preset to apply. When omitted the model keeps its current materials. */
  material?: MaterialPreset;

  /** Camera viewpoint. Omit for an auto-fit front view. */
  cameraState?: CameraState;

  /** Desired camera aspect ratio. Defaults to viewport. */
  aspect?: number;

  /** Whether the key light casts shadows. Default: `false`. */
  enableShadows?: boolean;
}

export interface ComposedScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  lights: LightSet;
}

/* ── composeScene ─────────────────────────────────── */

/**
 * Composes a complete scene from a model and settings.
 *
 * Steps:
 *  1. Create Scene with the requested background
 *  2. Add ambient + key / fill / rim directional lights
 *  3. Add the model
 *  4. Apply glossiness (if provided)
 *  5. Apply material preset (if provided)
 *  6. Create and fit camera, optionally applying cameraState
 *
 * The returned objects are owned by the caller. Dispose them when done.
 */
export function composeScene(options: CompositionOptions): ComposedScene {
  const {
    model,
    background,
    keylight,
    fill,
    rim,
    glossiness,
    material,
    cameraState,
    aspect,
    enableShadows,
  } = options;

  // 1–2. Scene + lights
  const scene = createScene(background);
  const lights = addLights(scene, {
    keylight,
    fill,
    rim,
    enableShadows,
  });

  // 3. Model
  scene.add(model);

  // 4. Glossiness
  if (glossiness !== undefined) {
    applyGlossinessToModel(model, glossiness);
  }

  // 5. Material preset
  if (material !== undefined) {
    applyMaterialPreset(model, material);
  }

  // 6. Camera
  const camera = createFittedCamera(model, aspect, cameraState);

  return { scene, camera, lights };
}

/* ── Glossiness Helpers ────────────────────────────── */

/**
 * Applies the current glossiness setting to all Meshes in the model.
 *
 * - PBR materials (Standard/Physical): roughness = 1 - glossiness
 * - Phong material: shininess = glossiness * MAX_SHININESS
 * - Other materials are silently skipped.
 */
export function applyGlossinessToModel(
  model: THREE.Object3D,
  gloss: number, // 0 = dull … 1 = glossy
): void {
  const roughness = 1 - gloss;

  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    for (const mat of materials) {
      applyGlossinessToMaterial(mat, roughness, gloss);
    }
  });
}

/**
 * Sets roughness or shininess on a single material according to its type.
 */
export function applyGlossinessToMaterial(
  material: THREE.Material,
  roughness: number, // 0 = glossy, 1 = dull (PBR)
  gloss: number,     // 0 = dull, 1 = glossy
): void {
  const MAX_SHININESS = 100;

  if (
    material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshPhysicalMaterial
  ) {
    material.roughness = roughness;
  } else if (material instanceof THREE.MeshPhongMaterial) {
    material.shininess = Math.round(gloss * MAX_SHININESS);
  }
  // Lambert, Basic, Toon, Matcap etc. have no gloss → do nothing
}
