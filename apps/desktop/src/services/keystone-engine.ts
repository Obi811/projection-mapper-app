/**
 * Keystone Engine — 4-point perspective correction algorithms.
 *
 * Provides:
 * - Perspective transformation matrix computation from 4 corner points
 * - Mesh vertex deformation for Three.js PlaneGeometry
 * - UV coordinate mapping for texture-correct rendering
 * - Bilinear interpolation for smooth mesh deformation
 *
 * The coordinate system uses normalised [0..1] range:
 * - (0, 0) = bottom-left
 * - (1, 1) = top-right
 * - Default (identity) corners form a unit rectangle
 */

import type { KeystoneCorners, Point2D, TransformMatrix4 } from '../shared/types';
import { DEFAULT_KEYSTONE_CORNERS } from '../shared/types';

// ─── Perspective Matrix Computation ──────────────────────────────────────────

/**
 * Compute a 3×3 perspective transformation matrix from 4 source points
 * to 4 destination points using the Direct Linear Transform (DLT) method.
 *
 * Source: unit square (0,0), (1,0), (1,1), (0,1)
 * Destination: the keystone corners
 *
 * Returns a 3×3 matrix as flat 9-element array (row-major).
 */
export function computePerspectiveMatrix(corners: KeystoneCorners): number[] {
  // Source: unit square corners [BL, BR, TR, TL]
  const src: Point2D[] = [
    { x: 0, y: 0 }, // bottomLeft
    { x: 1, y: 0 }, // bottomRight
    { x: 1, y: 1 }, // topRight
    { x: 0, y: 1 }, // topLeft
  ];

  // Destination: keystone corners [TL, TR, BR, BL] → remap to match src order
  const dst: Point2D[] = [
    corners[3], // bottomLeft
    corners[2], // bottomRight
    corners[1], // topRight
    corners[0], // topLeft
  ];

  return computeHomography(src, dst);
}

/**
 * Compute the 3×3 homography matrix H such that dst = H * src
 * using the DLT (Direct Linear Transform) algorithm.
 *
 * @param src 4 source points
 * @param dst 4 destination points
 * @returns 9-element flat array (row-major 3×3)
 */
function computeHomography(src: Point2D[], dst: Point2D[]): number[] {
  // Build the 8×8 system of equations: A * h = b
  // where h = [h0, h1, h2, h3, h4, h5, h6, h7] and h8 = 1
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = src[i].x;
    const sy = src[i].y;
    const dx = dst[i].x;
    const dy = dst[i].y;

    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
    b.push(dx);

    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
    b.push(dy);
  }

  const h = solveLinearSystem(A, b);

  // Return as 3×3 matrix (row-major)
  return [
    h[0], h[1], h[2],
    h[3], h[4], h[5],
    h[6], h[7], 1,
  ];
}

/**
 * Solve an 8×8 linear system using Gaussian elimination with partial pivoting.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  // Augmented matrix
  const aug: number[][] = A.map((row, i) => [...row, b[i]]);

  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxVal = Math.abs(aug[col][col]);
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > maxVal) {
        maxVal = Math.abs(aug[row][col]);
        maxRow = row;
      }
    }

    // Swap rows
    if (maxRow !== col) {
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    }

    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) {
      // Degenerate case — return identity-like result
      return [1, 0, 0, 0, 1, 0, 0, 0];
    }

    // Eliminate below
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / pivot;
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = aug[row][n];
    for (let col = row + 1; col < n; col++) {
      sum -= aug[row][col] * x[col];
    }
    x[row] = sum / aug[row][row];
  }

  return x;
}

// ─── Transform Point ─────────────────────────────────────────────────────────

/**
 * Apply a 3×3 perspective transform to a 2D point.
 *
 * @param matrix 9-element flat 3×3 matrix (row-major)
 * @param point Input 2D point (normalised 0..1)
 * @returns Transformed 2D point
 */
export function transformPoint(matrix: number[], point: Point2D): Point2D {
  const w = matrix[6] * point.x + matrix[7] * point.y + matrix[8];
  if (Math.abs(w) < 1e-12) return { x: point.x, y: point.y };

  return {
    x: (matrix[0] * point.x + matrix[1] * point.y + matrix[2]) / w,
    y: (matrix[3] * point.x + matrix[4] * point.y + matrix[5]) / w,
  };
}

// ─── Mesh Deformation ────────────────────────────────────────────────────────

/**
 * Compute deformed vertex positions for a subdivided plane mesh.
 *
 * Given keystone corners and a subdivision count, returns arrays of
 * positions and UV coordinates suitable for Three.js BufferGeometry.
 *
 * @param corners Keystone corners [TL, TR, BR, BL] in scene-space coords
 * @param subdivisions Number of segments along each axis
 * @param width Scene-space width of the plane (default 8)
 * @param height Scene-space height of the plane (default 4.5)
 * @returns { positions: Float32Array, uvs: Float32Array, indices: Uint16Array }
 */
