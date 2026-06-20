/**
 * Addon / Marketplace Service
 *
 * Provides access to the addon marketplace for discovering,
 * purchasing, downloading, and checking installed addons.
 *
 * API endpoints target https://licensing.obitron.de
 */

import { apiClient } from './api-client';
import type { Addon, AddonCategory, AddonPurchaseResponse } from '../shared/types';

// ─── Marketplace Browsing ────────────────────────────────────────────────────

/** Fetch all available addons from the marketplace */
export async function listAddons(): Promise<Addon[]> {
  try {
    const { data } = await apiClient.get<Addon[]>('/addons');
    return data;
  } catch {
    return [];
  }
}

/** Fetch addons filtered by category */
export async function listAddonsByCategory(
  category: AddonCategory,
): Promise<Addon[]> {
  const { data } = await apiClient.get<Addon[]>('/addons', {
    params: { category },
  });
  return data;
}

/** Fetch addon details by slug */
export async function getAddonDetails(slug: string): Promise<Addon | null> {
  try {
    const { data } = await apiClient.get<Addon>(`/addons/slug/${slug}`);
    return data;
  } catch {
    return null;
  }
}

// ─── User's Addons ───────────────────────────────────────────────────────────

/** Fetch addons purchased by the current user */
export async function listMyAddons(): Promise<Addon[]> {
  const { data } = await apiClient.get<Addon[]>('/addons/my');
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

// ─── Purchase ────────────────────────────────────────────────────────────────

/** Purchase an addon by ID */
export async function purchaseAddon(
  addonId: string,
): Promise<AddonPurchaseResponse> {
  const { data } = await apiClient.post<AddonPurchaseResponse>(
    `/addons/${addonId}/purchase`,
  );
  return data;
}

// ─── Update Checks ───────────────────────────────────────────────────────────

/** Check for updates for installed addons */
export async function checkForUpdates(
  installedAddons: Array<{ slug: string; version: string }>,
): Promise<Array<{ slug: string; currentVersion: string; latestVersion: string; hasUpdate: boolean }>> {
  const results: Array<{
    slug: string;
    currentVersion: string;
    latestVersion: string;
    hasUpdate: boolean;
  }> = [];

  for (const installed of installedAddons) {
    try {
      const details = await getAddonDetails(installed.slug);
      if (details) {
        const hasUpdate = compareVersions(details.version, installed.version) > 0;
        results.push({
          slug: installed.slug,
          currentVersion: installed.version,
          latestVersion: details.version,
          hasUpdate,
        });
      }
    } catch {
      // Skip failed checks
    }
  }

  return results;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Simple semver comparison: returns 1 if a > b, -1 if a < b, 0 if equal.
 */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}
