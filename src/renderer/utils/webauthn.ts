/**
 * WebAuthn / Passkey Utilities for Renderer Process
 *
 * Handles the browser-side WebAuthn credential creation & assertion,
 * plus serialisation for transport over IPC (ArrayBuffer → base64url).
 */

import type { SerializedCredential } from '../../shared/types';

// ─── Base64URL helpers ──────────────────────────────────────────────────────

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─── Server options → WebAuthn API ──────────────────────────────────────────

/**
 * Convert server-provided registration options (JSON with base64url strings)
 * into the format expected by navigator.credentials.create().
 */
export function decodeRegistrationOptions(
  options: Record<string, unknown>,
): CredentialCreationOptions {
  const publicKey = (options.publicKey ?? options) as Record<string, unknown>;

  const decoded: PublicKeyCredentialCreationOptions = {
    ...publicKey,
    challenge: base64urlToBuffer(publicKey.challenge as string),
    user: {
      ...(publicKey.user as Record<string, unknown>),
      id: base64urlToBuffer((publicKey.user as Record<string, string>).id),
    } as PublicKeyCredentialUserEntity,
  } as PublicKeyCredentialCreationOptions;

  // Decode excludeCredentials if present
  if (Array.isArray(publicKey.excludeCredentials)) {
    decoded.excludeCredentials = publicKey.excludeCredentials.map(
      (cred: Record<string, unknown>) => ({
        ...cred,
        id: base64urlToBuffer(cred.id as string),
      }),
    ) as PublicKeyCredentialDescriptor[];
  }

  return { publicKey: decoded };
}

/**
 * Convert server-provided login options (JSON with base64url strings)
 * into the format expected by navigator.credentials.get().
 */
export function decodeLoginOptions(
  options: Record<string, unknown>,
): CredentialRequestOptions {
  const publicKey = (options.publicKey ?? options) as Record<string, unknown>;

  const decoded: PublicKeyCredentialRequestOptions = {
    ...publicKey,
    challenge: base64urlToBuffer(publicKey.challenge as string),
  } as PublicKeyCredentialRequestOptions;

  // Decode allowCredentials if present
  if (Array.isArray(publicKey.allowCredentials)) {
    decoded.allowCredentials = publicKey.allowCredentials.map(
      (cred: Record<string, unknown>) => ({
        ...cred,
        id: base64urlToBuffer(cred.id as string),
      }),
    ) as PublicKeyCredentialDescriptor[];
  }

  return { publicKey: decoded };
}

// ─── Credential → serialisable JSON ────────────────────────────────────────

/**
 * Serialise a PublicKeyCredential (registration) for IPC transport.
 */
export function serializeRegistrationCredential(
  credential: PublicKeyCredential,
): SerializedCredential {
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      attestationObject: bufferToBase64url(response.attestationObject),
    },
  };
}

/**
 * Serialise a PublicKeyCredential (login/assertion) for IPC transport.
 */
export function serializeLoginCredential(
  credential: PublicKeyCredential,
): SerializedCredential {
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      authenticatorData: bufferToBase64url(response.authenticatorData),
      signature: bufferToBase64url(response.signature),
      userHandle: response.userHandle
        ? bufferToBase64url(response.userHandle)
        : undefined,
    },
  };
}

/**
 * Check if WebAuthn is available in this browser context.
 */
export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials !== 'undefined'
  );
}

/**
 * Check if platform authenticators (biometrics) are available.
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnAvailable()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}
