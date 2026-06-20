/**
 * WorkspacePage — Live-Arbeitsbereich für die Projektion.
 *
 * Enthält die WebGL-Vorschau (Three.js via @react-three/fiber), eine
 * fokussierte Steuerleiste für Text-Overlay und Keystone-Korrektur sowie
 * die interaktiven Eck-Griffe für die Keystone-Bearbeitung.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectionCanvas } from '../components/ProjectionCanvas';
import { KeystonePanel } from '../components/KeystonePanel';
import { CornerHandles } from '../components/CornerHandles';
import { useFeatureGate } from '../hooks/useFeatureGate';
import type { KeystoneCorners, KeystoneConfig } from '../../shared/types';
import { DEFAULT_KEYSTONE_CORNERS } from '../../shared/types';

export const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const { hasFeature } = useFeatureGate();

  const [overlayText, setOverlayText] = useState('Hallo Projektion!');
  const [fontSize, setFontSize] = useState(72);
  const [textColor, setTextColor] = useState('#ffffff');

  // ─── Keystone-Zustand ──────────────────────────────────────────────
  const [keystoneConfig, setKeystoneConfig] = useState<KeystoneConfig | null>(null);
  const [keystoneCorners, setKeystoneCorners] = useState<KeystoneCorners>(
    [...DEFAULT_KEYSTONE_CORNERS] as KeystoneCorners,
  );
  const [keystoneEnabled, setKeystoneEnabled] = useState(false);
  const [keystoneEditMode, setKeystoneEditMode] = useState(false);
  const [keystoneSubdivisions, setKeystoneSubdivisions] = useState(8);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [selectedProjectorId] = useState<string>('default');

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Größe des Canvas-Containers beobachten
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

  // Keystone-Konfiguration laden
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
      // Außerhalb von Electron ignorieren
    }
  }, []);

  useEffect(() => {
    loadKeystoneConfig(selectedProjectorId);
  }, [selectedProjectorId, loadKeystoneConfig]);

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
        // ignorieren
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
        // ignorieren
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
        // ignorieren
      }
    },
    [selectedProjectorId],
  );

  return (
    <div style={styles.layout}>
      {/* Fokussierte Steuerleiste */}
      <aside style={styles.sidebar}>
        {/* Text-Overlay */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Text-Overlay</h3>
          <label style={styles.label}>
            Inhalt
            <textarea
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              style={styles.textarea}
              rows={3}
              placeholder="Projektionstext eingeben…"
            />
          </label>
          <label style={styles.label}>
            Schriftgröße: {fontSize}px
            <input
              type="range"
              min={12}
              max={200}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={styles.range}
            />
          </label>
          <label style={styles.label}>
            Farbe
            <div style={styles.colorRow}>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={styles.colorPicker}
              />
              <span style={styles.colorValue}>{textColor}</span>
            </div>
          </label>
        </div>

        {/* Keystone-Korrektur */}
        <KeystonePanel
          projectorId={selectedProjectorId}
          config={keystoneConfig}
          featureEnabled={hasFeature('keystone_correction')}
          onCornersChange={handleCornersChange}
          onEnabledChange={handleKeystoneEnabledChange}
          onReset={handleKeystoneReset}
          onSubdivisionsChange={handleSubdivisionsChange}
          snapEnabled={snapEnabled}
          onSnapToggle={() => setSnapEnabled(!snapEnabled)}
          onEditModeChange={setKeystoneEditMode}
          editModeActive={keystoneEditMode}
          onUpgradePrompt={() => navigate('/settings')}
        />
      </aside>

      {/* Canvas-Bereich */}
      <div style={styles.canvasWrap}>
        <div style={styles.canvasToolbar}>
          <button
            style={{
              ...styles.toolbarButton,
              ...(keystoneEditMode ? styles.toolbarButtonActive : {}),
            }}
            onClick={() => setKeystoneEditMode(!keystoneEditMode)}
            disabled={!keystoneEnabled}
            title={
              keystoneEnabled
                ? 'Keystone-Bearbeitung umschalten'
                : 'Aktiviere zuerst die Keystone-Korrektur'
            }
          >
            ◇ Keystone bearbeiten
          </button>
          <span style={styles.canvasHint}>
            Live-Vorschau · Ziehe die Ecken zur Korrektur
          </span>
        </div>

        <div ref={canvasContainerRef} style={styles.canvasContainer}>
          <ProjectionCanvas
            text={overlayText}
            fontSize={fontSize}
            textColor={textColor}
            keystoneCorners={keystoneCorners}
            keystoneEnabled={keystoneEnabled}
            keystoneSubdivisions={keystoneSubdivisions}
          />
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
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  sidebar: {
    width: 280,
    minWidth: 280,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1a1a2e',
    borderRight: '1px solid #27272a',
    padding: 16,
    overflowY: 'auto',
    gap: 20,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#a1a1aa',
    paddingBottom: 8,
    borderBottom: '1px solid #27272a',
    margin: 0,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    color: '#a1a1aa',
  },
  textarea: {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #27272a',
    backgroundColor: '#0d0d0d',
    color: '#e4e4e7',
    fontSize: 13,
    resize: 'vertical',
    fontFamily: 'inherit',
    outline: 'none',
  },
  range: {
    width: '100%',
    accentColor: '#6366f1',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  colorPicker: {
    width: 32,
    height: 32,
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    backgroundColor: 'transparent',
  },
  colorValue: {
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    color: '#71717a',
  },
  canvasWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  canvasToolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    height: 44,
    padding: '0 16px',
    backgroundColor: '#0d0d0d',
    borderBottom: '1px solid #27272a',
  },
  toolbarButton: {
    padding: '5px 12px',
    borderRadius: 6,
    border: '1px solid #27272a',
    backgroundColor: 'transparent',
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  toolbarButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
    color: '#000',
    fontWeight: 600,
  },
  canvasHint: {
    fontSize: 12,
    color: '#52525b',
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
};
