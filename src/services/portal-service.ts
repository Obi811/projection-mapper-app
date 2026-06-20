/**
 * Portal Service
 * 
 * Handles customer portal API calls for profile management,
 * dashboard data, device management, and account settings.
 * 
 * API endpoints target https://licensing.obitron.de
 */

import { apiClient } from './api-client';
import type {
  PortalProfile,
  PortalDashboard,
  RegisteredDevice,
  ProfileUpdatePayload,
} from '../shared/types';

/**
 * Get current user's portal profile
 * GET /portal/profile
 */
export async function getPortalProfile(): Promise<PortalProfile> {
  const response = await apiClient.get<PortalProfile>('/portal/profile');
  return response.data;
}

/**
 * Get portal dashboard with licenses, subscriptions, and payments
 * GET /portal/dashboard
 */
export async function getPortalDashboard(): Promise<PortalDashboard> {
  const response = await apiClient.get<PortalDashboard>('/portal/dashboard');
  return response.data;
}

/**
 * Get list of devices registered to this account
 * GET /portal/devices
 */
export async function getPortalDevices(): Promise<RegisteredDevice[]> {
  const response = await apiClient.get<RegisteredDevice[]>('/portal/devices');
  return response.data;
}

/**
 * Update user profile (name and/or password)
 * PATCH /portal/profile
 */
export async function updatePortalProfile(
  payload: ProfileUpdatePayload
): Promise<PortalProfile> {
  const response = await apiClient.patch<PortalProfile>('/portal/profile', payload);
  return response.data;
}

/**
 * Deactivate a specific device
 * DELETE /portal/devices/:deviceId
 */
export async function deactivateDevice(deviceId: string): Promise<void> {
  await apiClient.delete(`/portal/devices/${deviceId}`);
}
