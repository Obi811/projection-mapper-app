/**
 * KeystonePanel — Sidebar panel for keystone correction settings.
 *
 * Provides:
 * - Enable/disable keystone correction toggle
 * - Numeric input for each corner (precise values)
 * - Preset management (save/load/delete)
 * - Reset to default
 * - Mesh subdivision slider
 * - Snap-to-grid toggle
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { KeystoneCorners, KeystoneConfig, KeystonePreset } from '../../shared/types';
import { DEFAULT_KEYSTONE_CORNERS } from '../../shared/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface KeystonePanelProps {
  /** Currently selected projector ID */
  projectorId: string;
  /** Current keystone config */
  config: KeystoneConfig | null;
  /** Whether the keystone feature is licensed */
  featureEnabled: boolean;
  /** Called when corners change */
  onCornersChange: (corners: KeystoneCorners) => void;
  /** Called to toggle keystone enabled state */
  onEnabledChange: (enabled: boolean) => void;
  /** Called to reset to default */
  onReset: () => void;
  /** Called when subdivisions change */
  onSubdivisionsChange: (subdivisions: number) => void;
  /** Whether snap-to-grid is active */
  snapEnabled: boolean;
  /** Toggle snap-to-grid */
  onSnapToggle: () => void;
  /** Called when keystone edit mode changes */
  onEditModeChange: (active: boolean) => void;
  /** Whether keystone edit mode is active */
  editModeActive: boolean;
  /** Show upgrade prompt */
  onUpgradePrompt: () => void;
}

const CORNER_LABELS = ['Top Left', 'Top Right', 'Bottom Right', 'Bottom Left'];

// ─── Component ───────────────────────────────────────────────────────────────

