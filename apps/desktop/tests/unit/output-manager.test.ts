/**
 * Unit Tests — Output Manager Service
 *
 * Tests configuration CRUD, state management, and display enumeration
 * for the multi-projector output management system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadConfigs,
  getConfigs,
  getConfig,
  saveConfig,
  deleteConfig,
  getStates,
  getState,
  updateState,
  assignSurfaces,
  clearAll,
  getActiveCount,
} from '../../src/services/output-manager';
import type { ProjectorConfig } from '../../src/shared/types';

// Mock electron module since tests run in Node, not Electron
vi.mock('electron', () => ({
  screen: {
    getAllDisplays: () => [
      {
        id: 1,
        label: 'Built-in Display',
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        workArea: { x: 0, y: 0, width: 1920, height: 1040 },
        scaleFactor: 2,
        internal: true,
      },
      {
        id: 2,
        label: 'External Monitor',
        bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
        workArea: { x: 1920, y: 0, width: 2560, height: 1440 },
        scaleFactor: 1,
        internal: false,
      },
    ],
    getPrimaryDisplay: () => ({
      id: 1,
      label: 'Built-in Display',
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      workArea: { x: 0, y: 0, width: 1920, height: 1040 },
      scaleFactor: 2,
      internal: true,
    }),
  },
}));

const createTestConfig = (overrides?: Partial<ProjectorConfig>): ProjectorConfig => ({
  id: 'test-projector-1',
  name: 'Test Projector',
  displayId: 2,
  displayIndex: 1,
  resolution: { width: 1920, height: 1080 },
  position: { x: 1920, y: 0 },
  enabled: true,
  fullscreen: true,
  assignedSurfaces: [],
  ...overrides,
});

describe('Output Manager', () => {
  beforeEach(() => {
    clearAll();
  });

  // ─── loadConfigs ──────────────────────────────────────────────────────

  describe('loadConfigs', () => {
    it('should load an array of projector configs', () => {
      const configs = [
        createTestConfig({ id: 'proj-1', name: 'Projector 1' }),
        createTestConfig({ id: 'proj-2', name: 'Projector 2' }),
      ];

      loadConfigs(configs);

      expect(getConfigs()).toHaveLength(2);
      expect(getConfig('proj-1')?.name).toBe('Projector 1');
      expect(getConfig('proj-2')?.name).toBe('Projector 2');
    });

    it('should create idle states for each loaded config', () => {
      loadConfigs([createTestConfig({ id: 'proj-1' })]);

      const states = getStates();
      expect(states).toHaveLength(1);
      expect(states[0].status).toBe('idle');
    });

    it('should clear previous configs on load', () => {
      loadConfigs([createTestConfig({ id: 'proj-1' })]);
      loadConfigs([createTestConfig({ id: 'proj-new' })]);

      expect(getConfigs()).toHaveLength(1);
      expect(getConfig('proj-1')).toBeUndefined();
      expect(getConfig('proj-new')).toBeDefined();
    });
  });

  // ─── saveConfig ───────────────────────────────────────────────────────

  describe('saveConfig', () => {
    it('should create a new projector config with generated ID', () => {
      const config = saveConfig({
        displayId: 2,
        name: 'New Projector',
      });

      expect(config.id).toBeDefined();
      expect(config.name).toBe('New Projector');
      expect(config.displayId).toBe(2);
      expect(config.enabled).toBe(true);
      expect(config.fullscreen).toBe(true);
    });

    it('should update an existing projector config', () => {
      const original = saveConfig({
        displayId: 2,
        name: 'Original',
      });

      const updated = saveConfig({
        id: original.id,
        displayId: 2,
        name: 'Updated',
        fullscreen: false,
      });

      expect(updated.id).toBe(original.id);
      expect(updated.name).toBe('Updated');
      expect(updated.fullscreen).toBe(false);
      expect(getConfigs()).toHaveLength(1);
    });

    it('should throw when max projectors exceeded', () => {
      // Add 16 projectors
      for (let i = 0; i < 16; i++) {
        saveConfig({
          displayId: i,
          name: `Projector ${i}`,
        });
      }

      expect(() =>
        saveConfig({ displayId: 17, name: 'One too many' }),
      ).toThrow('Maximum number of projectors (16) reached');
    });

    it('should create corresponding runtime state on save', () => {
      const config = saveConfig({
        displayId: 2,
        name: 'Test',
      });

      const state = getState(config.id);
      expect(state).toBeDefined();
      expect(state?.status).toBe('idle');
      expect(state?.name).toBe('Test');
    });
  });

  // ─── deleteConfig ─────────────────────────────────────────────────────

  describe('deleteConfig', () => {
    it('should delete an existing config', () => {
      const config = saveConfig({ displayId: 2, name: 'To Delete' });

      expect(deleteConfig(config.id)).toBe(true);
      expect(getConfig(config.id)).toBeUndefined();
      expect(getState(config.id)).toBeUndefined();
    });

    it('should return false for non-existent config', () => {
      expect(deleteConfig('non-existent')).toBe(false);
    });
  });

  // ─── State Management ─────────────────────────────────────────────────

  describe('state management', () => {
    it('should update projector state', () => {
      const config = saveConfig({ displayId: 2, name: 'Test' });

      updateState(config.id, { status: 'active', windowId: 42, fps: 60 });

      const state = getState(config.id);
      expect(state?.status).toBe('active');
      expect(state?.windowId).toBe(42);
      expect(state?.fps).toBe(60);
    });

    it('should return undefined for non-existent state update', () => {
      const result = updateState('non-existent', { status: 'active' });
      expect(result).toBeUndefined();
    });

    it('should count active projectors', () => {
      saveConfig({ displayId: 1, name: 'P1' });
      const p2 = saveConfig({ displayId: 2, name: 'P2' });
      const p3 = saveConfig({ displayId: 3, name: 'P3' });

      updateState(p2.id, { status: 'active' });
      updateState(p3.id, { status: 'active' });

      expect(getActiveCount()).toBe(2);
    });
  });

  // ─── Surface Assignment ───────────────────────────────────────────────

  describe('assignSurfaces', () => {
    it('should assign surfaces to a projector', () => {
      const config = saveConfig({ displayId: 2, name: 'Test' });

      const result = assignSurfaces(config.id, ['surface-1', 'surface-2']);

      expect(result).toBeDefined();
      expect(result?.assignedSurfaces).toEqual(['surface-1', 'surface-2']);
    });

    it('should update state with surface assignments', () => {
      const config = saveConfig({ displayId: 2, name: 'Test' });

      assignSurfaces(config.id, ['surface-1']);

      const state = getState(config.id);
      expect(state?.assignedSurfaces).toEqual(['surface-1']);
    });

    it('should return undefined for non-existent projector', () => {
      const result = assignSurfaces('non-existent', ['surface-1']);
      expect(result).toBeUndefined();
    });
  });

  // ─── clearAll ─────────────────────────────────────────────────────────

  describe('clearAll', () => {
    it('should remove all configs and states', () => {
      saveConfig({ displayId: 1, name: 'P1' });
      saveConfig({ displayId: 2, name: 'P2' });

      clearAll();

      expect(getConfigs()).toHaveLength(0);
      expect(getStates()).toHaveLength(0);
    });
  });
});
