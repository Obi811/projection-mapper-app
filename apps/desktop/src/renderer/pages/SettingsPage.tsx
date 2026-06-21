/**
 * SettingsPage — Einstellungen, Lizenz, Profil und App-Informationen.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFeatureGate } from '../hooks/useFeatureGate';
import { useAppVersion } from '../hooks/useAppVersion';
import { API_BASE_URL } from '../../shared/constants';
import type { RegisteredDevice, PortalDashboard } from '../../shared/types';

const FEATURE_LABELS: Record<string, string> = {
  basic_projection: 'Basis-Projektion',
  text_overlay: 'Text-Overlay',
  media_import: 'Medien-Import',
  gif_support: 'GIF-Unterstützung',
  multi_surface: 'Multi-Projektor',
  keystone_correction: 'Keystone-Korrektur',
  audio_sync: 'Audio-Synchronisation',
  dmx_support: 'DMX-Unterstützung',
  addon_system: 'Addon-System',
  remote_control: 'Fernsteuerung',
};

const ROLE_LABELS: Record<string, string> = {
  user: 'Benutzer',
  admin: 'Administrator',
  owner: 'Eigentümer',
};

const ROLE_COLORS: Record<string, string> = {
  user: '#6b7280',
  admin: '#3b82f6',
  owner: '#f59e0b',
};

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { features, refresh } = useFeatureGate();
  const version = useAppVersion();

  const [licenseKey, setLicenseKey] = useState('');
  const [activeLicenseKey, setActiveLicenseKey] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null,
  );
  
  // Portal data
  const [devices, setDevices] = useState<RegisteredDevice[]>([]);
  const [dashboard, setDashboard] = useState<PortalDashboard | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  // Load active license key on mount
  useEffect(() => {
    if (window.electronAPI?.license?.getKey) {
      window.electronAPI.license
        .getKey()
        .then((key) => setActiveLicenseKey(key))
        .catch((err) => console.warn('Failed to load license key:', err));
    }
  }, []);

  // Load portal data (optional - gracefully fails if backend endpoints don't exist)
  useEffect(() => {
    if (window.electronAPI?.portal) {
      setLoadingPortal(true);
      Promise.all([
        window.electronAPI.portal.getDevices().catch(() => []),
        window.electronAPI.portal.getDashboard().catch(() => null),
      ])
        .then(([devicesData, dashboardData]) => {
          setDevices(devicesData || []);
          setDashboard(dashboardData);
        })
        .catch((err) => {
          console.warn('Portal data unavailable:', err);
          // Portal features disabled, but settings page still works
          setDevices([]);
          setDashboard(null);
        })
        .finally(() => setLoadingPortal(false));
    }
  }, []);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setMessage({ type: 'err', text: 'Bitte gib einen Lizenzschlüssel ein.' });
      return;
    }
    setActivating(true);
    setMessage(null);
    try {
      if (window.electronAPI?.license?.activate) {
        const result = await window.electronAPI.license.activate(licenseKey.trim());
        if (result && (result.valid ?? result.success)) {
          setMessage({
            type: 'ok',
            text: 'Lizenz erfolgreich aktiviert! Funktionen wurden freigeschaltet.',
          });
          setActiveLicenseKey(licenseKey.trim());
          setLicenseKey('');
          await refresh();
        } else {
          setMessage({
            type: 'err',
            text: result?.message || 'Lizenzschlüssel ungültig oder abgelaufen.',
          });
        }
      } else {
        setMessage({
          type: 'err',
          text: 'Lizenzaktivierung ist nur in der Desktop-App verfügbar.',
        });
      }
    } catch (err) {
      setMessage({
        type: 'err',
        text: `Aktivierung fehlgeschlagen: ${err instanceof Error ? err.message : 'Prüfe deine Internetverbindung.'}`,
      });
    } finally {
      setActivating(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Möchtest du die Lizenz wirklich entfernen? Die App wird neu geladen.')) {
      return;
    }
    setRemoving(true);
    setMessage(null);
    try {
      if (window.electronAPI?.license?.remove) {
        await window.electronAPI.license.remove();
        // Reload the app to clear all feature-gate state across all components
        window.location.reload();
      }
    } catch (err) {
      setMessage({
        type: 'err',
        text: `Entfernen fehlgeschlagen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`,
      });
      setRemoving(false);
    }
  };

  const displayName = user?.name || 'Nicht angegeben';

  return (
    <div style={styles.scroll}>
      <div style={styles.container}>
        <h2 style={styles.title}>Einstellungen</h2>

        {/* Profil */}
        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Profil</h3>
          <div style={styles.row}>
            <span style={styles.rowLabel}>Name</span>
            <span style={styles.rowValue}>{displayName}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>E-Mail</span>
            <span style={styles.rowValue}>{user?.email ?? '—'}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>Rolle</span>
            <span
              style={{
                ...styles.badge,
                backgroundColor: user?.role ? ROLE_COLORS[user.role] : '#6b7280',
              }}
            >
              {user?.role ? ROLE_LABELS[user.role] : 'Benutzer'}
            </span>
          </div>
          {user?.createdAt && (
            <div style={styles.row}>
              <span style={styles.rowLabel}>Mitglied seit</span>
              <span style={styles.rowValue}>
                {new Date(user.createdAt).toLocaleDateString('de-DE')}
              </span>
            </div>
          )}
          <button style={styles.logoutButton} onClick={logout}>
            ⏻ Abmelden
          </button>
        </section>

        {/* Lizenz */}
        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Lizenz</h3>
          
          {activeLicenseKey ? (
            // Aktive Lizenz anzeigen
            <>
              <p style={styles.cardText}>
                Deine Lizenz ist aktiv. Premium-Funktionen sind freigeschaltet.
              </p>
              <div style={styles.licenseRow}>
                <input
                  type="text"
                  value={activeLicenseKey}
                  readOnly
                  style={{ ...styles.input, opacity: 0.7 }}
                />
                <button
                  style={{
                    ...styles.removeButton,
                    opacity: removing ? 0.6 : 1,
                  }}
                  onClick={handleRemove}
                  disabled={removing}
                >
                  {removing ? 'Entferne…' : 'Entfernen'}
                </button>
              </div>
            </>
          ) : (
            // Lizenz aktivieren
            <>
              <p style={styles.cardText}>
                Gib deinen Lizenzschlüssel ein, um Premium-Funktionen wie
                Multi-Projektor, Keystone-Korrektur und das Addon-System
                freizuschalten.
              </p>
              <div style={styles.licenseRow}>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="PM-XXXX-XXXX-XXXX-XXXX"
                  style={styles.input}
                  disabled={activating}
                />
                <button
                  style={{
                    ...styles.activateButton,
                    opacity: activating ? 0.6 : 1,
                  }}
                  onClick={handleActivate}
                  disabled={activating}
                >
                  {activating ? 'Aktiviere…' : 'Aktivieren'}
                </button>
              </div>
            </>
          )}
          
          {message && (
            <p
              style={{
                ...styles.message,
                color: message.type === 'ok' ? '#22c55e' : '#f87171',
                backgroundColor:
                  message.type === 'ok'
                    ? 'rgba(34, 197, 94, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
              }}
            >
              {message.text}
            </p>
          )}
        </section>

        {/* Freigeschaltete Funktionen */}
        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Freigeschaltete Funktionen</h3>
          {features.length === 0 ? (
            <p style={styles.cardText}>
              Aktuell sind keine Funktionen aktiv. Aktiviere eine Lizenz, um
              loszulegen.
            </p>
          ) : (
            <div style={styles.featureList}>
              {features.map((f) => (
                <span key={f} style={styles.featureChip}>
                  ✓ {FEATURE_LABELS[f] ?? f}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Aktive Geräte */}
        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Aktive Geräte</h3>
          {loadingPortal ? (
            <p style={{ color: '#a1a1aa', margin: 0 }}>Lade Geräte...</p>
          ) : devices.length === 0 ? (
            <p style={{ color: '#a1a1aa', margin: 0 }}>
              Keine Geräte registriert.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {devices.map((device) => (
                <div key={device.id} style={styles.deviceCard}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#e4e4e7' }}>
                      {device.deviceName}
                    </div>
                    <div style={{ fontSize: 13, color: '#a1a1aa', marginTop: 4 }}>
                      {device.platform} • Zuletzt gesehen:{' '}
                      {new Date(device.lastSeen).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Lizenz-Übersicht */}
        {dashboard && dashboard.licenses && dashboard.subscriptions && dashboard.stats && (
          <section style={styles.card}>
            <h3 style={styles.cardTitle}>Lizenz-Übersicht</h3>
            <div style={styles.row}>
              <span style={styles.rowLabel}>Aktive Lizenzen</span>
              <span style={styles.rowValue}>{dashboard.licenses.length}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.rowLabel}>Subscriptions</span>
              <span style={styles.rowValue}>{dashboard.subscriptions.length}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.rowLabel}>Aktive Addons</span>
              <span style={styles.rowValue}>{dashboard.stats.activeAddons}</span>
            </div>
          </section>
        )}

        {/* Über die App */}
        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Über Projection Mapper</h3>
          <div style={styles.row}>
            <span style={styles.rowLabel}>Version</span>
            <span style={styles.rowValue}>v{version}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>API-Server</span>
            <span style={styles.rowValue}>{API_BASE_URL}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>Lizenztyp</span>
            <span style={styles.rowValue}>MIT</span>
          </div>
        </section>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  scroll: { width: '100%', height: '100%', overflowY: 'auto' },
  container: {
    maxWidth: 720,
    margin: '0 auto',
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  title: { fontSize: 22, fontWeight: 700, color: '#e4e4e7', margin: 0 },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    border: '1px solid #27272a',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#e4e4e7',
    margin: 0,
    paddingBottom: 8,
    borderBottom: '1px solid #27272a',
  },
  cardText: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 1.6,
    margin: 0,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
  },
  rowLabel: { color: '#71717a' },
  rowValue: {
    color: '#e4e4e7',
    fontWeight: 500,
    maxWidth: '60%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    color: '#ffffff',
  },
  deviceCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#27272a',
    border: '1px solid #3f3f46',
  },
  logoutButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid rgba(248, 113, 113, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    color: '#f87171',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  licenseRow: {
    display: 'flex',
    gap: 8,
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #27272a',
    backgroundColor: '#0d0d0d',
    color: '#e4e4e7',
    fontSize: 13,
    fontFamily: 'var(--font-mono)',
    outline: 'none',
  },
  activateButton: {
    padding: '10px 18px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#6366f1',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  removeButton: {
    padding: '10px 18px',
    borderRadius: 8,
    border: '1px solid rgba(248, 113, 113, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: '#f87171',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  message: {
    fontSize: 12,
    padding: '8px 12px',
    borderRadius: 6,
    margin: 0,
  },
  featureList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    fontSize: 12,
    color: '#a5b4fc',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: 6,
    padding: '5px 10px',
  },
};
