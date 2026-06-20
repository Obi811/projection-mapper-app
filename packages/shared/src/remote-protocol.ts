/**
 * Remote Control Protocol — single source of truth
 *
 * This module defines the WebSocket message contract used between the
 * Projection Mapper **desktop server** (`remote-control-server.ts`) and the
 * **mobile companion app** (Expo / React Native).
 *
 * Both sides import these definitions so the wire format can never drift.
 */

/** Default WebSocket port the desktop remote-control server listens on. */
export const REMOTE_DEFAULT_PORT = 8765;

/** Protocol version negotiated in the `welcome` handshake. */
export const REMOTE_PROTOCOL_VERSION = '1.0.0';

/**
 * Message types sent **from the desktop server to the mobile client**.
 */
export enum ServerMessageType {
  /** Sent immediately after a socket connects. */
  WELCOME = 'welcome',
  /** Authentication accepted. */
  AUTH_SUCCESS = 'auth_success',
  /** Authentication rejected — socket will be closed by the server. */
  AUTH_FAILED = 'auth_failed',
  /** Generic error envelope. */
  ERROR = 'error',
  /** Full or partial application state broadcast. */
  STATE = 'state',
}

/**
 * Message types sent **from the mobile client to the desktop server**.
 *
 * `AUTH` must be sent first; afterwards any of the command types may be sent.
 * The server replies to every command `X` with a `${X}_response` message.
 */
export enum ClientCommandType {
  AUTH = 'auth',
  PLAY = 'play',
  PAUSE = 'pause',
  STOP = 'stop',
  SEEK = 'seek',
  SET_VOLUME = 'set_volume',
  SELECT_SCENE = 'select_scene',
  NEXT_SCENE = 'next_scene',
  PREV_SCENE = 'prev_scene',
  SET_BLACKOUT = 'set_blackout',
  GET_STATE = 'get_state',
}

/** Suffix appended by the server to acknowledge a command. */
export const RESPONSE_SUFFIX = '_response';

/** Build the response message type for a given command. */
export function responseType(command: string): string {
  return `${command}${RESPONSE_SUFFIX}`;
}

/** Base envelope for every message exchanged over the socket. */
export interface RemoteMessage<T = unknown> {
  type: string;
  payload?: T;
}

// ─── Server → Client payloads ────────────────────────────────────────────────

export interface WelcomePayload {
  clientId: string;
  serverVersion: string;
  requiresAuth: boolean;
}

export interface AuthResultPayload {
  message: string;
}

export interface ErrorPayload {
  message: string;
}

/** Snapshot of the desktop application state mirrored to remotes. */
export interface RemoteStatePayload {
  /** Whether audio/timeline playback is currently running. */
  isPlaying: boolean;
  /** Current playback position in seconds. */
  position: number;
  /** Total duration in seconds (0 if no media loaded). */
  duration: number;
  /** Master volume 0..1. */
  volume: number;
  /** Currently active scene id, if any. */
  activeSceneId?: string;
  /** Available scenes for navigation. */
  scenes: RemoteScene[];
  /** Output blackout flag. */
  blackout: boolean;
  /** Number of connected projectors. */
  projectorCount: number;
}

export interface RemoteScene {
  id: string;
  name: string;
}

// ─── Client → Server payloads ────────────────────────────────────────────────

export interface AuthPayload {
  token: string;
  name?: string;
}

export interface SeekPayload {
  position: number;
}

export interface VolumePayload {
  volume: number;
}

export interface SelectScenePayload {
  sceneId: string;
}

export interface BlackoutPayload {
  enabled: boolean;
}

// ─── QR pairing ──────────────────────────────────────────────────────────────

/**
 * Connection descriptor encoded into the pairing QR code shown by the desktop
 * app and scanned by the mobile app.
 */
export interface RemotePairingInfo {
  /** Discriminator so the scanner can validate the payload. */
  kind: 'projection-mapper-remote';
  /** Hostname or IP address of the desktop machine. */
  host: string;
  /** WebSocket port. */
  port: number;
  /** Authentication token. */
  token: string;
  /** Protocol version of the server. */
  version: string;
}

/** Encode pairing info into the string embedded in a QR code. */
export function encodePairingInfo(info: Omit<RemotePairingInfo, 'kind'>): string {
  const payload: RemotePairingInfo = { kind: 'projection-mapper-remote', ...info };
  return JSON.stringify(payload);
}

/** Safely decode a scanned QR string into pairing info, or `null` if invalid. */
export function decodePairingInfo(raw: string): RemotePairingInfo | null {
  try {
    const parsed = JSON.parse(raw) as Partial<RemotePairingInfo>;
    if (
      parsed &&
      parsed.kind === 'projection-mapper-remote' &&
      typeof parsed.host === 'string' &&
      typeof parsed.port === 'number' &&
      typeof parsed.token === 'string'
    ) {
      return {
        kind: 'projection-mapper-remote',
        host: parsed.host,
        port: parsed.port,
        token: parsed.token,
        version: typeof parsed.version === 'string' ? parsed.version : REMOTE_PROTOCOL_VERSION,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Build the `ws://` URL for a pairing descriptor. */
export function buildRemoteUrl(host: string, port: number): string {
  return `ws://${host}:${port}`;
}

/** Helpers to construct well-formed client command messages. */
export const RemoteCommands = {
  auth: (token: string, name?: string): RemoteMessage<AuthPayload> => ({
    type: ClientCommandType.AUTH,
    payload: { token, name },
  }),
  play: (): RemoteMessage => ({ type: ClientCommandType.PLAY }),
  pause: (): RemoteMessage => ({ type: ClientCommandType.PAUSE }),
  stop: (): RemoteMessage => ({ type: ClientCommandType.STOP }),
  seek: (position: number): RemoteMessage<SeekPayload> => ({
    type: ClientCommandType.SEEK,
    payload: { position },
  }),
  setVolume: (volume: number): RemoteMessage<VolumePayload> => ({
    type: ClientCommandType.SET_VOLUME,
    payload: { volume },
  }),
  selectScene: (sceneId: string): RemoteMessage<SelectScenePayload> => ({
    type: ClientCommandType.SELECT_SCENE,
    payload: { sceneId },
  }),
  nextScene: (): RemoteMessage => ({ type: ClientCommandType.NEXT_SCENE }),
  prevScene: (): RemoteMessage => ({ type: ClientCommandType.PREV_SCENE }),
  setBlackout: (enabled: boolean): RemoteMessage<BlackoutPayload> => ({
    type: ClientCommandType.SET_BLACKOUT,
    payload: { enabled },
  }),
  getState: (): RemoteMessage => ({ type: ClientCommandType.GET_STATE }),
} as const;
