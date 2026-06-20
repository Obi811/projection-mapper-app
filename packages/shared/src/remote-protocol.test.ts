import { describe, it, expect } from 'vitest';
import {
  ClientCommandType,
  REMOTE_DEFAULT_PORT,
  RemoteCommands,
  buildRemoteUrl,
  decodePairingInfo,
  encodePairingInfo,
  responseType,
} from './remote-protocol';

describe('remote-protocol', () => {
  it('builds a ws url from host and port', () => {
    expect(buildRemoteUrl('192.168.1.5', 8765)).toBe('ws://192.168.1.5:8765');
  });

  it('derives the response type for a command', () => {
    expect(responseType(ClientCommandType.GET_STATE)).toBe('get_state_response');
  });

  it('round-trips pairing info through encode/decode', () => {
    const encoded = encodePairingInfo({
      host: '10.0.0.2',
      port: REMOTE_DEFAULT_PORT,
      token: 'abc123',
      version: '1.0.0',
    });
    const decoded = decodePairingInfo(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.kind).toBe('projection-mapper-remote');
    expect(decoded?.host).toBe('10.0.0.2');
    expect(decoded?.port).toBe(REMOTE_DEFAULT_PORT);
    expect(decoded?.token).toBe('abc123');
  });

  it('returns null for invalid pairing payloads', () => {
    expect(decodePairingInfo('not json')).toBeNull();
    expect(decodePairingInfo(JSON.stringify({ kind: 'other', host: 'x' }))).toBeNull();
    expect(decodePairingInfo(JSON.stringify({ kind: 'projection-mapper-remote' }))).toBeNull();
  });

  it('defaults the version when missing in a valid payload', () => {
    const decoded = decodePairingInfo(
      JSON.stringify({ kind: 'projection-mapper-remote', host: 'h', port: 1, token: 't' }),
    );
    expect(decoded?.version).toBe('1.0.0');
  });

  it('constructs well-formed command envelopes', () => {
    expect(RemoteCommands.auth('tok', 'Phone')).toEqual({
      type: ClientCommandType.AUTH,
      payload: { token: 'tok', name: 'Phone' },
    });
    expect(RemoteCommands.seek(42)).toEqual({
      type: ClientCommandType.SEEK,
      payload: { position: 42 },
    });
    expect(RemoteCommands.setVolume(0.5)).toEqual({
      type: ClientCommandType.SET_VOLUME,
      payload: { volume: 0.5 },
    });
    expect(RemoteCommands.play()).toEqual({ type: ClientCommandType.PLAY });
    expect(RemoteCommands.setBlackout(true)).toEqual({
      type: ClientCommandType.SET_BLACKOUT,
      payload: { enabled: true },
    });
  });
});
