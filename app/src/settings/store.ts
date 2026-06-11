/**
 * Settings Store
 *
 * Runtime state management for all registered settings.
 *
 * Responsibilities:
 *  - defaults  — initialise from the SETTINGS registry
 *  - read      — get current setting values
 *  - write     — set current setting values
 *  - change notifications — notify subscribers when a value changes
 *
 * Usage:
 *
 *   import { get, set, subscribe } from './store';
 *   import { SETTINGS } from './registry';
 *
 *   // Read
 *   const btn = get('btn');
 *
 *   // Write
 *   set('btn', 'br');
 *
 *   // Subscribe
 *   const unsub = subscribe((id, value) => { … });
 *   unsub();
 */

import { SETTINGS } from './registry';

/* ── Types ────────────────────────────────────────── */

type Listener = (id: string, value: unknown) => void;

/* ── Runtime State ────────────────────────────────── */

/**
 * Holds the current value for every registered setting,
 * initially populated with the registry defaults.
 */
const state: Record<string, unknown> = {};

for (const def of SETTINGS) {
  state[def.id] = def.defaultValue;
}

/* ── Subscribers ──────────────────────────────────── */

const listeners = new Set<Listener>();

/* ── Read ─────────────────────────────────────────── */

/**
 * Returns the current value of a setting, looked up by its id string.
 */
export function get(id: string): unknown {
  return state[id];
}

/**
 * Returns a shallow copy of all current setting values.
 */
export function getAll(): Record<string, unknown> {
  return { ...state };
}

/* ── Write ────────────────────────────────────────── */

/**
 * Updates the value of a setting and notifies all subscribers.
 *
 * Accepts either a setting id string or a SettingDefinition object
 * as the first argument.
 */
export function set(id: string, value: unknown): void {
  state[id] = value;

  for (const listener of listeners) {
    listener(id, value);
  }
}

/* ── Reset ────────────────────────────────────────── */

/**
 * Resets every registered setting to its registry default.
 * All subscribers are notified for each changed setting.
 */
export function reset(): void {
  for (const def of SETTINGS) {
    state[def.id] = def.defaultValue;

    for (const listener of listeners) {
      listener(def.id, def.defaultValue);
    }
  }
}

/* ── Change Notifications ─────────────────────────── */

/**
 * Registers a callback that is invoked whenever any setting changes.
 *
 * The callback receives the setting id and the new value.
 *
 * Returns an unsubscribe function. Call it to stop receiving
 * notifications.
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}