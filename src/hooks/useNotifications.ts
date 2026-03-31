"use client";

/**
 * src/hooks/useNotifications.ts
 *
 * Notification badge hook — migrated from Socket.IO to SWR polling.
 *
 * The Socket.IO `notification:new` live-push has been replaced by a
 * faster SWR refresh interval (8 s).  If you want true push for
 * notifications, add a `notifications` Pusher channel and push from
 * the relevant API routes (e.g. when a new connection request arrives).
 */

import { useEffect } from "react";
import useSWR from "swr";
import { getter } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getPusherClient } from "@/lib/pusher";

export function useNotifications() {
  const { user } = useAuth();

  // Initial fetch of notifications
  const { data, mutate } = useSWR(
    user ? "/api/notifications" : null,
    getter,
    { revalidateOnFocus: true }
  );

  useEffect(() => {
    if (!user?._id) return;

    const pusher = getPusherClient();
    const channelName = `user_${user._id}`;
    const channel = pusher.subscribe(channelName);

    // When a new notification is pushed from the server
    channel.bind("notification:new", () => {
      // Re-fetch the notification list to get the full object and update count
      mutate();
    });

    return () => {
      pusher.unsubscribe(channelName);
    };
  }, [user?._id, mutate]);

  const unreadCount = data?.notifications
    ? data.notifications.filter(
        (n: Record<string, unknown> & { isRead: boolean }) => !n.isRead
      ).length
    : 0;

  return { unreadCount, mutate };
}
