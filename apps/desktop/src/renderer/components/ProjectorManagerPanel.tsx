/**
 * ProjectorManagerPanel — UI panel for managing projector outputs.
 *
 * Features:
 * - List all configured projectors with status indicators
 * - Preview thumbnails for each projector
 * - Toggle projectors on/off
 * - Add/edit/delete projectors via setup dialog
 * - Feature-gated: requires 'multi_surface' feature flag
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { ProjectorConfig, ProjectorState } from '../../shared/types';
import { ProjectorPreview } from './ProjectorPreview';
import { ProjectorSetupDialog } from './ProjectorSetupDialog';
import { MAX_PROJECTORS } from '../../shared/constants';

interface ProjectorManagerPanelProps {
  /** Whether the multi_surface feature is enabled */
  featureEnabled: boolean;
  /** Callback to show upgrade prompt */
  onUpgradePrompt?: () => void;
}

export const ProjectorManagerPanel: React.FC<ProjectorManagerPanelProps> = ({
  featureEnabled,
  onUpgradePrompt,
}) => {
  const [configs, setConfigs] = useState<ProjectorConfig[]>([]);
  const [states, setStates] = useState<ProjectorState[]>([]);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ProjectorConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch projector configurations
  const fetchConfigs = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const [configResult, stateResult] = await Promise.all([
          window.electronAPI.projector.getConfigs(),
          window.electronAPI.projector.getStates(),
        ]);
        setConfigs(configResult ?? []);
        setStates(stateResult ?? []);
      }
    } catch {
      // Silently handle — not in Electron
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();

    // Listen for state changes from main process
    if (window.electronAPI) {
      const unsubscribe = window.electronAPI.projector.onStateChange(
        (newStates) => {
          setStates(newStates as ProjectorState[]);
        },
      );
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [fetchConfigs]);

  const handleSaveConfig = async (
    config: Partial<ProjectorConfig> & { displayId: number },
  ) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.projector.saveConfig(config as Record<string, unknown>);
        await fetchConfigs();
      }
    } catch (err) {
      console.error('Failed to save projector config:', err);
    }
  };

  const handleDeleteConfig = async (projectorId: string) => {
    try {
      if (window.electronAPI) {
        // Close window first if active
        await window.electronAPI.projector.closeWindow(projectorId);
        await window.electronAPI.projector.deleteConfig(projectorId);
        await fetchConfigs();
      }
    } catch (err) {
      console.error('Failed to delete projector:', err);
    }
  };

  const handleToggleProjector = async (projectorId: string) => {
    const state = states.find((s) => s.id === projectorId);
    try {
      if (window.electronAPI) {
        if (state?.status === 'active') {
          await window.electronAPI.projector.closeWindow(projectorId);
        } else {
          await window.electronAPI.projector.openWindow(projectorId);
        }
        await fetchConfigs();
      }
    } catch (err) {
      console.error('Failed to toggle projector:', err);
    }
  };

  const getStateForProjector = (id: string): ProjectorState | undefined =>
    states.find((s) => s.id === id);

  // ─── Feature Gate: Not Enabled ──────────────────────────────────────────
  if (!featureEnabled) {
    return (
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Projektoren</h3>
          <span style={styles.premiumBadge}>⭐ Premium</span>
        </div>
        <div style={styles.upgradePrompt}>
          <p style={styles.upgradeText}>
            Multi-Projektor-Unterstützung ist eine Premium-Funktion. Schalte deine
            Lizenz frei, um bis zu {MAX_PROJECTORS} Projektor-Ausgänge gleichzeitig
            zu verwalten.
          </p>
          <button
            style={styles.upgradeButton}
            onClick={onUpgradePrompt}
          >
            Auf Premium upgraden
          </button>
        </div>
      </div>
    );
  }

  // ─── Feature Enabled ────────────────────────────────────────────────────
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>
          Projektoren
          <span style={styles.count}>
            {configs.length}/{MAX_PROJECTORS}
          </span>
        </h3>
        <button
          style={styles.addButton}
          onClick={() => {
            setEditingConfig(null);
            setShowSetupDialog(true);
          }}
          disabled={configs.length >= MAX_PROJECTORS}
          title={
            configs.length >= MAX_PROJECTORS
              ? 'Maximale Anzahl an Projektoren erreicht'
              : 'Projektor hinzufügen'
          }
        >
          + Hinzufügen
        </button>
      </div>

      {loading ? (
        <p style={styles.placeholder}>Projektor-Konfigurationen werden geladen…</p>
      ) : configs.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Noch keine Projektoren konfiguriert.</p>
          <p style={styles.emptyHint}>
            Klicke auf „Hinzufügen“, um deinen ersten Projektor-Ausgang einzurichten.
          </p>
        </div>
      ) : (
        <div style={styles.projectorList}>
          {configs.map((config) => {
            const state = getStateForProjector(config.id);
            const isActive = state?.status === 'active';

            return (
              <div key={config.id} style={styles.projectorCard}>
                {/* Preview thumbnail */}
                <ProjectorPreview
                  projectorId={config.id}
                  projectorName={config.name}
                  assignedSurfaces={config.assignedSurfaces}
                  isActive={isActive}
                  width={160}
                  height={90}
                />

                {/* Info & controls */}
                <div style={styles.projectorInfo}>
                  <div style={styles.projectorHeader}>
                    <span style={styles.projectorName}>{config.name}</span>
                    <span
                      style={{
                        ...styles.statusDot,
                        backgroundColor: isActive
                          ? '#22c55e'
                          : state?.status === 'error'
                            ? '#ef4444'
                            : '#71717a',
                      }}
                      title={state?.status ?? 'idle'}
                    />
                  </div>

                  <span style={styles.projectorMeta}>
                    {config.resolution.width}×{config.resolution.height}
                    {config.fullscreen ? ' · Vollbild' : ''}
                  </span>

                  {state?.fps !== undefined && isActive && (
                    <span style={styles.fpsLabel}>{state.fps} FPS</span>
                  )}

                  <div style={styles.projectorActions}>
                    <button
                      style={{
                        ...styles.toggleButton,
                        backgroundColor: isActive
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(34, 197, 94, 0.15)',
                        color: isActive ? '#ef4444' : '#22c55e',
                        borderColor: isActive ? '#ef4444' : '#22c55e',
                      }}
                      onClick={() => handleToggleProjector(config.id)}
                    >
                      {isActive ? '■ Stopp' : '▶ Start'}
                    </button>

                    <button
                      style={styles.editButton}
                      onClick={() => {
                        setEditingConfig(config);
                        setShowSetupDialog(true);
                      }}
                      title="Bearbeiten"
                    >
                      ✏️
                    </button>

                    <button
                      style={styles.deleteButton}
                      onClick={() => handleDeleteConfig(config.id)}
                      title="Löschen"
                      disabled={isActive}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectorSetupDialog
        isOpen={showSetupDialog}
        onClose={() => {
          setShowSetupDialog(false);
          setEditingConfig(null);
        }}
        onSave={handleSaveConfig}
        editConfig={editingConfig}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#a1a1aa',
    paddingBottom: 8,
    borderBottom: '1px solid #27272a',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: 0,
    width: '100%',
  },
  count: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: 400,
    fontFamily: 'var(--font-mono)',
  },
  premiumBadge: {
    fontSize: 10,
    color: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: 4,
    padding: '2px 6px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  addButton: {
    padding: '4px 10px',
    borderRadius: 4,
    border: '1px solid #6366f1',
    backgroundColor: 'transparent',
    color: '#6366f1',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  placeholder: {
    fontSize: 12,
    color: '#71717a',
    fontStyle: 'italic',
    lineHeight: 1.5,
    padding: '8px 0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '16px 0',
  },
  emptyText: {
    fontSize: 13,
    color: '#a1a1aa',
    margin: '0 0 4px',
  },
  emptyHint: {
    fontSize: 11,
    color: '#71717a',
    margin: 0,
    fontStyle: 'italic',
  },
  projectorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  projectorCard: {
    display: 'flex',
    gap: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#0d0d0d',
    border: '1px solid #27272a',
  },
  projectorInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  projectorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  projectorName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#e4e4e7',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  projectorMeta: {
    fontSize: 11,
    color: '#71717a',
    fontFamily: 'var(--font-mono)',
  },
  fpsLabel: {
    fontSize: 10,
    color: '#22c55e',
    fontFamily: 'var(--font-mono)',
  },
  projectorActions: {
    display: 'flex',
    gap: 4,
    marginTop: 4,
  },
  toggleButton: {
    padding: '3px 8px',
    borderRadius: 4,
    border: '1px solid',
    fontSize: 10,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  editButton: {
    padding: '3px 6px',
    borderRadius: 4,
    border: '1px solid #27272a',
    backgroundColor: 'transparent',
    fontSize: 12,
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '3px 6px',
    borderRadius: 4,
    border: '1px solid #27272a',
    backgroundColor: 'transparent',
    fontSize: 12,
    cursor: 'pointer',
  },
  upgradePrompt: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    textAlign: 'center',
  },
  upgradeText: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 1.6,
    margin: '0 0 12px',
  },
  upgradeButton: {
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: '#f59e0b',
    color: '#0d0d0d',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
