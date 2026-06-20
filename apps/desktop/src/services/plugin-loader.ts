/**
 * Plugin Loader — Discovers, validates, and manages addon lifecycle.
 *
 * Responsibilities:
 * - Scan addon directory for installed addons
 * - Validate addon manifests (addon.json)
 * - Load/unload addon entry modules
 * - Enable/disable addons at runtime
 * - Manage addon sandboxing (permission checks)
 *
 * Addons are stored in: <userData>/addons/<addon-id>/
 * Each addon must contain an addon.json manifest.
 */

import type {
  AddonManifest,
  InstalledAddon,
  AddonState,
  AddonHooks,
  AddonPermission,
  AddonCategory,
  ProjectionSurface,
} from '../shared/types';
import {
  MAX_ADDONS,
  ADDON_MANIFEST_FILENAME,
  VALID_ADDON_PERMISSIONS,
} from '../shared/constants';
import { createAddonAPI, addonEventBus, emitAddonEvent } from './addon-api';
import type { AddonAPIInstance } from './addon-api';

// ─── Addon Registry ──────────────────────────────────────────────────────────

/** In-memory map of loaded addons */
const registry = new Map<string, InstalledAddon>();

/** Active addon modules (hooks) — keyed by addon ID */
const activeModules = new Map<string, AddonHooks>();

/** Active API instances — keyed by addon ID */
const activeAPIs = new Map<string, AddonAPIInstance>();

/** Event unsubscribers per addon */
const eventCleanup = new Map<string, Array<() => void>>();

/** Persistent storage delegate (wired by main process) */
let storageDelegate: {
  getAddonData: (addonId: string) => Record<string, unknown>;
  setAddonData: (addonId: string, data: Record<string, unknown>) => void;
  getInstalledAddons: () => InstalledAddon[];
  setInstalledAddons: (addons: InstalledAddon[]) => void;
} | null = null;

/** Surfaces provider (wired by main process) */
let surfacesProvider: (() => ProjectionSurface[]) | null = null;

/** Addons root directory */
let addonsDir: string = '';

// ─── Configuration ───────────────────────────────────────────────────────────

/**
 * Configure the plugin loader with storage and directory paths.
 * Must be called once during app startup.
 */
export function configurePluginLoader(config: {
  addonsDir: string;
  storage: typeof storageDelegate;
  getSurfaces?: () => ProjectionSurface[];
}): void {
  addonsDir = config.addonsDir;
  storageDelegate = config.storage;
  surfacesProvider = config.getSurfaces ?? (() => []);
}

// ─── Manifest Validation ─────────────────────────────────────────────────────

const VALID_CATEGORIES: AddonCategory[] = ['effect', 'integration', 'import_export', 'tool'];

/**
 * Validate an addon manifest for correctness.
 * Returns an array of error messages (empty = valid).
 */
