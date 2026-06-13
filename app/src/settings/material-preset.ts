/**
 * Material Preset Setting
 *
 * Artist-friendly material presets for the study model.
 *
 * Each preset defines color, roughness, and metalness values for
 * MeshStandardMaterial, designed to help artists study different
 * visual qualities (form, value, highlights, shadows).
 *
 * The UI presents preview cards generated from the actual loaded
 * model, rendered with a fixed camera and lighting setup.
 *
 * (See docs/004.material.md)
 */

import type { SettingDefinition } from './registry';

/* ── Preset Names ──────────────────────────────────── */

export type MaterialPreset =
  | 'plaster'
  | 'clay'
  | 'bronze'
  | 'matte-black'
  | 'chrome';

export const PRESET_NAMES: readonly MaterialPreset[] = [
  'plaster',
  'clay',
  'bronze',
  // 'matte-black',
  'chrome',
];

/* ── Material Type ─────────────────────────────────── */

/**
 * The Three.js material constructor to use for a preset.
 *
 * - `'standard'` → MeshStandardMaterial (basic PBR, matte surfaces)
 * - `'physical'` → MeshPhysicalMaterial (advanced PBR, metallic/reflective)
 */
export type MaterialClass = 'standard' | 'physical';

/* ── Preset Material Values ────────────────────────── */

export interface PresetMaterial {
  color: string;
  roughness: number;
  metalness: number;
  materialClass: MaterialClass;
}

const PRESET_MATERIALS: Record<MaterialPreset, PresetMaterial> = {
  plaster: {
    color: '#d8d6d0',
    roughness: 0.95,
    metalness: 0.0,
    materialClass: 'standard',
  },
  clay: {
    color: '#9d7f68',
    roughness: 0.95,
    metalness: 0.0,
    materialClass: 'standard',
  },
  bronze: {
    color: '#8b5a2b',
    roughness: 0.35,
    metalness: 1.0,
    materialClass: 'physical',
  },
  'matte-black': {
    color: '#111111',
    roughness: 1.0,
    metalness: 0.0,
    materialClass: 'standard',
  },
  chrome: {
    color: '#ffffff',
    roughness: 0.0,
    metalness: 0.9,
    materialClass: 'physical',
  },
};

/**
 * Returns the material values for a given preset name.
 */
export function getPresetMaterial(preset: MaterialPreset): PresetMaterial {
  return PRESET_MATERIALS[preset];
}

/* ── Apply Preset to a Model ───────────────────────── */

import * as THREE from 'three';

/**
 * Applies a material preset to all MeshStandardMaterial instances
 * on the given model by traversing its hierarchy.
 *
 * Each Mesh's material(s) are updated in place — color, roughness,
 * and metalness are set from the preset definition, and `needsUpdate`
 * is flagged so Three.js recompiles the shader.
 *
 * @param model  - The model (or any Object3D with Mesh descendants)
 * @param preset - The preset name to apply
 */
export function applyMaterialPreset(
  model: THREE.Object3D,
  preset: MaterialPreset,
): void {
  const mat = getPresetMaterial(preset);

  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const newMat = createMaterialForPreset(mat, child);

      if (Array.isArray(child.material)) {
        child.material = child.material.map(() => newMat.clone());
      } else {
        child.material = newMat;
      }

      child.material.needsUpdate = true;
    }
  });
}

/**
 * Creates a fresh material instance of the appropriate class for the
 * given preset, carrying over per-mesh attributes that should be
 * preserved (vertex colours, textures, side, transparency).
 */
