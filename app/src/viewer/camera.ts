/**
 * Camera — creates and positions the PerspectiveCamera.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Creates a PerspectiveCamera with a 50° FOV.
 * Aspect ratio is taken from the current viewport.
 */
export function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.01,
    100,
  );
  return camera;
}

/**
 * Fits the camera so the model's bounding sphere (with the given radius)
 * fills ~80% of the viewport.
 */
export function fitCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  targetRadius: number,
): void {
  const vFovRad = camera.fov * (Math.PI / 180);
  const fit = 0.8; // 80% fill

  // Distance needed to fit the bounding sphere vertically
  const distV = targetRadius / Math.tan(vFovRad / 2) / fit;
  // Distance needed to fit the bounding sphere horizontally
  const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * camera.aspect);
  const distH = targetRadius / Math.tan(hFovRad / 2) / fit;

  const distance = Math.max(distV, distH);

  camera.position.set(0, 0, distance);
  camera.lookAt(0, 0, 0);
  controls.update();
}