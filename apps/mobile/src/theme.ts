/** Shared dark theme matching the desktop app's look & feel. */
export const theme = {
  colors: {
    background: '#0b0f19',
    surface: '#151b2b',
    surfaceAlt: '#1d2436',
    border: '#2a3346',
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    danger: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    textFaint: '#64748b',
  },
  spacing: (n: number) => n * 8,
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
  },
  font: {
    h1: 28,
    h2: 22,
    h3: 18,
    body: 15,
    small: 13,
    tiny: 11,
  },
} as const;

export type Theme = typeof theme;