export function createMaterialForPreset(
  mat: PresetMaterial,
  mesh: THREE.Mesh,
): THREE.Material {
  const baseParams: THREE.MeshStandardMaterialParameters = {
    color: mat.color,
    roughness: mat.roughness,
    metalness: mat.metalness,
  };

  // Carry over existing per-mesh attributes that are important for
  // correct rendering (vertex colours, textures, side, transparent, opacity).
  const src = mesh.material;
  const srcSingle = Array.isArray(src) ? src[0] : src;
  if (srcSingle instanceof THREE.MeshStandardMaterial) {
    if (srcSingle.vertexColors) {
      baseParams.vertexColors = true;
    }
    if (srcSingle.map) {
      baseParams.map = srcSingle.map;
    }
    if (srcSingle.side !== THREE.FrontSide) {
      baseParams.side = srcSingle.side;
    }
    if (srcSingle.transparent) {
      baseParams.transparent = true;
      baseParams.opacity = srcSingle.opacity ?? 1;
    }
  }

  switch (mat.materialClass) {
    case 'physical': {
      // MeshPhysicalMaterial for reflective/metallic surfaces
      return new THREE.MeshPhysicalMaterial(baseParams);
    }
    case 'standard':
    default: {
      // MeshStandardMaterial for matte/diffuse surfaces
      return new THREE.MeshStandardMaterial(baseParams);
    }
  }
}

/* ── Setting Definition ────────────────────────────── */

/**
 * Validates that a string is a known material preset name.
 * Returns the preset if valid, or the default ('plaster') if not.
 */
function validatePreset(value: string | null): MaterialPreset {
  if (value === null) return 'plaster';

  const presets: readonly string[] = PRESET_NAMES;
  if ((presets as readonly string[]).includes(value)) {
    return value as MaterialPreset;
  }

  return 'plaster';
}

/**
 * Creates the visual label for a preset (human-readable, capitalized).
 */
function presetLabel(preset: MaterialPreset): string {
  switch (preset) {
    case 'plaster': return 'Plaster';
    case 'clay': return 'Clay';
    case 'bronze': return 'Bronze';
    case 'matte-black': return 'Matte Black';
    case 'chrome': return 'Chrome';
  }
}

/**
 * Material Preset Setting Definition.
 *
 * The control creates a grid of preview cards. Each card shows:
 *   - A thumbnail preview (initially a placeholder, populated
 *     asynchronously by the material-preview module)
 *   - A text label
 *
 * The selected card is visually highlighted.
 *
 * External code can populate thumbnails via:
 *   `container._setThumbnail(presetName, dataUrl)`
 *
 * External code can update the selection via:
 *   `container._selectPreset(presetName)`
 */
export const materialPresetSetting: SettingDefinition<MaterialPreset> = {
  id: 'material',

  label: 'Material',

  type: 'material-preset',

  defaultValue: 'plaster',

  serialize: (value) => value,

  deserialize: (raw) => validatePreset(raw),

  createControl(value, onChange) {
    const container = document.createElement('div');
    container.className = 'material-preset-grid';

    for (const preset of PRESET_NAMES) {
      const card = document.createElement('button');
      card.className = 'material-preset-card';
      card.dataset.preset = preset;
      card.type = 'button';

      const preview = document.createElement('div');
      preview.className = 'material-preset-preview';

      const label = document.createElement('span');
      label.className = 'material-preset-label';
      label.textContent = presetLabel(preset);

      card.append(preview, label);

      card.addEventListener('click', () => {
        onChange(preset);
      });

      container.append(card);
    }

    // Mark initial selection
    updateSelection(container, value);

    /**
     * Exposed for external code to set a thumbnail image for a preset.
     * Called by material-preview.ts after off-screen rendering.
     */
    (container as any)._setThumbnail = (preset: string, dataUrl: string) => {
      const card = container.querySelector<HTMLElement>(
        `[data-preset="${preset}"]`,
      );
      if (!card) return;
      const preview = card.querySelector<HTMLElement>(
        '.material-preset-preview',
      );
      if (!preview) return;
      preview.style.backgroundImage = `url(${dataUrl})`;
      preview.classList.add('has-thumbnail');
    };

    /**
     * Exposed for external code to update the selected preset highlight.
     * Called by the store subscriber.
     */
    (container as any)._selectPreset = (preset: string) => {
      updateSelection(container, preset);
    };

    return container;
  },
};

/* ── Selection Highlight ───────────────────────────── */

/**
 * Updates the visual selection state across all preset cards.
 */
function updateSelection(
  container: HTMLElement,
  selectedPreset: string,
): void {
  const cards = container.querySelectorAll<HTMLElement>(
    '.material-preset-card',
  );
  for (const card of cards) {
    const isSelected = card.dataset.preset === selectedPreset;
    card.classList.toggle('is-selected', isSelected);
  }
}