/**
 * URL State Sync
 *
 * Keeps the browser URL in sync with the application state.
 *
 * Listens to:
 *  - setting changes (via the settings subscribe API)
 *  - camera changes (via OrbitControls `change` event)
 *
 * Updates are debounced at 300ms and pushed via `history.pushState`.
 */

import { subscribe } from '../settings/store';
import { serializeState } from '../settings/serialization';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PerspectiveCamera } from 'three';

/* ── Debounce ─────────────────────────────────────── */

/**
 * Creates a debounced version of `fn`.
 * The debounced function is called at most once every `delay` ms.
 * Returns an object with `call` and `cancel` methods.
 */
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): { call: (...args: Parameters<T>) => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  function call(...args: Parameters<T>) {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  }

  function cancel() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return { call, cancel };
}

/* ── pushUrl ──────────────────────────────────────── */

/**
 * Builds the URL query string from the current application state
 * and pushes it into the browser history.
 */
function pushUrl(
  model: string | null,
  controls: OrbitControls,
  camera: PerspectiveCamera,
): void {
  const query = serializeState(model, controls, camera);
  const url = query.length > 0 ? `?${query}` : window.location.pathname;

  history.pushState(null, '', url);
}

/* ── startUrlSync ─────────────────────────────────── */

/**
 * Starts synchronising the browser URL with the application state.
 *
 * @param getModel - A function that returns the current model identifier
 *                   (or null when using the fallback).
 * @param controls - The active OrbitControls instance.
 * @param camera   - The active PerspectiveCamera instance.
 *
 * @returns A cleanup function that stops all listeners and cancels any
 *          pending debounced update.
 */
export function startUrlSync(
  getModel: () => string | null,
  controls: OrbitControls,
  camera: PerspectiveCamera,
): () => void {
  const sync = debounce(() => {
    pushUrl(getModel(), controls, camera);
  }, 300);

  /* ── Setting changes ──────────────────────────── */
  const unsubSettings = subscribe(() => {
    sync.call();
  });

  /* ── Camera changes ───────────────────────────── */
  const onCameraChange = () => {
    sync.call();
  };

  controls.addEventListener('change', onCameraChange);

  /* ── Cleanup ──────────────────────────────────── */
  return function cleanup() {
    unsubSettings();
    controls.removeEventListener('change', onCameraChange);
    sync.cancel();
  };
}