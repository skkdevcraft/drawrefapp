/**
 * Scene — creates and configures the Three.js scene.
 *
 * Responsibilities:
 *  - Create the Scene with a neutral dark background
 *  - Add lighting (ambient, directional key/fill/rim)
 *  - Update background when the OS colour scheme changes
 */

import * as THREE from 'three';
import type { LightValue } from '../settings/registry';

/**
 * Creates an empty Scene with a neutral dark background.
 */
export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#111111');
  return scene;
}

/**
 * Adds lighting to the scene.
 *
 * - Ambient: soft fill
 * - Key directional: main light from upper-right-front
 * - Fill directional: cool fill from upper-left-back
 * - Rim directional: back rim light from below
 */
export function addLights(scene: THREE.Scene): { keyLight: THREE.DirectionalLight; fillLight: THREE.DirectionalLight } {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.01);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(5, 8, 6);
  keyLight.castShadow = true;

  // Shadow camera sized for a model normalized to radius ~1
  const shadowSize = 4;
  keyLight.shadow.camera.left = -shadowSize;
  keyLight.shadow.camera.right = shadowSize;
  keyLight.shadow.camera.top = shadowSize;
  keyLight.shadow.camera.bottom = -shadowSize;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 20;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.radius = 0.5; // default softness for half (0.5)
  keyLight.shadow.bias = -0.001;

  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x8ab4f8, 0.4);
  fillLight.position.set(-4, 2, -3);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
  rimLight.position.set(0, -6, -4);
  scene.add(rimLight);

  return { keyLight, fillLight };
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
 * Updates the scene background from CSS custom property `--bg-primary`.
 * Listens for OS colour scheme changes automatically via media query.
 */
export function updateBackground(scene: THREE.Scene): void {
  const bg = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-primary')
    .trim();
  scene.background = new THREE.Color(bg || '#111111');
}