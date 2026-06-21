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
  status?: string;
  activated?: boolean;
  license?: unknown;
  features?: FeatureFlag[] | null;
  [key: string]: unknown;
}

/**
 * Extract a feature-flag array from a raw response, checking both the
 * top-level `features` field and a nested `license.features` field.
 */
function extractFeatures(raw: RawLicenseResponse): FeatureFlag[] {
  if (Array.isArray(raw.features)) return raw.features as FeatureFlag[];

  const license = raw.license as Record<string, unknown> | null | undefined;
  if (license && Array.isArray(license.features)) {
    return license.features as FeatureFlag[];
  }
  return [];
}

/**
 * Normalize a raw license API response into the app's camelCase shape.
 *
 * The Obitron backend returns DIFFERENT shapes per endpoint:
 *   - /licenses/validate may return { valid: true, features: [...] }
 *   - /licenses/activate may return the license object directly, e.g.
 *     { id, key, status: 'active', features: [...] } WITHOUT a valid/success flag.
 *
 * We therefore treat the response as successful if ANY of these hold:
 *   - valid === true
 *   - success === true
 *   - activated === true
 *   - status === 'active'
 *   - a license object is present (activate echoes the activated license)
 *   - a non-empty features array is present
 *
 * This guarantees the downstream UI / IPC logic never crashes on missing
 * fields and that a genuine activation isn't mis-reported as "invalid".
 */
function normalizeLicenseResponse(
  raw: RawLicenseResponse,
): LicenseValidationResponse & LicenseActivationResponse {
  const features = extractFeatures(raw);

  const license = raw.license as Record<string, unknown> | null | undefined;
  const licenseStatus =
    raw.status ?? (license?.status as string | undefined);

  const ok =
    raw.valid === true ||
    raw.success === true ||
    raw.activated === true ||
    licenseStatus === 'active' ||
    license != null ||
    features.length > 0;

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

    // Special case: "Device already activated" — the server returns HTTP 200
    // with { message: "Device already activated", license_key, device_id } but
    // NO features array. We treat this as success but need to fetch the features
    // separately via /licenses/validate.
    const message = (data as { message?: string }).message;
    if (
      message &&
      typeof message === 'string' &&
      message.toLowerCase().includes('already activated')
    ) {
      const validation = await validateLicense(licenseKey, deviceId);
      return {
        success: true,
        license: validation.license,
        features: validation.features,
      };
    }

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
