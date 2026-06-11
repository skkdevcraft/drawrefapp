/**
 * Scene — creates and configures the Three.js scene.
 *
 * Responsibilities:
 *  - Create the Scene with a neutral dark background
 *  - Add lighting (ambient, directional key/fill/rim)
 *  - Update background when the OS colour scheme changes
 */

import * as THREE from 'three';

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
export function addLights(scene: THREE.Scene): void {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 8, 6);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x8ab4f8, 0.4);
  fillLight.position.set(-4, 2, -3);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
  rimLight.position.set(0, -6, -4);
  scene.add(rimLight);
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