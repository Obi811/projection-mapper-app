/**
 * Shared type definitions used across Main Process, Renderer, and Services.
 *
 * This module is the single source of truth for all API response types,
 * domain models, and shared interfaces.
 */

// ─── Authentication ──────────────────────────────────────────────────────────

/** User profile returned by the auth API */
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
}

/** Successful auth response from POST /auth/login or /auth/register */
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

/** Token refresh response from POST /auth/refresh */
export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

/** Social auth providers */
export type SocialProvider = 'google' | 'apple';

// ─── Licensing ───────────────────────────────────────────────────────────────

/**
 * All available feature flags.
 * Basic tier features are prefixed with standard names,
 * premium features unlock advanced projection capabilities.
 */
export type FeatureFlag =
  // Basic
  | 'basic_projection'
  | 'text_overlay'
  | 'media_import'
  | 'gif_support'
  // Premium
  | 'multi_surface'
  | 'keystone_correction'
  | 'audio_sync'
  | 'dmx_support'
  | 'addon_system'
  | 'remote_control';

/** License object returned by the validation endpoint */
export interface License {
  id: string;
  key: string;
  tier: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'expired' | 'revoked';
  expiresAt: string;
  maxDevices: number;
  activatedDevices: number;
}

/** Response from POST /licenses/validate */
export interface LicenseValidationResponse {
  valid: boolean;
  license: License | null;
  features: FeatureFlag[];
}

/** Response from POST /licenses/activate */
export interface LicenseActivationResponse {
  success: boolean;
  license: License;
  features: FeatureFlag[];
}

// ─── Addons / Marketplace ────────────────────────────────────────────────────

/** Category of an addon in the marketplace */
export type AddonCategory = 'effect' | 'integration' | 'import_export' | 'tool';

/** Marketplace addon (from API) */
export interface Addon {
  id: string;
  slug: string;
  name: string;
  description: string;
  version: string;
  price: number;
  currency: string;
  author: string;
  thumbnailUrl?: string;
  category: AddonCategory;
}

export interface AddonPurchaseResponse {
  success: boolean;
  addon: Addon;
}

/** Permissions an addon can request */
export type AddonPermission =
  | 'projection:read'
  | 'projection:write'
  | 'surfaces:read'
  | 'surfaces:write'
  | 'projectors:read'
  | 'keystone:read'
  | 'keystone:write'
  | 'ui:sidebar'
  | 'ui:toolbar'
  | 'storage:read'
  | 'storage:write'
  | 'network:fetch';

/** Addon manifest (addon.json) — defines the addon's metadata and entry point */
export interface AddonManifest {
  /** Unique addon identifier (reverse-dns style, e.g. "com.example.my-addon") */
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  /** Relative path to the entry module (default: "index.js") */
  entry: string;
  /** Category for marketplace display */
  category: AddonCategory;
  /** Permissions requested by this addon */
  permissions: AddonPermission[];
  /** Minimum app version required (semver) */
  minAppVersion?: string;
  /** Optional icon path relative to addon directory */
  icon?: string;
  /** Marketplace slug (for update checks) */
  marketplaceSlug?: string;
  /** Addon settings schema (JSON Schema subset) */
  settings?: AddonSettingsSchema;
}

/** JSON Schema-like definition for addon settings */
export interface AddonSettingsSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'select';
    label: string;
    description?: string;
    default: string | number | boolean;
    options?: Array<{ label: string; value: string | number }>;
    min?: number;
    max?: number;
  };
}

/** Runtime state of a loaded addon */
export type AddonState = 'installed' | 'loaded' | 'enabled' | 'disabled' | 'error';

/** Installed addon — manifest + runtime state */
export interface InstalledAddon {
  manifest: AddonManifest;
  state: AddonState;
  /** Absolute path to addon directory */
  path: string;
  /** Error message if state is 'error' */
  error?: string;
  /** When addon was installed */
  installedAt: string;
  /** When addon was last enabled */
  lastEnabledAt?: string;
  /** Per-addon user settings */
  settings: Record<string, string | number | boolean>;
}

/** Event types that addons can subscribe to */
export type AddonEventType =
  | 'app:ready'
  | 'app:beforeQuit'
  | 'projection:update'
  | 'projection:render'
  | 'surface:added'
  | 'surface:removed'
  | 'surface:changed'
  | 'projector:connected'
  | 'projector:disconnected'
  | 'keystone:changed'
  | 'addon:settingsChanged';

/** Addon event payload */
export interface AddonEvent<T = unknown> {
  type: AddonEventType;
  timestamp: number;
  source: string; // addon ID or 'app'
  data: T;
}

/** Addon lifecycle hooks that addons implement */
export interface AddonHooks {
  onLoad?: () => void | Promise<void>;
  onEnable?: () => void | Promise<void>;
  onDisable?: () => void | Promise<void>;
  onUnload?: () => void | Promise<void>;
  onProjectionUpdate?: (data: { surfaces: ProjectionSurface[] }) => void;
  onSettingsChanged?: (settings: Record<string, string | number | boolean>) => void;
  onEvent?: (event: AddonEvent) => void;
}

// ─── Projection / Canvas ────────────────────────────────────────────────────

