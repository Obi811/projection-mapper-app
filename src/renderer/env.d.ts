/**
 * Type declarations for the renderer process environment.
 */

/// <reference types="vite/client" />

import type { ElectronAPI } from '../main/preload';

declare global {
  interface Window {
    /** Electron IPC bridge — only available when running inside Electron */
    electronAPI: ElectronAPI;
  }
}

export {};
