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
  category: string;
}

export interface AddonPurchaseResponse {
  success: boolean;
  addon: Addon;
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

  // App
  APP_GET_VERSION = 'app:getVersion',
  APP_QUIT = 'app:quit',
}
