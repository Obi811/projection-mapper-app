/**
 * Projector Window Manager
 *
 * Creates and manages dedicated BrowserWindow instances for each projector.
 * Each projector window renders its own Three.js scene on a specific display.
 *
 * Features:
 * - Fullscreen mode for projection output
 * - Window positioning on specific displays
 * - IPC communication between main window and projector windows
 * - Graceful cleanup on close
 */

import { BrowserWindow, screen, ipcMain } from 'electron';
import path from 'path';
import type { ProjectorConfig, ProjectorState } from '../shared/types';
import { IpcChannel } from '../shared/types';
import {
  PROJECTOR_WINDOW_MIN_WIDTH,
  PROJECTOR_WINDOW_MIN_HEIGHT,
} from '../shared/constants';
import * as outputManager from '../services/output-manager';

/** Map of projector ID → BrowserWindow */
const projectorWindows: Map<string, BrowserWindow> = new Map();

/**
 * Create a dedicated BrowserWindow for a projector output.
 *
 * @param config - Projector configuration (display, resolution, position)
 * @returns The created BrowserWindow, or null if the display is not found
 */
export function createProjectorWindow(config: ProjectorConfig): BrowserWindow | null {
  // Check if window already exists for this projector
  const existing = projectorWindows.get(config.id);
  if (existing && !existing.isDestroyed()) {
    existing.focus();
    return existing;
  }

  // Find the target display
  const displays = screen.getAllDisplays();
  const targetDisplay = displays.find((d) => d.id === config.displayId)
    || displays[config.displayIndex]
    || displays[0];

  if (!targetDisplay) {
    outputManager.updateState(config.id, { status: 'error' });
    return null;
  }

  const { x, y, width, height } = targetDisplay.bounds;

  const win = new BrowserWindow({
    x: config.fullscreen ? x : (config.position?.x ?? x),
    y: config.fullscreen ? y : (config.position?.y ?? y),
    width: config.fullscreen ? width : config.resolution.width,
    height: config.fullscreen ? height : config.resolution.height,
    minWidth: PROJECTOR_WINDOW_MIN_WIDTH,
    minHeight: PROJECTOR_WINDOW_MIN_HEIGHT,
    title: `Projector: ${config.name}`,
    fullscreen: config.fullscreen,
    frame: !config.fullscreen,
    alwaysOnTop: config.fullscreen,
    skipTaskbar: config.fullscreen,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Load the projector renderer page
  const isDev = !require('electron').app.isPackaged;
  if (isDev) {
    win.loadURL(`http://localhost:5173/#/projector/${config.id}`);
  } else {
    win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'), {
      hash: `/projector/${config.id}`,
    });
  }

  // Track the window
  projectorWindows.set(config.id, win);
  outputManager.updateState(config.id, {
    status: 'active',
    windowId: win.id,
  });

  // Notify main window of state change
  notifyMainWindow();

  // Cleanup on close
  win.on('closed', () => {
    projectorWindows.delete(config.id);
    outputManager.updateState(config.id, {
      status: 'idle',
      windowId: undefined,
      fps: undefined,
    });
    notifyMainWindow();
  });

  return win;
}

/**
 * Close a projector window by projector ID.
 */
export function closeProjectorWindow(projectorId: string): boolean {
  const win = projectorWindows.get(projectorId);
  if (win && !win.isDestroyed()) {
    win.close();
    return true;
  }
  projectorWindows.delete(projectorId);
  return false;
}

/**
 * Close all projector windows.
 */
export function closeAllProjectorWindows(): void {
  for (const [id, win] of projectorWindows) {
    if (!win.isDestroyed()) {
      win.close();
    }
    projectorWindows.delete(id);
  }
}

/**
 * Get a projector window by ID.
 */
export function getProjectorWindow(projectorId: string): BrowserWindow | undefined {
  const win = projectorWindows.get(projectorId);
  if (win && !win.isDestroyed()) return win;
  projectorWindows.delete(projectorId);
  return undefined;
}

/**
 * Get all active projector windows.
 */
export function getActiveProjectorWindows(): Map<string, BrowserWindow> {
  // Clean up destroyed windows
  for (const [id, win] of projectorWindows) {
    if (win.isDestroyed()) {
      projectorWindows.delete(id);
    }
  }
  return new Map(projectorWindows);
}

/**
 * Send content update to a specific projector window via IPC.
 */
export function sendContentToProjector(
  projectorId: string,
  content: { surfaces: string[]; overlays?: unknown[] },
): boolean {
  const win = projectorWindows.get(projectorId);
  if (!win || win.isDestroyed()) return false;

  win.webContents.send(IpcChannel.PROJECTOR_UPDATE_CONTENT, {
    projectorId,
    ...content,
  });
  return true;
}

/**
 * Broadcast a message to all projector windows.
 */
export function broadcastToProjectors(channel: string, data: unknown): void {
  for (const [, win] of projectorWindows) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  }
}

/**
 * Notify the main renderer window about projector state changes.
 */
function notifyMainWindow(): void {
  const allWindows = BrowserWindow.getAllWindows();
  // The main window is typically the first non-projector window
  const mainWin = allWindows.find(
    (w) => !Array.from(projectorWindows.values()).includes(w),
  );
  if (mainWin && !mainWin.isDestroyed()) {
    mainWin.webContents.send(
      IpcChannel.PROJECTOR_GET_STATES,
      outputManager.getStates(),
    );
  }
}

/**
 * Get the count of open projector windows.
 */
export function getOpenWindowCount(): number {
  let count = 0;
  for (const [, win] of projectorWindows) {
    if (!win.isDestroyed()) count++;
  }
  return count;
}
