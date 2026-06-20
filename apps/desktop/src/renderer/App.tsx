/**
 * Root Application Component
 *
 * Richtet das Routing (HashRouter — kompatibel mit dem Electron-file://-
 * Protokoll), den Auth-Kontext und das Hauptlayout ein.
 *
 * Routen:
 *   /login                → Anmeldung / Registrierung (öffentlich)
 *   /                     → Dashboard (geschützt)
 *   /workspace            → Live-Arbeitsbereich (geschützt)
 *   /projectors           → Projektor-Verwaltung (geschützt)
 *   /addons               → Addon-Verwaltung (geschützt)
 *   /settings             → Einstellungen (geschützt)
 */

import React, { useEffect } from 'react';
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { ProjectorsPage } from './pages/ProjectorsPage';
import { AddonsPage } from './pages/AddonsPage';
import { AudioPage } from './pages/AudioPage';
import { RemotePage } from './pages/RemotePage';
import { SettingsPage } from './pages/SettingsPage';

/**
 * Login-Route — leitet bereits angemeldete Benutzer zum Dashboard weiter
 * und aktualisiert nach erfolgreichem Login den Auth-Kontext.
 */
const LoginRoute: React.FC = () => {
  const { isAuthenticated, refreshUser, loading } = useAuth();
  const navigate = useNavigate();

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <LoginPage
      onLoginSuccess={async () => {
        await refreshUser();
        navigate('/', { replace: true });
      }}
    />
  );
};

export const App: React.FC = () => {
  // Debug: Check electronAPI availability on startup
  useEffect(() => {
    console.log('[App] Startup Check:');
    console.log('  window.electronAPI:', !!window.electronAPI);
    if (window.electronAPI) {
      console.log('  electronAPI.auth:', !!window.electronAPI.auth);
      console.log('  electronAPI.license:', !!window.electronAPI.license);
      console.log('  electronAPI.projector:', !!window.electronAPI.projector);
      console.log('  electronAPI.app:', !!window.electronAPI.app);
      
      // Check specific license methods
      if (window.electronAPI.license) {
        console.log('  license.activate:', typeof window.electronAPI.license.activate);
        console.log('  license.getFeatures:', typeof window.electronAPI.license.getFeatures);
      }
    }
  }, []);

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Öffentlich */}
          <Route path="/login" element={<LoginRoute />} />

          {/* Geschützt */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/projectors" element={<ProjectorsPage />} />
              <Route path="/addons" element={<AddonsPage />} />
              <Route path="/audio" element={<AudioPage />} />
              <Route path="/remote" element={<RemotePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};
