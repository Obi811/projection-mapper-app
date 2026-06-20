/**
 * AddonsPage — Verwaltung und Marktplatz für Addons.
 *
 * Bettet das AddonManagerPanel in eine eigene Seite ein.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AddonManagerPanel } from '../components/AddonManagerPanel';
import { useFeatureGate } from '../hooks/useFeatureGate';

export const AddonsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasFeature } = useFeatureGate();

  return (
    <div style={styles.scroll}>
      <div style={styles.container}>
        <div style={styles.intro}>
          <h2 style={styles.title}>Addons</h2>
          <p style={styles.subtitle}>
            Erweitere Projection Mapper mit Effekten, Integrationen und
            Werkzeugen aus dem Marktplatz. Installierte Addons kannst du hier
            aktivieren, konfigurieren oder entfernen.
          </p>
        </div>

        <div style={styles.panelCard}>
          <AddonManagerPanel
            featureEnabled={hasFeature('addon_system')}
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