export function computeDeformedMesh(
  corners: KeystoneCorners,
  subdivisions: number,
  width: number = 8,
  height: number = 4.5,
): {
  positions: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array;
} {
  const segs = Math.max(1, Math.floor(subdivisions));
  const vertCount = (segs + 1) * (segs + 1);
  const positions = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);

  // Corner positions in scene-space (centred at origin)
  // corners: [TL, TR, BR, BL] in normalised [0..1]
  // Map to scene-space: x ∈ [-w/2, w/2], y ∈ [-h/2, h/2]
  const tl = { x: (corners[0].x - 0.5) * width, y: (corners[0].y - 0.5) * height };
  const tr = { x: (corners[1].x - 0.5) * width, y: (corners[1].y - 0.5) * height };
  const br = { x: (corners[2].x - 0.5) * width, y: (corners[2].y - 0.5) * height };
  const bl = { x: (corners[3].x - 0.5) * width, y: (corners[3].y - 0.5) * height };

  for (let yi = 0; yi <= segs; yi++) {
    const v = yi / segs; // 0 = bottom, 1 = top
    for (let xi = 0; xi <= segs; xi++) {
      const u = xi / segs; // 0 = left, 1 = right
      const idx = yi * (segs + 1) + xi;

      // Bilinear interpolation of corner positions
      const x = bilinearInterp(bl.x, br.x, tl.x, tr.x, u, v);
      const y = bilinearInterp(bl.y, br.y, tl.y, tr.y, u, v);

      positions[idx * 3 + 0] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = 0;

      uvs[idx * 2 + 0] = u;
      uvs[idx * 2 + 1] = v;
    }
  }

  // Triangle indices
  const faceCount = segs * segs * 2;
  const indices = new Uint16Array(faceCount * 3);
  let indexOffset = 0;

  for (let yi = 0; yi < segs; yi++) {
    for (let xi = 0; xi < segs; xi++) {
      const a = yi * (segs + 1) + xi;
      const b = a + 1;
      const c = a + (segs + 1);
      const d = c + 1;

      // Two triangles per quad
      indices[indexOffset++] = a;
      indices[indexOffset++] = b;
      indices[indexOffset++] = d;

      indices[indexOffset++] = a;
      indices[indexOffset++] = d;
      indices[indexOffset++] = c;
    }
  }

  return { positions, uvs, indices };
}

/**
 * Bilinear interpolation between 4 values at corners of a unit square.
 *
 * @param bl Bottom-left value
 * @param br Bottom-right value
 * @param tl Top-left value
 * @param tr Top-right value
 * @param u Horizontal parameter [0..1]
 * @param v Vertical parameter [0..1]
 */
function bilinearInterp(
  bl: number, br: number, tl: number, tr: number,
  u: number, v: number,
): number {
  const bottom = bl * (1 - u) + br * u;
  const top = tl * (1 - u) + tr * u;
  return bottom * (1 - v) + top * v;
}

// ─── 4×4 Matrix for Three.js ─────────────────────────────────────────────────

/**
 * Convert a 3×3 perspective matrix to a Three.js-compatible 4×4 matrix.
 * The Z dimension is passed through unchanged.
 *
 * @param m3 9-element 3×3 matrix (row-major)
 * @returns 16-element 4×4 matrix (column-major, Three.js format)
 */
export function toMatrix4(m3: number[]): TransformMatrix4 {
  // Three.js uses column-major ordering
  return [
    m3[0], m3[3], 0, m3[6],
    m3[1], m3[4], 0, m3[7],
    0,     0,     1, 0,
    m3[2], m3[5], 0, m3[8],
  ] as TransformMatrix4;
}

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Check if corners are equal to default (identity) corners.
 */
export function isIdentityKeystone(corners: KeystoneCorners): boolean {
  for (let i = 0; i < 4; i++) {
    if (
      Math.abs(corners[i].x - DEFAULT_KEYSTONE_CORNERS[i].x) > 1e-6 ||
      Math.abs(corners[i].y - DEFAULT_KEYSTONE_CORNERS[i].y) > 1e-6
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Clamp a corner point to valid range [0..1].
 */
export function clampCorner(point: Point2D): Point2D {
  return {
    x: Math.max(0, Math.min(1, point.x)),
    y: Math.max(0, Math.min(1, point.y)),
  };
}

/**
 * Snap a point to the nearest grid position if snap-to-grid is enabled.
 *
 * @param point Input point
 * @param gridSize Grid cell size (e.g. 0.05 for 5% grid)
 * @returns Snapped point
 */
export function snapToGrid(point: Point2D, gridSize: number): Point2D {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

/**
 * Calculate the area of the quadrilateral defined by keystone corners.
 * Uses the Shoelace formula. Useful for detecting degenerate configurations.
 *
 * @returns Area in normalised units (1.0 = full unit square)
 */
export function computeQuadArea(corners: KeystoneCorners): number {
  const [tl, tr, br, bl] = corners;
  // Shoelace formula for the quadrilateral
  const area = 0.5 * Math.abs(
    (tl.x * tr.y - tr.x * tl.y) +
    (tr.x * br.y - br.x * tr.y) +
    (br.x * bl.y - bl.x * br.y) +
    (bl.x * tl.y - tl.x * bl.y)
  );
  return area;
}

/**
 * Validate that corners form a valid (non-degenerate, non-self-intersecting)
 * quadrilateral. Returns true if valid.
 */
export function validateCorners(corners: KeystoneCorners): boolean {
  // Check all corners are within [0..1]
  for (const c of corners) {
    if (c.x < -0.1 || c.x > 1.1 || c.y < -0.1 || c.y > 1.1) {
      return false;
    }
  }
  // Check area is not degenerate (at least 1% of unit square)
  const area = computeQuadArea(corners);
  if (area < 0.01) return false;
  return true;
}
