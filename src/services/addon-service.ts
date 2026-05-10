/**
 * Addon / Marketplace Service
 *
 * Provides access to the addon marketplace for discovering,
 * purchasing, and checking installed addons.
 *
 * This is a thin wrapper around the Obitron API endpoints.
 * Full addon runtime (loading, sandboxing) will be added later.
 */

import { apiClient } from './api-client';
import type { Addon, AddonPurchaseResponse } from '../shared/types';

/** Fetch all available addons from the marketplace */
export async function listAddons(): Promise<Addon[]> {
  const { data } = await apiClient.get<Addon[]>('/addons');
  return data;
}

/** Fetch addons purchased by the current user */
export async function listMyAddons(): Promise<Addon[]> {
  const { data } = await apiClient.get<Addon[]>('/addons/my');
  return data;
}

/** Purchase an addon by ID */
export async function purchaseAddon(
  addonId: string,
): Promise<AddonPurchaseResponse> {
  const { data } = await apiClient.post<AddonPurchaseResponse>(
    `/addons/${addonId}/purchase`,
  );
  return data;
}

/** Check whether a specific addon (by slug) is owned / active */
export async function checkAddon(
  slug: string,
): Promise<{ owned: boolean; addon: Addon | null }> {
  const { data } = await apiClient.get<{
    owned: boolean;
    addon: Addon | null;
  }>(`/addons/check/${slug}`);
  return data;
}
