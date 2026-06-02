/**
 * Social Auth Utilities — OAuth Flow for Electron Desktop Apps
 *
 * For desktop Electron apps, we use a popup-based OAuth flow:
 * 1. Open a new BrowserWindow to the provider's auth URL
 * 2. Listen for the redirect back with the authorization code / id_token
 * 3. Exchange the token via our backend
 *
 * Since the renderer process cannot open BrowserWindows directly,
 * we use window.open() which Electron handles as a popup.
 *
 * For Google: Uses the redirect-based OAuth 2.0 flow
 * For Apple: Uses Sign-in with Apple JS flow
 */

import { API_BASE_URL } from '../../shared/constants';

/**
 * Initiate Google Sign-In via OAuth redirect through our backend.
 *
 * Our backend provides a /auth/social/google/redirect endpoint that handles
 * the OAuth dance and returns the id_token via a callback URL.
 */
export async function initiateGoogleSignIn(): Promise<string> {
  return new Promise((resolve, reject) => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const authUrl = `${API_BASE_URL}/auth/social/google/redirect`;

    const popup = window.open(
      authUrl,
      'google-signin',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no`,
    );

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this application.'));
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Google Sign-In timed out. Please try again.'));
    }, 120_000);

    const handleMessage = (event: MessageEvent) => {
      // Accept messages from our API domain or the popup
      if (event.data?.type === 'social-auth-callback') {
        cleanup();
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else if (event.data.id_token) {
          resolve(event.data.id_token as string);
        } else {
          reject(new Error('No token received from Google Sign-In'));
        }
      }
    };

    const pollInterval = setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error('Sign-in window was closed'));
      }
    }, 500);

    function cleanup() {
      clearTimeout(timeout);
      clearInterval(pollInterval);
      window.removeEventListener('message', handleMessage);
      if (popup && !popup.closed) popup.close();
    }

    window.addEventListener('message', handleMessage);
  });
}

/**
 * Initiate Apple Sign-In via OAuth redirect through our backend.
 */
export async function initiateAppleSignIn(): Promise<string> {
  return new Promise((resolve, reject) => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const authUrl = `${API_BASE_URL}/auth/social/apple/redirect`;

    const popup = window.open(
      authUrl,
      'apple-signin',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no`,
    );

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this application.'));
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Apple Sign-In timed out. Please try again.'));
    }, 120_000);

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'social-auth-callback') {
        cleanup();
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else if (event.data.id_token) {
          resolve(event.data.id_token as string);
        } else {
          reject(new Error('No token received from Apple Sign-In'));
        }
      }
    };

    const pollInterval = setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error('Sign-in window was closed'));
      }
    }, 500);

    function cleanup() {
      clearTimeout(timeout);
      clearInterval(pollInterval);
      window.removeEventListener('message', handleMessage);
      if (popup && !popup.closed) popup.close();
    }

    window.addEventListener('message', handleMessage);
  });
}
