import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConversationItem } from "./ConversationItem";
import type { Conversation, Connection } from "@/app/messages/page";

interface ConversationListProps {
  conversations: Conversation[];
  newConnections: Connection[];
  isLoading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  activeConvId: string | null;
  hasValidSelection: boolean;
  isConnected: boolean;
  isUserOnline: (userId: string) => boolean;
  isStartingConv: boolean;
  onSelectConv: (id: string) => void;
  onStartNewChat: (userId: string) => void;
  convError: string | null;
  formatTime: (iso: string | undefined | null) => string;
  getInitials: (name: string) => string;
}

export function ConversationList({
  conversations,
  newConnections,
  isLoading,
  search,
  onSearchChange,
  activeConvId,
  hasValidSelection,
  isConnected,
  isUserOnline,
  isStartingConv,
  onSelectConv,
  onStartNewChat,
  convError,
  formatTime,
  getInitials,
}: ConversationListProps) {
  return (
    <div
      className={cn(
        "w-full lg:w-80 lg:border-r flex flex-col shrink-0 transition-all duration-300 ease-in-out",
        hasValidSelection ? "hidden lg:flex" : "flex"
      )}
    >
      {/* Header */}
      <div className="p-4 sm:p-3 border-b space-y-3 sm:space-y-2 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-semibold text-base sm:text-sm tracking-tight text-foreground/90 font-display">
            Conversations
          </h2>
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              isConnected ? "text-green-500" : "text-muted-foreground/60"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-muted-foreground/40"
              )}
            />
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
          <Input
            placeholder="Search chats or creators"
            className="pl-9 bg-muted/40 border-0 h-10 sm:h-9 text-sm sm:text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all hover:bg-muted/60"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
        {isLoading && conversations.length === 0 ? (
          <div className="p-3 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center animate-pulse">
                <Skeleton className="h-12 w-12 rounded-full shrink-0 bg-muted/40" />
                <div className="flex-1 space-y-2.5">
                  <Skeleton className="h-4 w-2/3 bg-muted/30" />
                  <Skeleton className="h-3 w-1/2 bg-muted/20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Active Chats */}
            {conversations.length > 0 && (
              <div className="space-y-0.5">
                {conversations.map((conv) => (
                  <ConversationItem
                    key={conv._id}
                    user={conv.otherUser}
                    lastMessage={conv.lastMessage}
                    lastActivity={conv.lastActivity}
                    unreadCount={conv.unreadCount}
                    active={activeConvId === conv._id}
                    online={isUserOnline(conv.otherUser._id)}
                    onClick={() => onSelectConv(conv._id)}
                    formatTime={formatTime}
                    getInitials={getInitials}
                  />
                ))}
              </div>
            )}

            {/* New Connections to Message */}
            {newConnections.length > 0 && (
              <div className="mt-4 animate-in fade-in duration-500">
                <p className="px-4 py-3 text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest bg-muted/20 border-y border-border/5 mb-1">
                  Start a Chat
                </p>
                <div className="space-y-0.5">
                  {newConnections.map((conn) => (
                    <ConversationItem
                      key={conn._id}
                      user={conn.user}
                      active={false}
                      online={isUserOnline(conn.user._id)}
                      disabled={isStartingConv}
                      onClick={() => onStartNewChat(conn.user._id)}
                      formatTime={formatTime}
                      getInitials={getInitials}
                    />
                  ))}
                </div>
              </div>
            )}

            {convError && (
              <div className="m-3 p-3 bg-destructive/5 rounded-xl border border-destructive/10 animate-in slide-in-from-top-2 duration-300">
                <p className="text-xs text-destructive text-center font-medium leading-relaxed">
                  {convError}
                </p>
              </div>
            )}

            {conversations.length === 0 && newConnections.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-500">
                <div className="p-6 rounded-3xl bg-muted/30 mb-5 relative group">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="max-w-[180px] space-y-2">
                  <p className="text-sm font-semibold text-foreground/80">No chats yet</p>
                  <p className="text-xs text-muted-foreground/60 leading-relaxed">
                    {search ? "No creators match your search." : "Build your network to start high-quality conversations."}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
