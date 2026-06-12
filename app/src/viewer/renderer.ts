/**
 * Renderer — creates a WebGLRenderer attached to a canvas.
 *
 * Fills the viewport with a max pixel ratio of 2 for performance.
 */

import * as THREE from 'three';

/**
 * Creates a WebGLRenderer attached to the given canvas.
 *
 * Shadow maps are enabled with PCFSoftShadowMap so that the softness
 * setting (shadow.radius) actually produces visible soft shadows.
 */
export function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  return renderer;
}