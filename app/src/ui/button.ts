/**
 * Toggle Button — creates the settings panel toggle button.
 */

/** Small inline SVG gear icon. */
export const GEAR_ICON = `
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round"
       stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
`.trim();

/** Small inline SVG open eye icon. */
export const EYE_OPEN_ICON = `
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round"
       stroke-linejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
`.trim();

/** Small inline SVG closed eye icon. */
export const EYE_CLOSED_ICON = `
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round"
       stroke-linejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
  </svg>
`.trim();

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