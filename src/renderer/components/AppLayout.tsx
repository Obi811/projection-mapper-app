/**
 * AppLayout — Hauptlayout nach der Anmeldung.
 *
 * Besteht aus:
 *  - einer linken Navigationsleiste (Dashboard, Arbeitsbereich, Projektoren,
 *    Addons, Einstellungen)
 *  - einer Kopfzeile mit Logo, Versionsanzeige und Benutzerprofil/Abmelden
 *  - dem Inhaltsbereich (<Outlet/>) für die aktive Seite
 */

import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppVersion } from '../hooks/useAppVersion';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/workspace', label: 'Arbeitsbereich', icon: '🎯' },
  { to: '/projectors', label: 'Projektoren', icon: '📽️' },
  { to: '/addons', label: 'Addons', icon: '🧩' },
  { to: '/settings', label: 'Einstellungen', icon: '⚙️' },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/workspace': 'Arbeitsbereich',
  '/projectors': 'Projektoren',
  '/addons': 'Addons',
  '/settings': 'Einstellungen',
};

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const version = useAppVersion();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Menü bei Klick außerhalb schließen
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Projection Mapper';

  const displayName = user?.name || user?.email || 'Benutzer';
  const initials = (user?.name || user?.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div style={styles.root}>
      {/* ─── Navigationsleiste ───────────────────────────────── */}
      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          <span style={styles.navLogo}>🎯</span>
        </div>

        <div style={styles.navItems}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              })}
              title={item.label}
            >
              <span style={styles.navItemIcon}>{item.icon}</span>
              <span style={styles.navItemLabel}>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div style={styles.navFooter}>
          <span style={styles.navVersion}>v{version}</span>
        </div>
      </nav>

      {/* ─── Hauptbereich ────────────────────────────────────── */}
      <div style={styles.main}>
        {/* Kopfzeile */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.headerTitle}>{pageTitle}</h1>
          </div>

          <div style={styles.headerRight} ref={menuRef}>
            <button
              style={styles.profileButton}
              onClick={() => setMenuOpen((o) => !o)}
              title="Benutzerkonto"
            >
              <span style={styles.avatar}>{initials}</span>
              <span style={styles.profileName}>{displayName}</span>
              <span style={styles.chevron}>{menuOpen ? '▴' : '▾'}</span>
            </button>

            {menuOpen && (
              <div style={styles.dropdown}>
                <div style={styles.dropdownHeader}>
                  <span style={styles.dropdownName}>{displayName}</span>
                  {user?.email && (
                    <span style={styles.dropdownEmail}>{user.email}</span>
                  )}
                </div>
                <div style={styles.dropdownDivider} />
                <button
                  style={styles.logoutButton}
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  ⏻ Abmelden
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Inhaltsbereich */}
        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#0d0d0d',
  },
  // Navigation
  nav: {
    width: 96,
    minWidth: 96,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#16161f',
    borderRight: '1px solid #27272a',
    paddingTop: 16,
    paddingBottom: 12,
  },
  navBrand: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 20,
  },
  navLogo: {
    fontSize: 26,
  },
  navItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
    padding: '0 8px',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '10px 4px',
    borderRadius: 10,
    color: '#a1a1aa',
    textDecoration: 'none',
    fontSize: 10,
    fontWeight: 500,
    transition: 'all 0.15s',
  },
  navItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    color: '#a5b4fc',
  },
  navItemIcon: {
    fontSize: 20,
  },
  navItemLabel: {
    textAlign: 'center',
    lineHeight: 1.2,
  },
  navFooter: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 8,
  },
  navVersion: {
    fontSize: 10,
    color: '#52525b',
    fontFamily: 'var(--font-mono)',
  },
  // Hauptbereich
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    height: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    minHeight: 56,
    padding: '0 20px',
    backgroundColor: '#16161f',
    borderBottom: '1px solid #27272a',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#e4e4e7',
    margin: 0,
  },
  headerRight: {
    position: 'relative',
  },
  profileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid #27272a',
    backgroundColor: '#0d0d0d',
    cursor: 'pointer',
    color: '#e4e4e7',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: '#6366f1',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 600,
  },
  profileName: {
    fontSize: 13,
    fontWeight: 500,
    maxWidth: 160,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chevron: {
    fontSize: 10,
    color: '#71717a',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 240,
    backgroundColor: '#1a1a2e',
    border: '1px solid #27272a',
    borderRadius: 10,
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
    padding: 8,
    zIndex: 100,
  },
  dropdownHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '8px 10px',
  },
  dropdownName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#e4e4e7',
  },
  dropdownEmail: {
    fontSize: 12,
    color: '#71717a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#27272a',
    margin: '4px 0',
  },
  logoutButton: {
    width: '100%',
    textAlign: 'left',
    padding: '8px 10px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#f87171',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
};
