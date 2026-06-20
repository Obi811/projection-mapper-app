/**
 * Unit tests for the Addon Service (marketplace integration).
 *
 * Uses Vitest mocking to stub API calls and verify the service
 * correctly calls marketplace endpoints and handles responses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@services/api-client';
import {
  listAddons,
  listAddonsByCategory,
  getAddonDetails,
  listMyAddons,
  checkAddon,
  purchaseAddon,
  checkForUpdates,
} from '@services/addon-service';
// Types used for reference only

// Mock the apiClient module
vi.mock('@services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

describe('Addon Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listAddons', () => {
    it('should fetch all addons from marketplace', async () => {
      const mockAddons = [
        { id: '1', name: 'Addon A', slug: 'addon-a', category: 'effect' },
        { id: '2', name: 'Addon B', slug: 'addon-b', category: 'tool' },
      ];
      mockGet.mockResolvedValueOnce({ data: mockAddons });

      const result = await listAddons();
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAddons);
    });

    it('should return empty array on error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      const result = await listAddons();
      expect(result).toEqual([]);
    });
  });

  describe('listAddonsByCategory', () => {
    it('should fetch addons filtered by category', async () => {
      const mockAddons = [
        { id: '1', name: 'Effect Addon', category: 'effect' },
      ];
      mockGet.mockResolvedValueOnce({ data: mockAddons });

      const result = await listAddonsByCategory('effect');
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAddons);
    });
  });

  describe('getAddonDetails', () => {
    it('should fetch addon details by slug', async () => {
      const mockDetail = { id: '1', name: 'Test', slug: 'test', category: 'tool' };
      mockGet.mockResolvedValueOnce({ data: mockDetail });

      const result = await getAddonDetails('test');
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDetail);
    });

    it('should return null on error', async () => {
      mockGet.mockRejectedValueOnce(new Error('Not found'));

      const result = await getAddonDetails('missing');
      expect(result).toBeNull();
    });
  });

  describe('listMyAddons', () => {
    it('should fetch user owned addons', async () => {
      const mockAddons = [{ id: '1', name: 'My Addon' }];
      mockGet.mockResolvedValueOnce({ data: mockAddons });

      const result = await listMyAddons();
      expect(result).toEqual(mockAddons);
    });
  });

  describe('checkAddon', () => {
    it('should check addon ownership', async () => {
      mockGet.mockResolvedValueOnce({ data: { owned: true, addon: null } });

      const result = await checkAddon('test-addon');
      expect(result).toEqual({ owned: true, addon: null });
    });
  });

  describe('purchaseAddon', () => {
    it('should purchase an addon', async () => {
      const mockResult = { success: true, transactionId: 'tx-123' };
      mockPost.mockResolvedValueOnce({ data: mockResult });

      const result = await purchaseAddon('addon-1');
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('checkForUpdates', () => {
    it('should return empty array when no addons installed', async () => {
      const result = await checkForUpdates([]);
      expect(result).toEqual([]);
    });

    it('should detect updates for installed addons', async () => {
      const installed = [{ slug: 'addon-a', version: '1.0.0' }];

      // getAddonDetails calls apiClient.get internally
      mockGet.mockResolvedValueOnce({
        data: {
          id: 'addon-a',
          name: 'Addon A',
          version: '2.0.0',
          slug: 'addon-a',
          category: 'tool',
        },
      });

      const result = await checkForUpdates(installed);
      expect(result.length).toBe(1);
      expect(result[0]).toMatchObject({
        slug: 'addon-a',
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        hasUpdate: true,
      });
    });

    it('should not flag addons that are up to date', async () => {
      const installed = [{ slug: 'addon-a', version: '2.0.0' }];

      mockGet.mockResolvedValueOnce({
        data: {
          id: 'addon-a',
          name: 'Addon A',
          version: '2.0.0',
          slug: 'addon-a',
          category: 'tool',
        },
      });

      const result = await checkForUpdates(installed);
      expect(result.length).toBe(1);
      expect(result[0].hasUpdate).toBe(false);
    });
  });
});
