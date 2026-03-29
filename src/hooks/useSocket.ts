"use client";

import { useEffect, useState, useCallback } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

interface OnlineStatus {
  [userId: string]: boolean;
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineStatus>({});
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    if (!s.connected) {
      s.connect();
    }

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onUserStatus = ({ userId, online }: { userId: string; online: boolean }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: online }));
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('user:status', onUserStatus);

    if (s.connected) setIsConnected(true);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('user:status', onUserStatus);
    };
  }, []);

  const isUserOnline = useCallback(
    (userId: string) => onlineUsers[userId] ?? false,
    [onlineUsers]
  );

  return { socket, isConnected, isUserOnline };
}
