/**
 * Camera State — read/write camera spherical coordinates from OrbitControls.
 *
 * URL convention:
 *   theta  — azimuthal angle in degrees (0–360)
 *   phi    — polar angle in degrees (0 = horizon, 90 = top)
 *   radius — distance from target (always at origin)
 *
 * Three.js OrbitControls convention:
 *   getAzimuthalAngle() — radians, theta around Y axis
 *   getPolarAngle()     — radians, 0 = top, PI = bottom
 *
 * Conversion:
 *   phi_url        = 90 - radToDeg(phi_threejs)
 *   phi_threejs    = degToRad(90 - phi_url)
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/* ── Types ──────────────────────────────────────────── */

export type CameraState = {
  /** Azimuthal angle in degrees (0–360). */
  theta: number;
  /** Polar angle in degrees (0 = horizon, 90 = top). */
  phi: number;
  /** Distance from target (origin). */
  radius: number;
};

/* ── Helpers ────────────────────────────────────────── */

const radToDeg = (r: number): number => r * (180 / Math.PI);
const degToRad = (d: number): number => d * (Math.PI / 180);

/**
 * Normalize an angle in degrees to [0, 360).
 */
function normalizeDeg(deg: number): number {
  const n = deg % 360;
  return n < 0 ? n + 360 : n;
}

/* ── getCameraState ─────────────────────────────────── */

/**
 * Reads the current camera state from OrbitControls.
 *
 * Converts Three.js polar angle (0 = top, PI = bottom)
 * to URL polar angle (0 = horizon, 90 = top).
 */
export function getCameraState(
  controls: OrbitControls,
  camera: THREE.PerspectiveCamera,
): CameraState {
  const thetaRad = controls.getAzimuthalAngle();
  const phiRad = controls.getPolarAngle();
  const radius = camera.position.distanceTo(controls.target);

  const theta = normalizeDeg(radToDeg(thetaRad));
  const phi = 90 - radToDeg(phiRad);

  return { theta, phi, radius };
}

/* ── applyCameraState ───────────────────────────────── */

/**
 * Applies a camera state (theta, phi, radius) to the camera.
 *
 * Converts URL polar angle (0 = horizon, 90 = top)
 * to Three.js polar angle (0 = top, PI = bottom),
 * then computes cartesian position relative to target (origin).
 */
export function applyCameraState(
  controls: OrbitControls,
  camera: THREE.PerspectiveCamera,
  state: CameraState,
): void {
  const thetaRad = degToRad(state.theta);
  const phiRad = degToRad(90 - state.phi);
  const radius = state.radius;

  // Spherical → Cartesian (Three.js convention)
  const sinPhi = Math.sin(phiRad);
  camera.position.set(
    radius * sinPhi * Math.sin(thetaRad),
    radius * Math.cos(phiRad),
    radius * sinPhi * Math.cos(thetaRad),
  );

  controls.target.set(0, 0, 0);
  controls.update();
}