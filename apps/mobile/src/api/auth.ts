/** Authentication & portal API calls for the mobile app. */
import {
  API_ENDPOINTS,
  AuthResponse,
  User,
  License,
  RegisteredDevice,
} from '@projection-mapper/shared';
import { apiClient, setTokens } from './client';

export async function login(email: string, password: string): Promise<User> {
  const { data } = await apiClient.post<AuthResponse>(API_ENDPOINTS.auth.login, {
    email,
    password,
  });
  await setTokens(data.access_token, data.refresh_token);
  return data.user;
}

export async function register(email: string, password: string, name?: string): Promise<User> {
  const { data } = await apiClient.post<AuthResponse>(API_ENDPOINTS.auth.register, {
    email,
    password,
    name,
  });
  await setTokens(data.access_token, data.refresh_token);
  return data.user;
}

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<User>(API_ENDPOINTS.auth.me);
  return data;
}

export async function logout(): Promise<void> {
  await setTokens(null, null);
}

export interface PortalDashboard {
  license: License | null;
  devices: RegisteredDevice[];
  activeDevices: number;
}

export async function fetchDashboard(): Promise<PortalDashboard> {
  const { data } = await apiClient.get<PortalDashboard>(API_ENDPOINTS.portal.dashboard);
  return data;
}

export async function fetchDevices(): Promise<RegisteredDevice[]> {
  const { data } = await apiClient.get<RegisteredDevice[]>(API_ENDPOINTS.portal.devices);
  return data;
}
