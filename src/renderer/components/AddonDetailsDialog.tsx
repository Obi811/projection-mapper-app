/**
 * AddonDetailsDialog — Modal showing detailed info about an installed addon.
 *
 * Displays manifest metadata, permissions, settings editor,
 * and enable/disable/uninstall actions.
 */

import React, { useEffect, useState } from 'react';
import type { InstalledAddon } from '../../shared/types';
import { ADDON_CATEGORY_LABELS } from '../../shared/constants';

interface AddonDetailsDialogProps {
  addon: InstalledAddon;
  onClose: () => void;
  onUninstall: () => void;
  onToggle: () => void;
  onSettingsSaved: () => void;
}

export const AddonDetailsDialog: React.FC<AddonDetailsDialogProps> = ({
  addon,
  onClose,
  onUninstall,
  onToggle,
  onSettingsSaved,
}) => {
  const { manifest, state } = addon;
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [confirmUninstall, setConfirmUninstall] = useState(false);

  useEffect(() => {
    window.electronAPI.addon
      .getSettings(manifest.id)
      .then((s: Record<string, unknown>) => setSettings(s ?? {}))
      .catch(() => setSettings({}));
  }, [manifest.id]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await window.electronAPI.addon.saveSettings(manifest.id, settings);
      onSettingsSaved();
    } catch (err) {
      console.error('[AddonDetails] Save settings failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const isActive = state === 'enabled' || state === 'loaded';

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>{manifest.name}</h2>
            <span style={styles.version}>
              v{manifest.version} · {ADDON_CATEGORY_LABELS[manifest.category] ?? manifest.category}
            </span>
          </div>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {/* Description */}
          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <p style={styles.description}>{manifest.description}</p>
          </div>

          {/* Author */}
          <div style={styles.field}>
            <label style={styles.label}>Author</label>
            <p style={styles.value}>{manifest.author}</p>
          </div>

          {/* Entry point */}
          <div style={styles.field}>
            <label style={styles.label}>Entry Point</label>
            <p style={styles.valueMono}>{manifest.entry}</p>
          </div>

          {/* Permissions */}
          <div style={styles.field}>
            <label style={styles.label}>Permissions</label>
            <div style={styles.permissionList}>
              {manifest.permissions.length === 0 ? (
                <span style={styles.value}>None required</span>
              ) : (
                manifest.permissions.map((perm) => (
                  <span key={perm} style={styles.permissionBadge}>
                    {perm}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* State */}
          <div style={styles.field}>
            <label style={styles.label}>State</label>
            <span
              style={{
                ...styles.stateBadge,
                backgroundColor: isActive ? '#166534' : state === 'error' ? '#991b1b' : '#3f3f46',
              }}
            >
              {state.toUpperCase()}
            </span>
          </div>

          {/* Settings */}
          {manifest.settings && Object.keys(manifest.settings).length > 0 && (
            <div style={styles.field}>
              <label style={styles.label}>Settings</label>
              {Object.entries(manifest.settings).map(([key, setting]) => (
                <div key={key} style={styles.settingRow}>
                  <label style={styles.settingLabel}>
                    {setting.label}
                    {setting.description && (
                      <span style={styles.settingHint}> — {setting.description}</span>
                    )}
                  </label>
                  {setting.type === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={Boolean(settings[key] ?? setting.default)}
                      onChange={(e) =>
                        setSettings({ ...settings, [key]: e.target.checked })
                      }
                    />
                  ) : setting.type === 'number' ? (
                    <input
                      type="number"
                      style={styles.input}
                      value={Number(settings[key] ?? setting.default ?? 0)}
                      onChange={(e) =>
                        setSettings({ ...settings, [key]: Number(e.target.value) })
                      }
                    />
                  ) : setting.type === 'select' ? (
                    <select
                      style={styles.input}
                      value={String(settings[key] ?? setting.default ?? '')}
                      onChange={(e) =>
                        setSettings({ ...settings, [key]: e.target.value })
                      }
                    >
                      {setting.options?.map((opt) => (
                        <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                          {typeof opt === 'string' ? opt : opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      style={styles.input}
                      value={String(settings[key] ?? setting.default ?? '')}
                      onChange={(e) =>
                        setSettings({ ...settings, [key]: e.target.value })
                      }
                    />
                  )}
                </div>
              ))}
              <button
                style={styles.saveButton}
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={styles.footer}>
          <button style={styles.toggleActionButton} onClick={onToggle}>
            {isActive ? 'Disable' : 'Enable'}
          </button>
          {!confirmUninstall ? (
            <button
              style={styles.uninstallButton}
              onClick={() => setConfirmUninstall(true)}
            >
              Uninstall
            </button>
          ) : (
            <button style={styles.confirmUninstallButton} onClick={onUninstall}>
              Confirm Uninstall
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  modal: {
    width: '90%',
    maxWidth: 520,
    maxHeight: '85vh',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    border: '1px solid #27272a',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px 20px',
    borderBottom: '1px solid #27272a',
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: '#e4e4e7',
    margin: 0,
  },
  version: {
    fontSize: 12,
    color: '#71717a',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#71717a',
    fontSize: 18,
    cursor: 'pointer',
    padding: '4px 8px',
  },
  body: {
    padding: 20,
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#a1a1aa',
  },
  description: {
    fontSize: 13,
    color: '#e4e4e7',
    lineHeight: 1.5,
    margin: 0,
  },
  value: {
    fontSize: 13,
    color: '#e4e4e7',
  },
  valueMono: {
    fontSize: 12,
    color: '#a1a1aa',
    fontFamily: 'monospace',
  },
  permissionList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  permissionBadge: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 10,
    backgroundColor: '#27272a',
    color: '#fbbf24',
  },
  stateBadge: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 10px',
    borderRadius: 10,
    color: '#fff',
    alignSelf: 'flex-start',
  },
  settingRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '6px 0',
  },
  settingLabel: {
    fontSize: 12,
    color: '#e4e4e7',
  },
  settingHint: {
    color: '#71717a',
    fontStyle: 'italic',
  },
  input: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #27272a',
    backgroundColor: '#0d0d0d',
    color: '#e4e4e7',
    fontSize: 13,
    outline: 'none',
  },
  saveButton: {
    marginTop: 8,
    padding: '8px 14px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: '#6366f1',
    color: '#fff',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderTop: '1px solid #27272a',
    gap: 12,
  },
  toggleActionButton: {
    padding: '8px 16px',
    borderRadius: 6,
    border: '1px solid #6366f1',
    backgroundColor: 'transparent',
    color: '#6366f1',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  uninstallButton: {
    padding: '8px 16px',
    borderRadius: 6,
    border: '1px solid #ef4444',
    backgroundColor: 'transparent',
    color: '#ef4444',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  confirmUninstallButton: {
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
};
