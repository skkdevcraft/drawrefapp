/**
 * Fallback Model — creates a unit cube centred at the origin.
 *
 * Used when model loading fails or during initial load so the viewer
 * never starts empty.
 */

import * as THREE from 'three';

/**
 * Creates a simple unit cube as the fallback model.
 * Uses a shaded material with a subtle wireframe overlay.
 */
export function createFallbackCube(): THREE.Object3D {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0x4a6fa5,
    roughness: 0.4,
    metalness: 0.1,
    envMapIntensity: 0.6,
  });
  const box = new THREE.Mesh(geometry, material);
  box.position.set(0, 0, 0);

  // Subtle wireframe overlay
  const wireframeGeo = new THREE.EdgesGeometry(geometry);
  const wireframeMat = new THREE.LineBasicMaterial({
    color: 0x8ab4f8,
    transparent: true,
    opacity: 0.2,
  });
  const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
  box.add(wireframe);

  return box;
}