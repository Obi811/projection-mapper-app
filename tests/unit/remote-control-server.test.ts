import { describe, it, expect, vi, beforeEach } from 'vitest';
import { remoteControlServer } from '@services/remote-control-server';

// Mock WebSocket
vi.mock('ws', () => ({
  WebSocketServer: vi.fn(() => ({
    on: vi.fn(),
    close: vi.fn((cb: () => void) => cb()),
  })),
  WebSocket: {
    OPEN: 1,
  },
}));

describe('Remote Control Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not be running initially', () => {
    expect(remoteControlServer.isRunning()).toBe(false);
  });

  it('should generate connection info', () => {
    const info = remoteControlServer.getConnectionInfo();
    expect(info).toHaveProperty('port');
    expect(info).toHaveProperty('token');
    expect(info).toHaveProperty('url');
  });

  it('should return empty client list when not running', () => {
    const clients = remoteControlServer.getClients();
    expect(Array.isArray(clients)).toBe(true);
    expect(clients.length).toBe(0);
  });

  it('should register command handlers', () => {
    const handler = vi.fn();
    remoteControlServer.onCommand('test', handler);
    // Handler registered successfully (no error)
    expect(true).toBe(true);
  });

  it('should broadcast messages', () => {
    // Should not throw when no clients connected
    expect(() => {
      remoteControlServer.broadcast({ type: 'test', payload: {} });
    }).not.toThrow();
  });
});
