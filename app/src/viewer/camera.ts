/**
 * Camera — creates and positions the PerspectiveCamera.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CameraState } from '../camera/state';

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
 * Creates a PerspectiveCamera fitted to the model so its bounding
 * sphere fills ~80% of the viewport, then optionally applies a
 * CameraState (theta / phi / radius) to override the auto-fit position.
 *
 * Used by both the main viewer and thumbnail generation so that camera
 * fitting is consistent everywhere.
 *
 * @param model       - The model whose bounding sphere drives the fit.
 * @param aspect      - Desired aspect ratio (defaults to viewport).
 * @param cameraState - Optional spherical camera state to apply after fit.
 */
export function createFittedCamera(
  model: THREE.Object3D,
  aspect?: number,
  cameraState?: CameraState,
): THREE.PerspectiveCamera {
  const cameraAspect = aspect ?? (window.innerWidth / window.innerHeight);
  const camera = new THREE.PerspectiveCamera(50, cameraAspect, 0.01, 100);

  // Compute bounding sphere directly from the model
  const box = new THREE.Box3().setFromObject(model);
  if (box.isEmpty()) {
    box.set(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
  }
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  const { radius } = sphere;

  const vFovRad = camera.fov * (Math.PI / 180);
  const fit = 0.8;

  const distV = radius / Math.tan(vFovRad / 2) / fit;
  const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * camera.aspect);
  const distH = radius / Math.tan(hFovRad / 2) / fit;
  const distance = Math.max(distV, distH);

  if (cameraState) {
    // Apply the spherical camera state
    const thetaRad = cameraState.theta * (Math.PI / 180);
    const phiRad = (90 - cameraState.phi) * (Math.PI / 180);
    const r = cameraState.radius;

    const sinPhi = Math.sin(phiRad);
    camera.position.set(
      r * sinPhi * Math.sin(thetaRad),
      r * Math.cos(phiRad),
      r * sinPhi * Math.cos(thetaRad),
    );
  } else {
    // Auto-fit: place camera at default front position
    camera.position.set(0, 0, distance);
  }

  camera.lookAt(0, 0, 0);
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