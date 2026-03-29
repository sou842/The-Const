"use client";

/**
 * src/lib/socket.ts
 * Lazy Socket.io client singleton.
 *
 * Lazily initialised so it never runs during SSR.
 * Single instance is shared across the entire app.
 */

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      // Connect to same origin — no CORS, same-origin WS
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,  // send session cookie for auth
      autoConnect: false,     // manually connect on demand
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}
