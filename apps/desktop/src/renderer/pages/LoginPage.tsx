/**
 * Login Page
 *
 * Full authentication UI with:
 * - Email/password login & registration
 * - Social auth (Google, Apple) via OAuth popup flow
 * - Passkey / WebAuthn login (biometric: TouchID, FaceID, Windows Hello)
 * - Error handling with user-friendly messages
 * - Loading states for all auth actions
 *
 * In Electron: uses window.electronAPI.auth for IPC calls
 * In browser (dev): falls back to direct service calls
 */

import React, { useState, useEffect, FormEvent } from 'react';
import {
  isWebAuthnAvailable,
  isPlatformAuthenticatorAvailable,
  decodeLoginOptions,
  serializeLoginCredential,
} from '../utils/webauthn';
import {
  initiateGoogleSignIn,
  initiateAppleSignIn,
} from '../utils/social-auth';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

/** Map common error messages to user-friendly text */
function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('network') || msg.includes('econnrefused') || msg.includes('timeout')) {
      return 'Server nicht erreichbar. Bitte Internetverbindung prüfen.';
    }
    if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid credentials')) {
      return 'Ungültige E-Mail oder Passwort.';
    }
    if (msg.includes('409') || msg.includes('already exists') || msg.includes('conflict')) {
      return 'Ein Konto mit dieser E-Mail existiert bereits.';
    }
    if (msg.includes('404')) {
      return 'Server-Endpunkt nicht gefunden. Bitte App aktualisieren.';
    }
    if (msg.includes('429') || msg.includes('rate limit')) {
      return 'Zu viele Versuche. Bitte warte einen Moment.';
    }
    if (msg.includes('500') || msg.includes('internal server')) {
      return 'Serverfehler. Bitte versuche es später erneut.';
    }
    if (msg.includes('popup') || msg.includes('window was closed')) {
      return 'Anmeldefenster wurde geschlossen.';
    }
    return err.message;
  }
  return 'Authentifizierung fehlgeschlagen. Bitte erneut versuchen.';
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { setUser } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  // Check for WebAuthn / platform authenticator availability
  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setPasskeyAvailable);
  }, []);

  // ─── Email / Password Submit ──────────────────────────────────────────

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      let response;
      if (window.electronAPI) {
        if (isRegister) {
          response = await window.electronAPI.auth.register(email, password, name || undefined);
        } else {
          response = await window.electronAPI.auth.login(email, password);
        }
      } else {
        const { login, register } = await import('@services/auth-service');
        if (isRegister) {
          response = await register(email, password, name || undefined);
        } else {
          response = await login(email, password);
        }
      }
      
      // Set user immediately in context to avoid race condition
      if (response?.user) {
        setUser(response.user);
      }
      
      setSuccess(isRegister ? 'Konto erstellt!' : 'Erfolgreich angemeldet!');
      setTimeout(onLoginSuccess, 300);
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // ─── Social Auth ──────────────────────────────────────────────────────

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    setError(null);
    setSuccess(null);
    setSocialLoading(provider);

    try {
      let idToken: string;

      if (provider === 'google') {
        idToken = await initiateGoogleSignIn();
      } else {
        idToken = await initiateAppleSignIn();
      }

      let response;
      if (window.electronAPI) {
        response = await window.electronAPI.auth.socialAuth(provider, idToken);
      } else {
        const { socialAuth } = await import('@services/auth-service');
        response = await socialAuth(provider, idToken);
      }

      // Set user immediately in context to avoid race condition
      if (response?.user) {
        setUser(response.user);
      }

      setSuccess('Erfolgreich angemeldet!');
      setTimeout(onLoginSuccess, 300);
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setSocialLoading(null);
    }
  };

  // ─── Passkey Login ────────────────────────────────────────────────────

  const handlePasskeyLogin = async () => {
    setError(null);
    setSuccess(null);
    setPasskeyLoading(true);

    try {
      let options: Record<string, unknown>;

      if (window.electronAPI) {
        options = await window.electronAPI.auth.passkeyLoginStart();
      } else {
        const { passkeyLoginStart } = await import('@services/auth-service');
        options = await passkeyLoginStart();
      }

      // Convert server options → WebAuthn API format
      const credentialOptions = decodeLoginOptions(options);

      // Trigger biometric prompt (TouchID / FaceID / Windows Hello)
      const credential = await navigator.credentials.get(credentialOptions);
      if (!credential) {
        throw new Error('Passkey-Authentifizierung abgebrochen.');
      }

      const serialized = serializeLoginCredential(credential as PublicKeyCredential);

      let response;
      if (window.electronAPI) {
        response = await window.electronAPI.auth.passkeyLoginFinish(serialized);
      } else {
        const { passkeyLoginFinish } = await import('@services/auth-service');
        response = await passkeyLoginFinish(serialized);
      }

      // Set user immediately in context to avoid race condition
      if (response?.user) {
        setUser(response.user);
      }

      setSuccess('Erfolgreich mit Passkey angemeldet!');
      setTimeout(onLoginSuccess, 300);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Passkey-Authentifizierung abgebrochen.');
      } else {
        setError(friendlyError(err));
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────

  const isAnyLoading = loading || socialLoading !== null || passkeyLoading;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎯 Projection Mapper</h1>
        <p style={styles.subtitle}>
          {isRegister ? 'Konto erstellen' : 'Anmelden'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              disabled={isAnyLoading}
            />
          )}
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            disabled={isAnyLoading}
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={styles.input}
            disabled={isAnyLoading}
          />

          {error && <p style={styles.error}>⚠️ {error}</p>}
          {success && <p style={styles.success}>✅ {success}</p>}

          <button type="submit" disabled={isAnyLoading} style={{
            ...styles.button,
            opacity: isAnyLoading ? 0.6 : 1,
          }}>
            {loading
              ? 'Bitte warten...'
              : isRegister
                ? 'Registrieren'
                : 'Anmelden'}
          </button>
        </form>

        {/* Passkey Login */}
        {passkeyAvailable && !isRegister && (
          <>
            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>oder</span>
              <span style={styles.dividerLine} />
            </div>
            <button
              style={{
                ...styles.passkeyButton,
                opacity: isAnyLoading ? 0.6 : 1,
              }}
              onClick={handlePasskeyLogin}
              disabled={isAnyLoading}
            >
              {passkeyLoading ? '🔐 Warte auf Biometrie...' : '🔐 Mit Passkey anmelden'}
            </button>
          </>
        )}

        {/* Social Auth */}
        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>oder fortfahren mit</span>
          <span style={styles.dividerLine} />
        </div>
        <div style={styles.socialRow}>
          <button
            style={{
              ...styles.socialButton,
              opacity: isAnyLoading ? 0.6 : 1,
              cursor: isAnyLoading ? 'not-allowed' : 'pointer',
            }}
            onClick={() => handleSocialAuth('google')}
            disabled={isAnyLoading}
          >
            {socialLoading === 'google' ? '⏳ Google...' : '🔵 Google'}
          </button>
          <button
            style={{
              ...styles.socialButton,
              opacity: isAnyLoading ? 0.6 : 1,
              cursor: isAnyLoading ? 'not-allowed' : 'pointer',
            }}
            onClick={() => handleSocialAuth('apple')}
            disabled={isAnyLoading}
          >
            {socialLoading === 'apple' ? '⏳ Apple...' : '🍎 Apple'}
          </button>
        </div>

        <p style={styles.toggle}>
          {isRegister ? 'Bereits ein Konto?' : 'Noch kein Konto?'}{' '}
          <button
            style={styles.toggleButton}
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
              setSuccess(null);
            }}
            disabled={isAnyLoading}
          >
            {isRegister ? 'Anmelden' : 'Registrieren'}
          </button>
        </p>
      </div>
    </div>
  );
};

