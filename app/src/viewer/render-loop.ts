/**
 * Render Loop — event-driven rendering for the 3D viewer.
 *
 * The loop:
 *   - Renders only when something changes (camera, controls, model, etc.)
 *   - Self-terminates when the scene becomes idle
 *   - Resumes automatically when interaction/damping resumes
 *
 * Usage:
 *   const loop = createRenderLoop(renderer, scene, camera, controls);
 *   loop.requestRender();       // schedule a frame
 *   loop.dispose();             // clean up (cancel RAF)
 *
 * `requestRender` is safe to call multiple times — if the loop is
 * already running it's a no-op.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/* ── Interface ────────────────────────────────────── */

export interface RenderLoop {
  /** Schedules a render frame. No-op if loop is already running. */
  requestRender: () => void;
  /** Cancels any pending animation frame. */
  dispose: () => void;
}

/* ── createRenderLoop ─────────────────────────────── */

/**
 * Creates an event-driven render loop.
 *
 * The loop callback calls `controls.update()` (which returns `true` when
 * damping or interaction is active) and renders. When `controls.update()`
 * returns `false`, the loop self-terminates.
 *
 * @param renderer - The WebGLRenderer
 * @param scene    - The Scene to render
 * @param camera   - The PerspectiveCamera
 * @param controls - OrbitControls (with damping enabled)
 */
export function createRenderLoop(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
): RenderLoop {
  let animationId: number | null = null;

  /**
   * The render loop callback. Self-terminates when idle.
   */
  function renderLoop(): void {
    const needsUpdate = controls.update();
    renderer.render(scene, camera);

    if (needsUpdate) {
      animationId = requestAnimationFrame(renderLoop);
    } else {
      animationId = null;
    }
  }

  /**
   * Requests a render. No-op if loop is already running.
   */
  function requestRender(): void {
    if (animationId !== null) return;
    animationId = requestAnimationFrame(renderLoop);
  }

  /**
   * Cancels any pending animation frame.
   */
  function dispose(): void {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  return { requestRender, dispose };
}