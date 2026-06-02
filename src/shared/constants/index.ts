/**
 * Application-wide constants.
 *
 * Centralised here so every layer (main, renderer, services)
 * can import the same values without duplication.
 */

/** Base URL of the Obitron licensing / auth API */
export const API_BASE_URL = 'https://obitron.abacusai.app';

/** Current application version — kept in sync with package.json via build step */
export const APP_VERSION = '0.1.0';

/** Application name used in window titles, about dialogs, etc. */
export const APP_NAME = 'Projection Mapper';

/** Default window dimensions */
export const DEFAULT_WINDOW_WIDTH = 1280;
export const DEFAULT_WINDOW_HEIGHT = 800;
export const MIN_WINDOW_WIDTH = 960;
export const MIN_WINDOW_HEIGHT = 600;

/**
 * Feature sets by tier — used as fallback when the API is unreachable.
 * The canonical source of truth is always the server response.
 */
export const BASIC_FEATURES = [
  'basic_projection',
  'text_overlay',
  'media_import',
  'gif_support',
] as const;

export const PREMIUM_FEATURES = [
  ...BASIC_FEATURES,
  'multi_surface',
  'keystone_correction',
  'audio_sync',
  'dmx_support',
  'addon_system',
  'remote_control',
] as const;

/** Multi-Projector limits */
export const MIN_PROJECTORS = 2;
export const MAX_PROJECTORS = 16;
export const PROJECTOR_WINDOW_MIN_WIDTH = 640;
export const PROJECTOR_WINDOW_MIN_HEIGHT = 480;

/** Keystone correction defaults */
export const KEYSTONE_DEFAULT_SUBDIVISIONS = 8;
export const KEYSTONE_MIN_SUBDIVISIONS = 1;
export const KEYSTONE_MAX_SUBDIVISIONS = 32;
export const KEYSTONE_SNAP_GRID_SIZE = 0.05; // 5% increments
export const KEYSTONE_ARROW_STEP = 0.005; // 0.5% per arrow key press
export const KEYSTONE_ARROW_STEP_FINE = 0.001; // 0.1% with Shift held
export const MAX_KEYSTONE_PRESETS = 20;

/** Addon system limits */
export const MAX_ADDONS = 50;
export const ADDON_DIR_NAME = 'addons';
export const ADDON_MANIFEST_FILENAME = 'addon.json';

/** Valid addon permissions */
export const VALID_ADDON_PERMISSIONS = [
  'projection:read',
  'projection:write',
  'surfaces:read',
  'surfaces:write',
  'projectors:read',
  'keystone:read',
  'keystone:write',
  'ui:sidebar',
  'ui:toolbar',
  'storage:read',
  'storage:write',
  'network:fetch',
] as const;

/** Addon category labels for UI */
export const ADDON_CATEGORY_LABELS: Record<string, string> = {
  effect: 'Effects',
  integration: 'Integrations',
  import_export: 'Import / Export',
  tool: 'Tools',
};

/** Electron Store keys */
export const STORE_KEYS = {
  ACCESS_TOKEN: 'auth.accessToken',
  REFRESH_TOKEN: 'auth.refreshToken',
  USER: 'auth.user',
  DEVICE_ID: 'device.id',
  LICENSE_KEY: 'license.key',
  FEATURES: 'license.features',
  WINDOW_BOUNDS: 'window.bounds',
  PROJECTOR_CONFIGS: 'projectors.configs',
  KEYSTONE_CONFIGS: 'keystone.configs',
  KEYSTONE_PRESETS: 'keystone.presets',
  ADDON_INSTALLED: 'addons.installed',
  ADDON_SETTINGS: 'addons.settings',
} as const;
