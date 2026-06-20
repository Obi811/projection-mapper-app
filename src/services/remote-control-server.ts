/**
 * Remote Control Server
 * 
 * WebSocket server for remote control from mobile apps.
 * Provides real-time state sync and command execution.
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { randomBytes } from 'crypto';
import type { RemoteCommand, RemoteClientInfo } from '../shared/types';

interface RemoteClient extends RemoteClientInfo {
  ws: WebSocket;
}

interface ServerConfig {
  port: number;
  authToken?: string;
}

class RemoteControlServerClass {
  private wss: WebSocketServer | null = null;
  private httpServer: Server | null = null;
  private clients: Map<string, RemoteClient> = new Map();
  private authToken: string = '';
  private port: number = 8765;
  
  private stateListeners: Set<(state: unknown) => void> = new Set();
  private commandHandlers: Map<string, (payload: unknown, clientId: string) => unknown> = new Map();
  
  /**
   * Start WebSocket server
   */
  start(config: ServerConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.port = config.port;
        this.authToken = config.authToken || this.generateToken();
        
        this.wss = new WebSocketServer({ port: this.port });
        
        this.wss.on('listening', () => {
          console.log(`[RemoteControl] Server started on port ${this.port}`);
          console.log(`[RemoteControl] Auth Token: ${this.authToken}`);
          resolve();
        });
        
        this.wss.on('connection', (ws: WebSocket) => {
          this.handleConnection(ws);
        });
        
        this.wss.on('error', (error) => {
          console.error('[RemoteControl] Server error:', error);
          reject(error);
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Stop WebSocket server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          console.log('[RemoteControl] Server stopped');
          this.wss = null;
          this.clients.clear();
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
  
  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    const clientId = randomBytes(16).toString('hex');
    
    const client: RemoteClient = {
      id: clientId,
      name: 'Unknown',
      ws,
      authenticated: false,
      connectedAt: Date.now(),
    };
    
    this.clients.set(clientId, client);
    
    console.log(`[RemoteControl] Client connected: ${clientId}`);
    
    ws.on('message', (data: Buffer) => {
      this.handleMessage(clientId, data.toString());
    });
    
    ws.on('close', () => {
      this.clients.delete(clientId);
      console.log(`[RemoteControl] Client disconnected: ${clientId}`);
    });
    
    ws.on('error', (error) => {
      console.error(`[RemoteControl] Client error ${clientId}:`, error);
    });
    
    // Send welcome message
    this.sendToClient(clientId, {
      type: 'welcome',
      payload: {
        clientId,
        serverVersion: '1.0.0',
        requiresAuth: !!this.authToken,
      },
    });
  }
  
  /**
   * Handle incoming message from client
   */
  private handleMessage(clientId: string, data: string): void {
    try {
      const message: RemoteCommand = JSON.parse(data);
      const client = this.clients.get(clientId);
      
      if (!client) return;
      
      // Handle authentication
      if (message.type === 'auth') {
        const token = (message.payload as { token?: string })?.token;
        if (token === this.authToken) {
          client.authenticated = true;
          client.name = (message.payload as { name?: string })?.name || 'Remote Client';
          this.sendToClient(clientId, {
            type: 'auth_success',
            payload: { message: 'Authenticated successfully' },
          });
          
          // Send current state
          this.broadcastState();
        } else {
          this.sendToClient(clientId, {
            type: 'auth_failed',
            payload: { message: 'Invalid token' },
          });
          client.ws.close();
        }
        return;
      }
      
      // Require authentication for other commands
      if (!client.authenticated && this.authToken) {
        this.sendToClient(clientId, {
          type: 'error',
          payload: { message: 'Authentication required' },
        });
        return;
      }
      
      // Handle command
      const handler = this.commandHandlers.get(message.type);
      if (handler) {
        const result = handler(message.payload, clientId);
        this.sendToClient(clientId, {
          type: `${message.type}_response`,
          payload: result,
        });
      } else {
        this.sendToClient(clientId, {
          type: 'error',
          payload: { message: `Unknown command: ${message.type}` },
        });
      }
      
    } catch (error) {
      console.error('[RemoteControl] Message parse error:', error);
      this.sendToClient(clientId, {
        type: 'error',
        payload: { message: 'Invalid message format' },
      });
    }
  }
  
  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: RemoteCommand): void {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }
  
  /**
   * Broadcast message to all authenticated clients
   */
  broadcast(message: RemoteCommand): void {
    const payload = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.authenticated && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    });
  }
  
  /**
   * Broadcast current state to all clients
   */
  broadcastState(): void {
    // This will be called by the main process when state changes
    // For now, just log
    console.log('[RemoteControl] Broadcasting state to', this.clients.size, 'clients');
  }
  
  /**
   * Register command handler
   */
  onCommand(type: string, handler: (payload: unknown, clientId: string) => unknown): void {
    this.commandHandlers.set(type, handler);
  }
  
  /**
   * Get connection info for QR code
   */
  getConnectionInfo(): { port: number; token: string; url: string } {
    return {
      port: this.port,
      token: this.authToken,
      url: `ws://localhost:${this.port}`,
    };
  }
  
  /**
   * Get list of connected clients
   */
  getClients(): RemoteClientInfo[] {
    return Array.from(this.clients.values()).map((c) => ({
      id: c.id,
      name: c.name,
      authenticated: c.authenticated,
      connectedAt: c.connectedAt,
    }));
  }
  
  /**
   * Generate secure auth token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }
  
  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.wss !== null;
  }
}

export const remoteControlServer = new RemoteControlServerClass();
