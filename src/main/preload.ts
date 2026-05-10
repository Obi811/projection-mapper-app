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
