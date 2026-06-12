/**
 * View Presets — predefined camera angles, lighting, and their UI.
 *
 * Each preset sets both the camera angle and a suitable light configuration
 * for that view, so the model is well-lit from the ideal drawing perspective.
 */

import { PerspectiveCamera } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { applyCameraState, getCameraState } from '../camera/state';
import { set } from '../settings/store';
import type { LightValue } from '../settings/registry';

/* ── Types ────────────────────────────────────────── */

/**
 * The three light settings that a preset can configure.
 */
interface LightPreset {
  keylight: LightValue;
  fill: LightValue;
  rim: LightValue;
}

/**
 * Minimal viewer controls needed for view presets.
 */
export interface ViewerControls {
  controls: OrbitControls;
  camera: PerspectiveCamera;
  fitCamera: (targetRadius?: number) => void;
}

/* ── Preset Definitions ───────────────────────────── */

interface PresetDef {
  label: string;
  theta: number;
  phi: number;
  /** Light configuration for this view. null means keep current lights. */
  lights: LightPreset | null;
}

/**
 * Default light values (matching the registry defaults).
 */
const DEFAULT_LIGHTS: LightPreset = {
  keylight: { azimuth: 45, elevation: 30, intensity: 1.0, softness: 0.5 },
  fill: { azimuth: 225, elevation: 20, intensity: 0.4, softness: 0 },
  rim: { azimuth: 180, elevation: 30, intensity: 0.3, softness: 0 },
};

/**
 * Suitable light configurations for each view preset, designed to
 * reveal the model's form well from the given camera angle.
 */
const PRESETS: PresetDef[] = [
  {
    label: 'Front',
    theta: 0,
    phi: 0,
    lights: {
      // Classic Rembrandt-style key from upper-right
      keylight: { azimuth: 45, elevation: 35, intensity: 1.2, softness: 0.5 },
      // Cool fill from back-left
      fill: { azimuth: 225, elevation: 20, intensity: 0.4, softness: 0 },
      // Rim light from behind
      rim: { azimuth: 180, elevation: 30, intensity: 0.3, softness: 0 },
    },
  },
  {
    label: 'Side',
    theta: 90,
    phi: 0,
    lights: {
      // Key from front-left to illuminate the face when viewed from the right
      keylight: { azimuth: 315, elevation: 30, intensity: 1.2, softness: 0.5 },
      // Fill from back-right
      fill: { azimuth: 135, elevation: 15, intensity: 0.4, softness: 0 },
      // Rim from behind-right
      rim: { azimuth: 90, elevation: 35, intensity: 0.4, softness: 0 },
    },
  },
  {
    label: 'Three Quarter',
    theta: 45,
    phi: 30,
    lights: {
      // Key from upper-right, same relative direction — reveals the form well
      keylight: { azimuth: 45, elevation: 35, intensity: 1.2, softness: 0.5 },
      // Cool fill from back-left
      fill: { azimuth: 225, elevation: 20, intensity: 0.4, softness: 0 },
      // Rim from behind
      rim: { azimuth: 180, elevation: 35, intensity: 0.4, softness: 0 },
    },
  },
  {
    label: 'Top',
    theta: 0,
    phi: 90,
    lights: {
      // Key from upper-right, steeper elevation for top-down clarity
      keylight: { azimuth: 45, elevation: 60, intensity: 1.0, softness: 0.5 },
      // Softer fill from upper-left
      fill: { azimuth: 225, elevation: 45, intensity: 0.3, softness: 0 },
      // Subtle rim from below to define the bottom edge
      rim: { azimuth: 180, elevation: 10, intensity: 0.3, softness: 0 },
    },
  },
];

/* ── Helpers ──────────────────────────────────────── */

/**
 * Applies a light preset to the three scene lights.
 */
function applyLights(lights: LightPreset): void {
  set('keylight', { ...lights.keylight });
  set('fill', { ...lights.fill });
  set('rim', { ...lights.rim });
}

/**
 * Resets the three scene lights back to their registry defaults.
 */
function resetLightsToDefaults(): void {
  set('keylight', { ...DEFAULT_LIGHTS.keylight });
  set('fill', { ...DEFAULT_LIGHTS.fill });
  set('rim', { ...DEFAULT_LIGHTS.rim });
}

/* ── renderViewPresets ────────────────────────────── */

/**
 * Creates a section of view-preset buttons.
 *
 * Each preset sets the camera to a predefined angle and applies a
 * suitable light configuration for that view.
 *
 * The Reset button resets both the camera (fit view) and all three
 * lights to their registry defaults.
 */
export function renderViewPresets(
  controls: OrbitControls,
  camera: PerspectiveCamera,
  fitCamera: (targetRadius?: number) => void,
): HTMLElement {
  const section = document.createElement('div');
  section.className = 'view-presets';

  const heading = document.createElement('span');
  heading.className = 'settings-label';
  heading.textContent = 'View Presets';
  section.append(heading);

  const grid = document.createElement('div');
  grid.className = 'view-presets-grid';

  for (const preset of PRESETS) {
    const btn = document.createElement('button');
    btn.className = 'view-preset-btn';
    btn.textContent = preset.label;
    btn.addEventListener('click', () => {
      // Set camera angle (preserve current radius)
      const current = getCameraState(controls, camera);
      applyCameraState(controls, camera, {
        theta: preset.theta,
        phi: preset.phi,
        radius: current.radius,
      });

      // Apply matching light configuration
      if (preset.lights) {
        applyLights(preset.lights);
      }
    });
    grid.append(btn);
  }

  // Reset button
  const resetBtn = document.createElement('button');
  resetBtn.className = 'view-preset-btn view-preset-btn--reset';
  resetBtn.textContent = 'Reset';
  resetBtn.addEventListener('click', () => {
    fitCamera(1);
    resetLightsToDefaults();
  });
  grid.append(resetBtn);

  section.append(grid);
  return section;
}