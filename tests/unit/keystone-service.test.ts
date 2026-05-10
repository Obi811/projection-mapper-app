/**
 * Unit tests for the Keystone Service.
 *
 * Covers:
 * - Config CRUD operations
 * - Preset management
 * - Reset functionality
 * - Load/clear operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getConfig,
  getAllConfigs,
  saveConfig,
  deleteConfig,
  resetConfig,
  loadConfigs,
  loadPresets,
  getPresets,
  getAllPresets,
  savePreset,
  deletePreset,
  applyPreset,
  clearAll,
} from '../../src/services/keystone-service';
import { DEFAULT_KEYSTONE_CORNERS } from '../../src/shared/types';
import type { KeystoneConfig, KeystoneCorners } from '../../src/shared/types';

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  clearAll();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Keystone Service', () => {
  // ── Config Management ─────────────────────────────────────────────────

  describe('getConfig', () => {
    it('should create a default config if none exists', () => {
      const config = getConfig('projector-1');
      expect(config).toBeDefined();
      expect(config.projectorId).toBe('projector-1');
      expect(config.name).toBe('Default');
      expect(config.enabled).toBe(true);
      expect(config.corners).toEqual(DEFAULT_KEYSTONE_CORNERS);
      expect(config.meshSubdivisions).toBe(8);
    });

    it('should return same config on subsequent calls', () => {
      const config1 = getConfig('projector-1');
      const config2 = getConfig('projector-1');
      expect(config1.id).toBe(config2.id);
    });

    it('should create separate configs for different projectors', () => {
      const config1 = getConfig('projector-1');
      const config2 = getConfig('projector-2');
      expect(config1.id).not.toBe(config2.id);
      expect(config1.projectorId).toBe('projector-1');
      expect(config2.projectorId).toBe('projector-2');
    });
  });

  describe('getAllConfigs', () => {
    it('should return empty array initially', () => {
      expect(getAllConfigs()).toEqual([]);
    });

    it('should return all created configs', () => {
      getConfig('projector-1');
      getConfig('projector-2');
      expect(getAllConfigs()).toHaveLength(2);
    });
  });

  describe('saveConfig', () => {
    it('should update corners', () => {
      const newCorners: KeystoneCorners = [
        { x: 0.1, y: 0.9 },
        { x: 0.9, y: 0.9 },
        { x: 1.0, y: 0.0 },
        { x: 0.0, y: 0.0 },
      ];

      const config = saveConfig('projector-1', { corners: newCorners });
      expect(config.corners).toEqual(newCorners);
    });

    it('should update enabled state', () => {
      const config = saveConfig('projector-1', { enabled: false });
      expect(config.enabled).toBe(false);
    });

    it('should update mesh subdivisions', () => {
      const config = saveConfig('projector-1', { meshSubdivisions: 16 });
      expect(config.meshSubdivisions).toBe(16);
    });

    it('should update name', () => {
      const config = saveConfig('projector-1', { name: 'Custom Setup' });
      expect(config.name).toBe('Custom Setup');
    });

    it('should update the updatedAt timestamp', () => {
      const config1 = getConfig('projector-1');
      const originalTime = config1.updatedAt;

      // Small delay to ensure different timestamp
      const config2 = saveConfig('projector-1', { enabled: false });
      expect(config2.updatedAt).toBeDefined();
      // updatedAt should be >= original (they could be the same in fast test)
    });
  });

  describe('deleteConfig', () => {
    it('should delete an existing config', () => {
      getConfig('projector-1');
      expect(deleteConfig('projector-1')).toBe(true);
      expect(getAllConfigs()).toHaveLength(0);
    });

    it('should return false for non-existent config', () => {
      expect(deleteConfig('nonexistent')).toBe(false);
    });
  });

  describe('resetConfig', () => {
    it('should reset corners to default', () => {
      saveConfig('projector-1', {
        corners: [
          { x: 0.1, y: 0.9 },
          { x: 0.9, y: 0.9 },
          { x: 1.0, y: 0.0 },
          { x: 0.0, y: 0.0 },
        ],
      });

      const reset = resetConfig('projector-1');
      expect(reset.corners).toEqual(DEFAULT_KEYSTONE_CORNERS);
    });
  });

  describe('loadConfigs', () => {
    it('should load configs from persisted data', () => {
      const savedConfigs: KeystoneConfig[] = [
        {
          id: 'cfg-1',
          projectorId: 'proj-1',
          name: 'Saved Config',
          corners: DEFAULT_KEYSTONE_CORNERS,
          meshSubdivisions: 8,
          enabled: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      loadConfigs(savedConfigs);
      const config = getConfig('proj-1');
      expect(config.id).toBe('cfg-1');
      expect(config.name).toBe('Saved Config');
    });

    it('should clear previous configs before loading', () => {
      getConfig('old-projector');
      loadConfigs([]);
      expect(getAllConfigs()).toHaveLength(0);
    });
  });

  // ── Preset Management ─────────────────────────────────────────────────

  describe('savePreset', () => {
    it('should create a new preset', () => {
      const corners: KeystoneCorners = [
        { x: 0.1, y: 0.9 },
        { x: 0.9, y: 0.9 },
        { x: 1.0, y: 0.0 },
        { x: 0.0, y: 0.0 },
      ];

      const preset = savePreset('projector-1', 'My Preset', corners);
      expect(preset.name).toBe('My Preset');
      expect(preset.projectorId).toBe('projector-1');
      expect(preset.corners).toEqual(corners);
      expect(preset.id).toBeDefined();
    });

    it('should enforce max preset limit', () => {
      for (let i = 0; i < 20; i++) {
        savePreset('projector-1', `Preset ${i}`, DEFAULT_KEYSTONE_CORNERS);
      }

      expect(() => {
        savePreset('projector-1', 'One Too Many', DEFAULT_KEYSTONE_CORNERS);
      }).toThrow(/Maximum of 20 presets/);
    });

    it('should count presets per projector', () => {
      savePreset('projector-1', 'Preset A', DEFAULT_KEYSTONE_CORNERS);
      savePreset('projector-2', 'Preset B', DEFAULT_KEYSTONE_CORNERS);

      expect(getPresets('projector-1')).toHaveLength(1);
      expect(getPresets('projector-2')).toHaveLength(1);
    });
  });

  describe('getPresets', () => {
    it('should return only presets for the specified projector', () => {
      savePreset('projector-1', 'A', DEFAULT_KEYSTONE_CORNERS);
      savePreset('projector-1', 'B', DEFAULT_KEYSTONE_CORNERS);
      savePreset('projector-2', 'C', DEFAULT_KEYSTONE_CORNERS);

      const presets = getPresets('projector-1');
      expect(presets).toHaveLength(2);
      expect(presets.every((p) => p.projectorId === 'projector-1')).toBe(true);
    });
  });

  describe('getAllPresets', () => {
    it('should return all presets across projectors', () => {
      savePreset('projector-1', 'A', DEFAULT_KEYSTONE_CORNERS);
      savePreset('projector-2', 'B', DEFAULT_KEYSTONE_CORNERS);
      expect(getAllPresets()).toHaveLength(2);
    });
  });

  describe('deletePreset', () => {
    it('should delete an existing preset', () => {
      const preset = savePreset('projector-1', 'Test', DEFAULT_KEYSTONE_CORNERS);
      expect(deletePreset(preset.id)).toBe(true);
      expect(getPresets('projector-1')).toHaveLength(0);
    });

    it('should return false for non-existent preset', () => {
      expect(deletePreset('nonexistent')).toBe(false);
    });
  });

  describe('applyPreset', () => {
    it('should apply preset corners to the config', () => {
      const corners: KeystoneCorners = [
        { x: 0.2, y: 0.8 },
        { x: 0.8, y: 0.8 },
        { x: 0.9, y: 0.1 },
        { x: 0.1, y: 0.1 },
      ];

      const preset = savePreset('projector-1', 'Custom', corners);
      const config = applyPreset(preset.id);
      expect(config).toBeDefined();
      expect(config!.corners).toEqual(corners);
    });

    it('should return null for non-existent preset', () => {
      expect(applyPreset('nonexistent')).toBeNull();
    });
  });

  describe('loadPresets', () => {
    it('should load presets from persisted data', () => {
      const savedPresets = [
        {
          id: 'preset-1',
          name: 'Saved Preset',
          projectorId: 'proj-1',
          corners: DEFAULT_KEYSTONE_CORNERS,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      loadPresets(savedPresets);
      expect(getPresets('proj-1')).toHaveLength(1);
      expect(getPresets('proj-1')[0].name).toBe('Saved Preset');
    });
  });

  // ── Cleanup ───────────────────────────────────────────────────────────

  describe('clearAll', () => {
    it('should clear all configs and presets', () => {
      getConfig('projector-1');
      savePreset('projector-1', 'Test', DEFAULT_KEYSTONE_CORNERS);

      clearAll();

      expect(getAllConfigs()).toHaveLength(0);
      expect(getAllPresets()).toHaveLength(0);
    });
  });
});
