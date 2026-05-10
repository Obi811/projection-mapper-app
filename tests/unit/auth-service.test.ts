/**
 * Unit tests for the Auth Service.
 *
 * Uses Vitest mocking to stub axios calls and verify the service
 * correctly calls endpoints and returns typed responses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@services/api-client';
import { login, register, socialAuth, refreshTokens } from '@services/auth-service';
import type { AuthResponse, RefreshResponse } from '@shared/types';

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
});
