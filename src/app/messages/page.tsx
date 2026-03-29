"use client";

import { useState, useRef, useEffect, KeyboardEvent, Suspense, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import useSWR from "swr";
import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { getter } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { useChat } from "@/hooks/useChat";

import { ConversationList } from "@/components/messages/ConversationList";
import { ChatWindow } from "@/components/messages/ChatWindow";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Conversation {
  _id: string;
  lastMessage: string;
  lastActivity: string;
  unreadCount: number;
  otherUser: {
    _id: string;
    name: string;
    profilePhoto?: string;
    profession?: string;
  };
}

export interface Connection {
  _id: string;
  user: {
    _id: string;
    name: string;
    profilePhoto?: string;
    profession?: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Inner Page ────────────────────────────────────────────────────────────────
function MessagesPageInner() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeConvId = searchParams.get("id");

  const { socket, isConnected, isUserOnline } = useSocket();
  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState("");
  const [isStartingConv, setIsStartingConv] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [convError, setConvError] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const isStartingConvRef = useRef(false);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: convData, isLoading: convsLoading, mutate: refetchConvs } = useSWR(
    user ? "/api/messages/conversations" : null,
    getter,
    { refreshInterval: 10000 }
  );

  const { data: connData, isLoading: connsLoading } = useSWR(
    user ? "/api/network/connections" : null,
    getter
  );

  const conversations: Conversation[] = convData?.conversations ?? [];
  const connections: Connection[] = connData?.connections ?? [];

  const filteredConversations = conversations.filter((c) =>
    c.otherUser.name.toLowerCase().includes(search.toLowerCase())
  );

  const convUserIds = new Set(conversations.map((c) => c.otherUser._id));
  const newConnections = connections.filter(
    (conn) =>
      !convUserIds.has(conn.user._id) &&
      conn.user.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeConversation = conversations.find((c) => c._id === activeConvId) || null;
  const hasValidSelection = Boolean(activeConvId && activeConversation);

  const { messages, isLoadingHistory, isSending, isOtherTyping, sendMessage, notifyTyping } =
    useChat({
      socket,
      conversationId: activeConvId,
      currentUserId: user?._id ?? "",
    });

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOtherTyping]);

  useEffect(() => {
    if (activeConvId && !convsLoading && !activeConversation) {
      updateConvSelection(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId, convsLoading, activeConversation]);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content) return;

    setInputValue("");
    setSendError(null);

    const ok = await sendMessage(content);
    if (!isMountedRef.current) return;

    if (ok) {
      refetchConvs();
    } else {
      setInputValue(content);
      setSendError("Failed to send message. Please try again.");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = useCallback((val: string) => {
    setInputValue(val);
    setSendError(null);
    if (val.trim()) {
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = setTimeout(() => {
        notifyTyping();
      }, 300);
    }
  }, [notifyTyping]);

  useEffect(() => {
    return () => {
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    };
  }, []);

  const updateConvSelection = useCallback((id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set("id", id);
    } else {
      params.delete("id");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const handleStartNewChat = async (targetUserId: string) => {
    if (isStartingConvRef.current) return;
    isStartingConvRef.current = true;
    setIsStartingConv(true);
    setConvError(null);

    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });

      if (!isMountedRef.current) return;

      if (response.ok) {
        const { conversation } = await response.json();
        await refetchConvs();
        if (isMountedRef.current) {
          updateConvSelection(conversation._id);
          setSearch("");
        }
      } else {
        const body = await response.json().catch(() => ({}));
        if (isMountedRef.current) {
          setConvError(body?.message ?? "Could not start conversation. Please try again.");
        }
      }
    } catch {
      if (isMountedRef.current) {
        setConvError("Network error. Please check your connection and try again.");
      }
    } finally {
      isStartingConvRef.current = false;
      if (isMountedRef.current) setIsStartingConv(false);
    }
  };

  const clearSelection = () => updateConvSelection(null);

  return (
    <AppLayout layout="full">
      <div className="bg-card md:rounded-xl border border-border/50 overflow-hidden pb-16 md:pb-0 flex flex-col shadow-sm md:h-[calc(100dvh-7rem)] h-[calc(100dvh-0rem)]">
        <div className="flex h-full">
          <ConversationList
            conversations={filteredConversations}
            newConnections={newConnections}
            isLoading={convsLoading || connsLoading}
            search={search}
            onSearchChange={setSearch}
            activeConvId={activeConvId}
            hasValidSelection={hasValidSelection}
            isConnected={isConnected}
            isUserOnline={isUserOnline}
            isStartingConv={isStartingConv}
            onSelectConv={updateConvSelection}
            onStartNewChat={handleStartNewChat}
            convError={convError}
            formatTime={formatTime}
            getInitials={getInitials}
          />

          <ChatWindow
            activeConversation={activeConversation}
            hasValidSelection={hasValidSelection}
            clearSelection={clearSelection}
            isUserOnline={isUserOnline}
            isLoadingHistory={isLoadingHistory}
            messages={messages}
            currentUserId={user?._id ?? ""}
            isOtherTyping={isOtherTyping}
            messageEndRef={messageEndRef}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            onKeyDown={handleKeyDown}
            isSending={isSending}
            isStartingConv={isStartingConv}
            sendError={sendError}
            onSend={handleSend}
            getInitials={getInitials}
            formatTime={formatTime}
          />
        </div>
      </div>
      <MobileNav />
    </AppLayout>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <AppLayout layout="full">
        <div className="h-[calc(100vh-7rem)] flex animate-pulse bg-card rounded-xl border">
          <div className="w-80 border-r" />
          <div className="flex-1" />
        </div>
      </AppLayout>
    }>
      <MessagesPageInner />
    </Suspense>
  );
}