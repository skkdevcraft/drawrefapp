/**
 * Screenshot — capture the current viewport as an image.
 *
 * Placeholder for future screenshot / export functionality.
 * The renderer already supports `renderer.domElement.toDataURL()`.
 *
 * TODO: Add download helper, resolution options, etc.
 */

import * as THREE from 'three';

/**
 * Captures the current renderer contents as a data URL (PNG).
 *
 * @param renderer - The active WebGLRenderer
 * @returns A PNG data URL string
 */
export function captureScreenshot(renderer: THREE.WebGLRenderer): string {
  return renderer.domElement.toDataURL('image/png');
}

/**
 * Triggers a download of the current viewport as a PNG file.
 *
 * @param renderer - The active WebGLRenderer
 * @param filename - The download filename (default: 'drawref-screenshot.png')
 */
export function downloadScreenshot(
  renderer: THREE.WebGLRenderer,
  filename = 'drawref-screenshot.png',
): void {
  const dataUrl = captureScreenshot(renderer);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}