/**
 * Scene — creates and configures the Three.js scene.
 *
 * Responsibilities:
 *  - Create the Scene with a configurable background
 *  - Add lighting (ambient, directional key/fill/rim) parameterized by settings
 *  - Update background when the OS colour scheme changes
 *  - Update individual lights in-place from LightValue settings
 */

import * as THREE from 'three';
import type { LightValue } from '../settings/registry';

export interface LightSet {
  ambientLight: THREE.AmbientLight;
  keyLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
  rimLight: THREE.DirectionalLight;
}

export interface LightsOptions {
  ambient?: number;
  keylight?: LightValue;
  fill?: LightValue;
  rim?: LightValue;
  enableShadows?: boolean;
}

/**
 * Creates an empty Scene with the given background colour.
 * Falls back to '#111111' when omitted.
 */
export function createScene(background?: string): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background ?? '#111111');
  return scene;
}

/**
 * Adds lighting to the scene, optionally positioned from LightValue settings.
 *
 * Always adds an ambient light (0xffffff, 0.2).
 *
 * When light settings are provided the lights are positioned immediately;
 * otherwise they use hard-coded defaults and the caller is expected to
 * call `updateKeyLight` / `updateFillLight` / `updateRimLight` later.
 *
 * Shadow-map setup on the key light is gated behind `enableShadows`
 * (defaults to `false` so thumbnail scenes stay cheap).
 */
export function addLights(
  scene: THREE.Scene,
  options?: LightsOptions,
): LightSet {
  const ambientIntensity = options?.ambient ?? 0.2;
  const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(
    0xffffff,
    options?.keylight?.intensity ?? 1.2,
  );
  const fillLight = new THREE.DirectionalLight(
    0x8ab4f8,
    options?.fill?.intensity ?? 0.4,
  );
  const rimLight = new THREE.DirectionalLight(
    0xffffff,
    options?.rim?.intensity ?? 0.3,
  );

  // Shadow setup (only when requested – e.g. main viewer)
  if (options?.enableShadows) {
    keyLight.castShadow = true;
    const shadowSize = 4;
    keyLight.shadow.camera.left = -shadowSize;
    keyLight.shadow.camera.right = shadowSize;
    keyLight.shadow.camera.top = shadowSize;
    keyLight.shadow.camera.bottom = -shadowSize;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.mapSize.set(4096, 4096);
    keyLight.shadow.radius = 0.5;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.5;
  }

  scene.add(keyLight);
  scene.add(fillLight);
  scene.add(rimLight);

  // Position lights from settings when provided, otherwise use defaults
  if (options?.keylight) {
    updateKeyLight(keyLight, options.keylight);
  } else {
    keyLight.position.set(5, 8, 6);
  }

  if (options?.fill) {
    updateFillLight(fillLight, options.fill);
  } else {
    fillLight.position.set(-4, 2, -3);
  }

  if (options?.rim) {
    updateRimLight(rimLight, options.rim);
  } else {
    rimLight.position.set(0, -6, -4);
  }

  return { ambientLight, keyLight, fillLight, rimLight };
}

/**
 * Updates the key directional light based on the LightValue settings.
 *
 * Converts azimuth/elevation spherical coordinates to a Cartesian position
 * aimed at the origin. Intensity and softness are applied directly.
 */
export function updateKeyLight(
  keyLight: THREE.DirectionalLight,
  lightValue: LightValue,
): void {
  const { azimuth, elevation, intensity, softness } = lightValue;

  // Spherical to Cartesian — azimuth around Y, elevation up from horizon
  const azRad = azimuth * (Math.PI / 180);
  const elRad = elevation * (Math.PI / 180);

  const distance = 10;
  const x = distance * Math.cos(elRad) * Math.sin(azRad);
  const y = distance * Math.sin(elRad);
  const z = distance * Math.cos(elRad) * Math.cos(azRad);

  keyLight.position.set(x, y, z);
  keyLight.intensity = intensity;

  // Make the shadow camera look at the origin from the light's position
  keyLight.shadow.camera.position.set(x, y, z);
  keyLight.shadow.camera.lookAt(0, 0, 0);

  // Softness: adjust shadow radius and bias to simulate softer shadows
  const shadowRadius = 0.5 + softness * 4;
  keyLight.shadow.radius = shadowRadius;
  keyLight.shadow.bias = -0.001 - softness * 0.002;

  keyLight.shadow.camera.updateProjectionMatrix();
  keyLight.shadow.needsUpdate = true;

  keyLight.updateMatrix();
}

/**
 * Updates the fill directional light based on the LightValue settings.
 *
 * Converts azimuth/elevation spherical coordinates to a Cartesian position
 * aimed at the origin. Intensity is applied directly. The fill light retains
 * its cool-blue tint (0x8ab4f8).
 */
export function updateFillLight(
  fillLight: THREE.DirectionalLight,
  lightValue: LightValue,
): void {
  const { azimuth, elevation, intensity, softness } = lightValue;

  // Spherical to Cartesian — azimuth around Y, elevation up from horizon
  const azRad = azimuth * (Math.PI / 180);
  const elRad = elevation * (Math.PI / 180);

  const distance = 10;
  const x = distance * Math.cos(elRad) * Math.sin(azRad);
  const y = distance * Math.sin(elRad);
  const z = distance * Math.cos(elRad) * Math.cos(azRad);

  fillLight.position.set(x, y, z);
  fillLight.intensity = intensity;

  // Softness not applicable to non-shadow-casting fill, but we keep the
  // interface consistent — softness is accepted but does nothing here.
  void softness;
}

/**
 * Updates the rim directional light based on the LightValue settings.
 *
 * Converts azimuth/elevation spherical coordinates to a Cartesian position
 * aimed at the origin. Intensity is applied directly.
 */
export function updateRimLight(
  rimLight: THREE.DirectionalLight,
  lightValue: LightValue,
): void {
  const { azimuth, elevation, intensity, softness } = lightValue;

  // Spherical to Cartesian — azimuth around Y, elevation up from horizon
  const azRad = azimuth * (Math.PI / 180);
  const elRad = elevation * (Math.PI / 180);

  const distance = 10;
  const x = distance * Math.cos(elRad) * Math.sin(azRad);
  const y = distance * Math.sin(elRad);
  const z = distance * Math.cos(elRad) * Math.cos(azRad);

  rimLight.position.set(x, y, z);
  rimLight.intensity = intensity;

  void softness; // reserved for future softness support on rim light
}

/**
 * Updates the ambient light intensity.
 */
export function updateAmbientLight(
  ambientLight: THREE.AmbientLight,
  intensity: number,
): void {
  ambientLight.intensity = intensity;
}

/**
 * Updates the scene background from CSS custom property `--bg-primary`.
 * Listens for OS colour scheme changes automatically via media query.
 */
export function updateBackground(scene: THREE.Scene): void {
  const bg = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-primary')
    .trim();
  scene.background = new THREE.Color(bg || '#111111');
}