/**
 * IPC Handler Registration
 *
 * Bridges the renderer process (React UI) with backend services
 * via Electron's contextBridge / ipcMain invoke pattern.
 *
 * Each handler maps an IpcChannel to a service call, reads/writes
 * the electron-store as needed, and returns typed results.
 */

import { ipcMain, app } from 'electron';
import { IpcChannel } from '../shared/types';
import * as authService from '../services/auth-service';
import * as licenseService from '../services/license-service';
import {
  getDeviceId,
  setAuthData,
  clearAuthData,
  getUser,
  setLicenseData,
  getFeatures,
} from './store';

/**
 * Register all IPC handlers.
 * Called once during app.whenReady().
 */
export function registerIpcHandlers(): void {
  // ─── Auth ───────────────────────────────────────────────────────────────

  ipcMain.handle(
    IpcChannel.AUTH_LOGIN,
    async (_event, email: string, password: string) => {
      const response = await authService.login(email, password);
      setAuthData(response.access_token, response.refresh_token, response.user);
      return response;
    },
  );

  ipcMain.handle(
    IpcChannel.AUTH_REGISTER,
    async (_event, email: string, password: string, name?: string) => {
      const response = await authService.register(email, password, name);
      setAuthData(response.access_token, response.refresh_token, response.user);
      return response;
    },
  );

  ipcMain.handle(IpcChannel.AUTH_LOGOUT, async () => {
    authService.logout();
    clearAuthData();
    licenseService.clearFeatures();
    return { success: true };
  });

  ipcMain.handle(IpcChannel.AUTH_GET_USER, async () => {
    return getUser();
  });

  // ─── License ────────────────────────────────────────────────────────────

  ipcMain.handle(
    IpcChannel.LICENSE_VALIDATE,
    async (_event, licenseKey: string) => {
      const deviceId = getDeviceId();
      const result = await licenseService.validateLicense(licenseKey, deviceId);

      if (result.valid && result.features) {
        setLicenseData(licenseKey, result.features);
        licenseService.setEnabledFeatures(result.features);
      }

      return result;
    },
  );

  ipcMain.handle(
    IpcChannel.LICENSE_ACTIVATE,
    async (_event, licenseKey: string) => {
      const deviceId = getDeviceId();
      const result = await licenseService.activateLicense(licenseKey, deviceId);

      if (result.success && result.features) {
        setLicenseData(licenseKey, result.features);
        licenseService.setEnabledFeatures(result.features);
      }

      return result;
    },
  );

  ipcMain.handle(IpcChannel.LICENSE_GET_FEATURES, async () => {
    return getFeatures();
  });

  // ─── Device ─────────────────────────────────────────────────────────────

  ipcMain.handle(IpcChannel.DEVICE_GET_ID, async () => {
    return getDeviceId();
  });

  // ─── App ────────────────────────────────────────────────────────────────

  ipcMain.handle(IpcChannel.APP_GET_VERSION, async () => {
    return app.getVersion();
  });

  ipcMain.handle(IpcChannel.APP_QUIT, async () => {
    app.quit();
  });
}
