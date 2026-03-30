"use client";

import { ImageIcon, Video, FileText, Smile, User } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export const CreatePost = () => {
  const { user } = useAuth();

  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user?.profilePhoto} />
          <AvatarFallback className="bg-muted">
            <User className="h-5 w-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <Link
          href="/write"
          className="flex-1 text-left bg-muted rounded-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent transition-colors"
        >
          What&apos;s on your mind?
        </Link>
      </div>
      <div className="flex items-center gap-1 mt-3 pt-3 border-t overflow-x-auto">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" asChild>
          <Link href="/write">
            <ImageIcon className="h-4 w-4" /> Photo
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" asChild>
          <Link href="/write">
            <Video className="h-4 w-4" /> Video
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Smile className="h-4 w-4" /> Feeling
        </Button>
      </div>
    </div>
  );
};
