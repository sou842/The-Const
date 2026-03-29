import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";
import type { ChatMessage } from "@/hooks/useChat";

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  formatTime: (iso: string | undefined | null) => string;
}

export function MessageBubble({ message, isMine, formatTime }: MessageBubbleProps) {
  return (
    <div className={cn("flex gap-2 max-w-[80%] md:max-w-[70%]", isMine ? "ml-auto flex-row-reverse" : "")}>
      <div
        className={cn(
          "px-3.5 py-2 rounded-2xl text-sm leading-relaxed",
          isMine
            ? "bg-primary text-primary-foreground rounded-br-sm shadow-sm"
            : "bg-muted rounded-bl-sm border border-border/40"
        )}
      >
        <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
        <div className={cn("flex items-center gap-1 mt-0.5", isMine ? "justify-end text-primary-foreground/60" : "text-muted-foreground/60")}>
          <span className="text-[10px]">
            {formatTime(message.createdAt)}
          </span>
          {isMine && (
            message.readAt
              ? <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
              : message.deliveredAt
              ? <CheckCheck className="h-3 w-3 text-primary-foreground/40" />
              : <Check className="h-3 w-3 text-primary-foreground/40" />
          )}
        </div>
      </div>
    </div>
  );
}
