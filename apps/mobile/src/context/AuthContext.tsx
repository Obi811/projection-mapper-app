import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User } from '@projection-mapper/shared';
import { loadTokens } from '../api/client';
import * as authApi from '../api/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on launch.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { access } = await loadTokens();
        if (access) {
          const me = await authApi.fetchMe();
          if (mounted) setUser(me);
        }
      } catch {
        // Token invalid/expired — stay logged out.
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toMessage = (e: unknown): string => {
    const err = e as { response?: { data?: { message?: string } }; message?: string };
    return err?.response?.data?.message ?? err?.message ?? 'Etwas ist schiefgelaufen';
  };

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const u = await authApi.login(email, password);
      setUser(u);
    } catch (e) {
      setError(toMessage(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    setError(null);
    setLoading(true);
    try {
      const u = await authApi.register(email, password, name);
      setUser(u);
    } catch (e) {
      setError(toMessage(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, error, login, register, logout, clearError }),
    [user, loading, error, login, register, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
