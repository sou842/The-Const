"use client";

import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

interface OnlineStatus {
  [userId: string]: boolean;
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(() => {
    if (typeof window === "undefined") return false;
    return getSocket().connected;
  });
  const [onlineUsers, setOnlineUsers] = useState<OnlineStatus>({});
  const [socket] = useState<Socket | null>(() => (typeof window !== "undefined" ? getSocket() : null));

  useEffect(() => {
    if (!socket) return;

    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onUserStatus = ({ userId, online }: { userId: string; online: boolean }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: online }));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('user:status', onUserStatus);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('user:status', onUserStatus);
    };
  }, [socket]);

  const isUserOnline = useCallback(
    (userId: string) => onlineUsers[userId] ?? false,
    [onlineUsers]
  );

  return { socket, isConnected, isUserOnline };
}
