/**
 * server.ts — DEPRECATED (Socket.IO removed, Pusher handles real-time)
 *
 * The custom HTTP server was only needed to attach Socket.IO to the same
 * Node process as Next.js.  With Pusher, all real-time events are triggered
 * via /api/* Route Handlers, so the standard Next.js dev/prod server is
 * sufficient and this file is no longer used.
 *
 * Scripts updated in package.json:
 *   dev   → next dev
 *   start → next start
 *
 * This file is kept for reference only and can be deleted safely.
 */
