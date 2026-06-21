/**
 * Unit tests for the License Service — feature gating logic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the HTTP client so we can assert the exact request bodies.
const postMock = vi.fn();
vi.mock('@services/api-client', () => ({
  apiClient: {
    post: (...args: unknown[]) => postMock(...args),
  },
}));

import {
  setEnabledFeatures,
  hasFeature,
  getEnabledFeatures,
  clearFeatures,
  generateDeviceId,
  validateLicense,
  activateLicense,
  revalidateLicense,
} from '@services/license-service';
import type { FeatureFlag } from '@shared/types';

describe('License Service', () => {
  beforeEach(() => {
    clearFeatures();
  });

  describe('generateDeviceId', () => {
    it('should return a valid UUID-like string', () => {
      const id = generateDeviceId();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateDeviceId()));
      expect(ids.size).toBe(100);
    });
  });

  describe('Feature Gating', () => {
    const basicFeatures: FeatureFlag[] = [
      'basic_projection',
      'text_overlay',
      'media_import',
      'gif_support',
    ];

    it('should start with no features enabled', () => {
      expect(getEnabledFeatures()).toEqual([]);
      expect(hasFeature('basic_projection')).toBe(false);
    });

    it('should enable features after setEnabledFeatures', () => {
      setEnabledFeatures(basicFeatures);
      expect(hasFeature('basic_projection')).toBe(true);
      expect(hasFeature('text_overlay')).toBe(true);
      expect(hasFeature('keystone_correction')).toBe(false);
    });

    it('should return all enabled features', () => {
      setEnabledFeatures(basicFeatures);
      const result = getEnabledFeatures();
      expect(result).toHaveLength(4);
      expect(result).toContain('basic_projection');
    });

    it('should clear all features on clearFeatures', () => {
      setEnabledFeatures(basicFeatures);
      expect(hasFeature('basic_projection')).toBe(true);
      clearFeatures();
      expect(hasFeature('basic_projection')).toBe(false);
      expect(getEnabledFeatures()).toEqual([]);
    });

    it('should handle premium features', () => {
      const premiumFeatures: FeatureFlag[] = [
        ...basicFeatures,
        'multi_surface',
        'keystone_correction',
        'audio_sync',
        'dmx_support',
        'addon_system',
        'remote_control',
      ];
      setEnabledFeatures(premiumFeatures);
      expect(hasFeature('keystone_correction')).toBe(true);
      expect(hasFeature('addon_system')).toBe(true);
      expect(getEnabledFeatures()).toHaveLength(10);
    });

    it('should replace features on subsequent setEnabledFeatures calls', () => {
      setEnabledFeatures(['basic_projection', 'text_overlay']);
      expect(hasFeature('text_overlay')).toBe(true);

      setEnabledFeatures(['basic_projection']);
      expect(hasFeature('text_overlay')).toBe(false);
      expect(hasFeature('basic_projection')).toBe(true);
    });
  });

  /**
   * Regression: the Obitron API rejected camelCase bodies with HTTP 400
   * ("property licenseKey should not exist ... license_key must be a string").
   * These tests lock the snake_case request contract for both endpoints.
   */
  describe('API request body format (snake_case)', () => {
    beforeEach(() => {
      postMock.mockReset();
    });

    it('validateLicense sends license_key + device_id (NO device_name)', async () => {
      postMock.mockResolvedValue({
        data: { valid: true, license: null, features: [] },
      });

      await validateLicense('PM-XXXX', 'dev-1');

      expect(postMock).toHaveBeenCalledWith('/licenses/validate', {
        license_key: 'PM-XXXX',
        device_id: 'dev-1',
      });
      // Must NOT include device_name (validate endpoint rejects it).
      const body = postMock.mock.calls[0][1];
      expect(body).not.toHaveProperty('device_name');
      expect(body).not.toHaveProperty('licenseKey');
      expect(body).not.toHaveProperty('deviceId');
    });

    it('activateLicense sends license_key + device_id + device_name', async () => {
      postMock.mockResolvedValue({
        data: { success: true, license: null, features: [] },
      });

      await activateLicense('PM-XXXX', 'dev-1', 'MacBook (darwin)');

      expect(postMock).toHaveBeenCalledWith('/licenses/activate', {
        license_key: 'PM-XXXX',
        device_id: 'dev-1',
        device_name: 'MacBook (darwin)',
      });
      const body = postMock.mock.calls[0][1];
      expect(body).not.toHaveProperty('licenseKey');
      expect(body).not.toHaveProperty('deviceId');
    });

    it('normalizes a snake_case success response into valid/success/features', async () => {
      // Server returns only `success` — app code checks both valid & success.
      postMock.mockResolvedValue({
        data: { success: true, features: ['keystone_correction'] },
      });

      const result = await activateLicense('PM-XXXX', 'dev-1', 'Box');
      expect(result.valid).toBe(true);
      expect(result.success).toBe(true);
      expect(result.features).toEqual(['keystone_correction']);
    });

    it('defaults features to [] when the response omits them', async () => {
      postMock.mockResolvedValue({ data: { valid: true } });

      const result = await validateLicense('PM-XXXX', 'dev-1');
      expect(result.valid).toBe(true);
      expect(result.features).toEqual([]);
    });

    it('treats an activate response with status "active" as success', async () => {
      // Activate endpoint may echo the license object directly (no valid/success flag).
      postMock.mockResolvedValue({
        data: {
          id: 'lic-1',
          key: 'PM-XXXX',
          status: 'active',
          features: ['basic_projection', 'keystone_correction'],
        },
      });

      const result = await activateLicense('PM-XXXX', 'dev-1', 'Box');
      expect(result.success).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.features).toEqual(['basic_projection', 'keystone_correction']);
    });

    it('treats a nested license object as success and extracts its features', async () => {
      postMock.mockResolvedValue({
        data: {
          license: { id: 'lic-1', status: 'active', features: ['multi_surface'] },
        },
      });

      const result = await activateLicense('PM-XXXX', 'dev-1', 'Box');
      expect(result.success).toBe(true);
      expect(result.features).toEqual(['multi_surface']);
    });

    it('treats activated:true as success even without features', async () => {
      postMock.mockResolvedValue({ data: { activated: true } });

      const result = await activateLicense('PM-XXXX', 'dev-1', 'Box');
      expect(result.success).toBe(true);
    });

    it('handles "Device already activated" by fetching features via validate', async () => {
      // Activate returns "already activated" without features
      postMock
        .mockResolvedValueOnce({
          data: {
            message: 'Device already activated',
            license_key: 'PM-XXXX',
            device_id: 'dev-1',
          },
        })
        // Validate is called to fetch features
        .mockResolvedValueOnce({
          data: {
            valid: true,
            features: ['multi_surface', 'keystone_correction'],
          },
        });

      const result = await activateLicense('PM-XXXX', 'dev-1', 'Box');

      expect(result.success).toBe(true);
      expect(result.features).toEqual(['multi_surface', 'keystone_correction']);
      expect(postMock).toHaveBeenCalledTimes(2); // activate + validate
    });
  });

  describe('revalidateLicense (server-side enforcement)', () => {
    beforeEach(() => {
      postMock.mockReset();
    });

    it('returns "valid" with features when the server confirms active', async () => {
      postMock.mockResolvedValue({
        data: { valid: true, status: 'active', features: ['multi_surface'] },
      });

      const verdict = await revalidateLicense('PM-XXXX', 'dev-1');

      expect(verdict.status).toBe('valid');
      if (verdict.status === 'valid') {
        expect(verdict.features).toEqual(['multi_surface']);
      }
      expect(postMock).toHaveBeenCalledWith('/licenses/validate', {
        license_key: 'PM-XXXX',
        device_id: 'dev-1',
      });
    });

    it('returns "valid" using nested license.features', async () => {
      postMock.mockResolvedValue({
        data: { status: 'active', license: { features: ['dmx_support'] } },
      });

      const verdict = await revalidateLicense('PM-XXXX', 'dev-1');

      expect(verdict.status).toBe('valid');
      if (verdict.status === 'valid') {
        expect(verdict.features).toEqual(['dmx_support']);
      }
    });

    it('returns "invalid" when the server reports valid:false', async () => {
      postMock.mockResolvedValue({ data: { valid: false } });

      const verdict = await revalidateLicense('PM-XXXX', 'dev-1');

      expect(verdict.status).toBe('invalid');
    });

    it('returns "invalid" when the license is paused', async () => {
      postMock.mockResolvedValue({ data: { status: 'paused' } });

      const verdict = await revalidateLicense('PM-XXXX', 'dev-1');

      expect(verdict.status).toBe('invalid');
    });

    it('returns "invalid" when the license status is revoked', async () => {
      postMock.mockResolvedValue({
        data: { license: { status: 'revoked' } },
      });

      const verdict = await revalidateLicense('PM-XXXX', 'dev-1');

      expect(verdict.status).toBe('invalid');
    });

    it('returns "invalid" on a 404 (license deleted)', async () => {
      postMock.mockRejectedValue({ response: { status: 404 } });

      const verdict = await revalidateLicense('PM-XXXX', 'dev-1');

      expect(verdict.status).toBe('invalid');
    });

    it('returns "invalid" on a 403 (forbidden)', async () => {
      postMock.mockRejectedValue({ response: { status: 403 } });

      const verdict = await revalidateLicense('PM-XXXX', 'dev-1');

      expect(verdict.status).toBe('invalid');
    });

    it('returns "unknown" on a network error (offline grace — keep state)', async () => {
      postMock.mockRejectedValue(new Error('Network Error'));

      const verdict = await revalidateLicense('PM-XXXX', 'dev-1');

      expect(verdict.status).toBe('unknown');
    });

    it('returns "unknown" on a 5xx server error (keep state)', async () => {
      postMock.mockRejectedValue({ response: { status: 503 } });

      const verdict = await revalidateLicense('PM-XXXX', 'dev-1');

      expect(verdict.status).toBe('unknown');
    });

    it('returns "unknown" on an ambiguous 200 response (do not revoke)', async () => {
      postMock.mockResolvedValue({ data: { message: 'ok' } });

      const verdict = await revalidateLicense('PM-XXXX', 'dev-1');

      expect(verdict.status).toBe('unknown');
    });
  });
});
