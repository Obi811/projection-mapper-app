import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RemoteStatePayload } from '@projection-mapper/shared';
import {
  ConnectOptions,
  ConnectionStatus,
  RemoteControlClient,
} from '../remote/RemoteControlClient';

interface RemoteContextValue {
  status: ConnectionStatus;
  state: RemoteStatePayload | null;
  error: string | null;
  lastConnection: ConnectOptions | null;
  client: RemoteControlClient;
  connect: (options: ConnectOptions) => void;
  disconnect: () => void;
}

const LAST_CONN_KEY = 'pm.lastConnection';

const RemoteContext = createContext<RemoteContextValue | undefined>(undefined);

export function RemoteProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [state, setState] = useState<RemoteStatePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastConnection, setLastConnection] = useState<ConnectOptions | null>(null);

  const clientRef = useRef<RemoteControlClient>();
  if (!clientRef.current) {
    clientRef.current = new RemoteControlClient({
      onStatus: setStatus,
      onState: setState,
      onError: setError,
    });
  }

  // Restore the last successful connection descriptor (without auto-connecting).
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(LAST_CONN_KEY);
      if (raw) {
        try {
          setLastConnection(JSON.parse(raw) as ConnectOptions);
        } catch {
          /* ignore */
        }
      }
    })();
    const client = clientRef.current!;
    return () => client.disconnect();
  }, []);

  const connect = (options: ConnectOptions) => {
    setError(null);
    setLastConnection(options);
    void AsyncStorage.setItem(LAST_CONN_KEY, JSON.stringify(options));
    clientRef.current!.connect(options);
  };

  const disconnect = () => {
    clientRef.current!.disconnect();
    setState(null);
  };

  const value = useMemo<RemoteContextValue>(
    () => ({
      status,
      state,
      error,
      lastConnection,
      client: clientRef.current!,
      connect,
      disconnect,
    }),
    [status, state, error, lastConnection],
  );

  return <RemoteContext.Provider value={value}>{children}</RemoteContext.Provider>;
}

export function useRemote(): RemoteContextValue {
  const ctx = useContext(RemoteContext);
  if (!ctx) throw new Error('useRemote must be used within a RemoteProvider');
  return ctx;
}
