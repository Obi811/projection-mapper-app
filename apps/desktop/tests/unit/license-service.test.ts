/**
 * Unit tests for the License Service — feature gating logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  setEnabledFeatures,
  hasFeature,
  getEnabledFeatures,
  clearFeatures,
  generateDeviceId,
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
});
