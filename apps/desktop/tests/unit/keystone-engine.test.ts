/**
 * Unit tests for the Keystone Engine algorithms.
 *
 * Covers:
 * - Perspective matrix computation
 * - Point transformation
 * - Mesh deformation
 * - Utility functions (identity check, clamping, snap, area, validation)
 */

import { describe, it, expect } from 'vitest';
import {
  computePerspectiveMatrix,
  transformPoint,
  computeDeformedMesh,
  toMatrix4,
  isIdentityKeystone,
  clampCorner,
  snapToGrid,
  computeQuadArea,
  validateCorners,
} from '../../src/services/keystone-engine';
import { DEFAULT_KEYSTONE_CORNERS } from '../../src/shared/types';
import type { KeystoneCorners, Point2D } from '../../src/shared/types';

// ─── Helper ──────────────────────────────────────────────────────────────────

function approxEqual(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) < eps;
}

function approxPoint(a: Point2D, b: Point2D, eps = 1e-4): boolean {
  return approxEqual(a.x, b.x, eps) && approxEqual(a.y, b.y, eps);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Keystone Engine', () => {
  // ── Perspective Matrix ────────────────────────────────────────────────

  describe('computePerspectiveMatrix', () => {
    it('should return identity-like matrix for default corners', () => {
      const matrix = computePerspectiveMatrix(DEFAULT_KEYSTONE_CORNERS);
      // Applying the matrix to unit square corners should return the same corners
      const bl = transformPoint(matrix, { x: 0, y: 0 });
      const br = transformPoint(matrix, { x: 1, y: 0 });
      const tr = transformPoint(matrix, { x: 1, y: 1 });
      const tl = transformPoint(matrix, { x: 0, y: 1 });

      expect(approxPoint(bl, { x: 0, y: 0 })).toBe(true);
      expect(approxPoint(br, { x: 1, y: 0 })).toBe(true);
      expect(approxPoint(tr, { x: 1, y: 1 })).toBe(true);
      expect(approxPoint(tl, { x: 0, y: 1 })).toBe(true);
    });

    it('should compute correct matrix for shifted corners', () => {
      const corners: KeystoneCorners = [
        { x: 0.1, y: 0.9 },   // topLeft shifted inward
        { x: 0.9, y: 0.9 },   // topRight shifted inward
        { x: 1.0, y: 0.0 },   // bottomRight stays
        { x: 0.0, y: 0.0 },   // bottomLeft stays
      ];

      const matrix = computePerspectiveMatrix(corners);
      // Corner mapping: src(0,1)→dst(0.1,0.9), src(1,1)→dst(0.9,0.9)
      const mappedTL = transformPoint(matrix, { x: 0, y: 1 });
      const mappedTR = transformPoint(matrix, { x: 1, y: 1 });
      const mappedBL = transformPoint(matrix, { x: 0, y: 0 });
      const mappedBR = transformPoint(matrix, { x: 1, y: 0 });

      expect(approxPoint(mappedTL, { x: 0.1, y: 0.9 }, 0.01)).toBe(true);
      expect(approxPoint(mappedTR, { x: 0.9, y: 0.9 }, 0.01)).toBe(true);
      expect(approxPoint(mappedBL, { x: 0.0, y: 0.0 }, 0.01)).toBe(true);
      expect(approxPoint(mappedBR, { x: 1.0, y: 0.0 }, 0.01)).toBe(true);
    });

    it('should return valid matrix (9 elements)', () => {
      const matrix = computePerspectiveMatrix(DEFAULT_KEYSTONE_CORNERS);
      expect(matrix).toHaveLength(9);
      expect(matrix.every((v) => isFinite(v))).toBe(true);
    });
  });

  // ── Transform Point ───────────────────────────────────────────────────

  describe('transformPoint', () => {
    it('should transform origin correctly with identity matrix', () => {
      const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      const result = transformPoint(identity, { x: 0.5, y: 0.5 });
      expect(approxPoint(result, { x: 0.5, y: 0.5 })).toBe(true);
    });

    it('should handle scaling matrix', () => {
      const scale2x = [2, 0, 0, 0, 2, 0, 0, 0, 1];
      const result = transformPoint(scale2x, { x: 0.5, y: 0.5 });
      expect(approxPoint(result, { x: 1.0, y: 1.0 })).toBe(true);
    });

    it('should handle translation matrix', () => {
      const translate = [1, 0, 0.1, 0, 1, 0.2, 0, 0, 1];
      const result = transformPoint(translate, { x: 0, y: 0 });
      expect(approxPoint(result, { x: 0.1, y: 0.2 })).toBe(true);
    });
  });

  // ── Mesh Deformation ──────────────────────────────────────────────────

  describe('computeDeformedMesh', () => {
    it('should generate correct vertex count for given subdivisions', () => {
      const result = computeDeformedMesh(DEFAULT_KEYSTONE_CORNERS, 4);
      const expectedVerts = (4 + 1) * (4 + 1); // 25
      expect(result.positions.length).toBe(expectedVerts * 3);
      expect(result.uvs.length).toBe(expectedVerts * 2);
    });

    it('should generate correct index count', () => {
      const result = computeDeformedMesh(DEFAULT_KEYSTONE_CORNERS, 4);
      const expectedTriangles = 4 * 4 * 2;
      expect(result.indices.length).toBe(expectedTriangles * 3);
    });

    it('should produce centred geometry for default corners', () => {
      const result = computeDeformedMesh(DEFAULT_KEYSTONE_CORNERS, 2, 8, 4.5);

      // Corner vertices should be at ±4, ±2.25
      // Bottom-left (first vertex): should be at (-4, -2.25, 0)
      expect(approxEqual(result.positions[0], -4, 0.01)).toBe(true);
      expect(approxEqual(result.positions[1], -2.25, 0.01)).toBe(true);
      expect(approxEqual(result.positions[2], 0)).toBe(true);
    });

    it('should handle minimum subdivisions (1)', () => {
      const result = computeDeformedMesh(DEFAULT_KEYSTONE_CORNERS, 1);
      expect(result.positions.length).toBe(4 * 3); // 2x2 = 4 vertices
      expect(result.indices.length).toBe(2 * 3); // 2 triangles
    });

    it('should deform mesh when corners are adjusted', () => {
      const shifted: KeystoneCorners = [
        { x: 0.1, y: 0.9 },
        { x: 0.9, y: 0.9 },
        { x: 1.0, y: 0.0 },
        { x: 0.0, y: 0.0 },
      ];

      const defaultMesh = computeDeformedMesh(DEFAULT_KEYSTONE_CORNERS, 2, 8, 4.5);
      const shiftedMesh = computeDeformedMesh(shifted, 2, 8, 4.5);

      // Top-left corner should be different
      const segs = 2;
      const tlIdx = segs * (segs + 1); // First vertex in top row
      expect(shiftedMesh.positions[tlIdx * 3]).not.toEqual(
        defaultMesh.positions[tlIdx * 3],
      );
    });

    it('should preserve UV coordinates [0..1] range', () => {
      const result = computeDeformedMesh(DEFAULT_KEYSTONE_CORNERS, 4);
      for (let i = 0; i < result.uvs.length; i++) {
        expect(result.uvs[i]).toBeGreaterThanOrEqual(0);
        expect(result.uvs[i]).toBeLessThanOrEqual(1);
      }
    });
  });

  // ── toMatrix4 ─────────────────────────────────────────────────────────

  describe('toMatrix4', () => {
    it('should produce 16-element matrix', () => {
      const m3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      const m4 = toMatrix4(m3);
      expect(m4).toHaveLength(16);
    });

    it('should correctly convert identity 3x3 to 4x4', () => {
      const m3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      const m4 = toMatrix4(m3);
      // Check diagonal elements (Three.js column-major)
      expect(m4[0]).toBe(1);  // m00
      expect(m4[5]).toBe(1);  // m11
      expect(m4[10]).toBe(1); // m22 (z pass-through)
      expect(m4[15]).toBe(1); // m33
    });
  });

  // ── Utility Functions ─────────────────────────────────────────────────

  describe('isIdentityKeystone', () => {
    it('should return true for default corners', () => {
      expect(isIdentityKeystone(DEFAULT_KEYSTONE_CORNERS)).toBe(true);
    });

    it('should return false for modified corners', () => {
      const modified: KeystoneCorners = [
        { x: 0.1, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 0 },
        { x: 0, y: 0 },
      ];
      expect(isIdentityKeystone(modified)).toBe(false);
    });

    it('should return true for near-identity corners (within tolerance)', () => {
      const nearIdentity: KeystoneCorners = [
        { x: 0.0000001, y: 1.0000001 },
        { x: 1, y: 1 },
        { x: 1, y: 0 },
        { x: 0, y: 0 },
      ];
      expect(isIdentityKeystone(nearIdentity)).toBe(true);
    });
  });

  describe('clampCorner', () => {
    it('should clamp values to [0..1]', () => {
      expect(clampCorner({ x: -0.5, y: 1.5 })).toEqual({ x: 0, y: 1 });
    });

    it('should pass through valid values', () => {
      expect(clampCorner({ x: 0.5, y: 0.5 })).toEqual({ x: 0.5, y: 0.5 });
    });

    it('should handle boundary values', () => {
      expect(clampCorner({ x: 0, y: 1 })).toEqual({ x: 0, y: 1 });
    });
  });

  describe('snapToGrid', () => {
    it('should snap to nearest grid position', () => {
      const snapped = snapToGrid({ x: 0.12, y: 0.38 }, 0.05);
      expect(approxEqual(snapped.x, 0.10, 0.001)).toBe(true);
      expect(approxEqual(snapped.y, 0.40, 0.001)).toBe(true);
    });

    it('should return same value if already on grid', () => {
      const snapped = snapToGrid({ x: 0.5, y: 0.25 }, 0.05);
      expect(approxEqual(snapped.x, 0.5, 0.001)).toBe(true);
      expect(approxEqual(snapped.y, 0.25, 0.001)).toBe(true);
    });
  });

  describe('computeQuadArea', () => {
    it('should return 1.0 for unit square (default corners)', () => {
      const area = computeQuadArea(DEFAULT_KEYSTONE_CORNERS);
      expect(approxEqual(area, 1.0, 0.001)).toBe(true);
    });

    it('should return smaller area for inward-shifted corners', () => {
      const small: KeystoneCorners = [
        { x: 0.2, y: 0.8 },
        { x: 0.8, y: 0.8 },
        { x: 0.8, y: 0.2 },
        { x: 0.2, y: 0.2 },
      ];
      const area = computeQuadArea(small);
      expect(area).toBeLessThan(1.0);
      expect(area).toBeGreaterThan(0);
    });

    it('should return 0 for degenerate (collapsed) corners', () => {
      const degenerate: KeystoneCorners = [
        { x: 0.5, y: 0.5 },
        { x: 0.5, y: 0.5 },
        { x: 0.5, y: 0.5 },
        { x: 0.5, y: 0.5 },
      ];
      const area = computeQuadArea(degenerate);
      expect(area).toBe(0);
    });
  });

  describe('validateCorners', () => {
    it('should accept valid default corners', () => {
      expect(validateCorners(DEFAULT_KEYSTONE_CORNERS)).toBe(true);
    });

    it('should reject degenerate corners (collapsed to single point)', () => {
      const degenerate: KeystoneCorners = [
        { x: 0.5, y: 0.5 },
        { x: 0.5, y: 0.5 },
        { x: 0.5, y: 0.5 },
        { x: 0.5, y: 0.5 },
      ];
      expect(validateCorners(degenerate)).toBe(false);
    });

    it('should reject corners far out of bounds', () => {
      const outOfBounds: KeystoneCorners = [
        { x: -0.5, y: 2.0 },
        { x: 1, y: 1 },
        { x: 1, y: 0 },
        { x: 0, y: 0 },
      ];
      expect(validateCorners(outOfBounds)).toBe(false);
    });

    it('should accept slightly shifted corners within tolerance', () => {
      const valid: KeystoneCorners = [
        { x: 0.05, y: 0.95 },
        { x: 0.95, y: 0.95 },
        { x: 1.0, y: 0.0 },
        { x: 0.0, y: 0.0 },
      ];
      expect(validateCorners(valid)).toBe(true);
    });
  });
});
