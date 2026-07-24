"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';
import { API_URL, getApiHeaders } from '@/lib/api';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  isConnected: boolean;
  /** Incrementa a cada connect/reconnect — use para re-emitir join_chat */
  connectionGeneration: number;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
  isConnected: false,
  connectionGeneration: 0,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionGeneration, setConnectionGeneration] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
      return;
    }

    let cancelled = false;

    const connect = async () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      let wsToken: string | null = null;
      try {
        const res = await fetch(`${API_URL}/v2/api/chats/ws-token`, {
          credentials: 'include',
          headers: getApiHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          wsToken = data.token;
        } else {
          console.warn('[SOCKET] ws-token retornou', res.status);
        }
      } catch {
        console.warn('[SOCKET] Falha ao obter ws-token — usando polling como fallback');
      }

      if (cancelled) return;

      if (!wsToken) {
        setSocket(null);
        setIsConnected(false);
        return;
      }

      const instance = io(API_URL!, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        auth: { token: wsToken },
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        timeout: 15000,
      });

      if (cancelled) {
        instance.disconnect();
        return;
      }

      socketRef.current = instance;
      setSocket(instance);

      instance.on('connect', () => {
        if (cancelled) return;
        console.log('[SOCKET] Conectado:', instance.id);
        setIsConnected(true);
        setConnectionGeneration((g) => g + 1);
      });

      instance.on('disconnect', (reason) => {
        console.log('[SOCKET] Desconectado:', reason);
        setIsConnected(false);
      });

      instance.on('connect_error', (err) => {
        console.warn('[SOCKET] Erro de conexão:', err.message);
        setIsConnected(false);
      });

      instance.io.on('reconnect_attempt', async () => {
        try {
          const res = await fetch(`${API_URL}/v2/api/chats/ws-token`, {
            credentials: 'include',
            headers: getApiHeaders(),
          });
          if (res.ok) {
            const data = await res.json();
            instance.auth = { token: data.token };
          }
        } catch {
          // ignore
        }
      });

      instance.on('presence_update', (users: string[]) => {
        if (!cancelled) setOnlineUsers(Array.isArray(users) ? users : []);
      });
    };

    connect();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [user?.id, loading]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isConnected, connectionGeneration }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextType {
  return useContext(SocketContext);
}