export function validateManifest(manifest: unknown): string[] {
  const errors: string[] = [];
  const m = manifest as Record<string, unknown>;

  if (!m || typeof m !== 'object') {
    return ['Manifest must be a JSON object'];
  }

  // Required string fields
  for (const field of ['id', 'name', 'version', 'description', 'author', 'entry']) {
    if (typeof m[field] !== 'string' || (m[field] as string).trim() === '') {
      errors.push(`Missing or empty required field: "${field}"`);
    }
  }

  // ID format check (alphanumeric, dots, hyphens)
  if (typeof m.id === 'string' && !/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/i.test(m.id)) {
    errors.push('Field "id" must be alphanumeric with dots/hyphens (e.g. "com.example.my-addon")');
  }

  // Category
  if (!VALID_CATEGORIES.includes(m.category as AddonCategory)) {
    errors.push(`Field "category" must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  // Permissions
  if (!Array.isArray(m.permissions)) {
    errors.push('Field "permissions" must be an array');
  } else {
    for (const perm of m.permissions as unknown[]) {
      if (!VALID_ADDON_PERMISSIONS.includes(perm as AddonPermission)) {
        errors.push(`Unknown permission: "${perm}"`);
      }
    }
  }

  // Version (semver-like)
  if (typeof m.version === 'string' && !/^\d+\.\d+\.\d+/.test(m.version)) {
    errors.push('Field "version" must follow semver (e.g. "1.0.0")');
  }

  return errors;
}

// ─── Discovery ───────────────────────────────────────────────────────────────

/**
 * Scan the addons directory for installed addons.
 * Returns manifests for all valid addons found.
 */
export async function discoverAddons(): Promise<InstalledAddon[]> {
  if (!addonsDir) {
    console.warn('[PluginLoader] addonsDir not configured');
    return [];
  }

  // Dynamic import for fs/path since this runs in main process
  const fs = await import('fs');
  const path = await import('path');

  if (!fs.existsSync(addonsDir)) {
    fs.mkdirSync(addonsDir, { recursive: true });
    return [];
  }

  const entries = fs.readdirSync(addonsDir, { withFileTypes: true });
  const discovered: InstalledAddon[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const addonPath = path.join(addonsDir, entry.name);
    const manifestPath = path.join(addonPath, ADDON_MANIFEST_FILENAME);

    if (!fs.existsSync(manifestPath)) continue;

    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(raw) as AddonManifest;
      const errors = validateManifest(manifest);

      if (errors.length > 0) {
        console.warn(`[PluginLoader] Invalid manifest in ${entry.name}:`, errors);
        discovered.push({
          manifest: manifest as AddonManifest,
          state: 'error',
          path: addonPath,
          error: `Invalid manifest: ${errors.join('; ')}`,
          installedAt: new Date().toISOString(),
          settings: {},
        });
        continue;
      }

      // Check for entry file
      const entryPath = path.join(addonPath, manifest.entry);
      if (!fs.existsSync(entryPath)) {
        discovered.push({
          manifest,
          state: 'error',
          path: addonPath,
          error: `Entry file not found: ${manifest.entry}`,
          installedAt: new Date().toISOString(),
          settings: {},
        });
        continue;
      }

      // Merge with stored state if available
      const stored = storageDelegate?.getInstalledAddons() ?? [];
      const existing = stored.find((a) => a.manifest.id === manifest.id);

      discovered.push({
        manifest,
        state: existing?.state === 'enabled' ? 'installed' : (existing?.state ?? 'installed'),
        path: addonPath,
        installedAt: existing?.installedAt ?? new Date().toISOString(),
        settings: existing?.settings ?? getDefaultSettings(manifest),
      });
    } catch (err) {
      console.warn(`[PluginLoader] Failed to read manifest in ${entry.name}:`, err);
    }
  }

  return discovered;
}

/** Extract default settings values from a manifest */
function getDefaultSettings(
  manifest: AddonManifest,
): Record<string, string | number | boolean> {
  const defaults: Record<string, string | number | boolean> = {};
  if (manifest.settings) {
    for (const [key, schema] of Object.entries(manifest.settings)) {
      defaults[key] = schema.default;
    }
  }
  return defaults;
}

// ─── Lifecycle Management ────────────────────────────────────────────────────

/**
 * Initialize the addon registry from stored state.
 * Discovers addons on disk and reconciles with persisted state.
 */
export async function initializeRegistry(): Promise<InstalledAddon[]> {
  const discovered = await discoverAddons();

  registry.clear();
  for (const addon of discovered) {
    registry.set(addon.manifest.id, addon);
  }

  // Persist the reconciled list
  storageDelegate?.setInstalledAddons(Array.from(registry.values()));

  return discovered;
}

/** Get all registered addons */
export function getRegisteredAddons(): InstalledAddon[] {
  return Array.from(registry.values());
}

/** Get a specific addon by ID */
export function getAddon(addonId: string): InstalledAddon | undefined {
  return registry.get(addonId);
}

/**
 * Load an addon — requires the entry module and invoke onLoad hook.
 */
export async function loadAddon(addonId: string): Promise<InstalledAddon> {
  const addon = registry.get(addonId);
  if (!addon) throw new Error(`Addon not found: ${addonId}`);
  if (addon.state === 'error') throw new Error(`Addon has errors: ${addon.error}`);

  const path = await import('path');
  const entryPath = path.join(addon.path, addon.manifest.entry);

  try {
    // Create sandboxed API
    const api = createAddonAPI(
      addonId,
      addon.manifest.permissions,
      () => storageDelegate?.getAddonData(addonId) ?? {},
      (data) => storageDelegate?.setAddonData(addonId, data),
      () => surfacesProvider?.() ?? [],
    );
    activeAPIs.set(addonId, api);

    // Require the entry module
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const entryModule = require(entryPath);
    const hooks: AddonHooks =
      typeof entryModule === 'function'
        ? entryModule(api)
        : typeof entryModule.default === 'function'
          ? entryModule.default(api)
          : entryModule;

    activeModules.set(addonId, hooks);

    // Call onLoad
    if (hooks.onLoad) {
      await hooks.onLoad();
    }

    // Update state
    addon.state = 'loaded';
    updateAddonState(addonId, 'loaded');

    console.log(`[PluginLoader] Loaded: ${addon.manifest.name} v${addon.manifest.version}`);
    return addon;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    addon.state = 'error';
    addon.error = `Load failed: ${msg}`;
    updateAddonState(addonId, 'error', msg);
    throw err;
  }
}

/**
 * Enable an addon — calls onEnable hook and starts event forwarding.
 */
export async function enableAddon(addonId: string): Promise<InstalledAddon> {
  const addon = registry.get(addonId);
  if (!addon) throw new Error(`Addon not found: ${addonId}`);

  // Auto-load if not loaded yet
  if (addon.state === 'installed') {
    await loadAddon(addonId);
  }

  if (addon.state !== 'loaded' && addon.state !== 'disabled') {
    throw new Error(`Cannot enable addon in state: ${addon.state}`);
  }

  const hooks = activeModules.get(addonId);
  if (hooks?.onEnable) {
    await hooks.onEnable();
  }

  // Set up event forwarding
  if (hooks?.onEvent) {
    const cleanup: Array<() => void> = [];
    const handler = (event: import('../shared/types').AddonEvent) => {
      try {
        hooks.onEvent!(event);
      } catch (err) {
        console.error(`[PluginLoader] Event error in ${addonId}:`, err);
      }
    };
    addonEventBus.on('projection:update', handler);
    addonEventBus.on('surface:changed', handler);
    addonEventBus.on('keystone:changed', handler);
    cleanup.push(
      () => addonEventBus.off('projection:update', handler),
      () => addonEventBus.off('surface:changed', handler),
      () => addonEventBus.off('keystone:changed', handler),
    );
    eventCleanup.set(addonId, cleanup);
  }

  addon.state = 'enabled';
  addon.lastEnabledAt = new Date().toISOString();
  updateAddonState(addonId, 'enabled');

  console.log(`[PluginLoader] Enabled: ${addon.manifest.name}`);
  return addon;
}

/**
 * Disable an addon — calls onDisable and stops event forwarding.
 */
export async function disableAddon(addonId: string): Promise<InstalledAddon> {
  const addon = registry.get(addonId);
  if (!addon) throw new Error(`Addon not found: ${addonId}`);

  if (addon.state !== 'enabled') {
    throw new Error(`Cannot disable addon in state: ${addon.state}`);
  }

  // Clean up event listeners
  const cleanup = eventCleanup.get(addonId);
  if (cleanup) {
    cleanup.forEach((fn) => fn());
    eventCleanup.delete(addonId);
  }

  const hooks = activeModules.get(addonId);
  if (hooks?.onDisable) {
    await hooks.onDisable();
  }

  addon.state = 'disabled';
  updateAddonState(addonId, 'disabled');

  console.log(`[PluginLoader] Disabled: ${addon.manifest.name}`);
  return addon;
}

/**
 * Unload an addon — calls onUnload, removes from active modules.
 */
export async function unloadAddon(addonId: string): Promise<void> {
  const addon = registry.get(addonId);
  if (!addon) return;

  // Disable first if enabled
  if (addon.state === 'enabled') {
    await disableAddon(addonId);
  }

  const hooks = activeModules.get(addonId);
  if (hooks?.onUnload) {
    try {
      await hooks.onUnload();
    } catch (err) {
      console.warn(`[PluginLoader] onUnload error in ${addonId}:`, err);
    }
  }

  activeModules.delete(addonId);
  activeAPIs.delete(addonId);

  // Clear require cache for addon files
  const path = await import('path');
  const entryPath = path.join(addon.path, addon.manifest.entry);
  delete require.cache[require.resolve(entryPath)];

  addon.state = 'installed';
  updateAddonState(addonId, 'installed');

  console.log(`[PluginLoader] Unloaded: ${addon.manifest.name}`);
}

/**
 * Install an addon from a directory path (e.g. after download).
 */
export async function installAddon(sourcePath: string): Promise<InstalledAddon> {
  if (registry.size >= MAX_ADDONS) {
    throw new Error(`Maximum of ${MAX_ADDONS} addons reached`);
  }

  const fs = await import('fs');
  const path = await import('path');

  const manifestPath = path.join(sourcePath, ADDON_MANIFEST_FILENAME);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`No ${ADDON_MANIFEST_FILENAME} found in ${sourcePath}`);
  }

  const raw = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(raw) as AddonManifest;
  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    throw new Error(`Invalid manifest: ${errors.join('; ')}`);
  }

  // Copy to addons directory
  const targetDir = path.join(addonsDir, manifest.id);
  if (fs.existsSync(targetDir)) {
    // Update existing — remove old files
    fs.rmSync(targetDir, { recursive: true });
  }

  // Copy directory
  fs.cpSync(sourcePath, targetDir, { recursive: true });

  const addon: InstalledAddon = {
    manifest,
    state: 'installed',
    path: targetDir,
    installedAt: new Date().toISOString(),
    settings: getDefaultSettings(manifest),
  };

  registry.set(manifest.id, addon);
  storageDelegate?.setInstalledAddons(Array.from(registry.values()));

  console.log(`[PluginLoader] Installed: ${manifest.name} v${manifest.version}`);
  return addon;
}

/**
 * Uninstall an addon — unload and remove files.
 */
export async function uninstallAddon(addonId: string): Promise<boolean> {
  const addon = registry.get(addonId);
  if (!addon) return false;

  // Unload first
  await unloadAddon(addonId);

  // Remove files
  const fs = await import('fs');
  if (fs.existsSync(addon.path)) {
    fs.rmSync(addon.path, { recursive: true });
  }

  registry.delete(addonId);
  storageDelegate?.setInstalledAddons(Array.from(registry.values()));

  console.log(`[PluginLoader] Uninstalled: ${addon.manifest.name}`);
  return true;
}

// ─── Settings ────────────────────────────────────────────────────────────────

/** Get settings for an addon */
export function getAddonSettings(
  addonId: string,
): Record<string, string | number | boolean> {
  const addon = registry.get(addonId);
  return addon?.settings ?? {};
}

/** Update settings for an addon */
export async function saveAddonSettings(
  addonId: string,
  settings: Record<string, string | number | boolean>,
): Promise<void> {
  const addon = registry.get(addonId);
  if (!addon) throw new Error(`Addon not found: ${addonId}`);

  addon.settings = { ...addon.settings, ...settings };
  storageDelegate?.setInstalledAddons(Array.from(registry.values()));

  // Notify addon of settings change
  const hooks = activeModules.get(addonId);
  if (hooks?.onSettingsChanged) {
    hooks.onSettingsChanged(addon.settings);
  }

  emitAddonEvent('addon:settingsChanged', addonId, {
    addonId,
    settings: addon.settings,
  });
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

function updateAddonState(addonId: string, state: AddonState, error?: string): void {
  const addon = registry.get(addonId);
  if (addon) {
    addon.state = state;
    if (error !== undefined) addon.error = error;
    storageDelegate?.setInstalledAddons(Array.from(registry.values()));
  }
}

/** Disable all addons (called during shutdown) */
export async function shutdownAll(): Promise<void> {
  for (const [addonId, addon] of registry) {
    if (addon.state === 'enabled' || addon.state === 'loaded') {
      try {
        await unloadAddon(addonId);
      } catch (err) {
        console.warn(`[PluginLoader] Shutdown error for ${addonId}:`, err);
      }
    }
  }
  registry.clear();
  activeModules.clear();
  activeAPIs.clear();
  eventCleanup.clear();
  addonEventBus.clear();
}
