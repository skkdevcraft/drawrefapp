# Contributing to DrawRef

Welcome! DrawRef is a lightweight web application for drawing studies — a 3D model viewer designed to help artists practice observation.

We welcome contributions of all kinds:

- New 3D models for artists to study
- New scene settings and controls
- Bug fixes and performance improvements
- Code quality and documentation
- AI-assisted or AI-generated contributions

---

## Quick Start

```bash
# Clone and install
git clone <your-fork>
cd app
npm install

# Start the dev server
npm run dev
```

The dev server runs at `http://localhost:5173` by default.

---

## Project Overview

| Directory | Purpose |
|---|---|
| `src/viewer/` | Three.js renderer, scene, camera, controls, render loop |
| `src/models/` | Model loading, normalisation, fallback, registry, credits, URL resolver |
| `src/settings/` | Settings registry, store, serialization, UI generation, material previews |
| `src/camera/` | Camera state serialization & deserialization |
| `src/url/` | URL sync (pushState on change, parse on load) |
| `src/ui/` | Settings panel, toggle button, icons, view presets |
| `public/models/` | 3D model assets served statically |

Read `docs/001.app.md` and `docs/002.settings.md` for the full specification.

---

## Architectural Principles

These are taken from `AGENTS.md` and apply to all contributions.

### URL Is the Source of Truth

Every user-configurable setting must be serializable into the URL query string. A shared URL must reconstruct the scene as closely as possible.

- Every setting must define `serialize` and `deserialize`.
- Missing query parameters imply defaults.
- Invalid values must fall back safely.

### Settings Registry Owns Settings

All settings are registered once in `src/settings/registry.ts`. The registry is the single source of truth for defaults, validation, URL persistence, and UI generation.

Do not create ad-hoc settings, hardcode values into UI components, or manually manage query parameters for individual settings.

### Event-Driven Rendering

The renderer must remain idle whenever possible. No permanent animation loops, polling, or continuous rendering without justification. Rendering occurs only when camera changes, controls move, models change, settings change, or the viewport changes.

### Mobile First

All controls must remain usable on touch devices. Minimum 44×44 px touch targets, reasonable spacing, swipe-friendly interactions.

### Scene Remains Visible

The model viewer is the primary interface. Settings panels should not completely obscure the scene.

---

## How to Contribute a Feature

Features typically fall into two categories: **settings** (user-configurable scene parameters) and **extensions** (new viewer capabilities, UI improvements, etc.).

### Adding a New Setting

This is the most common feature addition. Settings are self-contained — adding one requires exactly two things:

1. **Define the setting** in `src/settings/registry.ts`

   Create a `SettingDefinition<T>` object with:
   - `id` — URL query parameter name (short, kebab-case)
   - `label` — Human-readable name
   - `type` — `'boolean' | 'number' | 'select' | 'color' | 'light' | 'material-preset'`
   - `defaultValue` — The fallback
   - `serialize(value)` → URL-safe string
   - `deserialize(raw)` → validated value (invalid input → default)
   - `createControl(value, onChange)` → an `HTMLElement` for the settings panel

2. **Apply the value** to the scene

   In `src/main.ts`, subscribe to the setting and apply it whenever it changes:

   ```ts
   const unsubMySetting = subscribe((id) => {
     if (id === 'my-setting') {
       const v = get('my-setting') as MyType;
       applyMySetting(viewer, v);
       viewer.requestRender();
     }
   });
   ```

   Then add cleanup in the `viewer.dispose` section:

   ```ts
   unsubMySetting();
   ```

That's it. No URL code changes needed — the registry handles serialization, deserialization, and UI generation automatically.

### Adding UI Outside the Settings Panel

If your feature does not fit the settings model (e.g., a new floating button, a gesture handler, a screenshot feature), add it in the `createUI()` function in `src/main.ts`. Keep related logic in the appropriate `src/ui/` module.

---

## How to Fix a Bug

1. Read the relevant documentation in `docs/` first.
2. Reproduce the issue with a specific URL.
3. Fix the implementation.
4. Verify the fix both interactively and via URL sharing.

If the fix changes serialization format, increment the version parameter `v` in the URL and maintain backward compatibility where practical.

---

## How to Contribute a 3D Model

Adding a model is the most common external contribution. The system is designed to make this straightforward.

### Step 1: Prepare Your Model

Accepted formats: **glTF (`.glb` / `.gltf`)**, **OBJ (`.obj`)**, **FBX (`.fbx`)**, **STL (`.stl`)**, **PLY (`.ply`)**, **3MF (`.3mf`)**, **Collada (`.dae`)**.

Guidelines:

- Keep polygon count reasonable for mobile devices (< 500k triangles recommended).
- Use a single model file where possible (no external textures — embed them or use vertex colours).
- Make sure the model is positioned approximately at the origin before export.

### Step 2: Add the Model File

Place your model file in `public/models/`.

```text
public/models/your-model.glb
```

### Step 3: Register the Model

Edit `src/models/registry.ts`:

1. Import your thumbnail SVG (see Step 4).
2. Add an entry to the `MODELS` array.

```ts
import { YOUR_MODEL_THUMBNAIL } from '../ui/icons';

const MODELS: ModelEntry[] = [
  // ... existing models
  {
    id: 'your-model.glb',
    label: 'Your Model Name',
    thumbnail: YOUR_MODEL_THUMBNAIL,
  },
];
```

