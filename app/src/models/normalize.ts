/**
 * Model Normalization — centre and uniformly scale a loaded model.
 *
 * After normalisation:
 *   - The model's visual centre is at (0, 0, 0)
 *   - The model's bounding sphere has the given target radius
 *
 * This ensures a consistent viewing experience regardless of source
 * model size or origin offset.
 */

import * as THREE from 'three';

/**
 * Normalizes a loaded model so it is centred at the origin and
 * its bounding sphere has the given target radius.
 *
 * Steps:
 * 1. Compute world-space bounding box.
 * 2. Translate model so bounding box centre becomes (0, 0, 0).
 * 3. Compute bounding sphere of the centred model.
 * 4. Uniformly scale model so sphere radius == targetRadius.
 *
 * @param model        - The model to normalise (mutated in place)
 * @param targetRadius - Desired bounding sphere radius (default: 1)
 */
export function normalizeModel(model: THREE.Object3D, targetRadius = 1): void {
  // 1. Reset root transform
  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);
  model.scale.set(1, 1, 1);
  model.updateMatrixWorld();

  // 2. Find geometry centre and size
  const box = new THREE.Box3().setFromObject(model);
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  if (sphere.radius <= 0) return;

  const center = new THREE.Vector3();
  box.getCenter(center);
  const scale = targetRadius / sphere.radius;

  // 3. Shift all direct children so the geometry centre lands at the root's local origin
  model.children.forEach((child) => {
    child.position.sub(center);
  });

  // 4. Apply uniform scale to the root
  model.scale.set(scale, scale, scale);
}