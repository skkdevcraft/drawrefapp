/**
 * Model Loader — loads 3D models from the `./models/` directory.
 *
 * Uses dynamic imports so each loader is loaded only when its format
 * is requested — keeping the initial bundle small.
 *
 * Also provides `loadModelFromName()` which resolves a model identifier
 * to candidate URLs, tries each, and falls back to a cube if all fail.
 *
 * Supported formats: .glb, .gltf, .obj, .fbx, .stl, .ply, .3mf, .dae
 */

import * as THREE from 'three';
import { resolveModelUrl } from './resolver.js';
import { createFallbackCube } from './fallback.js';

/* ── Extension → Loader Map ──────────────────────── */

/**
 * Maps lowercase file extensions to their dynamic import function
 * and a post-processing step that extracts or wraps the loaded result
 * into a single THREE.Object3D.
 */
const LOADER_MAP: Record<
  string,
  () => Promise<{
    load: (url: string) => Promise<THREE.Object3D>;
  }>
> = {
  glb: () => importGLTF(),
  gltf: () => importGLTF(),
  obj: () => importOBJ(),
  fbx: () => importFBX(),
  stl: () => importSTL(),
  ply: () => importPLY(),
  '3mf': () => import3MF(),
  dae: () => importDAE(),
};

/* ── Dynamic Import Helpers ──────────────────────── */

async function importGLTF() {
  const { GLTFLoader } = await import(
    'three/examples/jsm/loaders/GLTFLoader.js'
  );

  return {
    async load(url: string): Promise<THREE.Object3D> {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(url);
      return gltf.scene;
    },
  };
}

async function importOBJ() {
  const { OBJLoader } = await import(
    'three/examples/jsm/loaders/OBJLoader.js'
  );

  return {
    async load(url: string): Promise<THREE.Object3D> {
      const loader = new OBJLoader();
      return loader.loadAsync(url);
    },
  };
}

async function importFBX() {
  const { FBXLoader } = await import(
    'three/examples/jsm/loaders/FBXLoader.js'
  );

  return {
    async load(url: string): Promise<THREE.Object3D> {
      const loader = new FBXLoader();
      return loader.loadAsync(url);
    },
  };
}

async function importSTL() {
  const { STLLoader } = await import(
    'three/examples/jsm/loaders/STLLoader.js'
  );

  return {
    async load(url: string): Promise<THREE.Object3D> {
      const loader = new STLLoader();
      const geometry = await loader.loadAsync(url);
      const material = new THREE.MeshStandardMaterial({
        color: 0x8ab4f8,
        roughness: 0.4,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      return mesh;
    },
  };
}

async function importPLY() {
  const { PLYLoader } = await import(
    'three/examples/jsm/loaders/PLYLoader.js'
  );

  return {
    async load(url: string): Promise<THREE.Object3D> {
      const loader = new PLYLoader();
      const geometry = await loader.loadAsync(url);
      const material = new THREE.MeshStandardMaterial({
        color: 0x8ab4f8,
        roughness: 0.4,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      return mesh;
    },
  };
}

async function import3MF() {
  const { ThreeMFLoader } = await import(
    'three/examples/jsm/loaders/3MFLoader.js'
  );

  return {
    async load(url: string): Promise<THREE.Object3D> {
      const loader = new ThreeMFLoader();
      return loader.loadAsync(url);
    },
  };
}

async function importDAE() {
  const { ColladaLoader } = await import(
    'three/examples/jsm/loaders/ColladaLoader.js'
  );

  return {
    async load(url: string): Promise<THREE.Object3D> {
      const loader = new ColladaLoader();
      const result = await loader.loadAsync(url);

      if (!result || !result.scene) {
        throw new Error(
          `ColladaLoader returned an empty scene for "${url}"`,
        );
      }

      return result.scene;
    },
  };
}

/* ── loadModel ──────────────────────────────────── */

/**
 * Loads a 3D model by its full URL/path.
 *
 * The file extension determines which Three.js loader is used.
 *
 * @param path - Model filename or URL (e.g. `"/models/skull.obj"`)
 * @returns The loaded model as a THREE.Object3D
 * @throws If the file extension is unsupported or loading fails
 */
export async function loadModel(path: string): Promise<THREE.Object3D> {
  const dotIndex = path.lastIndexOf('.');

  if (dotIndex === -1 || dotIndex === path.length - 1) {
    throw new Error(
      `Cannot determine file extension from path: "${path}". ` +
        'Expected a filename with an extension (e.g. "skull.obj").',
    );
  }

  const ext = path.slice(dotIndex + 1).toLowerCase();
  const importer = LOADER_MAP[ext];

  if (!importer) {
    const supported = Object.keys(LOADER_MAP).join(', ');
    throw new Error(
      `Unsupported model format: ".${ext}". ` +
        `Supported formats: ${supported}.`,
    );
  }

  const { load } = await importer();
  return load(path);
}

/* ── loadModelFromName ──────────────────────────── */

/**
 * Resolves a model identifier, tries each candidate URL, and returns
 * the first successful load. If all candidates fail, returns a fallback cube.
 *
 * @param name - Model identifier (e.g. `"skull.obj"`, `"bust"`, `"anatomy/torso"`)
 * @returns A promise that resolves to a THREE.Object3D
 */
export async function loadModelFromName(name: string): Promise<THREE.Object3D> {
  const candidates = resolveModelUrl(name);

  for (const url of candidates) {
    try {
      const model = await loadModel(url);
      console.log(`[loadModelFromName] Loaded "${url}"`);
      return model;
    } catch (err) {
      console.warn(`[loadModelFromName] Failed to load "${url}":`, err);
    }
  }

  console.warn(
    `[loadModelFromName] All candidates failed for "${name}", using fallback cube`,
  );
  return createFallbackCube();
}