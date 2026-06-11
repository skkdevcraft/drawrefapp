/**
 * View Presets — predefined camera angles and their UI.
 */

import { PerspectiveCamera } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { applyCameraState, getCameraState } from '../camera/state';

/* ── Types ────────────────────────────────────────── */

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
}

const PRESETS: PresetDef[] = [
  { label: 'Front', theta: 0, phi: 0 },
  { label: 'Side', theta: 90, phi: 0 },
  { label: 'Three Quarter', theta: 45, phi: 30 },
  { label: 'Top', theta: 0, phi: 90 },
];

/* ── renderViewPresets ────────────────────────────── */

/**
 * Creates a section of view-preset buttons.
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
      const current = getCameraState(controls, camera);
      applyCameraState(controls, camera, {
        theta: preset.theta,
        phi: preset.phi,
        radius: current.radius,
      });
    });
    grid.append(btn);
  }

  // Reset button
  const resetBtn = document.createElement('button');
  resetBtn.className = 'view-preset-btn view-preset-btn--reset';
  resetBtn.textContent = 'Reset';
  resetBtn.addEventListener('click', () => {
    fitCamera(1);
  });
  grid.append(resetBtn);

  section.append(grid);
  return section;
}