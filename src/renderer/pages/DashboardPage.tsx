/**
 * DashboardPage — Startseite nach der Anmeldung.
 *
 * Zeigt eine Übersicht über:
 *  - eine persönliche Begrüßung
 *  - den Lizenz-/Funktionsstatus
 *  - konfigurierte Projektoren (mit Status)
 *  - Schnellzugriffe auf die wichtigsten Bereiche
 *  - einen Onboarding-Hinweis für neue Benutzer (Empty-State)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFeatureGate } from '../hooks/useFeatureGate';
import type { ProjectorConfig, ProjectorState } from '../../shared/types';
import { MAX_PROJECTORS } from '../../shared/constants';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  to: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: 'Arbeitsbereich öffnen',
    description: 'Text, Medien und Keystone live anpassen',
    icon: '🎯',
    to: '/workspace',
  },
  {
    title: 'Projektoren verwalten',
    description: 'Ausgänge hinzufügen, starten und zuordnen',
    icon: '📽️',
    to: '/projectors',
  },
  {
    title: 'Addons entdecken',
    description: 'Funktionen über den Marktplatz erweitern',
    icon: '🧩',
    to: '/addons',
  },
  {
    title: 'Einstellungen',
    description: 'Lizenz, Profil und App-Informationen',
    icon: '⚙️',
    to: '/settings',
  },
];

const FEATURE_LABELS: { flag: string; label: string }[] = [
  { flag: 'basic_projection', label: 'Basis-Projektion' },
  { flag: 'text_overlay', label: 'Text-Overlay' },
  { flag: 'media_import', label: 'Medien-Import' },
  { flag: 'multi_surface', label: 'Multi-Projektor' },
  { flag: 'keystone_correction', label: 'Keystone-Korrektur' },
  { flag: 'addon_system', label: 'Addon-System' },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasFeature, features } = useFeatureGate();
  const [configs, setConfigs] = useState<ProjectorConfig[]>([]);
  const [states, setStates] = useState<ProjectorState[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectors = useCallback(async () => {
    try {
      if (window.electronAPI?.projector) {
        const [configResult, stateResult] = await Promise.all([
          window.electronAPI.projector.getConfigs(),
          window.electronAPI.projector.getStates(),
        ]);
        setConfigs(configResult ?? []);
        setStates(stateResult ?? []);
      }
    } catch {
      // Nicht im Electron-Kontext
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectors();
  }, [fetchProjectors]);

  const activeCount = states.filter((s) => s.status === 'active').length;
  const isPremium = hasFeature('multi_surface') || hasFeature('keystone_correction');
  const greetingName = user?.name || user?.email?.split('@')[0] || 'willkommen';

  return (
    <div style={styles.scroll}>
      <div style={styles.container}>
        {/* Begrüßung */}
        <section style={styles.hero}>
          <div>
            <h2 style={styles.heroTitle}>Hallo {greetingName} 👋</h2>
            <p style={styles.heroSubtitle}>
              Willkommen zurück bei Projection Mapper. Hier ist deine Übersicht.
            </p>
          </div>
          <div style={styles.licenseBadge}>
            <span style={styles.licenseBadgeIcon}>{isPremium ? '⭐' : '🔓'}</span>
            <div style={styles.licenseBadgeText}>
              <span style={styles.licenseBadgeTitle}>
                {isPremium ? 'Premium-Lizenz' : 'Basis-Lizenz'}
              </span>
              <span style={styles.licenseBadgeSub}>
                {features.length} Funktionen aktiv
              </span>
            </div>
          </div>
        </section>

        {/* Statistik-Karten */}
        <section style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{configs.length}</span>
            <span style={styles.statLabel}>Projektoren konfiguriert</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statValue, color: '#22c55e' }}>
              {activeCount}
            </span>
            <span style={styles.statLabel}>Aktiv</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{MAX_PROJECTORS}</span>
            <span style={styles.statLabel}>Maximal möglich</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{features.length}</span>
            <span style={styles.statLabel}>Funktionen freigeschaltet</span>
          </div>
        </section>

        {/* Schnellzugriffe */}
        <section style={styles.section}>
          <h3 style={styles.sectionHeading}>Schnellzugriff</h3>
          <div style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.to}
                style={styles.actionCard}
                onClick={() => navigate(action.to)}
              >
                <span style={styles.actionIcon}>{action.icon}</span>
                <span style={styles.actionTitle}>{action.title}</span>
                <span style={styles.actionDesc}>{action.description}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Projektor-Übersicht */}
        <section style={styles.section}>
          <div style={styles.sectionHeaderRow}>
            <h3 style={styles.sectionHeading}>Projektor-Übersicht</h3>
            <button
              style={styles.linkButton}
              onClick={() => navigate('/projectors')}
            >
              Alle verwalten →
            </button>
          </div>

          {loading ? (
            <div style={styles.loadingBox}>
              <div style={styles.spinner} />
              <span style={styles.loadingText}>Projektoren werden geladen…</span>
            </div>
          ) : configs.length === 0 ? (
            // Onboarding / Empty-State
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>📽️</span>
              <h4 style={styles.emptyTitle}>Noch keine Projektoren eingerichtet</h4>
              <p style={styles.emptyText}>
                Lege deinen ersten Projektor-Ausgang an, um Inhalte auf eine
                Fläche zu projizieren. Du kannst bis zu {MAX_PROJECTORS} Ausgänge
                gleichzeitig betreiben.
              </p>
              <button
                style={styles.primaryButton}
                onClick={() => navigate('/projectors')}
              >
                + Ersten Projektor anlegen
              </button>
            </div>
          ) : (
            <div style={styles.projectorGrid}>
              {configs.map((config) => {
                const state = states.find((s) => s.id === config.id);
                const isActive = state?.status === 'active';
                return (
                  <div key={config.id} style={styles.projectorCard}>
                    <div style={styles.projectorCardHeader}>
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
                        title={isActive ? 'Aktiv' : 'Inaktiv'}
                      />
                    </div>
                    <span style={styles.projectorMeta}>
                      {config.resolution.width}×{config.resolution.height}
                      {config.fullscreen ? ' · Vollbild' : ''}
                    </span>
                    <span
                      style={{
                        ...styles.projectorStatus,
                        color: isActive ? '#22c55e' : '#71717a',
                      }}
                    >
                      {isActive ? '● Läuft' : '○ Gestoppt'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Funktionsstatus */}
        <section style={styles.section}>
          <h3 style={styles.sectionHeading}>Funktionsstatus</h3>
          <div style={styles.featureGrid}>
            {FEATURE_LABELS.map((f) => {
              const enabled = hasFeature(f.flag as never);
              return (
                <div key={f.flag} style={styles.featureItem}>
                  <span
                    style={{
                      ...styles.featureDot,
                      backgroundColor: enabled ? '#22c55e' : '#3f3f46',
                    }}
                  />
                  <span
                    style={{
                      ...styles.featureLabel,
                      color: enabled ? '#e4e4e7' : '#71717a',
                    }}
                  >
                    {f.label}
                  </span>
                  {!enabled && <span style={styles.featureLock}>🔒</span>}
                </div>
              );
            })}
          </div>
          {!isPremium && (
            <button
              style={styles.upgradeButton}
              onClick={() => navigate('/settings')}
            >
              ⭐ Auf Premium upgraden
            </button>
          )}
        </section>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  scroll: {
    width: '100%',
    height: '100%',
    overflowY: 'auto',
  },
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#e4e4e7',
    margin: '0 0 6px',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    margin: 0,
  },
  licenseBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    border: '1px solid #27272a',
  },
  licenseBadgeIcon: {
    fontSize: 24,
  },
  licenseBadgeText: {
    display: 'flex',
    flexDirection: 'column',
  },
  licenseBadgeTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#e4e4e7',
  },
  licenseBadgeSub: {
    fontSize: 11,
    color: '#71717a',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 16,
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    border: '1px solid #27272a',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: '#e4e4e7',
    fontFamily: 'var(--font-mono)',
  },
  statLabel: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 600,
    color: '#e4e4e7',
    margin: 0,
  },
  linkButton: {
    border: 'none',
    background: 'none',
    color: '#818cf8',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 500,
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  actionCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    border: '1px solid #27272a',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color 0.15s, transform 0.1s',
  },
  actionIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e4e4e7',
  },
  actionDesc: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 1.4,
  },
  loadingBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 24,
    justifyContent: 'center',
  },
  spinner: {
    width: 24,
    height: 24,
    border: '3px solid #27272a',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'pm-spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: 13,
    color: '#71717a',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
    padding: '40px 24px',
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    border: '1px dashed #3f3f46',
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#e4e4e7',
    margin: 0,
  },
  emptyText: {
    fontSize: 13,
    color: '#a1a1aa',
    maxWidth: 460,
    lineHeight: 1.6,
    margin: 0,
  },
  primaryButton: {
    marginTop: 8,
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#6366f1',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  projectorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16,
  },
  projectorCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#1a1a2e',
    border: '1px solid #27272a',
  },
  projectorCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectorName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e4e4e7',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },
  projectorMeta: {
    fontSize: 12,
    color: '#71717a',
    fontFamily: 'var(--font-mono)',
  },
  projectorStatus: {
    fontSize: 12,
    fontWeight: 500,
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 10,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    border: '1px solid #27272a',
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  featureLabel: {
    fontSize: 13,
    flex: 1,
  },
  featureLock: {
    fontSize: 12,
    opacity: 0.6,
  },
  upgradeButton: {
    alignSelf: 'flex-start',
    padding: '10px 18px',
    borderRadius: 8,
    border: '1px solid #f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
