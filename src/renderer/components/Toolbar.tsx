/**
 * Toolbar — Top navigation bar.
 *
 * Houses application-level actions: file operations, view toggles,
 * and user menu. Placeholder for now — will be populated as features land.
 */

import React from 'react';

export const Toolbar: React.FC = () => {
  return (
    <div style={styles.toolbar}>
      <div style={styles.left}>
        <span style={styles.logo}>🎯</span>
        <span style={styles.title}>Projection Mapper</span>
        <span style={styles.version}>v0.1.0</span>
      </div>

      <div style={styles.center}>
        {/* Future: view mode toggles (Edit / Preview / Output) */}
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
