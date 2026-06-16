/**
 * Toggle Button — creates the settings panel toggle button.
 */

import { GEAR_ICON, EYE_OPEN_ICON } from './icons';

/**
 * Creates the settings toggle button element.
 *
 * @param onClick - Click handler to toggle the panel
 * @returns The button element (not yet inserted into DOM)
 */
export function createToggleButton(onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.id = 'settings-toggle';
  button.className = 'settings-toggle';
  button.setAttribute('aria-label', 'Toggle settings panel');
  button.innerHTML = GEAR_ICON;
  button.addEventListener('click', onClick);
  return button;
}

/**
 * Creates the eye toggle button element for showing/hiding the model.
 *
 * Uses outline eye icons: open eye when model is visible, closed eye
 * when model is hidden. The button is transparent and positioned next
 * to the settings toggle button.
 *
 * @param onClick - Click handler to toggle model visibility
 * @returns The button element (not yet inserted into DOM)
 */
export function createEyeButton(onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.id = 'eye-toggle';
  button.className = 'eye-toggle';
  button.setAttribute('aria-label', 'Toggle model visibility');
  button.innerHTML = EYE_OPEN_ICON;
  button.dataset.visible = 'true';
  button.addEventListener('click', onClick);
  return button;
}