/**
 * ProtectedRoute — Schützt Routen, die eine Anmeldung erfordern.
 *
 * Ist kein Benutzer angemeldet, wird auf die Login-Seite umgeleitet.
 * Während die Sitzung geprüft wird, erscheint ein Ladeindikator.
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Sitzung wird geladen…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const styles: Record<string, React.CSSProperties> = {
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    gap: 16,
    backgroundColor: '#0d0d0d',
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #27272a',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'pm-spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: 13,
    color: '#71717a',
  },
};