The `id` must match the filename in `public/models/`. The `label` is used for ARIA labels.

### Step 4: Create a Thumbnail SVG

Add an inline SVG thumbnail in `src/ui/icons.ts`.

The thumbnail is a simplified outline / silhouette of your model, used as the button icon in the model selection grid. Guidelines:

- ViewBox dimensions around `0 0 24 24` or similar — keep proportions reasonable.
- Use `currentColor` for fill/stroke so it inherits the theme.
- Keep the SVG small and clean — this is an icon, not a render.
- If your model is simple (e.g., a hand, a torso), a stylised line-art silhouette works best.

Example:

```ts
export const HAND_THUMBNAIL = `
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
       stroke-linejoin="round">
    <path d="M6 20V8a2 2 0 0 1 4 0v4m0-4V6a2 2 0 0 1 4 0v2m0-2a2 2 0 0 1 4 0v6
             c0 4-2 6-6 6h-4c-2 0-4-1-4-3"/>
  </svg>
`.trim();
```

### Step 5: Add Credits

Edit `src/models/credits.ts` and add an entry for your model.

```ts
const credits: Record<string, ModelCredit> = {
  // ... existing credits
  'your-model.glb': {
    author: 'Your Name',
    source: 'https://example.com/your-model-source',
    license: 'CC-BY 4.0',
  },
};
```

All fields are optional, but **author** is strongly encouraged so users know who created the model.

### Step 6: Verify

1. Start the dev server: `npm run dev`
2. Open the settings panel and confirm your model appears as a selectable thumbnail.
3. Select it and verify it loads, renders, and responds to controls.
4. Copy the URL and open it in a new tab to verify shareability.
5. Test on mobile viewport.

---

## Model Registry Reference

### `src/models/registry.ts`

```ts
export type ModelEntry = {
  id: string;        // filename in public/models/
  label: string;     // human-readable name
  thumbnail: string; // inline SVG string
};
```

Helper functions:

| Function | Returns | Purpose |
|---|---|---|
| `getModelEntry(id)` | `ModelEntry \| undefined` | Lookup by filename |
| `getModelEntries()` | `ModelEntry[]` | All registered models |
| `getDefaultModelId()` | `string` | First model in registry |

### `src/models/credits.ts`

```ts
export interface ModelCredit {
  author?: string;   // Name of the creator
  source?: string;   // URL where the model was obtained
  license?: string;  // License (e.g. "CC-BY 4.0", "Public Domain")
}
```

Helper function:

| Function | Returns | Purpose |
|---|---|---|
| `getModelCredit(filename)` | `ModelCredit \| null` | Lookup credits by filename |

Credits are displayed in the settings panel so users always know who made the models they're studying.

---

## AI-Assisted Contributions

AI-generated, AI-modified, and AI-suggested contributions are welcome.

### Guidelines for AI Contributions

1. **Read the docs first.** `AGENTS.md`, `docs/001.app.md`, and `docs/002.settings.md` contain the architectural principles. AI that follows these produces better contributions.

2. **Prefer the settings registry.** If you're adding a user-configurable feature, it should go through the registry. The docs show exactly how.

3. **Keep it simple.** This project favours small modules, native HTML controls, and minimal dependencies. Complexity should justify itself.

4. **AI is welcome to add models.** The model registry and credits system is deliberately straightforward — AI agents can follow the steps in "How to Contribute a 3D Model" above without any ambiguity.

5. **Test the URL.** After any change, verify that the URL shares correctly and reconstructs the scene. This is the most common test an AI contribution should perform.

6. **Disclose AI assistance.** Mention in the pull request if the contribution was AI-generated or AI-assisted — it helps reviewers understand the context.

7. **Review the output.** AI makes mistakes. Reviewing its own output before submission catches serialization errors, import typos, and broken thumbnails.

---

## Code Style

- **Language**: TypeScript (strict mode).
- **Imports**: Group by module path. No barrel imports. No `import *` unless necessary.
- **Formatting**: No Prettier or ESLint enforced yet — use common sense (2-space indentation, semicolons, consistent quotes).
- **Three.js**: Import addons from `three/examples/jsm/Addons.js`. See `docs/001.app.md`.
- **Naming**: `camelCase` for variables and functions, `PascalCase` for classes and types, `UPPER_CASE` for constants.
- **Modules**: Keep files small and focused. One concern per module.

---

## Pull Request Process

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/my-feature`.
3. Make your changes.
4. Verify the app runs: `npm run dev`.
5. Verify the build succeeds: `npm run build`.
6. Open a pull request against `main`.
7. In the PR description, explain what the change does and why.

### What reviewers look for

- Does the change follow the architectural principles?
- Is the URL shareability preserved?
- Does the scene remain event-driven (no continuous rendering)?
- Are the settings properly serialized/deserialized?
- Is the contribution mobile-friendly?
- Are model contributions properly credited?

---

## Questions?

Open an issue for discussion before starting large changes. This helps avoid wasted effort if the change conflicts with the project direction.

Feature suggestions are welcome — even if you can't implement them yourself, opening an issue with a clear description helps others contribute.