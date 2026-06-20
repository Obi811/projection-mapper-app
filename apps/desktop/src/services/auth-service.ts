/**
 * Authentication Service
 *
 * Handles all auth-related API calls against the Obitron backend:
 * - Email/password login & registration
 * - Token refresh
 * - Social auth (Google / Apple) — prepared, requires OAuth flow in renderer
 * - Logout (local token cleanup)
 *
 * All methods return typed responses and throw on network / API errors
 * so callers can handle UI feedback uniformly.
 */

import { apiClient } from './api-client';
import type {
  AuthResponse,
  RefreshResponse,
  SocialProvider,
  SerializedCredential,
  User,
} from '../shared/types';

// ─── Email / Password ───────────────────────────────────────────────────────

/**
 * Register a new user account.
 *
 * @param email    - User email
 * @param password - User password (min 8 chars recommended)
 * @param name     - Optional display name
 * @returns AuthResponse with tokens + user profile
 */
export async function register(
  email: string,
  password: string,
  name?: string,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', {
    email,
    password,
    name,
  });
  return data;
}

/**
 * Authenticate an existing user.
 *
 * @param email    - User email
 * @param password - User password
 * @returns AuthResponse with tokens + user profile
 */
export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', {
    email,
    password,
  });
  return data;
}

/**
 * Obtain a fresh access token using a refresh token.
 *
 * Typically called automatically by the api-client interceptor,
 * but exposed here for explicit usage when needed.
 */
export async function refreshTokens(
  refreshToken: string,
): Promise<RefreshResponse> {
  const { data } = await apiClient.post<RefreshResponse>('/auth/refresh', {
    refresh_token: refreshToken,
  });
  return data;
}

// ─── Social Auth ────────────────────────────────────────────────────────────

/**
 * Exchange a social-provider token for Obitron auth tokens.
 *
 * The `idToken` is obtained from the OAuth flow in the renderer process
 * (e.g. Google Sign-In popup or Apple Sign-In).
 *
 * @param provider - 'google' or 'apple'
 * @param idToken  - The id_token / authorization_code from the provider
 */
export async function socialAuth(
  provider: SocialProvider,
  idToken: string,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/social', {
    provider,
    id_token: idToken,
  });
  return data;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Fetch the currently authenticated user's profile.
 * Requires a valid access token (injected automatically by api-client).
 */
export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
}

/**
 * Logout is purely local — we clear tokens on the client side.
 * No server endpoint needed (JWTs are stateless).
 * Token cleanup is handled by the caller via the store.
 */
export function logout(): void {
  // Intentionally empty — cleanup is handled by the caller.
  // This function exists as a hook point for future server-side
  // session invalidation if needed.
}

// ─── Passkey / WebAuthn ─────────────────────────────────────────────────────

/**
 * Start passkey registration — called after the user is already logged in.
 * Returns PublicKeyCredentialCreationOptions for navigator.credentials.create().
 */
export async function passkeyRegisterStart(): Promise<Record<string, unknown>> {
  const { data } = await apiClient.post<Record<string, unknown>>(
    '/auth/passkey/register/start',
  );
  return data;
}

/**
 * Finish passkey registration — sends the credential back to the server.
 */
export async function passkeyRegisterFinish(
  credential: SerializedCredential,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>(
    '/auth/passkey/register/finish',
    credential,
  );
  return data;
}

/**
 * Start passkey login — server returns PublicKeyCredentialRequestOptions.
 */
export async function passkeyLoginStart(): Promise<Record<string, unknown>> {
  const { data } = await apiClient.post<Record<string, unknown>>(
    '/auth/passkey/login/start',
  );
  return data;
}

/**
 * Finish passkey login — sends the assertion credential to the server.
 * Returns tokens + user like a normal login.
 */
export async function passkeyLoginFinish(
  credential: SerializedCredential,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    '/auth/passkey/login/finish',
    credential,
  );
  return data;
}
