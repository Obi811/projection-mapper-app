/**
 * Axios-based HTTP client for the Obitron API.
 *
 * Features:
 * - Automatic Bearer-token injection via request interceptor
 * - Transparent token refresh on 401 responses
 * - Request queuing during refresh to avoid race conditions
 *
 * Usage in other services:
 *   import { apiClient } from '@services/api-client';
 *   const res = await apiClient.post('/auth/login', { email, password });
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL } from '../shared/constants';

// ─── Token storage callbacks ────────────────────────────────────────────────
// These are set by the main process (Electron Store) or by the renderer
// (in-memory / localStorage) depending on the execution context.

type TokenGetter = () => string | null;
type TokenSetter = (access: string, refresh: string) => void;
type OnAuthFailure = () => void;

let _getAccessToken: TokenGetter = () => null;
let _getRefreshToken: TokenGetter = () => null;
let _setTokens: TokenSetter = () => {};
let _onAuthFailure: OnAuthFailure = () => {};

/**
 * Wire up token persistence.  Must be called once during app bootstrap.
 */
export function configureTokenHandlers(handlers: {
  getAccessToken: TokenGetter;
  getRefreshToken: TokenGetter;
  setTokens: TokenSetter;
  onAuthFailure: OnAuthFailure;
}): void {
  _getAccessToken = handlers.getAccessToken;
  _getRefreshToken = handlers.getRefreshToken;
  _setTokens = handlers.setTokens;
  _onAuthFailure = handlers.onAuthFailure;
}

// ─── Axios instance ─────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — inject access token ─────────────────────────────

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = _getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — transparent token refresh ───────────────────────

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void): void {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(newToken: string): void {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401 and if we haven't retried yet
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = _getRefreshToken();
    if (!refreshToken) {
      _onAuthFailure();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the refresh completes
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken: string) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          originalRequest._retry = true;
          resolve(apiClient(originalRequest));
        });
      });
    }

    isRefreshing = true;
    originalRequest._retry = true;

    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const newAccess: string = data.access_token;
      const newRefresh: string = data.refresh_token;
      _setTokens(newAccess, newRefresh);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      }
      onTokenRefreshed(newAccess);

      return apiClient(originalRequest);
    } catch (refreshError) {
      _onAuthFailure();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
