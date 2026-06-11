/**
 * Model URL Resolver — resolves a model identifier to candidate URLs.
 *
 * Resolution order (deterministic):
 *
 * 1. If the identifier has an explicit file extension (e.g. `"hand.obj"`):
 *    → `/models/hand.obj` (single candidate)
 *
 * 2. If the identifier has no file extension (e.g. `"bust"`, `"anatomy/torso"`):
 *    → `/models/bust.glb`, then `/models/bust.gltf`
 *    → `/models/anatomy/torso.glb`, then `/models/anatomy/torso.gltf`
 *
 * @param model - A model identifier (filename with extension, or bare name).
 * @returns An array of candidate URLs to attempt loading from (ordered by priority).
 */

export function resolveModelUrl(model: string): string[] {
  const base = `${import.meta.env.BASE_URL}models`;

  if (!model || model.trim().length === 0) {
    return [`${base}/skull3.obj`];
  }

  model = model.trim();

  // Determine if the model string has a file extension.
  // We look at the last segment (after the last '/') for a dot.
  const lastSegmentIndex = model.lastIndexOf('/');
  const filename = lastSegmentIndex >= 0 ? model.slice(lastSegmentIndex + 1) : model;
  const dotIndex = filename.lastIndexOf('.');

  const hasExtension = dotIndex > 0 && dotIndex < filename.length - 1;

  if (hasExtension) {
    // Explicit extension — single candidate
    return [`${base}/${model}`];
  }

  // No extension — try .glb first, then .gltf
  return [`${base}/${model}.glb`, `${base}/${model}.gltf`];
}