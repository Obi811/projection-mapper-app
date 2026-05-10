/**
 * ProjectionCanvas — WebGL rendering surface using Three.js
 *
 * Renders projection content via @react-three/fiber (R3F):
 * - Orthographic camera for pixel-accurate 2D projection
 * - Text overlay using @react-three/drei's <Text> component
 * - Ambient grid for alignment reference
 *
 * Architecture notes:
 * - This component is designed to be extended with:
 *   - Multiple projection surfaces (multi_surface feature)
 *   - Keystone correction via custom shaders (keystone_correction)
 *   - Media layers (media_import, gif_support)
 *   - Audio-reactive elements (audio_sync)
 * - Performance: R3F handles the render loop efficiently;
 *   heavy content should use useMemo / useFrame wisely.
 */

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Grid, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { KeystoneCorners } from '../../shared/types';
import { DEFAULT_KEYSTONE_CORNERS } from '../../shared/types';
import { KeystoneMesh } from './KeystoneMesh';

// ─── Props ──────────────────────────────────────────────────────────────────

interface ProjectionCanvasProps {
  text: string;
  fontSize: number;
  textColor: string;
  /** Keystone correction corners */
  keystoneCorners?: KeystoneCorners;
  /** Whether keystone correction is enabled */
  keystoneEnabled?: boolean;
  /** Mesh subdivisions for keystone deformation */
  keystoneSubdivisions?: number;
}

// ─── Inner Scene Components ─────────────────────────────────────────────────

/**
 * Animated text overlay that gently pulses for visual feedback.
 * Replace with static rendering for production projection output.
 */
const TextOverlay: React.FC<{
  text: string;
  fontSize: number;
  color: string;
}> = ({ text, fontSize, color }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Subtle floating animation — shows the render loop is active
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <Text
        fontSize={fontSize / 100} // Scale down: screen px → Three.js units
        color={color}
        anchorX="center"
        anchorY="middle"
        maxWidth={8}
        textAlign="center"
        font={undefined} // Uses default font; custom fonts can be loaded here
      >
        {text}
      </Text>
    </mesh>
  );
};

/**
 * A projection surface rectangle — represents the physical projection area.
 * When keystone correction is enabled, uses KeystoneMesh for deformation.
 * Falls back to a simple PlaneGeometry when keystone is identity/disabled.
 */
const ProjectionSurface: React.FC<{
  keystoneCorners?: KeystoneCorners;
  keystoneEnabled?: boolean;
  keystoneSubdivisions?: number;
}> = ({
  keystoneCorners = DEFAULT_KEYSTONE_CORNERS,
  keystoneEnabled = false,
  keystoneSubdivisions = 8,
}) => {
  if (keystoneEnabled) {
    return (
      <KeystoneMesh
        corners={keystoneCorners}
        subdivisions={keystoneSubdivisions}
        enabled={keystoneEnabled}
      />
    );
  }

  // Default: simple plane
  return (
    <mesh position={[0, 0, -0.01]}>
      <planeGeometry args={[8, 4.5]} />
      <meshBasicMaterial
        color="#111827"
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
      />
      {/* Border wireframe */}
      <lineSegments>
        <edgesGeometry
          args={[new THREE.PlaneGeometry(8, 4.5)]}
        />
        <lineBasicMaterial color="#6366f1" linewidth={1} />
      </lineSegments>
    </mesh>
  );
};

// ─── Main Canvas Component ──────────────────────────────────────────────────

export const ProjectionCanvas: React.FC<ProjectionCanvasProps> = ({
  text,
  fontSize,
  textColor,
  keystoneCorners,
  keystoneEnabled = false,
  keystoneSubdivisions = 8,
}) => {
  return (
    <Canvas
      camera={{
        position: [0, 0, 5],
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      style={{ background: '#000000' }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
    >
      {/* Lighting */}
      <ambientLight intensity={1} />

      {/* Reference grid for alignment */}
      <Grid
        args={[20, 20]}
        position={[0, 0, -0.5]}
        cellColor="#1a1a2e"
        sectionColor="#27272a"
        fadeDistance={15}
        cellSize={0.5}
        sectionSize={2}
      />

      {/* Projection surface (with optional keystone deformation) */}
      <ProjectionSurface
        keystoneCorners={keystoneCorners}
        keystoneEnabled={keystoneEnabled}
        keystoneSubdivisions={keystoneSubdivisions}
      />

      {/* Text overlay */}
      <TextOverlay text={text} fontSize={fontSize} color={textColor} />

      {/* Camera controls — orbit for development, lock for production */}
      <OrbitControls
        enableRotate={true}
        enableZoom={true}
        enablePan={true}
        minDistance={2}
        maxDistance={20}
      />
    </Canvas>
  );
};
