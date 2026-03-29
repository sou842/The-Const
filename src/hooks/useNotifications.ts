import useSWR from 'swr';
import { getter } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { data, mutate } = useSWR(user ? '/api/notifications' : null, getter);
  
  const unreadCount = data?.notifications 
    ? data.notifications.filter((n: Record<string, unknown> & { isRead: boolean }) => !n.isRead).length 
    : 0;

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = () => {
      // Re-fetch notifications to ensure we have the latest
      // Alternatively, we could optimistically update, but re-fetching is safer and simpler
      // for the bell icon count.
      mutate();
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, user, mutate]);

  return { unreadCount, mutate };
}
