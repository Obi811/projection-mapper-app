/**
 * ProjectorsPage — Vollständige Verwaltung der Projektor-Ausgänge.
 *
 * Bettet das ProjectorManagerPanel in eine eigene Seite ein und stellt
 * Kontext sowie einen Upgrade-Hinweis bereit, falls die Funktion nicht
 * lizenziert ist.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectorManagerPanel } from '../components/ProjectorManagerPanel';
import { useFeatureGate } from '../hooks/useFeatureGate';

export const ProjectorsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasFeature } = useFeatureGate();

  return (
    <div style={styles.scroll}>
      <div style={styles.container}>
        <div style={styles.intro}>
          <h2 style={styles.title}>Projektor-Verwaltung</h2>
          <p style={styles.subtitle}>
            Richte mehrere Projektor-Ausgänge ein, ordne ihnen Flächen zu und
            steuere sie in Echtzeit. Jeder Ausgang kann auf einem eigenen
            Display im Vollbild laufen.
          </p>
        </div>

        <div style={styles.panelCard}>
          <ProjectorManagerPanel
            featureEnabled={hasFeature('multi_surface')}
            onUpgradePrompt={() => navigate('/settings')}
          />
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  scroll: { width: '100%', height: '100%', overflowY: 'auto' },
  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  intro: { display: 'flex', flexDirection: 'column', gap: 8 },
  title: { fontSize: 22, fontWeight: 700, color: '#e4e4e7', margin: 0 },
  subtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    lineHeight: 1.6,
    margin: 0,
    maxWidth: 640,
  },
  panelCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    border: '1px solid #27272a',
  },
};
