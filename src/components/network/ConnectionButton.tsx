"use client";

import { useConnection } from "@/hooks/useConnection";
import { Button } from "@/components/ui/button";
import { UserPlus, Clock, UserCheck, UserX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionButtonProps {
  targetUserId: string;
  size?: "sm" | "default" | "lg";
  className?: string;
  // Callback to trigger parent list re-fetch after action
  onStatusChange?: () => void;
}

/**
 * ConnectionButton — Declarative connection action button.
 *
 * Automatically renders the correct state based on the real-time
 * connection status between the logged-in user and targetUserId.
 *
 * States:
 *   none            → "Connect" button
 *   pending_sent    → "Pending" + "Withdraw" option
 *   pending_received → "Accept" + "Decline" buttons
 *   connected       → "Connected" + "Remove" option
 *   loading         → Spinner
 */
export function ConnectionButton({
  targetUserId,
  size = "sm",
  className,
  onStatusChange,
}: ConnectionButtonProps) {
  const { status, isMutating, sendRequest, accept, decline, remove } =
    useConnection(targetUserId);

  const handleAction = async (action: () => Promise<void>) => {
    await action();
    onStatusChange?.();
  };

  if (status === "loading") {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (status === "none" || status === "declined") {
    return (
      <Button
        size={size}
        className={className}
        disabled={isMutating}
        onClick={() => handleAction(sendRequest)}
      >
        <UserPlus className="h-4 w-4 mr-1.5" />
        Connect
      </Button>
    );
  }

  if (status === "pending_sent") {
    return (
      <Button
        variant="outline"
        size={size}
        className={cn("text-muted-foreground", className)}
        disabled={isMutating}
        onClick={() => handleAction(remove)}
      >
        {isMutating ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
        ) : (
          <Clock className="h-4 w-4 mr-1.5" />
        )}
        Pending
      </Button>
    );
  }

  if (status === "pending_received") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          size={size}
          disabled={isMutating}
          onClick={() => handleAction(accept)}
        >
          {isMutating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <UserCheck className="h-4 w-4 mr-1.5" />
          )}
          Accept
        </Button>
        <Button
          variant="outline"
          size={size}
          disabled={isMutating}
          onClick={() => handleAction(decline)}
        >
          <UserX className="h-4 w-4 mr-1.5" />
          Decline
        </Button>
      </div>
    );
  }

  if (status === "connected") {
    return (
      <Button
        variant="outline"
        size={size}
        className={cn("text-muted-foreground hover:text-destructive hover:border-destructive", className)}
        disabled={isMutating}
        onClick={() => handleAction(remove)}
      >
        {isMutating ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
        ) : (
          <UserCheck className="h-4 w-4 mr-1.5" />
        )}
        Connected
      </Button>
    );
  }

  return null;
}
