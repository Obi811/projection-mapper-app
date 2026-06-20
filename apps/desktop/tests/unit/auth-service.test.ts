/**
 * Unit tests for the Auth Service.
 *
 * Uses Vitest mocking to stub axios calls and verify the service
 * correctly calls endpoints and returns typed responses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@services/api-client';
import {
  login,
  register,
  socialAuth,
  refreshTokens,
  passkeyRegisterStart,
  passkeyRegisterFinish,
  passkeyLoginStart,
  passkeyLoginFinish,
} from '@services/auth-service';
import type { AuthResponse, RefreshResponse, SerializedCredential } from '@shared/types';

// Mock the apiClient module
vi.mock('@services/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockPost = vi.mocked(apiClient.post);

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAuthResponse: AuthResponse = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: '2026-01-01T00:00:00Z',
    },
  };

  describe('login', () => {
    it('should call POST /auth/login with email and password', async () => {
      mockPost.mockResolvedValueOnce({ data: mockAuthResponse });

      const result = await login('test@example.com', 'password123');

      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.access_token).toBe('test-access-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw on API error', async () => {
      mockPost.mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(login('bad@email.com', 'wrong')).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('register', () => {
    it('should call POST /auth/register with email, password, and name', async () => {
      mockPost.mockResolvedValueOnce({ data: mockAuthResponse });

      const result = await register('test@example.com', 'password123', 'Test');

      expect(mockPost).toHaveBeenCalledWith('/auth/register', {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test',
      });
      expect(result.user.id).toBe('user-123');
    });
  });

  describe('socialAuth', () => {
    it('should call POST /auth/social with provider and id_token', async () => {
      mockPost.mockResolvedValueOnce({ data: mockAuthResponse });

      const result = await socialAuth('google', 'google-id-token-xyz');

      expect(mockPost).toHaveBeenCalledWith('/auth/social', {
        provider: 'google',
        id_token: 'google-id-token-xyz',
      });
      expect(result.access_token).toBe('test-access-token');
    });
  });

  describe('refreshTokens', () => {
    it('should call POST /auth/refresh with refresh_token', async () => {
      const mockRefresh: RefreshResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };
      mockPost.mockResolvedValueOnce({ data: mockRefresh });

      const result = await refreshTokens('old-refresh-token');

      expect(mockPost).toHaveBeenCalledWith('/auth/refresh', {
        refresh_token: 'old-refresh-token',
      });
      expect(result.access_token).toBe('new-access-token');
    });
  });

  // ─── Passkey / WebAuthn ───────────────────────────────────────────────

  describe('passkeyRegisterStart', () => {
    it('should call POST /auth/passkey/register/start', async () => {
      const mockOptions = { challenge: 'abc123', rp: { name: 'Test' } };
      mockPost.mockResolvedValueOnce({ data: mockOptions });

      const result = await passkeyRegisterStart();

      expect(mockPost).toHaveBeenCalledWith('/auth/passkey/register/start');
      expect(result).toEqual(mockOptions);
    });
  });

  describe('passkeyRegisterFinish', () => {
    it('should call POST /auth/passkey/register/finish with credential', async () => {
      const mockCred: SerializedCredential = {
        id: 'cred-1',
        rawId: 'cmF3SWQ',
        type: 'public-key',
        response: {
          clientDataJSON: 'Y2xpZW50RGF0YQ',
          attestationObject: 'YXR0ZXN0YXRpb24',
        },
      };
      mockPost.mockResolvedValueOnce({ data: { success: true } });

      const result = await passkeyRegisterFinish(mockCred);

      expect(mockPost).toHaveBeenCalledWith(
        '/auth/passkey/register/finish',
        mockCred,
      );
      expect(result.success).toBe(true);
    });
  });

  describe('passkeyLoginStart', () => {
    it('should call POST /auth/passkey/login/start', async () => {
      const mockOptions = { challenge: 'xyz789', allowCredentials: [] };
      mockPost.mockResolvedValueOnce({ data: mockOptions });

      const result = await passkeyLoginStart();

      expect(mockPost).toHaveBeenCalledWith('/auth/passkey/login/start');
      expect(result).toEqual(mockOptions);
    });
  });

  describe('passkeyLoginFinish', () => {
    it('should call POST /auth/passkey/login/finish and return auth tokens', async () => {
      const mockCred: SerializedCredential = {
        id: 'cred-1',
        rawId: 'cmF3SWQ',
        type: 'public-key',
        response: {
          clientDataJSON: 'Y2xpZW50RGF0YQ',
          authenticatorData: 'YXV0aERhdGE',
          signature: 'c2lnbmF0dXJl',
        },
      };
      mockPost.mockResolvedValueOnce({ data: mockAuthResponse });

      const result = await passkeyLoginFinish(mockCred);

      expect(mockPost).toHaveBeenCalledWith(
        '/auth/passkey/login/finish',
        mockCred,
      );
      expect(result.access_token).toBe('test-access-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw on invalid passkey', async () => {
      const mockCred: SerializedCredential = {
        id: 'bad-cred',
        rawId: 'YmFk',
        type: 'public-key',
        response: { clientDataJSON: 'YmFk' },
      };
      mockPost.mockRejectedValueOnce(new Error('Invalid credential'));

      await expect(passkeyLoginFinish(mockCred)).rejects.toThrow(
        'Invalid credential',
      );
    });
  });
});
