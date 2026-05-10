/**
 * Login Page
 *
 * Provides email/password authentication with register toggle.
 * Social auth buttons are rendered but disabled pending OAuth integration.
 *
 * In Electron: uses window.electronAPI.auth for IPC calls
 * In browser (dev): falls back to direct service calls
 */

import React, { useState, FormEvent } from 'react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (window.electronAPI) {
        // Running inside Electron — use IPC
        if (isRegister) {
          await window.electronAPI.auth.register(email, password, name || undefined);
        } else {
          await window.electronAPI.auth.login(email, password);
        }
      } else {
        // Running in browser (dev mode) — import services directly
        const { login, register } = await import('@services/auth-service');
        if (isRegister) {
          await register(email, password, name || undefined);
        } else {
          await login(email, password);
        }
      }
      onLoginSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎯 Projection Mapper</h1>
        <p style={styles.subtitle}>
          {isRegister ? 'Create your account' : 'Sign in to continue'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Please wait...' : isRegister ? 'Register' : 'Sign In'}
          </button>
        </form>

        {/* Social Auth — prepared, not yet wired */}
        <div style={styles.divider}>
          <span style={styles.dividerText}>or continue with</span>
        </div>
        <div style={styles.socialRow}>
          <button style={styles.socialButton} disabled title="Coming soon">
            🔵 Google
          </button>
          <button style={styles.socialButton} disabled title="Coming soon">
            🍎 Apple
          </button>
        </div>

        <p style={styles.toggle}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            style={styles.toggleButton}
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
          >
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};

// ─── Inline Styles (will be migrated to CSS modules / Tailwind later) ────

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
    width: 400,
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
    transition: 'background-color 0.2s',
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center' as const,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
    gap: 12,
  },
  dividerText: {
    color: '#71717a',
    fontSize: 12,
    whiteSpace: 'nowrap' as const,
    flex: 1,
    textAlign: 'center' as const,
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
    cursor: 'not-allowed',
    opacity: 0.6,
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
