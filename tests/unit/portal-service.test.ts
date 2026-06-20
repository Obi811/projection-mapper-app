import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as portalService from '@services/portal-service';
import { apiClient } from '@services/api-client';

vi.mock('@services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Portal Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPortalProfile', () => {
    it('should fetch portal profile', async () => {
      const mockProfile = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockProfile });

      const result = await portalService.getPortalProfile();

      expect(apiClient.get).toHaveBeenCalledWith('/portal/profile');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('getPortalDashboard', () => {
    it('should fetch portal dashboard data', async () => {
      const mockDashboard = {
        licenses: [],
        subscriptions: [],
        payments: [],
        stats: {
          totalDevices: 2,
          activeAddons: 3,
          totalSpent: 99.99,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDashboard });

      const result = await portalService.getPortalDashboard();

      expect(apiClient.get).toHaveBeenCalledWith('/portal/dashboard');
      expect(result).toEqual(mockDashboard);
    });
  });

  describe('getPortalDevices', () => {
    it('should fetch registered devices', async () => {
      const mockDevices = [
        {
          id: 'dev1',
          deviceId: 'abc123',
          deviceName: 'MacBook Pro',
          platform: 'darwin',
          lastSeen: '2024-01-01T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDevices });

      const result = await portalService.getPortalDevices();

      expect(apiClient.get).toHaveBeenCalledWith('/portal/devices');
      expect(result).toEqual(mockDevices);
    });
  });

  describe('updatePortalProfile', () => {
    it('should update profile with name change', async () => {
      const payload = { name: 'New Name' };
      const mockUpdatedProfile = {
        id: '123',
        email: 'test@example.com',
        name: 'New Name',
        role: 'user' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      vi.mocked(apiClient.patch).mockResolvedValue({ data: mockUpdatedProfile });

      const result = await portalService.updatePortalProfile(payload);

      expect(apiClient.patch).toHaveBeenCalledWith('/portal/profile', payload);
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should update profile with password change', async () => {
      const payload = {
        password: 'newpassword123',
        currentPassword: 'oldpassword',
      };
      const mockUpdatedProfile = {
        id: '123',
        email: 'test@example.com',
        role: 'user' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      vi.mocked(apiClient.patch).mockResolvedValue({ data: mockUpdatedProfile });

      const result = await portalService.updatePortalProfile(payload);

      expect(apiClient.patch).toHaveBeenCalledWith('/portal/profile', payload);
      expect(result).toEqual(mockUpdatedProfile);
    });
  });

  describe('deactivateDevice', () => {
    it('should deactivate a device', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });

      await portalService.deactivateDevice('dev123');

      expect(apiClient.delete).toHaveBeenCalledWith('/portal/devices/dev123');
    });
  });
});