export const KeystonePanel: React.FC<KeystonePanelProps> = ({
  projectorId,
  config,
  featureEnabled,
  onCornersChange,
  onEnabledChange,
  onReset,
  onSubdivisionsChange,
  snapEnabled,
  onSnapToggle,
  onEditModeChange,
  editModeActive,
  onUpgradePrompt,
}) => {
  const [presets, setPresets] = useState<KeystonePreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  const corners = config?.corners ?? DEFAULT_KEYSTONE_CORNERS;
  const enabled = config?.enabled ?? true;
  const subdivisions = config?.meshSubdivisions ?? 8;

  // ─── Load presets ──────────────────────────────────────────────────

  const loadPresets = useCallback(async () => {
    try {
      if (window.electronAPI?.keystone) {
        const result = await window.electronAPI.keystone.getPresets(projectorId);
        setPresets(result ?? []);
      }
    } catch {
      // Ignore errors in non-Electron environments
    }
  }, [projectorId]);

  useEffect(() => {
    if (featureEnabled) {
      loadPresets();
    }
  }, [featureEnabled, loadPresets]);

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleCornerChange = (
    cornerIndex: number,
    axis: 'x' | 'y',
    value: number,
  ) => {
    const newCorners = [...corners] as KeystoneCorners;
    newCorners[cornerIndex] = {
      ...newCorners[cornerIndex],
      [axis]: Math.max(0, Math.min(1, value)),
    };
    onCornersChange(newCorners);
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    try {
      if (window.electronAPI?.keystone) {
        await window.electronAPI.keystone.savePreset(
          projectorId,
          presetName.trim(),
          corners,
        );
        setPresetName('');
        await loadPresets();
      }
    } catch (err) {
      console.error('Failed to save preset:', err);
    }
  };

  const handleLoadPreset = async (preset: KeystonePreset) => {
    onCornersChange(preset.corners);
  };

  const handleDeletePreset = async (presetId: string) => {
    try {
      if (window.electronAPI?.keystone) {
        await window.electronAPI.keystone.deletePreset(presetId);
        await loadPresets();
      }
    } catch (err) {
      console.error('Failed to delete preset:', err);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────

  if (!featureEnabled) {
    return (
      <div style={styles.section}>
        <div style={styles.headerRow}>
          <h3 style={styles.sectionTitle}>Keystone-Korrektur</h3>
          <span style={styles.premiumBadge}>PREMIUM</span>
        </div>
        <p style={styles.placeholder}>
          Mit der Keystone-Korrektur kannst du die Projektionsecken anpassen,
          for perfect alignment on angled surfaces.
        </p>
        <button style={styles.upgradeButton} onClick={onUpgradePrompt}>
          🔓 Auf Premium upgraden
        </button>
      </div>
    );
  }

  return (
    <div style={styles.section}>
      <div style={styles.headerRow}>
        <h3 style={styles.sectionTitle}>Keystone-Korrektur</h3>
        <span style={styles.premiumBadge}>PREMIUM</span>
      </div>

      {/* Enable/Disable toggle */}
      <label style={styles.toggleRow}>
        <span style={styles.toggleLabel}>Aktiviert</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          style={styles.checkbox}
        />
      </label>

      {/* Edit mode toggle */}
      <button
        style={{
          ...styles.editButton,
          backgroundColor: editModeActive ? '#f59e0b' : '#4f46e5',
        }}
        onClick={() => onEditModeChange(!editModeActive)}
        disabled={!enabled}
      >
        {editModeActive ? '✓ Ecken werden bearbeitet' : '◇ Ecken bearbeiten'}
      </button>

      {/* Corner values */}
      {enabled && (
        <div style={styles.cornersGrid}>
          {corners.map((corner, idx) => (
            <div key={idx} style={styles.cornerGroup}>
              <span style={styles.cornerLabel}>{CORNER_LABELS[idx]}</span>
              <div style={styles.coordRow}>
                <label style={styles.coordLabel}>
                  X
                  <input
                    type="number"
                    value={Number(corner.x.toFixed(3))}
                    onChange={(e) =>
                      handleCornerChange(idx, 'x', parseFloat(e.target.value) || 0)
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    style={styles.coordInput}
                  />
                </label>
                <label style={styles.coordLabel}>
                  Y
                  <input
                    type="number"
                    value={Number(corner.y.toFixed(3))}
                    onChange={(e) =>
                      handleCornerChange(idx, 'y', parseFloat(e.target.value) || 0)
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    style={styles.coordInput}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Snap-to-grid toggle */}
      <label style={styles.toggleRow}>
        <span style={styles.toggleLabel}>Am Raster ausrichten</span>
        <input
          type="checkbox"
          checked={snapEnabled}
          onChange={onSnapToggle}
          style={styles.checkbox}
        />
      </label>

      {/* Mesh subdivisions */}
      <label style={styles.label}>
        Netzqualität: {subdivisions}
        <input
          type="range"
          min={1}
          max={32}
          value={subdivisions}
          onChange={(e) => onSubdivisionsChange(Number(e.target.value))}
          style={styles.range}
        />
      </label>

      {/* Reset button */}
      <button style={styles.resetButton} onClick={onReset}>
        ↺ Auf Standard zurücksetzen
      </button>

      {/* Presets section */}
      <div style={styles.presetsSection}>
        <button
          style={styles.presetsToggle}
          onClick={() => setShowPresets(!showPresets)}
        >
          {showPresets ? '▾' : '▸'} Voreinstellungen ({presets.length})
        </button>

        {showPresets && (
          <div style={styles.presetsContent}>
            {/* Save new preset */}
            <div style={styles.presetSaveRow}>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Name der Voreinstellung…"
                style={styles.presetInput}
                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              />
              <button
                style={styles.presetSaveButton}
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
              >
                Save
              </button>
            </div>

            {/* Preset list */}
            {presets.length === 0 ? (
              <p style={styles.noPresets}>Noch keine Voreinstellungen gespeichert</p>
            ) : (
              <div style={styles.presetList}>
                {presets.map((preset) => (
                  <div key={preset.id} style={styles.presetItem}>
                    <button
                      style={styles.presetLoadButton}
                      onClick={() => handleLoadPreset(preset)}
                      title={`„${preset.name}“ laden`}
                    >
                      {preset.name}
                    </button>
                    <button
                      style={styles.presetDeleteButton}
                      onClick={() => handleDeletePreset(preset.id)}
                      title="Voreinstellung löschen"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      {editModeActive && (
        <div style={styles.shortcutHint}>
          <p>Pfeiltasten: Ausgewählte Ecke bewegen</p>
          <p>Umschalt+Pfeil: Feinjustierung</p>
          <p>Tab: Ecken durchschalten</p>
          <p>Esc: Auswahl aufheben</p>
        </div>
      )}
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottom: '1px solid #27272a',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#a1a1aa',
    margin: 0,
  },
  premiumBadge: {
    fontSize: 9,
    fontWeight: 700,
    color: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: '2px 6px',
    borderRadius: 4,
    letterSpacing: '0.05em',
  },
  placeholder: {
    fontSize: 12,
    color: '#71717a',
    fontStyle: 'italic',
    lineHeight: 1.5,
  },
  upgradeButton: {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 13,
    color: '#a1a1aa',
    cursor: 'pointer',
  },
  toggleLabel: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  checkbox: {
    accentColor: '#6366f1',
    width: 16,
    height: 16,
    cursor: 'pointer',
  },
  editButton: {
    padding: '8px 12px',
    borderRadius: 6,
    border: 'none',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  cornersGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  cornerGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 4,
  },
  cornerLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  coordRow: {
    display: 'flex',
    gap: 4,
  },
  coordLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 11,
    color: '#a1a1aa',
  },
  coordInput: {
    width: 52,
    padding: '3px 5px',
    borderRadius: 3,
    border: '1px solid #27272a',
    backgroundColor: '#0d0d0d',
    color: '#e4e4e7',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    outline: 'none',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    color: '#a1a1aa',
  },
  range: {
    width: '100%',
    accentColor: '#6366f1',
  },
  resetButton: {
    padding: '6px 10px',
    borderRadius: 4,
    border: '1px solid #27272a',
    backgroundColor: 'transparent',
    color: '#a1a1aa',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  presetsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  presetsToggle: {
    background: 'none',
    border: 'none',
    color: '#a1a1aa',
    fontSize: 12,
    cursor: 'pointer',
    textAlign: 'left',
    padding: '4px 0',
  },
  presetsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    paddingLeft: 8,
  },
  presetSaveRow: {
    display: 'flex',
    gap: 4,
  },
  presetInput: {
    flex: 1,
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px solid #27272a',
    backgroundColor: '#0d0d0d',
    color: '#e4e4e7',
    fontSize: 12,
    outline: 'none',
  },
  presetSaveButton: {
    padding: '4px 10px',
    borderRadius: 4,
    border: 'none',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
  },
  noPresets: {
    fontSize: 11,
    color: '#52525b',
    fontStyle: 'italic',
    margin: 0,
  },
  presetList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  presetItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  presetLoadButton: {
    flex: 1,
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px solid #27272a',
    backgroundColor: 'transparent',
    color: '#a1a1aa',
    fontSize: 11,
    cursor: 'pointer',
    textAlign: 'left',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    transition: 'all 0.1s',
  },
  presetDeleteButton: {
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#71717a',
    fontSize: 11,
    cursor: 'pointer',
    transition: 'all 0.1s',
  },
  shortcutHint: {
    fontSize: 10,
    color: '#52525b',
    lineHeight: 1.6,
    borderTop: '1px solid #27272a',
    paddingTop: 8,
  },
};