/** A single projection surface in the scene */
export interface ProjectionSurface {
  id: string;
  name: string;
  /** Corner positions for keystone [topLeft, topRight, bottomRight, bottomLeft] */
  corners: [Point2D, Point2D, Point2D, Point2D];
  width: number;
  height: number;
  opacity: number;
  visible: boolean;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

/** A text overlay element on a projection surface */
export interface TextOverlay {
  id: string;
  surfaceId: string;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  position: Point2D;
  rotation: number;
  opacity: number;
}

/** Project file schema — serialisable to disk */
export interface ProjectFile {
  version: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  surfaces: ProjectionSurface[];
  textOverlays: TextOverlay[];
}

// ─── Multi-Projector / Output Manager ────────────────────────────────────────

/** Display information from Electron screen API */
export interface DisplayInfo {
  id: number;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  internal: boolean;
}

/** Projector configuration stored in electron-store */
export interface ProjectorConfig {
  id: string;
  name: string;
  displayId: number;
  displayIndex: number;
  resolution: { width: number; height: number };
  position: { x: number; y: number };
  enabled: boolean;
  fullscreen: boolean;
  /** Assigned surface IDs for this projector */
  assignedSurfaces: string[];
}

/** Runtime projector state (extends config with live status) */
export interface ProjectorState extends ProjectorConfig {
  status: 'idle' | 'active' | 'error' | 'disconnected';
  windowId?: number;
  fps?: number;
}

/** Content assignment — maps content to a projector */
export interface SurfaceAssignment {
  projectorId: string;
  surfaceId: string;
  layer: number;
}

// ─── Keystone Correction ─────────────────────────────────────────────────────

/** Corner positions for keystone correction [topLeft, topRight, bottomRight, bottomLeft] */
export type KeystoneCorners = [Point2D, Point2D, Point2D, Point2D];

/** Default (identity) keystone corners — normalised 0..1 */
export const DEFAULT_KEYSTONE_CORNERS: KeystoneCorners = [
  { x: 0, y: 1 },   // topLeft
  { x: 1, y: 1 },   // topRight
  { x: 1, y: 0 },   // bottomRight
  { x: 0, y: 0 },   // bottomLeft
];

/** Keystone configuration for a single projector */
export interface KeystoneConfig {
  id: string;
  projectorId: string;
  name: string;
  corners: KeystoneCorners;
  /** Mesh subdivision for smooth deformation (higher = more accurate) */
  meshSubdivisions: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A saved keystone preset */
export interface KeystonePreset {
  id: string;
  name: string;
  projectorId: string;
  corners: KeystoneCorners;
  createdAt: string;
}

/** 4x4 transformation matrix as flat array (column-major, Three.js format) */
export type TransformMatrix4 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
];

// ─── IPC (Main ↔ Renderer) ──────────────────────────────────────────────────

/** Channel names for Electron IPC communication */
export enum IpcChannel {
  // Auth
  AUTH_LOGIN = 'auth:login',
  AUTH_REGISTER = 'auth:register',
  AUTH_LOGOUT = 'auth:logout',
  AUTH_REFRESH = 'auth:refresh',
  AUTH_GET_USER = 'auth:getUser',

  // License
  LICENSE_VALIDATE = 'license:validate',
  LICENSE_ACTIVATE = 'license:activate',
  LICENSE_GET_FEATURES = 'license:getFeatures',

  // Device
  DEVICE_GET_ID = 'device:getId',

  // Projector / Output Manager
  PROJECTOR_GET_DISPLAYS = 'projector:getDisplays',
  PROJECTOR_GET_CONFIGS = 'projector:getConfigs',
  PROJECTOR_SAVE_CONFIG = 'projector:saveConfig',
  PROJECTOR_DELETE_CONFIG = 'projector:deleteConfig',
  PROJECTOR_OPEN_WINDOW = 'projector:openWindow',
  PROJECTOR_CLOSE_WINDOW = 'projector:closeWindow',
  PROJECTOR_GET_STATES = 'projector:getStates',
  PROJECTOR_UPDATE_CONTENT = 'projector:updateContent',
  PROJECTOR_SCAN_DISPLAYS = 'projector:scanDisplays',

  // Keystone Correction
  KEYSTONE_GET_CONFIG = 'keystone:getConfig',
  KEYSTONE_SAVE_CONFIG = 'keystone:saveConfig',
  KEYSTONE_DELETE_CONFIG = 'keystone:deleteConfig',
  KEYSTONE_GET_PRESETS = 'keystone:getPresets',
  KEYSTONE_SAVE_PRESET = 'keystone:savePreset',
  KEYSTONE_DELETE_PRESET = 'keystone:deletePreset',
  KEYSTONE_RESET = 'keystone:reset',

  // Addons
  ADDON_LIST_MARKETPLACE = 'addon:listMarketplace',
  ADDON_LIST_BY_CATEGORY = 'addon:listByCategory',
  ADDON_GET_DETAILS = 'addon:getDetails',
  ADDON_PURCHASE = 'addon:purchase',
  ADDON_CHECK_OWNED = 'addon:checkOwned',
  ADDON_LIST_MY = 'addon:listMy',
  ADDON_INSTALL = 'addon:install',
  ADDON_UNINSTALL = 'addon:uninstall',
  ADDON_ENABLE = 'addon:enable',
  ADDON_DISABLE = 'addon:disable',
  ADDON_GET_INSTALLED = 'addon:getInstalled',
  ADDON_GET_SETTINGS = 'addon:getSettings',
  ADDON_SAVE_SETTINGS = 'addon:saveSettings',
  ADDON_CHECK_UPDATES = 'addon:checkUpdates',

  // App
  APP_GET_VERSION = 'app:getVersion',
  APP_QUIT = 'app:quit',
}
