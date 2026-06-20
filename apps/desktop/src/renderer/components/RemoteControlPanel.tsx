/**
 * RemoteControlPanel Component
 * 
 * Remote control server management with QR code pairing
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import type { RemoteServerConfig, RemoteClientInfo } from '../../shared/types';

export const RemoteControlPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [serverInfo, setServerInfo] = useState<RemoteServerConfig | null>(null);
  const [clients, setClients] = useState<RemoteClientInfo[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkServerStatus();
  }, []);

  useEffect(() => {
    if (isRunning) {
      // Poll clients every 2 seconds
      const interval = setInterval(fetchClients, 2000);
      return () => clearInterval(interval);
    }
  }, [isRunning]);

  const checkServerStatus = async () => {
    if (!window.electronAPI?.remote) return;
    
    const running = await window.electronAPI.remote.isRunning();
    setIsRunning(running);
    
    if (running) {
      const info = await window.electronAPI.remote.getInfo();
      setServerInfo(info);
      await generateQRCode(info);
      await fetchClients();
    }
  };

  const fetchClients = async () => {
    if (!window.electronAPI?.remote) return;
    
    const clientList = await window.electronAPI.remote.getClients();
    setClients(clientList);
  };

  const generateQRCode = async (info: RemoteServerConfig) => {
    const connectionData = JSON.stringify({
      url: info.url,
      token: info.token,
      name: 'Projection Mapper',
    });
    
    const qrUrl = await QRCode.toDataURL(connectionData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#3b82f6',
        light: '#18181b',
      },
    });
    
    setQrCodeUrl(qrUrl);
  };

  const handleStartServer = async () => {
    if (!window.electronAPI?.remote) return;
    
    setLoading(true);
    try {
      const info = await window.electronAPI.remote.startServer(8765);
      setServerInfo(info);
      setIsRunning(true);
      await generateQRCode(info);
      await fetchClients();
    } catch (error) {
      console.error('Failed to start server:', error);
      alert('Fehler beim Starten des Servers');
    } finally {
      setLoading(false);
    }
  };

  const handleStopServer = async () => {
    if (!window.electronAPI?.remote) return;
    
    setLoading(true);
    try {
      await window.electronAPI.remote.stopServer();
      setIsRunning(false);
      setServerInfo(null);
      setClients([]);
      setQrCodeUrl('');
    } catch (error) {
      console.error('Failed to stop server:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Remote-Steuerung</h3>
        {!isRunning ? (
          <button 
            onClick={handleStartServer} 
            style={{ ...styles.button, ...styles.startButton }}
            disabled={loading}
          >
            {loading ? '⏳ Startet...' : '🚀 Server starten'}
          </button>
        ) : (
          <button 
            onClick={handleStopServer} 
            style={{ ...styles.button, ...styles.stopButton }}
            disabled={loading}
          >
            {loading ? '⏳ Stoppt...' : '⏹ Server stoppen'}
          </button>
        )}
      </div>

      {!isRunning ? (
        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            Starten Sie den Remote-Control-Server, um die App von einem mobilen Gerät
            zu steuern.
          </p>
        </div>
      ) : (
        <>
          {/* Server Info */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Server-Informationen</h4>
            <div style={styles.infoGrid}>
              <div style={styles.infoRow}>
                <span style={styles.label}>URL:</span>
                <span style={styles.value}>{serverInfo?.url}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Port:</span>
                <span style={styles.value}>{serverInfo?.port}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Token:</span>
                <code style={styles.token}>{serverInfo?.token.slice(0, 16)}...</code>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>QR-Code für Verbindung</h4>
            <div style={styles.qrContainer}>
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" style={styles.qrCode} />
              ) : (
                <div style={styles.qrPlaceholder}>Lade QR-Code...</div>
              )}
              <p style={styles.qrHint}>
                Scannen Sie diesen Code mit Ihrer mobilen App, um sich zu verbinden.
              </p>
            </div>
          </div>

          {/* Connected Clients */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>
              Verbundene Geräte ({clients.length})
            </h4>
            {clients.length === 0 ? (
              <p style={styles.emptyText}>Keine Geräte verbunden</p>
            ) : (
              <div style={styles.clientList}>
                {clients.map((client) => (
                  <div key={client.id} style={styles.clientCard}>
                    <div style={styles.clientHeader}>
                      <span style={styles.clientName}>
                        {client.authenticated ? '✅' : '🔒'} {client.name}
                      </span>
                      <span style={styles.clientStatus}>
                        {client.authenticated ? 'Authentifiziert' : 'Warte auf Auth'}
                      </span>
                    </div>
                    <div style={styles.clientFooter}>
                      <span style={styles.clientId}>ID: {client.id.slice(0, 8)}</span>
                      <span style={styles.clientTime}>
                        {new Date(client.connectedAt).toLocaleTimeString('de-DE')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: '#e4e4e7',
    margin: 0,
  },
  button: {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  startButton: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
  },
  stopButton: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
  },
  infoBox: {
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    border: '1px solid #27272a',
  },
  infoText: {
    fontSize: 14,
    color: '#a1a1aa',
    lineHeight: 1.6,
    margin: 0,
  },
  section: {
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    border: '1px solid #27272a',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#e4e4e7',
    margin: '0 0 16px 0',
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
  },
  label: {
    color: '#71717a',
  },
  value: {
    color: '#e4e4e7',
    fontWeight: 500,
  },
  token: {
    color: '#3b82f6',
    backgroundColor: '#18181b',
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  qrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  qrCode: {
    width: 256,
    height: 256,
    borderRadius: 8,
    border: '2px solid #27272a',
  },
  qrPlaceholder: {
    width: 256,
    height: 256,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181b',
    borderRadius: 8,
    border: '2px solid #27272a',
    color: '#71717a',
  },
  qrHint: {
    fontSize: 13,
    color: '#a1a1aa',
    textAlign: 'center',
    margin: 0,
  },
  emptyText: {
    fontSize: 13,
    color: '#71717a',
    fontStyle: 'italic',
    margin: 0,
  },
  clientList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  clientCard: {
    padding: 12,
    backgroundColor: '#27272a',
    borderRadius: 8,
    border: '1px solid #3f3f46',
  },
  clientHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e4e4e7',
  },
  clientStatus: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  clientFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#71717a',
  },
  clientId: {
    fontFamily: 'monospace',
  },
  clientTime: {},
};
