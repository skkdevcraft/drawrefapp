/**
 * SettingsPanel — a floating toggle button and sliding side panel.
 *
 * The panel:
 *  - Slides from the left or right depending on the `btn` setting
 *  - Auto-generates its controls from the SETTINGS registry
 *  - Includes view presets (front, side, three-quarter, top, reset)
 *  - Notifies the application when it opens/closes so the scene can resize
 *
 * The button position follows the `btn` setting (tl / tr / bl / br).
 */

import { get, subscribe } from '../settings/store';
import { renderSettingsPanel } from '../settings/ui';
import { createToggleButton } from './button';
import { renderViewPresets, type ViewerControls } from './presets';
import { getModelCredit } from '../models/credits';
import { GITHUB_ICON } from './icons';

/* ── Types ────────────────────────────────────────── */

type Corner = 'tl' | 'tr' | 'bl' | 'br';
type Side = 'left' | 'right';

export { type ViewerControls };

/* ── SettingsPanel ─────────────────────────────────── */

export class SettingsPanel {
  private button: HTMLButtonElement;
  private panel: HTMLElement;
  private isOpen = false;
  private unsub: (() => void) | null = null;
  private currentSide: Side = 'left';
  private onToggle: ((open: boolean) => void) | null;
  private viewerControls: ViewerControls | null;

  private modelName: string | null;

  constructor(
    onToggle?: (open: boolean) => void,
    viewerControls?: ViewerControls,
    modelName?: string | null,
  ) {
    this.modelName = modelName ?? null;
    this.onToggle = onToggle ?? null;

    /* ── Toggle Button ──────────────────────────────── */
    this.button = createToggleButton(() => this.toggle());

    /* ── Sliding Panel ──────────────────────────────── */
    this.panel = document.createElement('aside');
    this.panel.id = 'settings-panel';
    this.panel.className = 'settings-panel';

    this.viewerControls = viewerControls ?? null;

    /* ── Populate settings controls from registry ──── */
    this.populatePanel();

    /* ── Append to DOM ──────────────────────────────── */
    document.body.append(this.panel, this.button);

    /* ── Escape key ─────────────────────────────────── */
    this.onKeyDown = this.onKeyDown.bind(this);
    document.addEventListener('keydown', this.onKeyDown);

    /* ── Apply initial position ─────────────────────── */
    const initial = (get('btn') as Corner) ?? 'tl';
    this.applyPosition(initial);

    /* ── React to setting changes ──────────────────── */
    this.unsub = subscribe((id, value) => {
      if (id === 'btn') {
        this.applyPosition(value as Corner);
        // If panel is open when position changes, notify so scene re-sizes
        if (this.isOpen) {
          this.onToggle?.(true);
        }
      }

      // Sync control value when setting changes externally (e.g. URL load, presets)
      const control = this.panel.querySelector<HTMLElement>(
        `[data-setting-id="${id}"]`
      );
      if (control) {
        // Light controls expose a custom update method for external sync
        const updateLight = (control as any)._updateLight;
        if (updateLight) {
          updateLight(value);
          return;
        }

        // Material preset controls expose selection update
        const selectPreset = (control as any)._selectPreset;
        if (selectPreset) {
          selectPreset(value);
          return;
        }

        // Button position controls expose selection update
        const selectButton = (control as any)._selectButton;
        if (selectButton) {
          selectButton(value);
          return;
        }

        // Model selection controls expose selection update
        const selectModel = (control as any)._selectModel;
        if (selectModel) {
          selectModel(value);
          return;
        }

        // Standard controls use the value property
        if ('value' in control) {
          (control as HTMLSelectElement).value = String(value);
        }
      }
    });
  }

  /* ── Public accessors ────────────────────────────── */

  /** The panel DOM element (for reading layout dimensions). */
  get panelElement(): HTMLElement {
    return this.panel;
  }

  /** The side the panel currently slides from. */
  get side(): Side {
    return this.currentSide;
  }

  /** Whether the panel is currently open. */
  get panelOpen(): boolean {
    return this.isOpen;
  }

  /* ── Position ────────────────────────────────────── */

  private applyPosition(corner: Corner): void {
    this.button.dataset.corner = corner;
    this.panel.dataset.corner = corner;

    // Panel slides from the same horizontal side as the button corner.
    this.currentSide =
      corner === 'tl' || corner === 'bl' ? 'left' : 'right';
    this.panel.dataset.side = this.currentSide;
  }

