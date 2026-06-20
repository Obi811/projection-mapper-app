/**
 * Preload Script — Secure bridge between Main and Renderer processes.
 *
 * Exposes a strictly typed API to the renderer via contextBridge.
 * The renderer accesses these through `window.electronAPI`.
 *
 * Security:
 * - contextIsolation: true  → renderer cannot access Node.js APIs
 * - nodeIntegration: false   → no require() in renderer
 * - Only whitelisted IPC channels are exposed
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannel } from '../shared/types';

/**
 * The API surface exposed to the renderer process.
 * Accessible via `window.electronAPI` in React components.
 */
const electronAPI = {
  // ─── Auth ─────────────────────────────────────────────────────────────
  auth: {
    login: (email: string, password: string) =>
      ipcRenderer.invoke(IpcChannel.AUTH_LOGIN, email, password),

    register: (email: string, password: string, name?: string) =>
      ipcRenderer.invoke(IpcChannel.AUTH_REGISTER, email, password, name),

    logout: () => ipcRenderer.invoke(IpcChannel.AUTH_LOGOUT),

    getUser: () => ipcRenderer.invoke(IpcChannel.AUTH_GET_USER),

    socialAuth: (provider: string, idToken: string) =>
      ipcRenderer.invoke(IpcChannel.AUTH_SOCIAL, provider, idToken),

    passkeyRegisterStart: () =>
      ipcRenderer.invoke(IpcChannel.AUTH_PASSKEY_REGISTER_START),
    passkeyRegisterFinish: (credential: unknown) =>
      ipcRenderer.invoke(IpcChannel.AUTH_PASSKEY_REGISTER_FINISH, credential),
    passkeyLoginStart: () =>
      ipcRenderer.invoke(IpcChannel.AUTH_PASSKEY_LOGIN_START),
    passkeyLoginFinish: (credential: unknown) =>
      ipcRenderer.invoke(IpcChannel.AUTH_PASSKEY_LOGIN_FINISH, credential),
  },

  // ─── License ──────────────────────────────────────────────────────────
  license: {
    validate: (licenseKey: string) =>
      ipcRenderer.invoke(IpcChannel.LICENSE_VALIDATE, licenseKey),

    activate: (licenseKey: string) =>
      ipcRenderer.invoke(IpcChannel.LICENSE_ACTIVATE, licenseKey),

    getFeatures: () => ipcRenderer.invoke(IpcChannel.LICENSE_GET_FEATURES),
  },

  // ─── Device ───────────────────────────────────────────────────────────
  device: {
    getId: () => ipcRenderer.invoke(IpcChannel.DEVICE_GET_ID),
  },

  // ─── Projector / Output Manager ────────────────────────────────────────
  projector: {
    getDisplays: () => ipcRenderer.invoke(IpcChannel.PROJECTOR_GET_DISPLAYS),
    scanDisplays: () => ipcRenderer.invoke(IpcChannel.PROJECTOR_SCAN_DISPLAYS),
    getConfigs: () => ipcRenderer.invoke(IpcChannel.PROJECTOR_GET_CONFIGS),
    saveConfig: (config: Record<string, unknown>) =>
      ipcRenderer.invoke(IpcChannel.PROJECTOR_SAVE_CONFIG, config),
    deleteConfig: (projectorId: string) =>
      ipcRenderer.invoke(IpcChannel.PROJECTOR_DELETE_CONFIG, projectorId),
    openWindow: (projectorId: string) =>
      ipcRenderer.invoke(IpcChannel.PROJECTOR_OPEN_WINDOW, projectorId),
    closeWindow: (projectorId: string) =>
      ipcRenderer.invoke(IpcChannel.PROJECTOR_CLOSE_WINDOW, projectorId),
    getStates: () => ipcRenderer.invoke(IpcChannel.PROJECTOR_GET_STATES),
    onStateChange: (callback: (states: unknown[]) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, states: unknown[]) => callback(states);
      ipcRenderer.on(IpcChannel.PROJECTOR_GET_STATES, handler);
      return () => ipcRenderer.removeListener(IpcChannel.PROJECTOR_GET_STATES, handler);
    },
    onContentUpdate: (callback: (content: unknown) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, content: unknown) => callback(content);
      ipcRenderer.on(IpcChannel.PROJECTOR_UPDATE_CONTENT, handler);
      return () => ipcRenderer.removeListener(IpcChannel.PROJECTOR_UPDATE_CONTENT, handler);
    },
  },

  // ─── Keystone Correction ────────────────────────────────────────────────
  keystone: {
    getConfig: (projectorId: string) =>
      ipcRenderer.invoke(IpcChannel.KEYSTONE_GET_CONFIG, projectorId),
    saveConfig: (projectorId: string, update: Record<string, unknown>) =>
      ipcRenderer.invoke(IpcChannel.KEYSTONE_SAVE_CONFIG, projectorId, update),
    deleteConfig: (projectorId: string) =>
      ipcRenderer.invoke(IpcChannel.KEYSTONE_DELETE_CONFIG, projectorId),
    getPresets: (projectorId: string) =>
      ipcRenderer.invoke(IpcChannel.KEYSTONE_GET_PRESETS, projectorId),
    savePreset: (projectorId: string, name: string, corners: unknown) =>
      ipcRenderer.invoke(IpcChannel.KEYSTONE_SAVE_PRESET, projectorId, name, corners),
    deletePreset: (presetId: string) =>
      ipcRenderer.invoke(IpcChannel.KEYSTONE_DELETE_PRESET, presetId),
    reset: (projectorId: string) =>
      ipcRenderer.invoke(IpcChannel.KEYSTONE_RESET, projectorId),
  },

  // ─── Addon System ──────────────────────────────────────────────────────
  addon: {
    listMarketplace: (category?: string) =>
      ipcRenderer.invoke(IpcChannel.ADDON_LIST_MARKETPLACE, category),
    getDetails: (slug: string) =>
      ipcRenderer.invoke(IpcChannel.ADDON_GET_DETAILS, slug),
    install: (sourcePath: string) =>
      ipcRenderer.invoke(IpcChannel.ADDON_INSTALL, sourcePath),
    uninstall: (addonId: string) =>
      ipcRenderer.invoke(IpcChannel.ADDON_UNINSTALL, addonId),
    enable: (addonId: string) =>
      ipcRenderer.invoke(IpcChannel.ADDON_ENABLE, addonId),
    disable: (addonId: string) =>
      ipcRenderer.invoke(IpcChannel.ADDON_DISABLE, addonId),
    getInstalled: () =>
      ipcRenderer.invoke(IpcChannel.ADDON_GET_INSTALLED),
    getSettings: (addonId: string) =>
      ipcRenderer.invoke(IpcChannel.ADDON_GET_SETTINGS, addonId),
    saveSettings: (addonId: string, settings: Record<string, unknown>) =>
      ipcRenderer.invoke(IpcChannel.ADDON_SAVE_SETTINGS, addonId, settings),
    listMyAddons: () =>
      ipcRenderer.invoke(IpcChannel.ADDON_LIST_MY),
    checkAddon: (slug: string) =>
      ipcRenderer.invoke(IpcChannel.ADDON_CHECK_OWNED, slug),
    purchase: (addonId: string) =>
      ipcRenderer.invoke(IpcChannel.ADDON_PURCHASE, addonId),
    checkUpdates: () =>
      ipcRenderer.invoke(IpcChannel.ADDON_CHECK_UPDATES),
  },

  // ─── Portal ───────────────────────────────────────────────────────────
  portal: {
    getProfile: () =>
      ipcRenderer.invoke(IpcChannel.PORTAL_GET_PROFILE),
    getDashboard: () =>
      ipcRenderer.invoke(IpcChannel.PORTAL_GET_DASHBOARD),
    getDevices: () =>
      ipcRenderer.invoke(IpcChannel.PORTAL_GET_DEVICES),
    updateProfile: (payload: Record<string, unknown>) =>
      ipcRenderer.invoke(IpcChannel.PORTAL_UPDATE_PROFILE, payload),
  },

  // ─── Audio ────────────────────────────────────────────────────────────
  audio: {
    openFile: () =>
      ipcRenderer.invoke(IpcChannel.AUDIO_OPEN_FILE),
  },

  // ─── Remote Control ───────────────────────────────────────────────────
  remote: {
    startServer: (port?: number) =>
      ipcRenderer.invoke(IpcChannel.REMOTE_START_SERVER, port),
    stopServer: () =>
      ipcRenderer.invoke(IpcChannel.REMOTE_STOP_SERVER),
    getInfo: () =>
      ipcRenderer.invoke(IpcChannel.REMOTE_GET_INFO),
    getClients: () =>
      ipcRenderer.invoke(IpcChannel.REMOTE_GET_CLIENTS),
    isRunning: () =>
      ipcRenderer.invoke(IpcChannel.REMOTE_IS_RUNNING),
  },

  // ─── App ──────────────────────────────────────────────────────────────
  app: {
    getVersion: () => ipcRenderer.invoke(IpcChannel.APP_GET_VERSION),
    quit: () => ipcRenderer.invoke(IpcChannel.APP_QUIT),
  },
};

// Expose to renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the renderer process
export type ElectronAPI = typeof electronAPI;
