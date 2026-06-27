import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Use polling first, then upgrade to websocket
    // This is required for Railway which needs HTTP upgrade handshake
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
      transports: ['polling', 'websocket'], // polling first — critical for Railway
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
      timeout: 20000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected');
      setConnected(true);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
      setConnected(false);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
