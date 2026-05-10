/**
 * Sidebar — Control panel for projection settings.
 *
 * Currently provides text overlay controls.
 * Extensible sections will be added for:
 * - Surface management (multi_surface)
 * - Media layers (media_import)
 * - Keystone correction (keystone_correction)
 * - Audio sync (audio_sync)
 * - Addon panels (addon_system)
 */

import React from 'react';

interface SidebarProps {
  overlayText: string;
  onTextChange: (text: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  textColor: string;
  onTextColorChange: (color: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  overlayText,
  onTextChange,
  fontSize,
  onFontSizeChange,
  textColor,
  onTextColorChange,
}) => {
  return (
    <aside style={styles.sidebar}>
      {/* Section: Text Overlay */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Text Overlay</h3>

        <label style={styles.label}>
          Content
          <textarea
            value={overlayText}
            onChange={(e) => onTextChange(e.target.value)}
            style={styles.textarea}
            rows={3}
            placeholder="Enter projection text..."
          />
        </label>

        <label style={styles.label}>
          Font Size: {fontSize}px
          <input
            type="range"
            min={12}
            max={200}
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            style={styles.range}
          />
        </label>

        <label style={styles.label}>
          Color
          <div style={styles.colorRow}>
            <input
              type="color"
              value={textColor}
              onChange={(e) => onTextColorChange(e.target.value)}
              style={styles.colorPicker}
            />
            <span style={styles.colorValue}>{textColor}</span>
          </div>
        </label>
      </div>

      {/* Section: Projection Surface — placeholder */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Surface</h3>
        <p style={styles.placeholder}>
          Surface controls will appear here when multi-surface projection is
          enabled.
        </p>
      </div>

      {/* Section: License Info */}
      <div style={{ ...styles.section, marginTop: 'auto' }}>
        <h3 style={styles.sectionTitle}>License</h3>
        <button
          style={styles.licenseButton}
          onClick={() => {
            // TODO: Open license validation dialog
          }}
        >
          Enter License Key
        </button>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
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
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#a1a1aa',
    paddingBottom: 8,
    borderBottom: '1px solid #27272a',
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
    resize: 'vertical' as const,
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
  placeholder: {
    fontSize: 12,
    color: '#71717a',
    fontStyle: 'italic',
    lineHeight: 1.5,
  },
  licenseButton: {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #6366f1',
    backgroundColor: 'transparent',
    color: '#6366f1',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
};
