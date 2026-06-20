/**
 * Licensing / portal API contract — single source of truth.
 *
 * Mirrors the endpoints exposed by the Obitron licensing server and consumed by
 * both the desktop app and the mobile companion app.
 */

/** Base URL of the Obitron licensing & portal server. */
export const API_BASE_URL = 'https://licensing.obitron.de';

/** All REST endpoints used by the apps. */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    social: '/auth/social',
    me: '/auth/me',
  },
  portal: {
    profile: '/portal/profile',
    dashboard: '/portal/dashboard',
    devices: '/portal/devices',
  },
  licenses: {
    validate: '/licenses/validate',
    activate: '/licenses/activate',
  },
} as const;

/** User role in the system (owner > admin > user). */
export type UserRole = 'user' | 'admin' | 'owner';

/** Authenticated user profile. */
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
}

/** Successful auth response from POST /auth/login or /auth/register. */
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

/** Token refresh response from POST /auth/refresh. */
export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

/** Social auth providers. */
export type SocialProvider = 'google' | 'apple';

/** License tiers and statuses. */
export type LicenseTier = 'basic' | 'premium' | 'enterprise';
export type LicenseStatus = 'active' | 'expired' | 'revoked';

/** License object returned by the validation endpoint. */
export interface License {
  id: string;
  key: string;
  tier: LicenseTier;
  status: LicenseStatus;
  expiresAt: string;
  maxDevices: number;
  activatedDevices: number;
}

/** A device registered against the user's account/license. */
export interface RegisteredDevice {
  id: string;
  name: string;
  platform: string;
  lastSeenAt: string;
  current?: boolean;
}
