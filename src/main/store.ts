/**
 * Electron Store — Persistent key-value storage.
 *
 * Wraps `electron-store` for type-safe access to persisted settings,
 * auth tokens, device ID, and license data.
 *
 * Storage location (default):
 *   macOS:   ~/Library/Application Support/projection-mapper-app/config.json
 *   Windows: %APPDATA%/projection-mapper-app/config.json
 *   Linux:   ~/.config/projection-mapper-app/config.json
 */

import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import { STORE_KEYS } from '../shared/constants';
import type { User, FeatureFlag } from '../shared/types';
import { configureTokenHandlers } from '../services/api-client';

interface StoreSchema {
  [STORE_KEYS.ACCESS_TOKEN]: string | null;
  [STORE_KEYS.REFRESH_TOKEN]: string | null;
  [STORE_KEYS.USER]: User | null;
  [STORE_KEYS.DEVICE_ID]: string;
  [STORE_KEYS.LICENSE_KEY]: string | null;
  [STORE_KEYS.FEATURES]: FeatureFlag[];
  [STORE_KEYS.WINDOW_BOUNDS]: {
    x?: number;
    y?: number;
    width: number;
    height: number;
  };
}

let store: Store<StoreSchema>;

/**
 * Initialise the store and wire up token handlers for the API client.
 * Must be called once during app startup (before any API calls).
 */
export function initStore(): void {
  store = new Store<StoreSchema>({
    name: 'config',
    defaults: {
      [STORE_KEYS.ACCESS_TOKEN]: null,
      [STORE_KEYS.REFRESH_TOKEN]: null,
      [STORE_KEYS.USER]: null,
      [STORE_KEYS.DEVICE_ID]: uuidv4(), // Generated once, persisted forever
      [STORE_KEYS.LICENSE_KEY]: null,
      [STORE_KEYS.FEATURES]: [],
      [STORE_KEYS.WINDOW_BOUNDS]: { width: 1280, height: 800 },
    },
  });

  // Wire the API client to read/write tokens from this store
  configureTokenHandlers({
    getAccessToken: () => store.get(STORE_KEYS.ACCESS_TOKEN),
    getRefreshToken: () => store.get(STORE_KEYS.REFRESH_TOKEN),
    setTokens: (access, refresh) => {
      store.set(STORE_KEYS.ACCESS_TOKEN, access);
      store.set(STORE_KEYS.REFRESH_TOKEN, refresh);
    },
    onAuthFailure: () => {
      // Clear auth state — renderer will detect this and show login
      store.set(STORE_KEYS.ACCESS_TOKEN, null);
      store.set(STORE_KEYS.REFRESH_TOKEN, null);
      store.set(STORE_KEYS.USER, null);
    },
  });
}

export function getStore(): Store<StoreSchema> {
  return store;
}

// ─── Convenience accessors ──────────────────────────────────────────────────

export function getDeviceId(): string {
  return store.get(STORE_KEYS.DEVICE_ID);
}

export function getAccessToken(): string | null {
  return store.get(STORE_KEYS.ACCESS_TOKEN);
}

export function getUser(): User | null {
  return store.get(STORE_KEYS.USER);
}

export function setAuthData(
  accessToken: string,
  refreshToken: string,
  user: User,
): void {
  store.set(STORE_KEYS.ACCESS_TOKEN, accessToken);
  store.set(STORE_KEYS.REFRESH_TOKEN, refreshToken);
  store.set(STORE_KEYS.USER, user);
}

export function clearAuthData(): void {
  store.set(STORE_KEYS.ACCESS_TOKEN, null);
  store.set(STORE_KEYS.REFRESH_TOKEN, null);
  store.set(STORE_KEYS.USER, null);
}

export function setLicenseData(
  licenseKey: string,
  features: FeatureFlag[],
): void {
  store.set(STORE_KEYS.LICENSE_KEY, licenseKey);
  store.set(STORE_KEYS.FEATURES, features);
}

export function getLicenseKey(): string | null {
  return store.get(STORE_KEYS.LICENSE_KEY);
}

export function getFeatures(): FeatureFlag[] {
  return store.get(STORE_KEYS.FEATURES);
}
