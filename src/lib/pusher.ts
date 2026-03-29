"use client";

/**
 * src/lib/pusher.ts
 * Pusher client singleton.
 *
 * Lazily initialised so it never runs during SSR.
 * A single Pusher instance is shared across the entire app —
 * Pusher itself manages channel subscriptions internally.
 */

import Pusher from "pusher-js";

// Singleton instance — created once and reused for all subscriptions
let pusherInstance: Pusher | null = null;

/**
 * Returns the shared Pusher client instance.
 * Initialises it on first call using NEXT_PUBLIC_ env variables.
 */
export function getPusherClient(): Pusher {
  if (!pusherInstance) {
    // NEXT_PUBLIC_ variables are inlined by Next.js at build time — safe to use on the client
    pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      // Enable encrypted (TLS) connection
      forceTLS: true,
    });
  }
  return pusherInstance;
}

/**
 * Disconnect and destroy the Pusher singleton.
 * Call this when the user logs out to clean up the connection.
 */
export function disconnectPusher(): void {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }
}
