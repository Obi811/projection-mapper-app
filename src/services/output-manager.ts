/**
 * Output Manager Service
 *
 * Manages multiple display outputs for projection mapping.
 * Handles display enumeration, projector configuration,
 * and runtime state management.
 *
 * Scalable from 2 to 16 projectors.
 *
 * Architecture:
 *   output-manager.ts  ←  display enumeration, config CRUD, state tracking
 *   main/projector-window.ts  ←  BrowserWindow creation per projector
 *   main/ipc.ts  ←  IPC bridge to renderer
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  DisplayInfo,
  ProjectorConfig,
  ProjectorState,
} from '../shared/types';
import { MAX_PROJECTORS } from '../shared/constants';

// ─── Display Enumeration ────────────────────────────────────────────────────

/**
 * Enumerate all connected displays using Electron's screen API.
 * Must be called from the main process after app.whenReady().
 */
export function enumerateDisplays(): DisplayInfo[] {
  // Lazy import to avoid issues in renderer/test contexts
  const { screen } = require('electron');
  const displays = screen.getAllDisplays();

  return displays.map((display: Electron.Display, index: number) => ({
    id: display.id,
    label: display.label || `Display ${index + 1}`,
    bounds: { ...display.bounds },
    workArea: { ...display.workArea },
    scaleFactor: display.scaleFactor,
    internal: display.internal ?? (index === 0),
  }));
}

/**
 * Get the primary display.
 */
export function getPrimaryDisplay(): DisplayInfo {
  const { screen } = require('electron');
  const primary = screen.getPrimaryDisplay();
  return {
    id: primary.id,
    label: primary.label || 'Primary Display',
    bounds: { ...primary.bounds },
    workArea: { ...primary.workArea },
    scaleFactor: primary.scaleFactor,
    internal: true,
  };
}

// ─── Configuration Management ───────────────────────────────────────────────

/** In-memory projector configurations (synced with electron-store) */
let _configs: Map<string, ProjectorConfig> = new Map();

/** In-memory projector runtime states */
let _states: Map<string, ProjectorState> = new Map();

/**
 * Load projector configurations from an array (e.g. from electron-store).
 */
export function loadConfigs(configs: ProjectorConfig[]): void {
  _configs.clear();
  _states.clear();
  for (const config of configs) {
    _configs.set(config.id, config);
    _states.set(config.id, {
      ...config,
      status: 'idle',
    });
  }
}

/**
 * Get all projector configurations.
 */
export function getConfigs(): ProjectorConfig[] {
  return Array.from(_configs.values());
}

/**
 * Get a single projector configuration by ID.
 */
export function getConfig(id: string): ProjectorConfig | undefined {
  return _configs.get(id);
}

/**
 * Create or update a projector configuration.
 * Returns the saved config.
 *
 * @throws Error if MAX_PROJECTORS is exceeded on creation
 */
export function saveConfig(config: Partial<ProjectorConfig> & { displayId: number }): ProjectorConfig {
  const isNew = !config.id || !_configs.has(config.id);

  if (isNew && _configs.size >= MAX_PROJECTORS) {
    throw new Error(
      `Maximum number of projectors (${MAX_PROJECTORS}) reached.`,
    );
  }

  const existing = config.id ? _configs.get(config.id) : undefined;

  const saved: ProjectorConfig = {
    id: config.id || uuidv4(),
    name: config.name || existing?.name || `Projector ${_configs.size + 1}`,
    displayId: config.displayId ?? existing?.displayId ?? 0,
    displayIndex: config.displayIndex ?? existing?.displayIndex ?? 0,
    resolution: config.resolution ?? existing?.resolution ?? { width: 1920, height: 1080 },
    position: config.position ?? existing?.position ?? { x: 0, y: 0 },
    enabled: config.enabled ?? existing?.enabled ?? true,
    fullscreen: config.fullscreen ?? existing?.fullscreen ?? true,
    assignedSurfaces: config.assignedSurfaces ?? existing?.assignedSurfaces ?? [],
  };

  _configs.set(saved.id, saved);

  // Update or create runtime state
  const existingState = _states.get(saved.id);
  _states.set(saved.id, {
    ...saved,
    status: existingState?.status ?? 'idle',
    windowId: existingState?.windowId,
    fps: existingState?.fps,
  });

  return saved;
}

/**
 * Delete a projector configuration.
 * Returns true if the config existed and was deleted.
 */
export function deleteConfig(id: string): boolean {
  _states.delete(id);
  return _configs.delete(id);
}

// ─── Runtime State Management ───────────────────────────────────────────────

/**
 * Get all projector runtime states.
 */
export function getStates(): ProjectorState[] {
  return Array.from(_states.values());
}

/**
 * Get a single projector state by ID.
 */
export function getState(id: string): ProjectorState | undefined {
  return _states.get(id);
}

/**
 * Update projector runtime state (status, windowId, fps).
 */
export function updateState(
  id: string,
  update: Partial<Pick<ProjectorState, 'status' | 'windowId' | 'fps'>>,
): ProjectorState | undefined {
  const state = _states.get(id);
  if (!state) return undefined;

  const updated: ProjectorState = {
    ...state,
    ...update,
  };
  _states.set(id, updated);
  return updated;
}

/**
 * Assign surfaces to a projector.
 */
export function assignSurfaces(projectorId: string, surfaceIds: string[]): ProjectorConfig | undefined {
  const config = _configs.get(projectorId);
  if (!config) return undefined;

  config.assignedSurfaces = surfaceIds;
  _configs.set(projectorId, config);

  const state = _states.get(projectorId);
  if (state) {
    state.assignedSurfaces = surfaceIds;
    _states.set(projectorId, state);
  }

  return config;
}

/**
 * Clear all configs and states.
 */
export function clearAll(): void {
  _configs.clear();
  _states.clear();
}

/**
 * Get the count of active projectors.
 */
export function getActiveCount(): number {
  let count = 0;
  for (const state of _states.values()) {
    if (state.status === 'active') count++;
  }
  return count;
}