  /* ── Open / Close / Toggle ───────────────────────── */

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.button.classList.add('is-active');
    this.panel.classList.add('is-open');
    this.onToggle?.(true);
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.button.classList.remove('is-active');
    this.panel.classList.remove('is-open');
    this.onToggle?.(false);
  }

  /* ── Keyboard ────────────────────────────────────── */

  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  /* ── Model name ──────────────────────────────────── */

  /**
   * Updates the current model name and re-renders the credits section.
   * Called when a new model is loaded so attribution stays in sync.
   */
  setModelName(name: string | null): void {
    this.modelName = name;
    this.updateCredits();
  }

  /* ── Credits Section ─────────────────────────────── */

  private creditsSection: HTMLElement | null = null;

  /**
   * Renders the model credits row at the top of the panel.
   * If the current model has no registered credits, the section is hidden.
   */
  private renderCredits(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'model-credits';

    if (!this.modelName) {
      section.style.display = 'none';
      return section;
    }

    const credit = getModelCredit(this.modelName);

    if (!credit) {
      section.style.display = 'none';
      return section;
    }

    // Model filename
    const nameRow = document.createElement('div');
    nameRow.className = 'credit-row';
    nameRow.innerHTML = `<span class="credit-label">Model</span><span class="credit-value credit-value--filename">${escapeHtml(this.modelName)}</span>`;
    section.append(nameRow);

    // Author
    if (credit.author) {
      const row = document.createElement('div');
      row.className = 'credit-row';
      row.innerHTML = `<span class="credit-label">Author</span><span class="credit-value">${escapeHtml(credit.author)}</span>`;
      section.append(row);
    }

    // Source
    if (credit.source) {
      const row = document.createElement('div');
      row.className = 'credit-row';

      // If source looks like a URL, make it a link
      const isUrl = /^https?:\/\//.test(credit.source);
      if (isUrl) {
        row.innerHTML = `<span class="credit-label">Source</span><a class="credit-value credit-value--link" href="${escapeHtml(credit.source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(credit.source)}</a>`;
      } else {
        row.innerHTML = `<span class="credit-label">Source</span><span class="credit-value">${escapeHtml(credit.source)}</span>`;
      }
      section.append(row);
    }

    // License
    if (credit.license) {
      const row = document.createElement('div');
      row.className = 'credit-row';
      row.innerHTML = `<span class="credit-label">License</span><span class="credit-value">${escapeHtml(credit.license)}</span>`;
      section.append(row);
    }

    return section;
  }

  /* ── GitHub Link ──────────────────────────────── */

  /**
   * Renders a button linking to the GitHub repository.
   * Opens in a new tab with noopener/noreferrer for security.
   */
  private renderGitHubLink(): HTMLElement {
    const link = document.createElement('a');
    link.className = 'github-link';
    link.href = 'https://github.com/skkdevcraft/drawrefapp';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', 'View source code on GitHub');
    link.innerHTML = `${GITHUB_ICON}<span>GitHub</span>`;
    return link;
  }

  /** Updates the credits section in the panel. */
  private updateCredits(): void {
    if (!this.creditsSection) return;

    const newSection = this.renderCredits();
    this.creditsSection.replaceWith(newSection);
    this.creditsSection = newSection;
  }

  /* ── Populate panel from registry ───────────────── */

  private populatePanel(): void {

    this.panel.append(renderSettingsPanel());

    // Only add view presets if viewer controls are available
    if (this.viewerControls) {
      const presetsSection = renderViewPresets(
        this.viewerControls.controls,
        this.viewerControls.camera,
        this.viewerControls.fitCamera,
      );
      this.panel.append(presetsSection);
    }

    // Credits section
    this.creditsSection = this.renderCredits();
    this.panel.append(this.creditsSection);

    // GitHub link
    this.panel.append(this.renderGitHubLink());
  }

  /* ── Cleanup ─────────────────────────────────────── */

  dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    if (this.unsub) this.unsub();
    this.button.remove();
    this.panel.remove();
  }
}

/* ── Helpers ────────────────────────────────────────── */

/**
 * Escapes HTML special characters to prevent XSS when rendering
 * user-provided or external content like model names and URLs.
 */
function escapeHtml(text: string): string {
  const el = document.createElement('span');
  el.textContent = text;
  return el.innerHTML;
}