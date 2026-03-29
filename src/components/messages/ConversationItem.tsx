import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ConversationItemProps {
  user: { name: string; profilePhoto?: string };
  lastMessage?: string;
  lastActivity?: string;
  unreadCount?: number;
  active: boolean;
  online: boolean;
  disabled?: boolean;
  onClick: () => void;
  formatTime: (iso: string | undefined | null) => string;
  getInitials: (name: string) => string;
}

export function ConversationItem({
  user,
  lastMessage,
  lastActivity,
  unreadCount = 0,
  active,
  online,
  disabled,
  onClick,
  formatTime,
  getInitials,
}: ConversationItemProps) {
  const initials = getInitials(user.name);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-4 sm:py-3 text-left hover:bg-accent/60 transition-colors border-b sm:border-b-0 border-border/40 cursor-pointer",
        active && "bg-accent shadow-sm ring-1 ring-border/50",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12 sm:h-11 sm:w-11 ring-2 ring-background">
          <AvatarImage src={user.profilePhoto} />
          <AvatarFallback className="font-semibold text-sm bg-muted text-muted-foreground whitespace-nowrap overflow-hidden">
            {initials}
          </AvatarFallback>
        </Avatar>
        {online && (
          <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-card" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={cn("text-sm sm:text-base md:text-sm truncate leading-tight", unreadCount > 0 ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
            {user.name}
          </p>
          <span className="text-[10px] sm:text-xs md:text-[10px] text-muted-foreground/60 shrink-0 ml-1">
            {lastActivity ? formatTime(lastActivity) : ""}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className={cn("text-xs sm:text-sm md:text-xs truncate max-w-[85%]", unreadCount > 0 ? "text-foreground/90 font-medium" : "text-muted-foreground/80")}>
            {lastMessage || "Start a new conversation"}
          </p>
          {unreadCount > 0 && (
            <span className="ml-1 shrink-0 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold shadow-lg animate-in zoom-in duration-200">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
