/**
 * Settings UI — generates setting controls from the registry.
 *
 * `renderSettingsPanel()` is the pure function that creates DOM elements
 * for all registered settings. It is used by the SettingsPanel class.
 */

import { get, set } from './store';
import { SETTINGS } from './registry';

/**
 * Renders all registered settings as DOM elements.
 *
 * Each setting renders a row with a label and the auto-generated control
 * element (driven by `def.createControl()`).
 *
 * @returns A DocumentFragment containing all setting rows.
 */
export function renderSettingsPanel(): DocumentFragment {
  const fragment = document.createDocumentFragment();

  for (const def of SETTINGS) {
    const currentValue = get(def.id);

    const row = document.createElement('div');
    row.className = 'settings-row';

    const label = document.createElement('label');
    label.className = 'settings-label';
    label.textContent = def.label;

    const control = def.createControl(currentValue as never, (newValue) => {
      set(def.id, newValue);
    });
    control.dataset.settingId = def.id;
    control.className = `${control.className || ''} settings-control`.trim();

    row.append(label, control);
    fragment.append(row);
  }

  return fragment;
}