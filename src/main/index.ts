/**
 * Electron Main Process — Application Entry Point
 *
 * Responsibilities:
 * - Create and manage BrowserWindow instances
 * - Register IPC handlers for auth, licensing, and device operations
 * - Persist settings via electron-store
 * - Manage application lifecycle (ready, activate, window-all-closed)
 *
 * Architecture:
 *   main/index.ts  ←  entry, window creation, lifecycle
 *   main/ipc.ts    ←  IPC handler registration
 *   main/store.ts  ←  electron-store wrapper
 */

import { app, BrowserWindow } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc';
import { initStore, getProjectorConfigs } from './store';
import { loadConfigs } from '../services/output-manager';
import { closeAllProjectorWindows } from './projector-window';
import {
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
  APP_NAME,
} from '../shared/constants';

let mainWindow: BrowserWindow | null = null;

/**
 * Create the primary application window.
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    title: APP_NAME,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    // Modern frameless look — uncomment for custom titlebar:
    // titleBarStyle: 'hiddenInset',
    // frame: false,
  });

  // In development, load from Vite dev server; in production, load built files
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── App Lifecycle ──────────────────────────────────────────────────────────

app.whenReady().then(() => {
  initStore();

  // Load persisted projector configurations
  const savedConfigs = getProjectorConfigs();
  if (savedConfigs.length > 0) {
    loadConfigs(savedConfigs);
  }

  registerIpcHandlers();
  createWindow();

  // macOS: re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Close all projector windows before quitting
app.on('before-quit', () => {
  closeAllProjectorWindows();
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

export { mainWindow };
