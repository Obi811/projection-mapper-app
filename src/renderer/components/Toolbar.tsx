/**
 * Toolbar — Top navigation bar.
 *
 * Houses application-level actions: file operations, view toggles,
 * and user menu. Placeholder for now — will be populated as features land.
 */

import React from 'react';

interface ToolbarProps {
  /** Whether keystone edit mode is currently active */
  keystoneEditMode?: boolean;
  /** Toggle keystone edit mode */
  onKeystoneToggle?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  keystoneEditMode = false,
  onKeystoneToggle,
}) => {
  return (
    <div style={styles.toolbar}>
      <div style={styles.left}>
        <span style={styles.logo}>🎯</span>
        <span style={styles.title}>Projection Mapper</span>
        <span style={styles.version}>v0.4.0</span>
      </div>

      <div style={styles.center}>
        {/* Keystone mode toggle */}
        <button
          style={{
            ...styles.modeButton,
            ...(keystoneEditMode ? styles.modeButtonActive : {}),
          }}
          onClick={onKeystoneToggle}
          title="Toggle Keystone Correction Edit Mode (K)"
        >
          ◇ Keystone
        </button>
      </div>

      <div style={styles.right}>
        <button style={styles.iconButton} title="Settings">
          ⚙️
        </button>
        <button style={styles.iconButton} title="Fullscreen">
          ⛶
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    padding: '0 16px',
    backgroundColor: '#0d0d0d',
    borderBottom: '1px solid #27272a',
    userSelect: 'none',
    WebkitAppRegion: 'drag' as unknown as string, // Enable window dragging
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e4e4e7',
  },
  version: {
    fontSize: 11,
    color: '#71717a',
    fontFamily: 'var(--font-mono)',
  },
  center: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  modeButton: {
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid #27272a',
    backgroundColor: 'transparent',
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
    WebkitAppRegion: 'no-drag' as unknown as string,
  },
  modeButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
    color: '#000000',
    fontWeight: 600,
  },
  iconButton: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    fontSize: 16,
    WebkitAppRegion: 'no-drag' as unknown as string,
    transition: 'background-color 0.15s',
  },
};
