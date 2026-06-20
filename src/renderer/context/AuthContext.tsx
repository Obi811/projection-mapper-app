/**
 * AuthContext — Zentrale Verwaltung des Authentifizierungszustands.
 *
 * Hält den aktuell eingeloggten Benutzer, stellt Login-/Logout-Funktionen
 * bereit und lädt beim Start die bestehende Sitzung (persistierte Tokens)
 * aus dem Electron-Hauptprozess.
 *
 * Verwendung:
 *   const { user, isAuthenticated, login, logout, loading } = useAuth();
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from '../../shared/types';

interface AuthContextValue {
  /** Aktuell eingeloggter Benutzer oder null */
  user: User | null;
  /** true, sobald ein gültiger Benutzer vorhanden ist */
  isAuthenticated: boolean;
  /** true, während die bestehende Sitzung geprüft wird */
  loading: boolean;
  /** Aktualisiert den Benutzer aus dem Hauptprozess (nach Login) */
  refreshUser: () => Promise<void>;
  /** Setzt den Benutzer direkt (z. B. nach erfolgreichem Login) */
  setUser: (user: User | null) => void;
  /** Meldet den Benutzer ab und löscht die Sitzung */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      if (window.electronAPI?.auth) {
        const result = (await window.electronAPI.auth.getUser()) as User | null;
        setUser(result ?? null);
      }
    } catch {
      // Im Browser-Dev-Modus oder bei fehlender Sitzung ignorieren
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Bestehende Sitzung beim Start laden
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      if (window.electronAPI?.auth) {
        await window.electronAPI.auth.logout();
      }
    } catch {
      // Auch bei Fehler lokal abmelden
    } finally {
      setUser(null);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    loading,
    refreshUser,
    setUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** Hook für den Zugriff auf den Auth-Kontext */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth muss innerhalb von <AuthProvider> verwendet werden');
  }
  return ctx;
}
