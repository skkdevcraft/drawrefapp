/**
 * Settings Registry
 *
 * Every shareable setting is self-contained and registered once.
 * The registry is the single source of truth for UI generation,
 * defaults, validation, and URL persistence.
 *
 * Adding a new setting requires only:
 *   1. Defining a SettingDefinition object
 *   2. Adding it to the SETTINGS array
 *
 * No architecture changes needed.
 */

/* ── SettingDefinition ─────────────────────────────── */

/**
 * Describes a single user-configurable setting.
 *
 * Each setting owns:
 *  - its id (used as the URL query parameter name)
 *  - its label (used in UI)
 *  - its type (drives UI generation)
 *  - a default value
 *  - serialize / deserialize for URL persistence
 *  - createControl for auto-generating the UI element
 */
export type SettingDefinition<T> = {
  id: string;
  label: string;

  type:
    | 'boolean'
    | 'number'
    | 'select'
    | 'color'
    | 'light';

  defaultValue: T;

  serialize(value: T): string;
  deserialize(value: string | null): T;

  createControl(
    value: T,
    onChange: (value: T) => void,
  ): HTMLElement;
};

/* ── Button Position Setting ───────────────────────── */

/**
 * Controls where the action buttons are placed on screen.
 * Values: tl (top-left), tr (top-right), bl (bottom-left), br (bottom-right).
 */
const buttonPositionSetting: SettingDefinition<string> = {
  id: 'btn',

  label: 'Button Position',

  type: 'select',

  defaultValue: 'tl',

  serialize: value => value,

  deserialize: value => {
    if (
      value === 'tl' ||
      value === 'tr' ||
      value === 'bl' ||
      value === 'br'
    ) {
      return value;
    }

    return 'tl';
  },

  createControl(value, onChange) {
    const select = document.createElement('select');

    const options: [string, string][] = [
      ['tl', 'Top Left'],
      ['tr', 'Top Right'],
      ['bl', 'Bottom Left'],
      ['br', 'Bottom Right'],
    ];

    for (const [id, label] of options) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = label;
      select.append(option);
    }

    select.value = value;
    select.onchange = () => onChange(select.value);

    return select;
  },
};

/* ── Light Setting ──────────────────────────── */

export type LightValue = {
  azimuth: number;
  elevation: number;
  intensity: number;
  softness: number;
};

/* ── Light Control UI ─────────────────────────────── */

import { createLightControl } from './light-control';

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

const keylightSetting: SettingDefinition<LightValue> = {
  id: 'keylight',
  label: 'Key Light',
  type: 'light',

  defaultValue: {
    azimuth: 45,
    elevation: 30,
    intensity: 1.0,
    softness: 0.5,
  },

  serialize(value) {
    const { azimuth, elevation, intensity, softness } = value;
    return `${azimuth},${elevation},${intensity},${softness}`;
  },

  deserialize(raw) {
    if (raw === null) {
      return { ...keylightSetting.defaultValue };
    }

    const parts = raw.split(',').map((s) => s.trim()).map(Number);

    if (parts.length !== 4 || parts.some(isNaN)) {
      return { ...keylightSetting.defaultValue };
    }

    return {
      azimuth: clamp(parts[0], 0, 360),
      elevation: clamp(parts[1], 0, 90),
      intensity: clamp(parts[2], 0, 5),
      softness: clamp(parts[3], 0, 1),
    };
  },

  createControl(value, onChange) {
    return createLightControl(value, onChange);
  },
};

/* ── Fill Light Setting ──────────────────────────── */

/**
 * Controls the fill directional light parameters.
 *
 * Uses the same LightValue type as the key light.
 * Defaults mimic the original hardcoded fill light position
 * (back-left, slightly elevated, cool-blue tint, moderate intensity).
 */
