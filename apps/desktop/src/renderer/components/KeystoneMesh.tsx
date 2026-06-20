/**
 * KeystoneMesh — Deformable Three.js mesh for keystone correction.
 *
 * Uses a subdivided PlaneGeometry whose vertices are deformed
 * according to the 4 keystone corner positions using bilinear interpolation.
 * UV coordinates are preserved for correct texture mapping.
 *
 * The mesh updates in real-time when corners change (useFrame-driven).
 */

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { KeystoneCorners } from '../../shared/types';
import { DEFAULT_KEYSTONE_CORNERS } from '../../shared/types';
import { computeDeformedMesh, isIdentityKeystone } from '../../services/keystone-engine';
import { KEYSTONE_DEFAULT_SUBDIVISIONS } from '../../shared/constants';

interface KeystoneMeshProps {
  corners: KeystoneCorners;
  subdivisions?: number;
  width?: number;
  height?: number;
  enabled?: boolean;
  /** The colour of the surface background */
  surfaceColor?: string;
  /** Surface opacity */
  opacity?: number;
  /** Whether to show the wireframe border */
  showBorder?: boolean;
  /** Border colour */
  borderColor?: string;
  children?: React.ReactNode;
}

export const KeystoneMesh: React.FC<KeystoneMeshProps> = ({
  corners,
  subdivisions = KEYSTONE_DEFAULT_SUBDIVISIONS,
  width = 8,
  height = 4.5,
  enabled = true,
  surfaceColor = '#111827',
  opacity = 0.8,
  showBorder = true,
  borderColor = '#6366f1',
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.LineSegments>(null);

  // Determine which corners to use
  const activeCorners = enabled ? corners : DEFAULT_KEYSTONE_CORNERS;

  // Compute deformed mesh data
  const meshData = useMemo(() => {
    return computeDeformedMesh(activeCorners, subdivisions, width, height);
  }, [activeCorners, subdivisions, width, height]);

  // Build the geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(meshData.positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(meshData.uvs, 2));
    geo.setIndex(new THREE.BufferAttribute(meshData.indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, [meshData]);

  // Build wireframe for border
  const wireframeGeometry = useMemo(() => {
    if (!showBorder) return null;

    // Create border from the outer edges of the deformed mesh
    const segs = Math.max(1, Math.floor(subdivisions));
    const points: THREE.Vector3[] = [];

    // Bottom edge (v=0)
    for (let xi = 0; xi <= segs; xi++) {
      const idx = xi;
      points.push(new THREE.Vector3(
        meshData.positions[idx * 3],
        meshData.positions[idx * 3 + 1],
        0.001,
      ));
    }
    // Right edge (u=1)
    for (let yi = 1; yi <= segs; yi++) {
      const idx = yi * (segs + 1) + segs;
      points.push(new THREE.Vector3(
        meshData.positions[idx * 3],
        meshData.positions[idx * 3 + 1],
        0.001,
      ));
    }
    // Top edge (v=1) reversed
    for (let xi = segs - 1; xi >= 0; xi--) {
      const idx = segs * (segs + 1) + xi;
      points.push(new THREE.Vector3(
        meshData.positions[idx * 3],
        meshData.positions[idx * 3 + 1],
        0.001,
      ));
    }
    // Left edge (u=0) reversed
    for (let yi = segs - 1; yi >= 1; yi--) {
      const idx = yi * (segs + 1);
      points.push(new THREE.Vector3(
        meshData.positions[idx * 3],
        meshData.positions[idx * 3 + 1],
        0.001,
      ));
    }
    // Close the loop
    points.push(points[0].clone());

    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    return lineGeo;
  }, [meshData, showBorder, subdivisions]);

  // Cleanup geometries
  useEffect(() => {
    return () => {
      geometry.dispose();
      wireframeGeometry?.dispose();
    };
  }, [geometry, wireframeGeometry]);

  const isIdentity = isIdentityKeystone(activeCorners);

  return (
    <group position={[0, 0, -0.01]}>
      {/* Main deformed surface */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial
          color={surfaceColor}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Border wireframe */}
      {showBorder && wireframeGeometry && (
        <lineSegments ref={wireframeRef} geometry={wireframeGeometry}>
          <lineBasicMaterial
            color={isIdentity ? borderColor : '#f59e0b'}
            linewidth={1}
          />
        </lineSegments>
      )}
    </group>
  );
};
