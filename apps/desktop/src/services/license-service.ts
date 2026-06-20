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
  const { data } = await apiClient.post<LicenseValidationResponse>(
    '/licenses/validate',
    { licenseKey, deviceId },
  );
  return data;
}

/**
 * Activate a license key on this device.
 *
 * @param licenseKey - The user's license key string
 * @param deviceId   - This machine's persisted device identifier
 */
export async function activateLicense(
  licenseKey: string,
  deviceId: string,
): Promise<LicenseActivationResponse> {
  const { data } = await apiClient.post<LicenseActivationResponse>(
    '/licenses/activate',
    { licenseKey, deviceId },
  );
  return data;
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
