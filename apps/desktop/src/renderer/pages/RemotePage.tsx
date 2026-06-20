/**
 * RemotePage — Remote-Control Server-Verwaltung
 */

import React from 'react';
import { RemoteControlPanel } from '../components/RemoteControlPanel';

export const RemotePage: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Remote-Steuerung</h2>
        <p style={styles.subtitle}>
          Verbinde dein mobiles Gerät und steuere die Projektion von überall
        </p>
      </div>

      <RemoteControlPanel />

      <div style={styles.infoSection}>
        <h3 style={styles.infoTitle}>So funktioniert's</h3>
        <ol style={styles.stepList}>
          <li style={styles.step}>
            <span style={styles.stepNumber}>1</span>
            <div style={styles.stepContent}>
              <h4 style={styles.stepTitle}>Server starten</h4>
              <p style={styles.stepText}>
                Klicke auf "Server starten", um den WebSocket-Server zu aktivieren
              </p>
            </div>
          </li>
          <li style={styles.step}>
            <span style={styles.stepNumber}>2</span>
            <div style={styles.stepContent}>
              <h4 style={styles.stepTitle}>QR-Code scannen</h4>
              <p style={styles.stepText}>
                Öffne die Mobile App und scanne den QR-Code mit der Kamera
              </p>
            </div>
          </li>
          <li style={styles.step}>
            <span style={styles.stepNumber}>3</span>
            <div style={styles.stepContent}>
              <h4 style={styles.stepTitle}>Steuerung übernehmen</h4>
              <p style={styles.stepText}>
                Nach erfolgreicher Verbindung kannst du alle Funktionen remote steuern
              </p>
            </div>
          </li>
        </ol>
      </div>

      <div style={styles.featuresSection}>
        <h3 style={styles.infoTitle}>Verfügbare Funktionen</h3>
        <div style={styles.featureGrid}>
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>📱</span>
            <h4 style={styles.featureTitle}>Live-Preview</h4>
            <p style={styles.featureDesc}>
              Sieh die Projektion in Echtzeit auf deinem mobilen Gerät
            </p>
          </div>
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>🎮</span>
            <h4 style={styles.featureTitle}>Touch-Steuerung</h4>
            <p style={styles.featureDesc}>
              Keystone-Korrektur und Projektor-Kontrolle per Touch
            </p>
          </div>
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>🎬</span>
            <h4 style={styles.featureTitle}>Playlist-Management</h4>
            <p style={styles.featureDesc}>
              Verwalte und steuere deine Medien-Playlists remote
            </p>
          </div>
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>🔊</span>
            <h4 style={styles.featureTitle}>Audio-Kontrolle</h4>
            <p style={styles.featureDesc}>
              Steuere Lautstärke und Audio-Synchronisation
            </p>
          </div>
        </div>
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
    margin: '0 0 20px 0',
  },
  stepList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  step: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e4e4e7',
    margin: '0 0 4px 0',
  },
  stepText: {
    fontSize: 13,
    color: '#a1a1aa',
    margin: 0,
    lineHeight: 1.6,
  },
  featuresSection: {
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    border: '1px solid #27272a',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
  },
  featureCard: {
    padding: 16,
    backgroundColor: '#27272a',
    borderRadius: 8,
    border: '1px solid #3f3f46',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e4e4e7',
    margin: 0,
  },
  featureDesc: {
    fontSize: 12,
    color: '#a1a1aa',
    margin: 0,
    lineHeight: 1.5,
  },
};
