/**
 * Unit Tests — Surface Manager Service
 *
 * Tests surface registration, assignment, render data,
 * and synchronisation for multi-projector rendering.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerSurface,
  unregisterSurface,
  getSurface,
  getAllSurfaces,
  registerOverlay,
  getOverlaysForSurface,
  assignSurfaceToProjector,
  unassignSurface,
  getAssignmentsForProjector,
  getRenderDataForProjector,
  advanceSyncClock,
  getSyncState,
  resetSyncClock,
  clearAll,
} from '../../src/services/surface-manager';
import type { ProjectionSurface, TextOverlay } from '../../src/shared/types';

const createTestSurface = (id: string): ProjectionSurface => ({
  id,
  name: `Surface ${id}`,
  corners: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ],
  width: 100,
  height: 100,
  opacity: 1,
  visible: true,
});

const createTestOverlay = (id: string, surfaceId: string): TextOverlay => ({
  id,
  surfaceId,
  text: `Overlay ${id}`,
  fontSize: 24,
  fontFamily: 'Arial',
  color: '#ffffff',
  position: { x: 10, y: 10 },
  rotation: 0,
  opacity: 1,
});

describe('Surface Manager', () => {
  beforeEach(() => {
    clearAll();
  });

  // ─── Surface CRUD ───────────────────────────────────────────────────────

  describe('surface registration', () => {
    it('should register and retrieve a surface', () => {
      const surface = createTestSurface('s1');
      registerSurface(surface);

      expect(getSurface('s1')).toEqual(surface);
    });

    it('should return all registered surfaces', () => {
      registerSurface(createTestSurface('s1'));
      registerSurface(createTestSurface('s2'));

      expect(getAllSurfaces()).toHaveLength(2);
    });

    it('should unregister a surface and clean up assignments', () => {
      registerSurface(createTestSurface('s1'));
      assignSurfaceToProjector('s1', 'proj-1');

      unregisterSurface('s1');

      expect(getSurface('s1')).toBeUndefined();
      expect(getAssignmentsForProjector('proj-1')).toHaveLength(0);
    });
  });

  // ─── Overlay Management ───────────────────────────────────────────────

  describe('overlay management', () => {
    it('should register and retrieve overlays for a surface', () => {
      const overlay = createTestOverlay('o1', 's1');
      registerOverlay(overlay);

      expect(getOverlaysForSurface('s1')).toHaveLength(1);
      expect(getOverlaysForSurface('s1')[0].text).toBe('Overlay o1');
    });

    it('should filter overlays by surface ID', () => {
      registerOverlay(createTestOverlay('o1', 's1'));
      registerOverlay(createTestOverlay('o2', 's2'));
      registerOverlay(createTestOverlay('o3', 's1'));

      expect(getOverlaysForSurface('s1')).toHaveLength(2);
      expect(getOverlaysForSurface('s2')).toHaveLength(1);
    });
  });

  // ─── Assignments ──────────────────────────────────────────────────────

  describe('surface assignments', () => {
    it('should assign a surface to a projector', () => {
      const assignment = assignSurfaceToProjector('s1', 'proj-1', 0);

      expect(assignment.surfaceId).toBe('s1');
      expect(assignment.projectorId).toBe('proj-1');
      expect(assignment.layer).toBe(0);
    });

    it('should return assignments sorted by layer', () => {
      assignSurfaceToProjector('s1', 'proj-1', 2);
      assignSurfaceToProjector('s2', 'proj-1', 0);
      assignSurfaceToProjector('s3', 'proj-1', 1);

      const assignments = getAssignmentsForProjector('proj-1');
      expect(assignments.map((a) => a.layer)).toEqual([0, 1, 2]);
    });

    it('should re-assign a surface to a different projector', () => {
      assignSurfaceToProjector('s1', 'proj-1');
      assignSurfaceToProjector('s1', 'proj-2');

      expect(getAssignmentsForProjector('proj-1')).toHaveLength(0);
      expect(getAssignmentsForProjector('proj-2')).toHaveLength(1);
    });

    it('should unassign a surface', () => {
      assignSurfaceToProjector('s1', 'proj-1');

      expect(unassignSurface('s1')).toBe(true);
      expect(getAssignmentsForProjector('proj-1')).toHaveLength(0);
    });

    it('should return false when unassigning non-existent surface', () => {
      expect(unassignSurface('non-existent')).toBe(false);
    });
  });

  // ─── Render Data ──────────────────────────────────────────────────────

  describe('getRenderDataForProjector', () => {
    it('should return surfaces and overlays for a projector', () => {
      registerSurface(createTestSurface('s1'));
      registerSurface(createTestSurface('s2'));
      registerOverlay(createTestOverlay('o1', 's1'));
      registerOverlay(createTestOverlay('o2', 's1'));
      registerOverlay(createTestOverlay('o3', 's2'));

      assignSurfaceToProjector('s1', 'proj-1');
      assignSurfaceToProjector('s2', 'proj-1');

      const data = getRenderDataForProjector('proj-1');

      expect(data.surfaces).toHaveLength(2);
      expect(data.overlays).toHaveLength(3);
    });

    it('should return empty data for projector with no assignments', () => {
      const data = getRenderDataForProjector('proj-empty');

      expect(data.surfaces).toHaveLength(0);
      expect(data.overlays).toHaveLength(0);
    });

    it('should include sync frame and timestamp', () => {
      advanceSyncClock();
      const data = getRenderDataForProjector('proj-1');

      expect(data.syncFrame).toBe(1);
      expect(data.syncTimestamp).toBeGreaterThan(0);
    });
  });

  // ─── Synchronisation ─────────────────────────────────────────────────

  describe('sync clock', () => {
    it('should advance frame counter', () => {
      const state1 = advanceSyncClock();
      const state2 = advanceSyncClock();

      expect(state2.frame).toBe(state1.frame + 1);
    });

    it('should reset sync clock', () => {
      advanceSyncClock();
      advanceSyncClock();
      resetSyncClock();

      const state = getSyncState();
      expect(state.frame).toBe(0);
      expect(state.timestamp).toBe(0);
    });
  });

  // ─── clearAll ─────────────────────────────────────────────────────────

  describe('clearAll', () => {
    it('should clear all surfaces, overlays, assignments, and sync', () => {
      registerSurface(createTestSurface('s1'));
      registerOverlay(createTestOverlay('o1', 's1'));
      assignSurfaceToProjector('s1', 'proj-1');
      advanceSyncClock();

      clearAll();

      expect(getAllSurfaces()).toHaveLength(0);
      expect(getOverlaysForSurface('s1')).toHaveLength(0);
      expect(getAssignmentsForProjector('proj-1')).toHaveLength(0);
      expect(getSyncState().frame).toBe(0);
    });
  });
});
