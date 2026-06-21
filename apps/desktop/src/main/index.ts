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
import {
  initStore,
  getProjectorConfigs,
  getKeystoneConfigs,
  getKeystonePresets,
  getInstalledAddons,
  setInstalledAddons,
  getAddonSettings,
  setAddonSettings,
  getDeviceId,
  getLicenseKey,
  getFeatures,
  setLicenseData,
  clearLicenseData,
} from './store';
import { loadConfigs } from '../services/output-manager';
import { loadConfigs as loadKeystoneConfigs, loadPresets as loadKeystonePresets } from '../services/keystone-service';
import { configurePluginLoader, initializeRegistry, shutdownAll } from '../services/plugin-loader';
import * as licenseService from '../services/license-service';
import { closeAllProjectorWindows } from './projector-window';
import { ADDON_DIR_NAME, LICENSE_REVALIDATION_INTERVAL_MS } from '../shared/constants';
import { IpcChannel } from '../shared/types';
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
    show: true, // Ensure window is shown immediately
    center: true, // Center on screen
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
    const indexPath = path.join(__dirname, '..', 'renderer', 'index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('[Main] Failed to load index.html:', err);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── License Enforcement ─────────────────────────────────────────────────────

let licenseRevalidationTimer: NodeJS.Timeout | null = null;

/**
 * Re-validate the stored license against the licensing server and enforce the
 * server-side state locally.
 *
 *  - If the server explicitly rejects the license (paused / revoked / deleted /
 *    expired), the local license + features are cleared and the renderer is
 *    notified so premium features are disabled immediately — no restart needed.
 *  - If the server confirms it, the local feature set is refreshed (the
 *    entitlement set may have changed server-side).
 *  - On network errors / unreachable server, the current local state is kept
 *    so legitimate offline usage continues uninterrupted.
 */
async function revalidateStoredLicense(): Promise<void> {
  const licenseKey = getLicenseKey();
  if (!licenseKey) {
    return; // No license stored — nothing to enforce.
  }

  const deviceId = getDeviceId();
  const verdict = await licenseService.revalidateLicense(licenseKey, deviceId);

  if (verdict.status === 'invalid') {
    console.warn(
      `[license] Stored license is no longer valid (${verdict.reason}) — revoking local entitlements.`,
    );
    clearLicenseData();
    licenseService.setEnabledFeatures([]);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IpcChannel.LICENSE_CHANGED, []);
    }
  } else if (verdict.status === 'valid') {
    // Refresh the feature set in case it changed server-side.
    setLicenseData(licenseKey, verdict.features);
    licenseService.setEnabledFeatures(verdict.features);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IpcChannel.LICENSE_CHANGED, verdict.features);
    }
  }
  // 'unknown' → keep current state (offline grace).
}

// ─── App Lifecycle ──────────────────────────────────────────────────────────

app.whenReady().then(() => {
  initStore();

  // Load persisted projector configurations
  const savedConfigs = getProjectorConfigs();
  if (savedConfigs.length > 0) {
    loadConfigs(savedConfigs);
  }

  // Load persisted keystone configurations and presets
  const savedKeystoneConfigs = getKeystoneConfigs();
  if (savedKeystoneConfigs.length > 0) {
    loadKeystoneConfigs(savedKeystoneConfigs);
  }
  const savedKeystonePresets = getKeystonePresets();
  if (savedKeystonePresets.length > 0) {
    loadKeystonePresets(savedKeystonePresets);
  }

  // Initialise addon plugin loader
  const addonsDir = path.join(app.getPath('userData'), ADDON_DIR_NAME);
  configurePluginLoader({
    addonsDir,
    storage: {
      getInstalledAddons,
      setInstalledAddons,
      getAddonData: (addonId: string) => {
        const all = getAddonSettings();
        return all[addonId] ?? {};
      },
      setAddonData: (addonId: string, data: Record<string, unknown>) => {
        const all = getAddonSettings();
        all[addonId] = data;
        setAddonSettings(all);
      },
    },
  });
  initializeRegistry().catch((err) =>
    console.error('[addon] Failed to initialise addon registry:', err),
  );

  // Load persisted license features into the in-memory service so feature
  // gates are consistent before any server round-trip completes.
  licenseService.setEnabledFeatures(getFeatures());

  registerIpcHandlers();
  createWindow();

  // Enforce server-side license state: re-validate the stored license once at
  // startup, then periodically while the app runs. A license paused or deleted
  // on the licensing server will disable premium features without a restart.
  revalidateStoredLicense().catch((err) =>
    console.error('[license] Startup re-validation failed:', err),
  );
  licenseRevalidationTimer = setInterval(() => {
    revalidateStoredLicense().catch((err) =>
      console.error('[license] Periodic re-validation failed:', err),
    );
  }, LICENSE_REVALIDATION_INTERVAL_MS);

  // macOS: re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Close all projector windows and shutdown addons before quitting
app.on('before-quit', () => {
  if (licenseRevalidationTimer) {
    clearInterval(licenseRevalidationTimer);
    licenseRevalidationTimer = null;
  }
  shutdownAll();
  closeAllProjectorWindows();
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

export { mainWindow };
