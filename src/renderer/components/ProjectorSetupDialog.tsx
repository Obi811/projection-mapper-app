/**
 * ProjectorSetupDialog — Modal dialog for adding/editing projector configurations.
 *
 * Features:
 * - Scan connected displays
 * - Assign display to projector
 * - Configure resolution and name
 * - Toggle fullscreen mode
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { DisplayInfo, ProjectorConfig } from '../../shared/types';

interface ProjectorSetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: Partial<ProjectorConfig> & { displayId: number }) => void;
  /** Pass existing config for edit mode, null for create mode */
  editConfig?: ProjectorConfig | null;
}

export const ProjectorSetupDialog: React.FC<ProjectorSetupDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  editConfig,
}) => {
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [scanning, setScanning] = useState(false);
  const [name, setName] = useState('');
  const [selectedDisplayId, setSelectedDisplayId] = useState<number>(0);
  const [resWidth, setResWidth] = useState(1920);
  const [resHeight, setResHeight] = useState(1080);
  const [fullscreen, setFullscreen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (editConfig) {
      setName(editConfig.name);
      setSelectedDisplayId(editConfig.displayId);
      setResWidth(editConfig.resolution.width);
      setResHeight(editConfig.resolution.height);
      setFullscreen(editConfig.fullscreen);
    } else {
      setName('');
      setSelectedDisplayId(0);
      setResWidth(1920);
      setResHeight(1080);
      setFullscreen(true);
    }
    setError(null);
  }, [editConfig, isOpen]);

  const scanDisplays = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.projector.scanDisplays();
        setDisplays(result ?? []);
        if (result?.length > 0 && !selectedDisplayId) {
          // Pre-select the first external display, or the first display
          const external = result.find((d: DisplayInfo) => !d.internal);
          setSelectedDisplayId(external?.id ?? result[0].id);
        }
      } else {
        // Browser fallback for development
        setDisplays([
          {
            id: 1,
            label: 'Integriertes Display',
            bounds: { x: 0, y: 0, width: 1920, height: 1080 },
            workArea: { x: 0, y: 0, width: 1920, height: 1040 },
            scaleFactor: 1,
            internal: true,
          },
          {
            id: 2,
            label: 'Externer Monitor',
            bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
            workArea: { x: 1920, y: 0, width: 1920, height: 1080 },
            scaleFactor: 1,
            internal: false,
          },
        ]);
      }
    } catch (err) {
      setError('Displays konnten nicht gescannt werden. Stellen Sie sicher, dass Electron läuft.');
    } finally {
      setScanning(false);
    }
  }, [selectedDisplayId]);

  // Auto-scan on open
  useEffect(() => {
    if (isOpen) {
      scanDisplays();
    }
  }, [isOpen, scanDisplays]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Bitte geben Sie einen Projektornamen ein.');
      return;
    }
    if (!selectedDisplayId && displays.length > 0) {
      setError('Bitte wählen Sie ein Display aus.');
      return;
    }

    const selectedDisplay = displays.find((d) => d.id === selectedDisplayId);
    const displayIndex = displays.findIndex((d) => d.id === selectedDisplayId);

    onSave({
      id: editConfig?.id,
      name: name.trim(),
      displayId: selectedDisplayId,
      displayIndex: displayIndex >= 0 ? displayIndex : 0,
      resolution: { width: resWidth, height: resHeight },
      position: selectedDisplay
        ? { x: selectedDisplay.bounds.x, y: selectedDisplay.bounds.y }
        : { x: 0, y: 0 },
      fullscreen,
      enabled: true,
      assignedSurfaces: editConfig?.assignedSurfaces ?? [],
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>
          {editConfig ? 'Projektor bearbeiten' : 'Projektor hinzufügen'}
        </h3>

        {error && <div style={styles.error}>{error}</div>}

        {/* Projector Name */}
        <label style={styles.label}>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            placeholder="z. B. Frontwand, Bühne links ..."
          />
        </label>

        {/* Display Selection */}
        <div style={styles.field}>
          <div style={styles.fieldHeader}>
            <span style={styles.fieldLabel}>Display</span>
            <button
              onClick={scanDisplays}
              disabled={scanning}
              style={styles.scanButton}
            >
              {scanning ? '⏳ Wird gescannt ...' : '🔄 Displays scannen'}
            </button>
          </div>

          {displays.length === 0 ? (
            <p style={styles.noDisplays}>
              Keine Displays erkannt. Klicken Sie auf „Displays scannen", um zu aktualisieren.
            </p>
          ) : (
            <div style={styles.displayGrid}>
              {displays.map((display, index) => (
                <div
                  key={display.id}
                  onClick={() => {
                    setSelectedDisplayId(display.id);
                    setResWidth(display.bounds.width);
                    setResHeight(display.bounds.height);
                  }}
                  style={{
                    ...styles.displayCard,
                    borderColor:
                      selectedDisplayId === display.id ? '#6366f1' : '#27272a',
                    backgroundColor:
                      selectedDisplayId === display.id
                        ? 'rgba(99, 102, 241, 0.1)'
                        : '#0d0d0d',
                  }}
                >
                  <div style={styles.displayIcon}>
                    {display.internal ? '💻' : '🖥️'}
                  </div>
                  <div style={styles.displayInfo}>
                    <span style={styles.displayName}>
                      {display.label || `Display ${index + 1}`}
                    </span>
                    <span style={styles.displayRes}>
                      {display.bounds.width}×{display.bounds.height}
                      {display.scaleFactor > 1
                        ? ` @${display.scaleFactor}x`
                        : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolution */}
        <div style={styles.row}>
          <label style={{ ...styles.label, flex: 1 }}>
            Breite
            <input
              type="number"
              value={resWidth}
              onChange={(e) => setResWidth(Number(e.target.value))}
              style={styles.input}
              min={640}
              max={7680}
            />
          </label>
          <span style={styles.separator}>×</span>
          <label style={{ ...styles.label, flex: 1 }}>
            Höhe
            <input
              type="number"
              value={resHeight}
              onChange={(e) => setResHeight(Number(e.target.value))}
              style={styles.input}
              min={480}
              max={4320}
            />
          </label>
        </div>

        {/* Fullscreen Toggle */}
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={fullscreen}
            onChange={(e) => setFullscreen(e.target.checked)}
            style={styles.checkbox}
          />
          Vollbildmodus (empfohlen für Projektoren)
        </label>

        {/* Actions */}
        <div style={styles.actions}>
          <button onClick={onClose} style={styles.cancelButton}>
            Abbrechen
          </button>
          <button onClick={handleSave} style={styles.saveButton}>
            {editConfig ? 'Aktualisieren' : 'Projektor hinzufügen'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    width: 520,
    maxHeight: '80vh',
    overflowY: 'auto',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    border: '1px solid #27272a',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: '#e4e4e7',
    margin: 0,
  },
  error: {
    padding: '8px 12px',
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    fontSize: 13,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    color: '#a1a1aa',
  },
  input: {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #27272a',
    backgroundColor: '#0d0d0d',
    color: '#e4e4e7',
    fontSize: 13,
    outline: 'none',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  fieldHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  scanButton: {
    padding: '4px 10px',
    borderRadius: 4,
    border: '1px solid #27272a',
    backgroundColor: 'transparent',
    color: '#a1a1aa',
    fontSize: 12,
    cursor: 'pointer',
  },
  noDisplays: {
    fontSize: 12,
    color: '#71717a',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  displayGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  displayCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #27272a',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  displayIcon: {
    fontSize: 24,
  },
  displayInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  displayName: {
    fontSize: 13,
    color: '#e4e4e7',
    fontWeight: 500,
  },
  displayRes: {
    fontSize: 11,
    color: '#71717a',
    fontFamily: 'var(--font-mono)',
  },
  row: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
  },
  separator: {
    color: '#71717a',
    fontSize: 16,
    paddingBottom: 8,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#a1a1aa',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: '#6366f1',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  cancelButton: {
    padding: '8px 16px',
    borderRadius: 6,
    border: '1px solid #27272a',
    backgroundColor: 'transparent',
    color: '#a1a1aa',
    fontSize: 13,
    cursor: 'pointer',
  },
  saveButton: {
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
};
