"use client";

/**
 * src/hooks/usePusherChat.ts
 *
 * Pusher-backed replacement for the old useChat (Socket.IO) hook.
 *
 * How it works:
 *  1. On mount, subscribe to the Pusher channel `chat-${conversationId}`.
 *  2. Listen for `new-message` events and append them to local state.
 *  3. `sendMessage` POSTs to /api/send-message, which persists the message
 *     and triggers the Pusher event — so ALL subscribers (including this tab)
 *     receive it via the Pusher channel automatically.
 *  4. On unmount (or conversationId change), unsubscribe cleanly.
 *
 * Typing indicators and read receipts still work through lightweight API calls.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher";

// ── Shared types (re-exported so ChatWindow / MessageBubble keep their imports) ──
export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  readAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

interface UsePusherChatOptions {
  /** MongoDB ObjectId of the open conversation */
  conversationId: string | null;
  /** MongoDB ObjectId of the currently logged-in user */
  currentUserId: string;
}

interface UsePusherChatReturn {
  messages: ChatMessage[];
  isLoadingHistory: boolean;
  isSending: boolean;
  isOtherTyping: boolean;
  sendMessage: (content: string) => Promise<boolean>;
  notifyTyping: () => void;
}

export function usePusherChat({
  conversationId,
  currentUserId,
}: UsePusherChatOptions): UsePusherChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  // Refs for typing-indicator debounce (no re-render needed)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // ── Load historical messages from the REST API ────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!conversationId) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/messages/${conversationId}?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  }, [conversationId]);

  // ── Pusher subscription lifecycle ─────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;

    // Fetch persisted history first
    loadHistory();

    // Mark existing messages as read
    fetch(`/api/messages/${conversationId}/read`, { method: "POST" }).catch(
      () => {/* best-effort — non-critical */}
    );

    // --- Step 1: Get the shared Pusher client instance ---
    const pusher = getPusherClient();

    // --- Step 2: Subscribe to the conversation's dedicated channel ---
    // Channel format: `chat-${conversationId}` — one channel per conversation
    const channelName = `chat-${conversationId}`;
    const channel = pusher.subscribe(channelName);

    // --- Step 3: Listen for new messages on this channel ---
    // Event name must match what the server triggers in /api/send-message
    const handleNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => {
        // Deduplicate by _id (Pusher delivers at-least-once)
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      // Auto-mark as read if the message is from the other user
      if (msg.senderId !== currentUserId) {
        fetch(`/api/messages/${conversationId}/read`, { method: "POST" }).catch(
          () => {}
        );
      }
    };

    channel.bind("new-message", handleNewMessage);

    // --- Step 4: Listen for typing events ---
    const handleTyping = ({
      userId,
      isTyping,
    }: {
      userId: string;
      isTyping: boolean;
    }) => {
      // Only show the indicator for the other user's typing
      if (userId === currentUserId) return;
      setIsOtherTyping(isTyping);
      // Auto-clear fallback for missed `typing-stop` events (e.g. tab close)
      if (isTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(
          () => setIsOtherTyping(false),
          4000
        );
      } else {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    };

    channel.bind("typing-update", handleTyping);

    // --- Step 5: Listen for read-receipt acknowledgements ---
    const handleReadAck = ({ readBy }: { readBy: string; readAt: string }) => {
      // When the other user reads our messages, mark them as read in local state
      if (readBy === currentUserId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === currentUserId && !m.readAt
            ? { ...m, readAt: new Date().toISOString() }
            : m
        )
      );
    };

    channel.bind("message-read-ack", handleReadAck);

    // --- Step 6: Cleanup — unsubscribe when conversationId changes or unmounts ---
    return () => {
      channel.unbind("new-message", handleNewMessage);
      channel.unbind("typing-update", handleTyping);
      channel.unbind("message-read-ack", handleReadAck);
      // Unsubscribe from the channel entirely on unmount
      pusher.unsubscribe(channelName);
      setIsOtherTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, currentUserId, loadHistory]);

  // ── Send a message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!conversationId || !content.trim()) return false;
      setIsSending(true);

      // Stop typing indicator immediately on send
      if (isTypingRef.current) {
        isTypingRef.current = false;
        if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
        // Fire-and-forget typing-stop signal to other participants
        fetch("/api/messages/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, isTyping: false }),
        }).catch(() => {});
      }

      try {
        // POST to /api/send-message — this persists + triggers the Pusher event
        const res = await fetch("/api/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            senderId: currentUserId,
            roomId: conversationId,
          }),
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, currentUserId]
  );

  // ── Typing indicator (debounced, sent via REST) ───────────────────────────
  const notifyTyping = useCallback(() => {
    if (!conversationId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, isTyping: true }),
      }).catch(() => {});
    }

    // Auto-stop after 2 s of inactivity
    if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
    myTypingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        fetch("/api/messages/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, isTyping: false }),
        }).catch(() => {});
      }
    }, 2000);
  }, [conversationId]);

  return {
    messages,
    isLoadingHistory,
    isSending,
    isOtherTyping,
    sendMessage,
    notifyTyping,
  };
}
