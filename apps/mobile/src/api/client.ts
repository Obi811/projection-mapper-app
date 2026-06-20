/**
 * Axios HTTP client for the mobile app.
 *
 * - Persists tokens in AsyncStorage
 * - Injects the Bearer access token on every request
 * - Transparently refreshes the access token on 401 and replays the request
 */
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS, RefreshResponse } from '@projection-mapper/shared';

const ACCESS_KEY = 'pm.accessToken';
const REFRESH_KEY = 'pm.refreshToken';

let accessToken: string | null = null;
let refreshToken: string | null = null;

/** Load persisted tokens into memory. Call once on app start. */
export async function loadTokens(): Promise<{ access: string | null; refresh: string | null }> {
  const [access, refresh] = await Promise.all([
    AsyncStorage.getItem(ACCESS_KEY),
    AsyncStorage.getItem(REFRESH_KEY),
  ]);
  accessToken = access;
  refreshToken = refresh;
  return { access, refresh };
}

/** Persist (or clear) tokens both in memory and in AsyncStorage. */
export async function setTokens(access: string | null, refresh: string | null): Promise<void> {
  accessToken = access;
  refreshToken = refresh;
  const ops: Promise<void>[] = [];
  ops.push(access ? AsyncStorage.setItem(ACCESS_KEY, access) : AsyncStorage.removeItem(ACCESS_KEY));
  ops.push(refresh ? AsyncStorage.setItem(REFRESH_KEY, refresh) : AsyncStorage.removeItem(REFRESH_KEY));
  await Promise.all(ops);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

// ─── Transparent token refresh ───────────────────────────────────────────────

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null): void {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

async function performRefresh(): Promise<string | null> {
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<RefreshResponse>(
      `${API_BASE_URL}${API_ENDPOINTS.auth.refresh}`,
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );
    await setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    await setTokens(null, null);
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && original && !original._retry && refreshToken) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push((token) => {
            if (!token) {
              reject(error);
              return;
            }
            original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
            resolve(apiClient(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;
      const newToken = await performRefresh();
      isRefreshing = false;
      flushQueue(newToken);

      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return apiClient(original);
      }
    }

    return Promise.reject(error);
  },
);
