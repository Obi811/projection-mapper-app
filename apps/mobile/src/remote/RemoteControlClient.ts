/**
 * RemoteControlClient
 *
 * WebSocket client that talks to the desktop app's remote-control server.
 * Uses the shared protocol so the wire format can never drift from the server.
 */
import {
  ClientCommandType,
  RemoteCommands,
  RemoteMessage,
  RemoteStatePayload,
  ServerMessageType,
  WelcomePayload,
  buildRemoteUrl,
  responseType,
} from '@projection-mapper/shared';

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'authenticating'
  | 'connected'
  | 'auth_failed'
  | 'error';

export interface RemoteClientListeners {
  onStatus?: (status: ConnectionStatus) => void;
  onState?: (state: RemoteStatePayload) => void;
  onError?: (message: string) => void;
  onWelcome?: (welcome: WelcomePayload) => void;
}

export interface ConnectOptions {
  host: string;
  port: number;
  token: string;
  /** Friendly name reported to the server. */
  clientName?: string;
}

const RECONNECT_DELAY_MS = 2500;
const MAX_RECONNECT_ATTEMPTS = 5;

export class RemoteControlClient {
  private ws: WebSocket | null = null;
  private listeners: RemoteClientListeners;
  private options: ConnectOptions | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;

  constructor(listeners: RemoteClientListeners = {}) {
    this.listeners = listeners;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }

  connect(options: ConnectOptions): void {
    this.options = options;
    this.manuallyClosed = false;
    this.reconnectAttempts = 0;
    this.openSocket();
  }

  disconnect(): void {
    this.manuallyClosed = true;
    this.clearReconnect();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  // ─── Commands ──────────────────────────────────────────────────────────────

  play(): void {
    this.send(RemoteCommands.play());
  }
  pause(): void {
    this.send(RemoteCommands.pause());
  }
  stop(): void {
    this.send(RemoteCommands.stop());
  }
  seek(position: number): void {
    this.send(RemoteCommands.seek(position));
  }
  setVolume(volume: number): void {
    this.send(RemoteCommands.setVolume(volume));
  }
  selectScene(sceneId: string): void {
    this.send(RemoteCommands.selectScene(sceneId));
  }
  nextScene(): void {
    this.send(RemoteCommands.nextScene());
  }
  prevScene(): void {
    this.send(RemoteCommands.prevScene());
  }
  setBlackout(enabled: boolean): void {
    this.send(RemoteCommands.setBlackout(enabled));
  }
  requestState(): void {
    this.send(RemoteCommands.getState());
  }

  // ─── Internals ───────────────────────────────────────────────────────────────

  private openSocket(): void {
    if (!this.options) return;
    const { host, port } = this.options;
    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(buildRemoteUrl(host, port));
    } catch (err) {
      this.setStatus('error');
      this.listeners.onError?.(err instanceof Error ? err.message : 'Connection failed');
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setStatus('authenticating');
      // Send auth immediately after the socket opens.
      this.send(RemoteCommands.auth(this.options!.token, this.options!.clientName ?? 'Mobile Remote'));
    };

    this.ws.onmessage = (event: WebSocketMessageEvent) => {
      this.handleMessage(typeof event.data === 'string' ? event.data : '');
    };

    this.ws.onerror = () => {
      this.listeners.onError?.('WebSocket error');
      this.setStatus('error');
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (!this.manuallyClosed) {
        this.setStatus('disconnected');
        this.scheduleReconnect();
      }
    };
  }

  private handleMessage(raw: string): void {
    if (!raw) return;
    let message: RemoteMessage;
    try {
      message = JSON.parse(raw) as RemoteMessage;
    } catch {
      return;
    }

    switch (message.type) {
      case ServerMessageType.WELCOME:
        this.listeners.onWelcome?.(message.payload as WelcomePayload);
        break;
      case ServerMessageType.AUTH_SUCCESS:
        this.setStatus('connected');
        this.requestState();
        break;
      case ServerMessageType.AUTH_FAILED:
        this.setStatus('auth_failed');
        this.manuallyClosed = true; // do not auto-reconnect on bad token
        break;
      case ServerMessageType.STATE:
        this.listeners.onState?.(message.payload as RemoteStatePayload);
        break;
      case ServerMessageType.ERROR:
        this.listeners.onError?.((message.payload as { message?: string })?.message ?? 'Server error');
        break;
      case responseType(ClientCommandType.GET_STATE):
        // Server may answer get_state via a command response envelope.
        if (message.payload) {
          this.listeners.onState?.(message.payload as RemoteStatePayload);
        }
        break;
      default:
        // Other command responses are currently ignored by the UI.
        break;
    }
  }

  private send(message: RemoteMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.listeners.onStatus?.(status);
    }
  }

  private scheduleReconnect(): void {
    if (this.manuallyClosed || this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
    this.clearReconnect();
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => this.openSocket(), RECONNECT_DELAY_MS);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
