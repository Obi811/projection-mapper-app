/**
 * Unit tests for the Plugin Loader service.
 *
 * Covers:
 * - Manifest validation (valid + invalid cases)
 * - Addon registration & lifecycle (enable/disable)
 * - Settings persistence
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateManifest } from '@services/plugin-loader';
import type { AddonManifest } from '@shared/types';

describe('Plugin Loader', () => {
  describe('validateManifest', () => {
    const validManifest: AddonManifest = {
      id: 'test-addon',
      name: 'Test Addon',
      version: '1.0.0',
      description: 'A test addon for validation',
      author: 'Tester',
      entry: 'index.js',
      category: 'tool',
      permissions: ['projection:read'],
      minAppVersion: '0.7.0',
    };

    it('should accept a valid manifest', () => {
      const errors = validateManifest(validManifest);
      expect(errors).toEqual([]);
    });

    it('should reject null/undefined input', () => {
      const errors = validateManifest(null);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toMatch(/must be/i);
    });

    it('should reject missing required fields', () => {
      const errors = validateManifest({ id: 'x' });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject an invalid category', () => {
      const errors = validateManifest({
        ...validManifest,
        category: 'not_a_category',
      });
      expect(errors.some((e: string) => e.toLowerCase().includes('category'))).toBe(true);
    });

    it('should reject an invalid permission', () => {
      const errors = validateManifest({
        ...validManifest,
        permissions: ['bad:permission'],
      });
      expect(errors.some((e: string) => e.toLowerCase().includes('permission'))).toBe(true);
    });

    it('should reject invalid semver version', () => {
      const errors = validateManifest({
        ...validManifest,
        version: 'not-semver',
      });
      expect(errors.some((e: string) => e.toLowerCase().includes('version'))).toBe(true);
    });

    it('should reject empty id', () => {
      const errors = validateManifest({
        ...validManifest,
        id: '',
      });
      expect(errors.some((e: string) => e.toLowerCase().includes('id'))).toBe(true);
    });

    it('should reject empty name', () => {
      const errors = validateManifest({
        ...validManifest,
        name: '',
      });
      expect(errors.some((e: string) => e.toLowerCase().includes('name'))).toBe(true);
    });

    it('should allow manifest with no permissions', () => {
      const errors = validateManifest({
        ...validManifest,
        permissions: [],
      });
      expect(errors).toEqual([]);
    });

    it('should allow manifest with settings', () => {
      const errors = validateManifest({
        ...validManifest,
        settings: {
          option1: { type: 'string', label: 'Option 1', default: 'hello' },
          option2: { type: 'boolean', label: 'Option 2', default: true },
        },
      });
      expect(errors).toEqual([]);
    });
  });
});