const fillLightSetting: SettingDefinition<LightValue> = {
  id: 'fill',
  label: 'Fill Light',
  type: 'light',

  defaultValue: {
    azimuth: 225,
    elevation: 20,
    intensity: 0.4,
    softness: 0,
  },

  serialize(value) {
    const { azimuth, elevation, intensity, softness } = value;
    return `${azimuth},${elevation},${intensity},${softness}`;
  },

  deserialize(raw) {
    if (raw === null) {
      return { ...fillLightSetting.defaultValue };
    }

    const parts = raw.split(',').map((s) => s.trim()).map(Number);

    if (parts.length !== 4 || parts.some(isNaN)) {
      return { ...fillLightSetting.defaultValue };
    }

    return {
      azimuth: clamp(parts[0], 0, 360),
      elevation: clamp(parts[1], 0, 90),
      intensity: clamp(parts[2], 0, 5),
      softness: clamp(parts[3], 0, 1),
    };
  },

  createControl(value, onChange) {
    return createLightControl(value, onChange);
  },
};

/* ── Rim Light Setting ──────────────────────────── */

/**
 * Controls the rim/back directional light parameters.
 *
 * Uses the same LightValue type as the key light.
 * Defaults position the light directly behind and slightly above
 * the model (azimuth 180°, elevation 30°) to create a classic
 * rim light effect.
 */
const rimLightSetting: SettingDefinition<LightValue> = {
  id: 'rim',
  label: 'Back Light',
  type: 'light',

  defaultValue: {
    azimuth: 180,
    elevation: 30,
    intensity: 0.3,
    softness: 0,
  },

  serialize(value) {
    const { azimuth, elevation, intensity, softness } = value;
    return `${azimuth},${elevation},${intensity},${softness}`;
  },

  deserialize(raw) {
    if (raw === null) {
      return { ...rimLightSetting.defaultValue };
    }

    const parts = raw.split(',').map((s) => s.trim()).map(Number);

    if (parts.length !== 4 || parts.some(isNaN)) {
      return { ...rimLightSetting.defaultValue };
    }

    return {
      azimuth: clamp(parts[0], 0, 360),
      elevation: clamp(parts[1], 0, 90),
      intensity: clamp(parts[2], 0, 5),
      softness: clamp(parts[3], 0, 1),
    };
  },

  createControl(value, onChange) {
    return createLightControl(value, onChange);
  },
};

/* ── Glossiness Setting ──────────────────────────────── */

/**
 * Controls the glossiness (shininess) of the model's surface.
 *
 * Maps to Three.js `roughness` on MeshStandardMaterial:
 *   roughness = 1 - glossiness
 *
 * 0 = completely matte (roughness 1)
 * 1 = mirror-like glossy (roughness 0)
 */
const glossinessSetting: SettingDefinition<number> = {
  id: 'gloss',

  label: 'Glossiness',

  type: 'number',

  defaultValue: 0.6,

  serialize: v => String(v),

  deserialize: raw => {
    if (raw === null) return 0.6;
    const n = parseFloat(raw);
    if (isNaN(n)) return 0.6;
    return Math.min(1, Math.max(0, n));
  },

  createControl(value, onChange) {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 44px;
    `;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '1';
    input.step = '0.01';
    input.value = String(value);
    input.style.cssText = `
      flex: 1;
      height: 6px;
      -webkit-appearance: none;
      appearance: none;
      background: var(--border);
      border-radius: 3px;
      outline: none;
      cursor: pointer;
    `;

    const display = document.createElement('span');
    display.style.cssText = `
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-secondary);
      min-width: 28px;
      text-align: right;
    `;
    display.textContent = value.toFixed(2);

    input.oninput = () => {
      const v = parseFloat(input.value);
      display.textContent = v.toFixed(2);
      onChange(v);
    };

    container.append(input, display);
    return container;
  },
};

/* ── Registry ──────────────────────────────────────── */

/**
 * All settings live in this registry.
 *
 * The panel UI is generated entirely from this array —
 * no hand-written UI per setting.
 *
 * Marked `as const` so consumers can infer the exact tuple
 * of setting definitions for type-safe iteration.
 */
export const SETTINGS = [
  buttonPositionSetting,
  glossinessSetting,
  keylightSetting,
  fillLightSetting,
  rimLightSetting,
  // Future settings are added here — no other code changes needed.
] as const;