// ─── Inline Styles ──────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #16213e 100%)',
  },
  card: {
    width: 420,
    padding: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 33, 62, 0.8)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    textAlign: 'center' as const,
    marginBottom: 8,
    color: '#e4e4e7',
  },
  subtitle: {
    textAlign: 'center' as const,
    color: '#a1a1aa',
    marginBottom: 24,
    fontSize: 14,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  input: {
    padding: '12px 16px',
    borderRadius: 8,
    border: '1px solid #27272a',
    backgroundColor: '#0d0d0d',
    color: '#e4e4e7',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '12px 16px',
    borderRadius: 8,
    backgroundColor: '#6366f1',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    marginTop: 4,
    transition: 'all 0.2s',
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center' as const,
    padding: '8px 12px',
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    margin: 0,
  },
  success: {
    color: '#22c55e',
    fontSize: 13,
    textAlign: 'center' as const,
    padding: '8px 12px',
    borderRadius: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    margin: 0,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#27272a',
  },
  dividerText: {
    color: '#71717a',
    fontSize: 12,
    whiteSpace: 'nowrap' as const,
  },
  passkeyButton: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 8,
    border: '1px solid #6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    color: '#a5b4fc',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  socialRow: {
    display: 'flex',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: 8,
    border: '1px solid #27272a',
    backgroundColor: '#1a1a2e',
    color: '#a1a1aa',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  toggle: {
    textAlign: 'center' as const,
    marginTop: 20,
    fontSize: 13,
    color: '#a1a1aa',
  },
  toggleButton: {
    color: '#6366f1',
    fontWeight: 600,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
  },
};
