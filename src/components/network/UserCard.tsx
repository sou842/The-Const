"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConnectionButton } from "@/components/network/ConnectionButton";
import { MapPin } from "lucide-react";

interface NetworkUser {
  _id: string;
  name: string;
  profilePhoto?: string;
  profession?: string;
  shortBio?: string;
  location?: string;
}

interface UserCardProps {
  user: NetworkUser;
  onStatusChange?: () => void;
  // For request cards — show the request timestamp
  requestedAt?: string;
  // Override action (e.g., for inline accept/decline on the requests list)
  connectionId?: string;
}

/**
 * UserCard — Re-usable card for the Network page and any user discovery context.
 * Includes avatar, name, profession, location and a smart ConnectionButton.
 */
export function UserCard({ user, onStatusChange }: UserCardProps) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center text-center p-5 bg-card rounded-xl border hover:shadow-md transition-shadow gap-3">
      <Avatar className="h-16 w-16">
        <AvatarImage src={user.profilePhoto} />
        <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 w-full">
        <p className="font-semibold text-sm truncate">{user.name}</p>
        {user.profession && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{user.profession}</p>
        )}
        {user.location && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <MapPin className="h-3 w-3" />
            {user.location}
          </p>
        )}
      </div>

      <ConnectionButton
        targetUserId={user._id}
        onStatusChange={onStatusChange}
        className="w-full"
      />
    </div>
  );
}

/**
 * UserListItem — Compact horizontal variant for request/connection lists.
 */
export function UserListItem({
  user,
  onStatusChange,
  meta,
}: {
  user: NetworkUser;
  onStatusChange?: () => void;
  meta?: string; // e.g., "Sent 2 days ago"
}) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 py-3">
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage src={user.profilePhoto} />
        <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name}</p>
        {user.profession && (
          <p className="text-xs text-muted-foreground truncate">{user.profession}</p>
        )}
        {meta && <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>}
      </div>
      <ConnectionButton
        targetUserId={user._id}
        onStatusChange={onStatusChange}
        className="shrink-0"
      />
    </div>
  );
}
