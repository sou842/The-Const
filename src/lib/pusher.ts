import PusherClient from "pusher-js";
import PusherServer from "pusher";

/**
 * Pusher Client Setup (for use in use-client files only)
 */
let pusherInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherInstance) {
    pusherInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      forceTLS: true,
    });
  }
  return pusherInstance;
}

export function disconnectPusher(): void {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }
}

/**
 * Pusher Server Setup (for use in API routes only)
 * Singleton instance — keeps things simple for serverless deployment.
 */
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});
