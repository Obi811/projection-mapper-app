import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Regression test for the "Attempted to register a second handler" crash.
 *
 * During the monorepo migration the App handlers (app:getVersion / app:quit)
 * were accidentally duplicated in registerIpcHandlers(). Electron throws on the
 * second ipcMain.handle() call for an already-registered channel, which crashed
 * the main process before the window was created (app active in dock, no window).
 *
 * This test asserts that registerIpcHandlers() registers every IPC channel
 * exactly once, so the bug can never silently return.
 */

// Track every channel passed to ipcMain.handle / ipcMain.on
const handledChannels: string[] = [];

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string) => {
      handledChannels.push(channel);
    }),
    on: vi.fn((channel: string) => {
      handledChannels.push(channel);
    }),
  },
  app: {
    getVersion: vi.fn(() => '0.0.0-test'),
    quit: vi.fn(),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
}));

// Mock all service modules and main-process collaborators so importing the
// IPC module has no real side effects.
vi.mock('@services/auth-service', () => ({}));
vi.mock('@services/license-service', () => ({}));
vi.mock('@services/portal-service', () => ({}));
vi.mock('@services/output-manager', () => ({}));
vi.mock('@services/keystone-service', () => ({}));
vi.mock('@services/addon-service', () => ({}));
vi.mock('@services/plugin-loader', () => ({}));
vi.mock('@services/remote-control-server', () => ({
  remoteControlServer: {
    start: vi.fn(),
    stop: vi.fn(),
    getConnectionInfo: vi.fn(),
    getClients: vi.fn(),
    isRunning: vi.fn(),
  },
}));

describe('registerIpcHandlers', () => {
  beforeEach(() => {
    handledChannels.length = 0;
  });

  it('registers every IPC channel exactly once (no duplicates)', async () => {
    const { registerIpcHandlers } = await import('../../src/main/ipc');

    expect(() => registerIpcHandlers()).not.toThrow();

    const duplicates = handledChannels.filter(
      (channel, index) => handledChannels.indexOf(channel) !== index,
    );

    expect(duplicates).toEqual([]);
  });

  it('registers the app:getVersion channel exactly once', async () => {
    const { registerIpcHandlers } = await import('../../src/main/ipc');

    registerIpcHandlers();

    const versionRegistrations = handledChannels.filter(
      (channel) => channel === 'app:getVersion',
    );

    expect(versionRegistrations).toHaveLength(1);
  });
});
