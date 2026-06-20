/**
 * AudioPage — Audio-Synchronisation und Timeline-Steuerung
 */

import React from 'react';
import { AudioPlayer } from '../components/AudioPlayer';

export const AudioPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Audio-Synchronisation</h2>
        <p style={styles.subtitle}>
          Importiere Audio-Dateien und synchronisiere deine Projektionen mit dem Beat
        </p>
      </div>

      <AudioPlayer />

      <div style={styles.infoSection}>
        <h3 style={styles.infoTitle}>Funktionen</h3>
        <ul style={styles.featureList}>
          <li style={styles.featureItem}>
            <span style={styles.featureIcon}>🎵</span>
            <span style={styles.featureText}>
              Audio-Dateien importieren (MP3, WAV, OGG, M4A, FLAC)
            </span>
          </li>
          <li style={styles.featureItem}>
            <span style={styles.featureIcon}>📊</span>
            <span style={styles.featureText}>
              Echtzeit-Waveform-Visualisierung
            </span>
          </li>
          <li style={styles.featureItem}>
            <span style={styles.featureIcon}>🎚️</span>
            <span style={styles.featureText}>
              Präzise Timeline-Steuerung und Synchronisation
            </span>
          </li>
          <li style={styles.featureItem}>
            <span style={styles.featureIcon}>🔊</span>
            <span style={styles.featureText}>
              Lautstärkeregelung und Playback-Controls
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    overflowY: 'auto',
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#e4e4e7',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    margin: '8px 0 0 0',
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    border: '1px solid #27272a',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#e4e4e7',
    margin: '0 0 16px 0',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 14,
    color: '#e4e4e7',
  },
};
