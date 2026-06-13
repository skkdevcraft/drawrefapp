/**
 * DrawRef — Drawing Reference Application
 *
 * Entry point. Sets up the Three.js scene, camera, renderer,
 * OrbitControls with damping, and a fallback box model.
 *
 * Rendering is event-driven: the animation loop runs only while
 * the user is interacting or damping is active.
 *
 * ── Initialization Sequence ──────────────────────────
 *
 *   1. Read URL
 *   2. Load model
 *   3. Normalize
 *   4. Fit camera
 *   5. Apply camera state from URL
 *   6. Create UI
 *   7. Render
 *
 *   (See docs/001.app.md and docs/002.settings.md)
 */

import './style.css';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { createRenderer } from './viewer/renderer';
import { createScene, addLights, updateBackground, updateKeyLight, updateFillLight, updateRimLight } from './viewer/scene';
import { applyGlossinessToModel } from './viewer/composition';
import { createCamera, fitCamera } from './viewer/camera';
import { createControls } from './viewer/controls';
import { createRenderLoop } from './viewer/render-loop';

import { loadModelFromName } from './models/loader';
import { normalizeModel } from './models/normalize';
import { createFallbackCube } from './models/fallback';

import { applyCameraState, getCameraState } from './camera/state';

import { SETTINGS } from './settings/registry';
import type { LightValue } from './settings/registry';
import { get, set, subscribe } from './settings/store';
import { deserializeState } from './settings/serialization';

import { startUrlSync } from './url/state';

import { SettingsPanel, type ViewerControls } from './ui/panel';

import { applyMaterialPreset, type MaterialPreset } from './settings/material-preset';
import { clearPreviewCache, generateMaterialPreviews, invalidateModelPreviews } from './settings/material-preview';

/* ── Exposed API ──────────────────────────────────── */

export interface ViewerAPI {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  keyLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
  rimLight: THREE.DirectionalLight;
  resize: () => void;
  /** Refits the camera to the current model with the given target radius. */
  fitCamera: (targetRadius?: number) => void;
  /**
   * Requests a render to occur.
   *
   * If the render loop is already running (user is interacting or damping
   * is active), this is a no-op since the loop will handle rendering.
   *
   * If the scene is idle, schedules a single frame. The loop then
   * self-terminates when `controls.update()` returns `false`.
   */
  requestRender: () => void;
  dispose: () => void;
  setModel: (model: THREE.Object3D) => void;
  getModel: () => THREE.Object3D | null;
}

/* ── createViewer ──────────────────────────────────── */

/**
 * Creates the full 3D viewer: renderer, scene, camera, OrbitControls,
 * fallback model, lighting, event-driven render loop, and resize handling.
 *
 * The fallback model is a unit cube centred at the origin with a subtle
 * wireframe overlay. The camera is automatically fitted so the cube
 * fills ~80% of the viewport.
 *
 * The viewer can later have its model replaced via `setModel()`.
 */
function createViewer(canvas: HTMLCanvasElement): ViewerAPI {
  /* ── Core ──────────────────────────────────────── */

  const renderer = createRenderer(canvas);
  const scene = createScene();
  const camera = createCamera();

  /* ── Controls ─────────────────────────────────── */

  const controls = createControls(camera, canvas);

  /* ── Lighting ─────────────────────────────────── */

  const { keyLight, fillLight, rimLight } = addLights(scene, {
    enableShadows: true,
    keylight: get('keylight') as LightValue,
    fill: get('fill') as LightValue,
    rim: get('rim') as LightValue,
  });

  /* ── Fallback Model ────────────────────────────── */

  let currentModel: THREE.Object3D | null = null;

  // Show fallback immediately so the viewer never starts empty
  currentModel = createFallbackCube();
  scene.add(currentModel);

  /**
   * Replaces the current model (fallback or previous) with a new one.
   * The new model should already be normalized and ready to display.
   * Automatically fits the camera and requests a render.
   */
  function setModel(model: THREE.Object3D): void {
    if (currentModel) {
      scene.remove(currentModel);
    }
    currentModel = model;
    scene.add(model);

    fitCamera(camera, controls, 1);
    requestRender();
  }

  /* ── Camera Fitting ────────────────────────────── */

  function fitCameraToTarget(targetRadius: number = 1) {
    fitCamera(camera, controls, targetRadius);
  }

  /* ── Render Loop ───────────────────────────────── */

  const { requestRender, dispose: disposeLoop } = createRenderLoop(
    renderer,
    scene,
    camera,
    controls,
  );

  // Whenever OrbitControls changes the camera (user drag, damping,
  // or programmatic update), request a render.
  controls.addEventListener('change', () => {
    requestRender();
  });

  // Initial render (single frame) — shows fallback immediately
  requestRender();

  /* ── Resize Handling ────────────────────────────── */

  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
    requestRender();
  }

  window.addEventListener('resize', onResize);

  /* ── Theme Change Handling ──────────────────────── */

  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function onThemeChange() {
    updateBackground(scene);
    requestRender();
  }

  darkModeQuery.addEventListener('change', onThemeChange);

  /* ── Cleanup ──────────────────────────────────────── */

  function dispose() {
    disposeLoop();
    controls.dispose();
    renderer.dispose();
    window.removeEventListener('resize', onResize);
    darkModeQuery.removeEventListener('change', onThemeChange);
  }

  return {
    renderer,
    scene,
    camera,
    controls,
    keyLight,
    fillLight,
    rimLight,
    resize: onResize,
    fitCamera: fitCameraToTarget,
    requestRender,
    dispose,
    setModel,
    getModel: () => currentModel,
  };
}

