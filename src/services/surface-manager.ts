/**
 * Surface Manager — Content-to-Projector Assignment & Synchronisation
 *
 * Manages the relationship between projection surfaces and projector outputs.
 * Each projector can render one or more surfaces, and surfaces can be
 * re-assigned between projectors at runtime.
 *
 * Synchronisation:
 * - Uses a shared clock for frame-accurate sync across projectors
 * - Broadcasts state changes to all active projector windows
 */

import type {
  SurfaceAssignment,
  ProjectionSurface,
  TextOverlay,
} from '../shared/types';

// ─── Surface Registry ───────────────────────────────────────────────────────

/** All known projection surfaces */
let _surfaces: Map<string, ProjectionSurface> = new Map();

/** All text overlays */
let _overlays: Map<string, TextOverlay> = new Map();

/** Surface → Projector assignments */
let _assignments: Map<string, SurfaceAssignment> = new Map();

/** Sync clock — monotonic frame counter */
let _syncFrame = 0;
let _syncTimestamp = 0;

// ─── Surface CRUD ───────────────────────────────────────────────────────────

export function registerSurface(surface: ProjectionSurface): void {
  _surfaces.set(surface.id, surface);
}

export function unregisterSurface(surfaceId: string): void {
  _surfaces.delete(surfaceId);
  // Remove any assignments for this surface
  for (const [key, assignment] of _assignments) {
    if (assignment.surfaceId === surfaceId) {
      _assignments.delete(key);
    }
  }
}

export function getSurface(id: string): ProjectionSurface | undefined {
  return _surfaces.get(id);
}

export function getAllSurfaces(): ProjectionSurface[] {
  return Array.from(_surfaces.values());
}

// ─── Overlay CRUD ───────────────────────────────────────────────────────────

export function registerOverlay(overlay: TextOverlay): void {
  _overlays.set(overlay.id, overlay);
}

export function unregisterOverlay(overlayId: string): void {
  _overlays.delete(overlayId);
}

export function getOverlaysForSurface(surfaceId: string): TextOverlay[] {
  return Array.from(_overlays.values()).filter(
    (o) => o.surfaceId === surfaceId,
  );
}

// ─── Assignments ────────────────────────────────────────────────────────────

/**
 * Assign a surface to a projector.
 * Each surface can only be assigned to one projector at a time.
 */
export function assignSurfaceToProjector(
  surfaceId: string,
  projectorId: string,
  layer: number = 0,
): SurfaceAssignment {
  const assignment: SurfaceAssignment = {
    projectorId,
    surfaceId,
    layer,
  };
  // Key by surfaceId since each surface → one projector
  _assignments.set(surfaceId, assignment);
  return assignment;
}

/**
 * Remove a surface assignment.
 */
export function unassignSurface(surfaceId: string): boolean {
  return _assignments.delete(surfaceId);
}

/**
 * Get all surface assignments for a specific projector.
 * Returns surfaces sorted by layer (ascending).
 */
export function getAssignmentsForProjector(
  projectorId: string,
): SurfaceAssignment[] {
  const assignments: SurfaceAssignment[] = [];
  for (const assignment of _assignments.values()) {
    if (assignment.projectorId === projectorId) {
      assignments.push(assignment);
    }
  }
  return assignments.sort((a, b) => a.layer - b.layer);
}

/**
 * Get the full render data for a projector (surfaces + overlays).
 */
export function getRenderDataForProjector(projectorId: string): {
  surfaces: ProjectionSurface[];
  overlays: TextOverlay[];
  syncFrame: number;
  syncTimestamp: number;
} {
  const assignments = getAssignmentsForProjector(projectorId);
  const surfaces: ProjectionSurface[] = [];
  const overlays: TextOverlay[] = [];

  for (const assignment of assignments) {
    const surface = _surfaces.get(assignment.surfaceId);
    if (surface) {
      surfaces.push(surface);
      overlays.push(...getOverlaysForSurface(surface.id));
    }
  }

  return {
    surfaces,
    overlays,
    syncFrame: _syncFrame,
    syncTimestamp: _syncTimestamp,
  };
}

// ─── Synchronisation ────────────────────────────────────────────────────────

/**
 * Advance the sync clock.
 * Called from the main render loop to keep all projectors in sync.
 */
export function advanceSyncClock(): { frame: number; timestamp: number } {
  _syncFrame++;
  _syncTimestamp = Date.now();
  return { frame: _syncFrame, timestamp: _syncTimestamp };
}

/**
 * Get current sync state.
 */
export function getSyncState(): { frame: number; timestamp: number } {
  return { frame: _syncFrame, timestamp: _syncTimestamp };
}

/**
 * Reset the sync clock.
 */
export function resetSyncClock(): void {
  _syncFrame = 0;
  _syncTimestamp = 0;
}

// ─── Cleanup ────────────────────────────────────────────────────────────────

export function clearAll(): void {
  _surfaces.clear();
  _overlays.clear();
  _assignments.clear();
  resetSyncClock();
}
