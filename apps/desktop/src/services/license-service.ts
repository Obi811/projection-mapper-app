/**
 * License Validation Service
 *
 * Manages license key validation, device registration, and feature gating.
 *
 * Architecture notes:
 * - Device ID is generated once per installation and persisted
 * - License validation results are cached locally for offline resilience
 * - Feature flags are exposed as a simple Set for O(1) lookups
 */

import { apiClient } from './api-client';
import type {
  FeatureFlag,
  LicenseValidationResponse,
  LicenseActivationResponse,
} from '../shared/types';

// ─── Device ID ──────────────────────────────────────────────────────────────

/**
 * Generate a stable, unique device identifier.
 *
 * Uses a combination of platform info and a random UUID.
 * In the Electron main process this is persisted via electron-store;
 * this function only generates — persistence is the caller's responsibility.
 */
export function generateDeviceId(): string {
  // We use the uuid package in the main process.
  // This is a pure fallback for environments without crypto.randomUUID.
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: manual v4-style UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Response normalization ───────────────────────────────────────────────

/**
 * Raw API response shape — the Obitron backend may return either snake_case
 * or camelCase keys depending on the endpoint, so we accept both and normalize.
 */
interface RawLicenseResponse {
  valid?: boolean;
  success?: boolean;
  license?: unknown;
  features?: FeatureFlag[] | null;
  [key: string]: unknown;
}

/**
 * Normalize a raw license API response into the app's camelCase shape.
 * Ensures `valid`, `success` and `features` are always well-defined so the
 * downstream UI / IPC logic never crashes on missing fields.
 */
function normalizeLicenseResponse(
  raw: RawLicenseResponse,
): LicenseValidationResponse & LicenseActivationResponse {
  const ok = raw.valid ?? raw.success ?? false;
  const features = Array.isArray(raw.features) ? raw.features : [];
  return {
    valid: ok,
    success: ok,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    license: (raw.license ?? null) as any,
    features,
  };
}

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Validate a license key + device ID against the Obitron API.
 *
 * @param licenseKey - The user's license key string
 * @param deviceId   - This machine's persisted device identifier
 * @returns Validation result including enabled feature flags
 */
export async function validateLicense(
  licenseKey: string,
  deviceId: string,
): Promise<LicenseValidationResponse> {
  // NOTE: The Obitron API uses snake_case field names.
  // The /licenses/validate endpoint expects ONLY license_key + device_id
  // (it rejects an extra device_name property with HTTP 400).
  try {
    const { data } = await apiClient.post<RawLicenseResponse>(
      '/licenses/validate',
      { license_key: licenseKey, device_id: deviceId },
    );
    return normalizeLicenseResponse(data) as LicenseValidationResponse;
  } catch (error: unknown) {
    // Extract the server's error message for better debugging
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: unknown } } };
      const serverMessage = axiosError.response?.data?.message;
      if (serverMessage) {
        const msg = Array.isArray(serverMessage)
          ? serverMessage.join(', ')
          : String(serverMessage);
        throw new Error(`License validation failed: ${msg}`);
      }
    }
    throw error;
  }
}

/**
 * Activate a license key on this device.
 *
 * @param licenseKey - The user's license key string
 * @param deviceId   - This machine's persisted device identifier
 * @param deviceName - Human-readable device name (e.g. hostname)
 */
export async function activateLicense(
  licenseKey: string,
  deviceId: string,
  deviceName: string,
): Promise<LicenseActivationResponse> {
  // NOTE: The Obitron API uses snake_case field names.
  // The /licenses/activate endpoint REQUIRES license_key + device_id + device_name.
  try {
    const { data } = await apiClient.post<RawLicenseResponse>(
      '/licenses/activate',
      { license_key: licenseKey, device_id: deviceId, device_name: deviceName },
    );
    return normalizeLicenseResponse(data) as LicenseActivationResponse;
  } catch (error: unknown) {
    // Extract the server's error message for better debugging
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: unknown } } };
      const serverMessage = axiosError.response?.data?.message;
      if (serverMessage) {
        const msg = Array.isArray(serverMessage)
          ? serverMessage.join(', ')
          : String(serverMessage);
        throw new Error(`License activation failed: ${msg}`);
      }
    }
    throw error;
  }
}

// ─── Feature Gating ─────────────────────────────────────────────────────────

/**
 * In-memory feature set, populated after license validation.
 * Provides O(1) feature checks throughout the app lifetime.
 */
let _enabledFeatures: Set<FeatureFlag> = new Set();

/**
 * Update the in-memory feature set.
 * Called after a successful license validation.
 */
export function setEnabledFeatures(features: FeatureFlag[]): void {
  _enabledFeatures = new Set(features);
}

/**
 * Check whether a specific feature is enabled for the current license.
 *
 * @example
 * if (hasFeature('keystone_correction')) {
 *   // render keystone UI
 * }
 */
export function hasFeature(feature: FeatureFlag): boolean {
  return _enabledFeatures.has(feature);
}

/**
 * Return a snapshot of all currently enabled features.
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return Array.from(_enabledFeatures);
}

/**
 * Clear all features — used on logout or license invalidation.
 */
export function clearFeatures(): void {
  _enabledFeatures.clear();
}
