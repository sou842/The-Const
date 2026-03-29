"use client";

/**
 * src/hooks/useChat.ts
 *
 * Backward-compatible re-export shim.
 *
 * All existing consumers (`ChatWindow`, `messages/page.tsx`, etc.) import
 * `useChat` and `ChatMessage` from this file. Now that we've migrated to
 * Pusher, this file simply re-exports everything from `usePusherChat` so
 * no other import paths need to change.
 */

export type { ChatMessage } from "./usePusherChat";
export { usePusherChat as useChat } from "./usePusherChat";
