import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, MessageCircle, CheckCheck, ChevronLeft } from "lucide-react";
import { KeyboardEvent, RefObject } from "react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { ChatMessage } from "@/hooks/useChat";
import type { Conversation } from "@/app/messages/page";
import Link from "next/link";

interface ChatWindowProps {
  activeConversation: Conversation | null;
  hasValidSelection: boolean;
  clearSelection: () => void;
  isUserOnline: (userId: string) => boolean;
  isLoadingHistory: boolean;
  messages: ChatMessage[];
  currentUserId: string;
  isOtherTyping: boolean;
  messageEndRef: RefObject<HTMLDivElement | null>;
  inputValue: string;
  onInputChange: (val: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  isSending: boolean;
  isStartingConv: boolean;
  sendError: string | null;
  onSend: () => void;
  getInitials: (name: string) => string;
  formatTime: (iso: string | undefined | null) => string;
}

export function ChatWindow({
  activeConversation,
  hasValidSelection,
  clearSelection,
  isUserOnline,
  isLoadingHistory,
  messages,
  currentUserId,
  isOtherTyping,
  messageEndRef,
  inputValue,
  onInputChange,
  onKeyDown,
  isSending,
  isStartingConv,
  sendError,
  onSend,
  getInitials,
  formatTime,
}: ChatWindowProps) {
  return (
    <div
      className={cn(
        "flex-1 flex-col min-w-0 bg-accent/5 transition-all",
        hasValidSelection ? "flex" : "hidden lg:flex"
      )}
    >
      {activeConversation ? (
        <>
          {/* Chat Header */}
          <div className="h-16 px-4 py-3 border-b flex items-center gap-3 shrink-0 bg-card/50 backdrop-blur-sm z-10">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10 -ml-1 mr-1"
              onClick={clearSelection}
              aria-label="Back to conversations"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Link href={`/profile/${activeConversation.otherUser._id}`} className="relative shrink-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={activeConversation.otherUser.profilePhoto} />
                <AvatarFallback className="text-xs font-bold">
                  {getInitials(activeConversation.otherUser.name)}
                </AvatarFallback>
              </Avatar>
              {isUserOnline(activeConversation.otherUser._id) && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
              )}
            </Link>
            <Link href={`/profile/${activeConversation.otherUser._id}`} className="flex-1 min-w-0">
              <p className="font-semibold text-sm sm:text-base truncate leading-tight">
                {activeConversation.otherUser.name}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate leading-tight">
                {isUserOnline(activeConversation.otherUser._id)
                  ? "Active now"
                  : activeConversation.otherUser.profession || "View Profile"}
              </p>
            </Link>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {isLoadingHistory ? (
              <div className="space-y-4 pt-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={cn("flex", i % 3 === 0 ? "" : "justify-end")}>
                    <Skeleton className={cn("h-11 rounded-2xl", i % 3 === 0 ? "w-52" : "w-40")} />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center bg-card/5 rounded-3xl">
                <div className="p-6 rounded-full bg-primary/10">
                  <MessageCircle className="h-10 w-10 text-primary/50" />
                </div>
                <div className="max-w-[200px] space-y-1.5">
                  <p className="font-semibold text-sm">No messages yet</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This is the beginning of your conversation with {activeConversation?.otherUser?.name}.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isMine={msg.senderId === currentUserId}
                  formatTime={formatTime}
                />
              ))
            )}

            {isOtherTyping && <TypingIndicator />}
            <div ref={messageEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 sm:px-3 sm:py-2.5 border-t bg-card/80 backdrop-blur-md flex items-end gap-2 shrink-0 z-10">
            <div className="flex-1 flex flex-col gap-1">
              <div className="min-h-[40px] max-h-[120px] bg-muted/50 rounded-2xl relative transition-all focus-within:ring-1 ring-primary/20">
                <Input
                  placeholder="Type a message…"
                  className="border-0 shadow-none bg-transparent h-10 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 px-4"
                  value={inputValue}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={isSending || isStartingConv}
                  autoComplete="off"
                  aria-label="Message input"
                />
              </div>
              {sendError && (
                <p className="text-xs text-destructive px-1">{sendError}</p>
              )}
            </div>
            <Button
              size="icon"
              className="h-10 w-10 sm:h-9 sm:w-9 shrink-0 rounded-full shadow-lg"
              onClick={onSend}
              disabled={!inputValue.trim() || isSending || isStartingConv}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground p-8 animate-in fade-in zoom-in duration-300">
          <div className="relative">
            <div className="p-6 rounded-full bg-primary/5">
              <MessageCircle className="h-16 w-16 opacity-10" />
            </div>
            <CheckCheck className="absolute -bottom-1 -right-1 h-8 w-8 text-primary opacity-20" />
          </div>
          <div className="text-center space-y-2 max-w-[280px]">
            <p className="font-semibold text-lg text-foreground">Stay Connected</p>
            <p className="text-sm leading-relaxed text-muted-foreground/80">
              Select a connection from the list to start a high-quality conversation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
