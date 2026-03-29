"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';

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

interface UseChatOptions {
  socket: Socket | null;
  conversationId: string | null;
  currentUserId: string;
}

export function useChat({ socket, conversationId, currentUserId }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myTypingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // ── Load message history ─────────────────────────────────────────────────
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

  // ── Join room + load history when conversation changes ──────────────────
  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join the room
    socket.emit('join-conversation', conversationId);

    // Load history
    loadHistory();

    // Mark messages as read
    socket.emit('message:read', { conversationId, messageId: 'all' });

    // Listen for new messages
    const onNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => {
        // Deduplicate by _id
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Auto-mark as read if we're in this conversation
      socket.emit('message:read', { conversationId, messageId: msg._id });
    };

    // Listen for typing from the other user
    const onTypingUpdate = ({ isTyping }: { userId: string; isTyping: boolean }) => {
      setIsOtherTyping(isTyping);
      // Auto-clear typing indicator after 4s (fallback for tab close)
      if (isTyping) {
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setIsOtherTyping(false), 4000);
      } else {
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
      }
    };

    // Listen for read receipts
    const onReadAck = () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === currentUserId && !m.readAt
            ? { ...m, readAt: new Date().toISOString() }
            : m
        )
      );
    };

    socket.on('message:new', onNewMessage);
    socket.on('typing:update', onTypingUpdate);
    socket.on('message:read-ack', onReadAck);

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('typing:update', onTypingUpdate);
      socket.off('message:read-ack', onReadAck);
      setIsOtherTyping(false);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [socket, conversationId, currentUserId, loadHistory]);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!socket || !conversationId || !content.trim()) return false;
      setIsSending(true);

      // Stop typing indicator on send
      if (isTypingRef.current) {
        socket.emit('typing:stop', conversationId);
        isTypingRef.current = false;
        if (myTypingTimeout.current) clearTimeout(myTypingTimeout.current);
      }

      return new Promise((resolve) => {
        socket.emit(
          'message:send',
          { conversationId, content: content.trim() },
          (res: { ok: boolean; error?: string }) => {
            setIsSending(false);
            resolve(res.ok);
          }
        );
      });
    },
    [socket, conversationId]
  );

  // ── Typing indicator (debounced) ────────────────────────────────────────
  const notifyTyping = useCallback(() => {
    if (!socket || !conversationId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing:start', conversationId);
    }

    // Auto-stop typing after 2s of inactivity
    if (myTypingTimeout.current) clearTimeout(myTypingTimeout.current);
    myTypingTimeout.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socket.emit('typing:stop', conversationId);
      }
    }, 2000);
  }, [socket, conversationId]);

  return {
    messages,
    isLoadingHistory,
    isSending,
    isOtherTyping,
    sendMessage,
    notifyTyping,
  };
}