/* ══════════════════════════════════════════════════════
   Bootstrap — Initialization Sequence
   ══════════════════════════════════════════════════════ */

/* ── 1. Read URL ──────────────────────────────────── */

/**
 * Parse the current URL query string and extract model name,
 * camera state, and all registered settings.
 *
 * Invalid or missing parameters fall back to defaults.
 */
const urlState = deserializeState();

const modelName: string =
  urlState && urlState.model && urlState.model.trim().length > 0
    ? urlState.model
    : 'skull3.obj';

/* ── Apply settings from URL to the settings store ──── */

/**
 * Settings are applied to the store *before* the UI is created so that
 * the SettingsPanel reads the correct values from the registry when it
 * initialises its controls.
 */
if (urlState) {
  for (const def of SETTINGS) {
    const value = urlState.settings[def.id];
    if (value !== undefined) {
      set(def.id, value);
    }
  }
}

/* ── 2. Create viewer (renderer, scene, camera, controls, fallback, lighting) ── */

const canvas = document.getElementById('scene-canvas') as HTMLCanvasElement;

if (!canvas) {
  throw new Error('Expected a <canvas id="scene-canvas"> element in the DOM');
}

const viewer = createViewer(canvas);

/* ── 3–5. Load model → Normalize → Set model (fit camera) → Apply camera state ── */

let currentModelName: string | null = null;
let currentModelObject: THREE.Object3D | null = null;

loadModelFromName(modelName)
  .then((model) => {
    // 3. Normalize
    normalizeModel(model, 1);
    currentModelName = modelName;
    currentModelObject = model;

    // 3c. Apply material preset (overrides color, roughness, metalness)
    const preset = get('material') as MaterialPreset;
    if (preset) {
      applyMaterialPreset(model, preset);
    }

    // 3b. Apply glossiness setting to all materials
    applyGlossinessToModel(model, get('gloss') as number);

    // 4. Replace fallback → fit camera → render
    viewer.setModel(model);

    // 5. Apply camera state from URL (overrides auto-fit if present)
    if (urlState?.camera) {
      applyCameraState(
        viewer.controls,
        viewer.camera,
        urlState.camera,
      );
      viewer.requestRender();
    }
  })
  .catch((err) => {
    console.error('[main] Failed to load model:', err);
    // Fallback box remains visible — the viewer never starts empty.
    // currentModelName stays null, so URL sync omits the model param.
    // Still track the fallback model so glossiness and material can be applied
    currentModelObject = viewer.getModel();
  })
  .finally(() => {
    // 6–7. Create UI and start URL sync (always, even on load failure)
    createUI();
  });

/* ── 6–7. Create UI, start URL sync ────────────────── */

/**
 * Creates the settings panel, panel-aware resize handling, and URL sync.
 *
 * Called once (from the `.finally()` of the model load promise) so that
 * the UI is always available regardless of whether the model loaded
 * successfully.
 */
