/**
 * Keystone Service — Manages keystone correction configurations and presets.
 *
 * - One KeystoneConfig per projector (1:1 mapping)
 * - Multiple presets per projector for quick switching
 * - Persistence via electron-store (delegated to IPC in main process)
 * - In-memory state for fast access during rendering
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  KeystoneConfig,
  KeystonePreset,
  KeystoneCorners,
} from '../shared/types';
import { DEFAULT_KEYSTONE_CORNERS } from '../shared/types';
import {
  KEYSTONE_DEFAULT_SUBDIVISIONS,
  MAX_KEYSTONE_PRESETS,
} from '../shared/constants';

// ─── In-Memory State ─────────────────────────────────────────────────────────

/** projectorId → KeystoneConfig */
const _configs = new Map<string, KeystoneConfig>();

/** presetId → KeystonePreset */
const _presets = new Map<string, KeystonePreset>();

// ─── Config Management ───────────────────────────────────────────────────────

/**
 * Load keystone configurations from persisted storage.
 */
export function loadConfigs(configs: KeystoneConfig[]): void {
  _configs.clear();
  for (const config of configs) {
    _configs.set(config.projectorId, config);
  }
}

/**
 * Load presets from persisted storage.
 */
export function loadPresets(presets: KeystonePreset[]): void {
  _presets.clear();
  for (const preset of presets) {
    _presets.set(preset.id, preset);
  }
}

/**
 * Get keystone config for a projector.
 * Returns the stored config, or creates a default one if none exists.
 */
export function getConfig(projectorId: string): KeystoneConfig {
  const existing = _configs.get(projectorId);
  if (existing) return existing;

  // Create default config
  const config: KeystoneConfig = {
    id: uuidv4(),
    projectorId,
    name: 'Default',
    corners: [...DEFAULT_KEYSTONE_CORNERS] as KeystoneCorners,
    meshSubdivisions: KEYSTONE_DEFAULT_SUBDIVISIONS,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  _configs.set(projectorId, config);
  return config;
}

/**
 * Get all keystone configs.
 */
export function getAllConfigs(): KeystoneConfig[] {
  return Array.from(_configs.values());
}

/**
 * Save/update a keystone configuration for a projector.
 */
export function saveConfig(
  projectorId: string,
  update: Partial<Pick<KeystoneConfig, 'corners' | 'meshSubdivisions' | 'enabled' | 'name'>>,
): KeystoneConfig {
  const config = getConfig(projectorId);

  if (update.corners !== undefined) config.corners = update.corners;
  if (update.meshSubdivisions !== undefined) config.meshSubdivisions = update.meshSubdivisions;
  if (update.enabled !== undefined) config.enabled = update.enabled;
  if (update.name !== undefined) config.name = update.name;
  config.updatedAt = new Date().toISOString();

  _configs.set(projectorId, config);
  return config;
}

/**
 * Delete keystone config for a projector.
 */
export function deleteConfig(projectorId: string): boolean {
  return _configs.delete(projectorId);
}

/**
 * Reset keystone corners to default (identity) for a projector.
 */
export function resetConfig(projectorId: string): KeystoneConfig {
  return saveConfig(projectorId, {
    corners: [...DEFAULT_KEYSTONE_CORNERS] as KeystoneCorners,
  });
}

// ─── Preset Management ───────────────────────────────────────────────────────

/**
 * Get all presets for a specific projector.
 */
export function getPresets(projectorId: string): KeystonePreset[] {
  return Array.from(_presets.values()).filter(
    (p) => p.projectorId === projectorId,
  );
}

/**
 * Get all presets across all projectors.
 */
export function getAllPresets(): KeystonePreset[] {
  return Array.from(_presets.values());
}

/**
 * Save the current keystone config as a named preset.
 */
export function savePreset(
  projectorId: string,
  name: string,
  corners: KeystoneCorners,
): KeystonePreset {
  // Enforce max presets per projector
  const projectorPresets = getPresets(projectorId);
  if (projectorPresets.length >= MAX_KEYSTONE_PRESETS) {
    throw new Error(
      `Maximum of ${MAX_KEYSTONE_PRESETS} presets per projector reached`,
    );
  }

  const preset: KeystonePreset = {
    id: uuidv4(),
    name,
    projectorId,
    corners: [...corners] as KeystoneCorners,
    createdAt: new Date().toISOString(),
  };

  _presets.set(preset.id, preset);
  return preset;
}

/**
 * Delete a preset by ID.
 */
export function deletePreset(presetId: string): boolean {
  return _presets.delete(presetId);
}

/**
 * Apply a preset to the active config for a projector.
 */
export function applyPreset(presetId: string): KeystoneConfig | null {
  const preset = _presets.get(presetId);
  if (!preset) return null;

  return saveConfig(preset.projectorId, {
    corners: [...preset.corners] as KeystoneCorners,
  });
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

/**
 * Clear all in-memory configs and presets.
 */
export function clearAll(): void {
  _configs.clear();
  _presets.clear();
}
