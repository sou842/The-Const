"use client";

/**
 * src/hooks/useSocket.ts  (Pusher edition)
 *
 * Previously this hook managed a Socket.IO connection and tracked online
 * presence via `user:status` events.  Now it:
 *
 *  - Tracks the Pusher connection state (connected / disconnected)
 *    so the ConversationList "Live" indicator keeps working.
 *  - Exposes `isUserOnline` as a stub that always returns `false`
 *    (full Pusher Presence Channels require extra server-side auth setup;
 *     add `/api/pusher/auth` + subscribe to `presence-global` to enable it).
 *
 * The `socket` property is intentionally removed — usePusherChat no
 * longer needs it. If any consumer still destructures `socket`, TypeScript
 * will catch it at compile time.
 */

import { useEffect, useState, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher";

export function useSocket() {
  // Pusher connection state — drives the "Live" dot in ConversationList
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only run on the client
    if (typeof window === "undefined") return;

    const pusher = getPusherClient();

    // Sync initial state (Pusher may already be connected on re-render)
    // — done via the handler below so it is never called synchronously
    // inside the effect body itself.
    const initialState = pusher.connection.state;

    // --- Listen to Pusher connection lifecycle events ---
    const onConnected = () => setIsConnected(true);
    const onDisconnected = () => setIsConnected(false);

    // If already connected before this effect ran, reflect that now
    // via queueMicrotask so React does not flag it as a sync setState.
    if (initialState === "connected") {
      queueMicrotask(() => setIsConnected(true));
    }

    pusher.connection.bind("connected", onConnected);
    pusher.connection.bind("disconnected", onDisconnected);
    // 'unavailable' fires when Pusher cannot reach the server
    pusher.connection.bind("unavailable", onDisconnected);
    pusher.connection.bind("failed", onDisconnected);

    return () => {
      pusher.connection.unbind("connected", onConnected);
      pusher.connection.unbind("disconnected", onDisconnected);
      pusher.connection.unbind("unavailable", onDisconnected);
      pusher.connection.unbind("failed", onDisconnected);
    };
  }, []);

  /**
   * isUserOnline — stub for now.
   * To enable real presence: set up Pusher Presence Channels + /api/pusher/auth.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isUserOnline = useCallback((_userId: string): boolean => false, []);

  return { isConnected, isUserOnline };
}