function createUI(): void {
  /* ── Settings Panel ────────────────────────────── */

  const viewerControls: ViewerControls = {
    controls: viewer.controls,
    camera: viewer.camera,
    fitCamera: viewer.fitCamera,
  };

  const settingsPanel = new SettingsPanel(
    (open) => {
      resizeScene(open, settingsPanel);
      if (open) {
        // Clear cache and regenerate thumbnails fresh every time panel opens
        clearPreviewCache();
        generateThumbnails();
      } else {
        // Clear cache so thumbnails are regenerated next time panel opens
        clearPreviewCache();
      }
    },
    viewerControls,
  );

  /* ── Panel-Aware Scene Resize ──────────────────── */

  /**
   * Resizes the renderer and camera to account for the panel width
   * when the panel is open, so the scene sits beside the panel
   * instead of being overlaid.
   */
  function resizeScene(panelOpen: boolean, panel: SettingsPanel): void {
    const w = window.innerWidth;
    const h = window.innerHeight;

    let availW = w;
    let offsetX = 0;

    if (panelOpen) {
      const pw = panel.panelElement.offsetWidth;
      availW = w - pw;
      if (panel.side === 'left') {
        offsetX = pw;
      }
    }

    viewer.camera.aspect = availW / h;
    viewer.camera.updateProjectionMatrix();
    viewer.renderer.setSize(availW, h);
    canvas.style.left = offsetX + 'px';
    viewer.requestRender();
  }

  // Remove the original full-window resize that createViewer registered
  window.removeEventListener('resize', viewer.resize);

  // Register a panel-aware resize handler instead
  function onWindowResize(): void {
    resizeScene(settingsPanel.panelOpen, settingsPanel);
  }
  window.addEventListener('resize', onWindowResize);

  // Update the viewer.resize reference so external callers stay in sync
  viewer.resize = onWindowResize;

  /* ── URL Sync ──────────────────────────────────── */

  const stopUrlSync = startUrlSync(
    () => currentModelName,
    viewer.controls,
    viewer.camera,
  );

  /* ── Key Light Sync ────────────────────────────── */

  /**
   * Applies the current keylight setting to the scene.
   */
  function applyKeyLight(): void {
    const v = get('keylight') as LightValue;
    if (v) {
      updateKeyLight(viewer.keyLight, v);
      viewer.requestRender();
    }
  }

  // Apply initial keylight from URL state (already loaded into store)
  applyKeyLight();

  // Subscribe to keylight changes
  const unsubKeyLight = subscribe((id) => {
    if (id === 'keylight') {
      applyKeyLight();
    }
  });

  /* ── Fill Light Sync ────────────────────────────── */

  /**
   * Applies the current fill light setting to the scene.
   */
  function applyFillLight(): void {
    const v = get('fill') as LightValue;
    if (v) {
      updateFillLight(viewer.fillLight, v);
      viewer.requestRender();
    }
  }

  // Apply initial fill light from URL state
  applyFillLight();

  // Subscribe to fill light changes
  const unsubFillLight = subscribe((id) => {
    if (id === 'fill') {
      applyFillLight();
    }
  });

  /* ── Rim Light Sync ────────────────────────────── */

  /**
   * Applies the current rim light setting to the scene.
   */
  function applyRimLight(): void {
    const v = get('rim') as LightValue;
    if (v) {
      updateRimLight(viewer.rimLight, v);
      viewer.requestRender();
    }
  }

  // Apply initial rim light from URL state
  applyRimLight();

  // Subscribe to rim light changes
  const unsubRimLight = subscribe((id) => {
    if (id === 'rim') {
      applyRimLight();
    }
  });

  /* ── Glossiness Sync ────────────────────────────────── */

  /**
   * Applies the current glossiness setting to the loaded model.
   */
  function applyGlossiness(): void {
    if (currentModelObject) {
      applyGlossinessToModel(currentModelObject, get('gloss') as number);
      viewer.requestRender();
    }
  }

  // Apply initial glossiness from URL state (already in store)
  applyGlossiness();

  // Subscribe to glossiness changes
  const unsubGloss = subscribe((id) => {
    if (id === 'gloss') {
      applyGlossiness();
    }
  });

  /* ── Material Preset Sync ────────────────────────── */

  /**
   * Applies the current material preset to the loaded model.
   */
  function applyMaterial(): void {
    if (currentModelObject) {
      const preset = get('material') as MaterialPreset;
      if (preset) {
        applyMaterialPreset(currentModelObject, preset);
        viewer.requestRender();
      }
    }
  }

  // Apply initial material preset from URL state (already in store)
  applyMaterial();

  // Subscribe to material preset changes
  const unsubMaterial = subscribe((id) => {
    if (id === 'material') {
      applyMaterial();
    }
  });

  /* ── Material Preview Thumbnails ──────────────────── */

  /**
   * Generates preview thumbnails for all material presets by reloading
   * the model from scratch using the same load → normalise pipeline
   * as the main scene. Populates the material control preview cards.
   *
   * Thumbnails are generated asynchronously so the UI remains responsive.
   * Cached thumbnails are reused across calls for the same model name.
   */
  function generateThumbnails(): void {
    const camState = getCameraState(viewer.controls, viewer.camera);
    generateMaterialPreviews(currentModelName, viewer.renderer, camState).then((previews) => {
      const materialContainer = document.querySelector(
        '[data-setting-id="material"]',
      );
      if (!materialContainer) return;

      const setThumbnail = (materialContainer as any)._setThumbnail;
      if (setThumbnail) {
        for (const [preset, dataUrl] of previews) {
          setThumbnail(preset, dataUrl);
        }
      }
    });
  }

  // Generate thumbnails after the panel is created and model is loaded
  generateThumbnails();

  /* ── Integrate cleanup into viewer.dispose ───────── */

  const origDispose = viewer.dispose.bind(viewer);
  viewer.dispose = () => {
    stopUrlSync();
    unsubKeyLight();
    unsubFillLight();
    unsubRimLight();
    unsubGloss();
    unsubMaterial();
    invalidateModelPreviews();
    window.removeEventListener('resize', onWindowResize);
    settingsPanel.dispose();
    origDispose();
  };
}