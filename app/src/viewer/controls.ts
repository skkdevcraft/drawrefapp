/**
 * Controls — creates OrbitControls with damping enabled.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Creates OrbitControls with damping (inertia) enabled.
 *
 * - dampingFactor: 0.08 (subtle inertia)
 * - target: origin (0, 0, 0)
 */
export function createControls(
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
): OrbitControls {
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 0, 0);
  controls.update();
  return controls;
}