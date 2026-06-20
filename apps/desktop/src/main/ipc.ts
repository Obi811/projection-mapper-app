/**
 * IPC Handler Registration
 *
 * Bridges the renderer process (React UI) with backend services
 * via Electron's contextBridge / ipcMain invoke pattern.
 *
 * Each handler maps an IpcChannel to a service call, reads/writes
 * the electron-store as needed, and returns typed results.
 */

import { ipcMain, app, dialog } from 'electron';
import { IpcChannel } from '../shared/types';
import type { ProjectorConfig, KeystoneCorners, AddonCategory } from '../shared/types';
import * as authService from '../services/auth-service';
import * as licenseService from '../services/license-service';
import * as portalService from '../services/portal-service';
import * as outputManager from '../services/output-manager';
import * as keystoneService from '../services/keystone-service';
import * as addonService from '../services/addon-service';
import * as pluginLoader from '../services/plugin-loader';
import { remoteControlServer } from '../services/remote-control-server';
import {
  createProjectorWindow,
  closeProjectorWindow,
} from './projector-window';
import {
  getDeviceId,
  setAuthData,
  clearAuthData,
  getUser,
  setLicenseData,
  getFeatures,
  getProjectorConfigs,
  setProjectorConfigs,
  getKeystoneConfigs,
  setKeystoneConfigs,
  getKeystonePresets,
  setKeystonePresets,
  getInstalledAddons,
  setInstalledAddons,
  getAddonSettings,
  setAddonSettings,
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
      console.log('[IPC] Login response:', JSON.stringify(response, null, 2));
      
      // Validate response structure
      if (!response.access_token || !response.refresh_token) {
        console.error('[IPC] Missing tokens in login response');
        throw new Error('Ungültige Server-Antwort: Tokens fehlen');
      }
      
      if (!response.user) {
        console.error('[IPC] Missing user object in login response');
        throw new Error('Ungültige Server-Antwort: Benutzerdaten fehlen');
      }
      
      console.log('[IPC] Storing auth data for user:', response.user.email);
      setAuthData(response.access_token, response.refresh_token, response.user);
      
      // Verify storage
      const storedUser = getUser();
      console.log('[IPC] Stored user:', storedUser ? storedUser.email : 'null');
      
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
    const user = getUser();
    console.log('[IPC] AUTH_GET_USER called, returning:', user ? `User(${user.email})` : 'null');
    return user;
  });

  ipcMain.handle(
    IpcChannel.AUTH_SOCIAL,
    async (_event, provider: string, idToken: string) => {
      const response = await authService.socialAuth(
        provider as 'google' | 'apple',
        idToken,
      );
      setAuthData(response.access_token, response.refresh_token, response.user);
      return response;
    },
  );

  // ─── Passkey / WebAuthn ─────────────────────────────────────────────────

  ipcMain.handle(IpcChannel.AUTH_PASSKEY_REGISTER_START, async () => {
    return authService.passkeyRegisterStart();
  });

  ipcMain.handle(
    IpcChannel.AUTH_PASSKEY_REGISTER_FINISH,
    async (_event, credential: unknown) => {
      return authService.passkeyRegisterFinish(
        credential as import('../shared/types').SerializedCredential,
      );
    },
  );

  ipcMain.handle(IpcChannel.AUTH_PASSKEY_LOGIN_START, async () => {
    return authService.passkeyLoginStart();
  });

  ipcMain.handle(
    IpcChannel.AUTH_PASSKEY_LOGIN_FINISH,
    async (_event, credential: unknown) => {
      const response = await authService.passkeyLoginFinish(
        credential as import('../shared/types').SerializedCredential,
      );
      setAuthData(response.access_token, response.refresh_token, response.user);
      return response;
    },
  );

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

  // ─── Projector / Output Manager ──────────────────────────────────────────

  ipcMain.handle(IpcChannel.PROJECTOR_GET_DISPLAYS, async () => {
    return outputManager.enumerateDisplays();
  });

  ipcMain.handle(IpcChannel.PROJECTOR_SCAN_DISPLAYS, async () => {
    return outputManager.enumerateDisplays();
  });

  ipcMain.handle(IpcChannel.PROJECTOR_GET_CONFIGS, async () => {
    return outputManager.getConfigs();
  });

  ipcMain.handle(
    IpcChannel.PROJECTOR_SAVE_CONFIG,
    async (_event, config: Partial<ProjectorConfig> & { displayId: number }) => {
      const saved = outputManager.saveConfig(config);
      // Persist to store
      setProjectorConfigs(outputManager.getConfigs());
      return saved;
    },
  );

  ipcMain.handle(
    IpcChannel.PROJECTOR_DELETE_CONFIG,
    async (_event, projectorId: string) => {
      const deleted = outputManager.deleteConfig(projectorId);
      if (deleted) {
        setProjectorConfigs(outputManager.getConfigs());
      }
      return deleted;
    },
  );

  ipcMain.handle(
    IpcChannel.PROJECTOR_OPEN_WINDOW,
    async (_event, projectorId: string) => {
      const config = outputManager.getConfig(projectorId);
      if (!config) {
        return { success: false, error: 'Projector config not found' };
      }
      const win = createProjectorWindow(config);
      return {
        success: !!win,
        windowId: win?.id,
        state: outputManager.getState(projectorId),
      };
    },
  );

  ipcMain.handle(
    IpcChannel.PROJECTOR_CLOSE_WINDOW,
    async (_event, projectorId: string) => {
      const closed = closeProjectorWindow(projectorId);
      return { success: closed };
    },
  );

  ipcMain.handle(IpcChannel.PROJECTOR_GET_STATES, async () => {
    return outputManager.getStates();
  });

  // ─── Keystone Correction ──────────────────────────────────────────────────

  ipcMain.handle(
    IpcChannel.KEYSTONE_GET_CONFIG,
    async (_event, projectorId: string) => {
      return keystoneService.getConfig(projectorId);
    },
  );

  ipcMain.handle(
    IpcChannel.KEYSTONE_SAVE_CONFIG,
    async (
      _event,
      projectorId: string,
      update: { corners?: KeystoneCorners; meshSubdivisions?: number; enabled?: boolean; name?: string },
    ) => {
      const config = keystoneService.saveConfig(projectorId, update);
      setKeystoneConfigs(keystoneService.getAllConfigs());
      return config;
    },
  );

  ipcMain.handle(
    IpcChannel.KEYSTONE_DELETE_CONFIG,
    async (_event, projectorId: string) => {
      const deleted = keystoneService.deleteConfig(projectorId);
      if (deleted) {
        setKeystoneConfigs(keystoneService.getAllConfigs());
      }
      return deleted;
    },
  );

  ipcMain.handle(
    IpcChannel.KEYSTONE_GET_PRESETS,
    async (_event, projectorId: string) => {
      return keystoneService.getPresets(projectorId);
    },
  );

  ipcMain.handle(
    IpcChannel.KEYSTONE_SAVE_PRESET,
    async (_event, projectorId: string, name: string, corners: KeystoneCorners) => {
      const preset = keystoneService.savePreset(projectorId, name, corners);
      setKeystonePresets(keystoneService.getAllPresets());
      return preset;
    },
  );

  ipcMain.handle(
    IpcChannel.KEYSTONE_DELETE_PRESET,
    async (_event, presetId: string) => {
      const deleted = keystoneService.deletePreset(presetId);
      if (deleted) {
        setKeystonePresets(keystoneService.getAllPresets());
      }
      return deleted;
    },
  );

  ipcMain.handle(
    IpcChannel.KEYSTONE_RESET,
    async (_event, projectorId: string) => {
      const config = keystoneService.resetConfig(projectorId);
      setKeystoneConfigs(keystoneService.getAllConfigs());
      return config;
    },
  );

  // ─── App ────────────────────────────────────────────────────────────────

  ipcMain.handle(IpcChannel.APP_GET_VERSION, async () => {
    return app.getVersion();
  });

  ipcMain.handle(IpcChannel.APP_QUIT, async () => {
    app.quit();
  });

  // ─── Addon System ──────────────────────────────────────────────────────

  ipcMain.handle(IpcChannel.ADDON_LIST_MARKETPLACE, async (_event, category?: AddonCategory) => {
    if (category) {
      return addonService.listAddonsByCategory(category);
    }
    return addonService.listAddons();
  });

  ipcMain.handle(IpcChannel.ADDON_GET_DETAILS, async (_event, slug: string) => {
    return addonService.getAddonDetails(slug);
  });

  ipcMain.handle(IpcChannel.ADDON_INSTALL, async (_event, sourcePath: string) => {
    const addon = await pluginLoader.installAddon(sourcePath);
    setInstalledAddons(pluginLoader.getRegisteredAddons());
    return addon;
  });

  ipcMain.handle(IpcChannel.ADDON_UNINSTALL, async (_event, addonId: string) => {
    await pluginLoader.uninstallAddon(addonId);
    setInstalledAddons(pluginLoader.getRegisteredAddons());
    return true;
  });

  ipcMain.handle(IpcChannel.ADDON_ENABLE, async (_event, addonId: string) => {
    await pluginLoader.enableAddon(addonId);
    setInstalledAddons(pluginLoader.getRegisteredAddons());
    return true;
  });

  ipcMain.handle(IpcChannel.ADDON_DISABLE, async (_event, addonId: string) => {
    await pluginLoader.disableAddon(addonId);
    setInstalledAddons(pluginLoader.getRegisteredAddons());
    return true;
  });

  ipcMain.handle(IpcChannel.ADDON_GET_INSTALLED, async () => {
    return pluginLoader.getRegisteredAddons();
  });

  ipcMain.handle(IpcChannel.ADDON_GET_SETTINGS, async (_event, addonId: string) => {
    return pluginLoader.getAddonSettings(addonId);
  });

  ipcMain.handle(
    IpcChannel.ADDON_SAVE_SETTINGS,
    async (_event, addonId: string, settings: Record<string, string | number | boolean>) => {
      pluginLoader.saveAddonSettings(addonId, settings);
      const allSettings = getAddonSettings();
      allSettings[addonId] = settings;
      setAddonSettings(allSettings);
      return true;
    },
  );

  ipcMain.handle(IpcChannel.ADDON_LIST_MY, async () => {
    return addonService.listMyAddons();
  });

  ipcMain.handle(IpcChannel.ADDON_CHECK_OWNED, async (_event, slug: string) => {
    return addonService.checkAddon(slug);
  });

  ipcMain.handle(IpcChannel.ADDON_PURCHASE, async (_event, addonId: string) => {
    return addonService.purchaseAddon(addonId);
  });

  ipcMain.handle(IpcChannel.ADDON_CHECK_UPDATES, async () => {
    const installed = pluginLoader.getRegisteredAddons();
    const mapped = installed.map((a) => ({
      slug: a.manifest.marketplaceSlug ?? a.manifest.id,
      version: a.manifest.version,
    }));
    return addonService.checkForUpdates(mapped);
  });

  // ─── Portal ─────────────────────────────────────────────────────────────

  ipcMain.handle(IpcChannel.PORTAL_GET_PROFILE, async () => {
    return portalService.getPortalProfile();
  });

  ipcMain.handle(IpcChannel.PORTAL_GET_DASHBOARD, async () => {
    return portalService.getPortalDashboard();
  });

  ipcMain.handle(IpcChannel.PORTAL_GET_DEVICES, async () => {
    return portalService.getPortalDevices();
  });

  ipcMain.handle(
    IpcChannel.PORTAL_UPDATE_PROFILE,
    async (_event, payload: Record<string, unknown>) => {
      return portalService.updatePortalProfile(payload);
    }
  );

  // ─── Audio ──────────────────────────────────────────────────────────────

  ipcMain.handle(IpcChannel.AUDIO_OPEN_FILE, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // ─── Remote Control ─────────────────────────────────────────────────────

  ipcMain.handle(
    IpcChannel.REMOTE_START_SERVER,
    async (_event, port: number = 8765) => {
      await remoteControlServer.start({ port });
      return remoteControlServer.getConnectionInfo();
    }
  );

  ipcMain.handle(IpcChannel.REMOTE_STOP_SERVER, async () => {
    await remoteControlServer.stop();
  });

  ipcMain.handle(IpcChannel.REMOTE_GET_INFO, () => {
    return remoteControlServer.getConnectionInfo();
  });

  ipcMain.handle(IpcChannel.REMOTE_GET_CLIENTS, () => {
    return remoteControlServer.getClients();
  });

  ipcMain.handle(IpcChannel.REMOTE_IS_RUNNING, () => {
    return remoteControlServer.isRunning();
  });
}
