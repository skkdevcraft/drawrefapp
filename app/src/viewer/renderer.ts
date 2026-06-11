/**
 * Renderer — creates a WebGLRenderer attached to a canvas.
 *
 * Fills the viewport with a max pixel ratio of 2 for performance.
 */

import * as THREE from 'three';

/**
 * Creates a WebGLRenderer attached to the given canvas.
 */
export function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  return renderer;
}