/**
 * Projection Page — Main workspace.
 *
 * Houses the WebGL canvas (Three.js via @react-three/fiber),
 * the sidebar controls, and the toolbar.
 * This is the primary view after authentication.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ProjectionCanvas } from '../components/ProjectionCanvas';
import { Sidebar } from '../components/Sidebar';
import { Toolbar } from '../components/Toolbar';
import { CornerHandles } from '../components/CornerHandles';
import type { KeystoneCorners, KeystoneConfig } from '../../shared/types';
import { DEFAULT_KEYSTONE_CORNERS } from '../../shared/types';

export const ProjectionPage: React.FC = () => {
  const [overlayText, setOverlayText] = useState('Hello Projection!');
  const [fontSize, setFontSize] = useState(72);
  const [textColor, setTextColor] = useState('#ffffff');

  // ─── Keystone State ──────────────────────────────────────────────────
  const [keystoneConfig, setKeystoneConfig] = useState<KeystoneConfig | null>(null);
  const [keystoneCorners, setKeystoneCorners] = useState<KeystoneCorners>(
    [...DEFAULT_KEYSTONE_CORNERS] as KeystoneCorners,
  );
  const [keystoneEnabled, setKeystoneEnabled] = useState(false);
  const [keystoneEditMode, setKeystoneEditMode] = useState(false);
  const [keystoneSubdivisions, setKeystoneSubdivisions] = useState(8);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [selectedProjectorId, setSelectedProjectorId] = useState<string>('default');

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Observe canvas container size
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load keystone config from backend
  const loadKeystoneConfig = useCallback(async (projectorId: string) => {
    try {
      if (window.electronAPI?.keystone) {
        const config = await window.electronAPI.keystone.getConfig(projectorId);
        if (config) {
          setKeystoneConfig(config);
          setKeystoneCorners(config.corners);
          setKeystoneEnabled(config.enabled);
          setKeystoneSubdivisions(config.meshSubdivisions);
        }
      }
    } catch {
      // Ignore in non-Electron env
    }
  }, []);

  useEffect(() => {
    loadKeystoneConfig(selectedProjectorId);
  }, [selectedProjectorId, loadKeystoneConfig]);

  // ─── Keystone Handlers ───────────────────────────────────────────────

  const handleCornersChange = useCallback(
    async (corners: KeystoneCorners) => {
      setKeystoneCorners(corners);
      try {
        if (window.electronAPI?.keystone) {
          const config = await window.electronAPI.keystone.saveConfig(
            selectedProjectorId,
            { corners },
          );
          setKeystoneConfig(config);
        }
      } catch {
        // Ignore
      }
    },
    [selectedProjectorId],
  );

  const handleKeystoneEnabledChange = useCallback(
    async (enabled: boolean) => {
      setKeystoneEnabled(enabled);
      try {
        if (window.electronAPI?.keystone) {
          const config = await window.electronAPI.keystone.saveConfig(
            selectedProjectorId,
            { enabled },
          );
          setKeystoneConfig(config);
        }
      } catch {
        // Ignore
      }
    },
    [selectedProjectorId],
  );

  const handleKeystoneReset = useCallback(async () => {
    try {
      if (window.electronAPI?.keystone) {
        const config = await window.electronAPI.keystone.reset(selectedProjectorId);
        setKeystoneConfig(config);
        setKeystoneCorners(config.corners);
      } else {
        setKeystoneCorners([...DEFAULT_KEYSTONE_CORNERS] as KeystoneCorners);
      }
    } catch {
      setKeystoneCorners([...DEFAULT_KEYSTONE_CORNERS] as KeystoneCorners);
    }
  }, [selectedProjectorId]);

  const handleSubdivisionsChange = useCallback(
    async (subdivisions: number) => {
      setKeystoneSubdivisions(subdivisions);
      try {
        if (window.electronAPI?.keystone) {
          const config = await window.electronAPI.keystone.saveConfig(
            selectedProjectorId,
            { meshSubdivisions: subdivisions },
          );
          setKeystoneConfig(config);
        }
      } catch {
        // Ignore
      }
    },
    [selectedProjectorId],
  );

  return (
    <div style={styles.layout}>
      {/* Top toolbar */}
      <Toolbar
        keystoneEditMode={keystoneEditMode}
        onKeystoneToggle={() => setKeystoneEditMode(!keystoneEditMode)}
      />

      <div style={styles.workspace}>
        {/* Left sidebar — controls & settings */}
        <Sidebar
          overlayText={overlayText}
          onTextChange={setOverlayText}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          textColor={textColor}
          onTextColorChange={setTextColor}
          // Keystone props
          keystoneConfig={keystoneConfig}
          keystoneProjectorId={selectedProjectorId}
          onKeystoneCornersChange={handleCornersChange}
          onKeystoneEnabledChange={handleKeystoneEnabledChange}
          onKeystoneReset={handleKeystoneReset}
          onKeystoneSubdivisionsChange={handleSubdivisionsChange}
          keystoneSnapEnabled={snapEnabled}
          onKeystoneSnapToggle={() => setSnapEnabled(!snapEnabled)}
          keystoneEditMode={keystoneEditMode}
          onKeystoneEditModeChange={setKeystoneEditMode}
        />

        {/* Main canvas area */}
        <div ref={canvasContainerRef} style={styles.canvasContainer}>
          <ProjectionCanvas
            text={overlayText}
            fontSize={fontSize}
            textColor={textColor}
            keystoneCorners={keystoneCorners}
            keystoneEnabled={keystoneEnabled}
            keystoneSubdivisions={keystoneSubdivisions}
          />

          {/* Corner handle overlay */}
          <CornerHandles
            corners={keystoneCorners}
            onChange={handleCornersChange}
            active={keystoneEditMode && keystoneEnabled}
            snapEnabled={snapEnabled}
            containerWidth={canvasSize.width}
            containerHeight={canvasSize.height}
          />
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  workspace: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
};
