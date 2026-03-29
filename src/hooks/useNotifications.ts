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

import useSWR from "swr";
import { getter } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useNotifications() {
  const { user } = useAuth();

  // Poll for notifications every 8 seconds when the user is logged in.
  // revalidateOnFocus keeps the count fresh when the user switches tabs.
  const { data, mutate } = useSWR(
    user ? "/api/notifications" : null,
    getter,
    { refreshInterval: 8000, revalidateOnFocus: true }
  );

  const unreadCount = data?.notifications
    ? data.notifications.filter(
        (n: Record<string, unknown> & { isRead: boolean }) => !n.isRead
      ).length
    : 0;

  return { unreadCount, mutate };
}
