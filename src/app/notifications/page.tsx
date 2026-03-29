"use client";

import { useEffect, useMemo } from "react";
import { Heart, MessageCircle, UserPlus, AtSign, Loader2, Bell } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useSWR from "swr";
import { getter } from "@/lib/api";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const iconMap: Record<string, React.ElementType> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: AtSign,
};

export default function Notifications() {
  const { data, isLoading } = useSWR('/api/notifications', getter);
  const notifications = useMemo(() => data?.notifications || [], [data?.notifications]);

  // Mark notifications as read when visiting the page
  useEffect(() => {
    if (notifications.some((n: Record<string, unknown> & { isRead: boolean }) => !n.isRead)) {
      fetch('/api/notifications', { method: 'PUT' }).catch(console.error);
    }
  }, [notifications]);

  return (
    <AppLayout>
      <div className="pb-20 md:pb-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6 px-2">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        </div>

        <div className="bg-card rounded-2xl border divide-y overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-24">
              <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground/80 mb-1">All caught up!</p>
              <p className="text-sm text-muted-foreground">You have no new notifications right now.</p>
            </div>
          ) : (
            notifications.map((n: Record<string, unknown> & { _id: string; type: string; sender?: { name: string; _id: string; profilePhoto?: string }; message?: string; isRead: boolean; createdAt: string }) => {
              const Icon = iconMap[n.type] || Bell;
              const senderName = n.sender?.name || 'Someone';
              const senderInitials = senderName.split(' ').map((w: string) => w[0]).join('').slice(0, 2);
              
              let actionText = '';
              switch(n.type) {
                case 'like': actionText = 'liked your post'; break;
                case 'comment': actionText = 'commented on your post'; break;
                case 'follow': actionText = 'started following you'; break;
                case 'mention': actionText = 'mentioned you'; break;
                default: actionText = n.message || 'interacted with you';
              }

              return (
                <div 
                  key={n._id} 
                  className={cn(
                    "flex items-start gap-4 p-4 hover:bg-accent/50 transition-colors cursor-pointer",
                    !n.isRead && "bg-primary/5"
                  )}
                >
                  <Link href={`/profile/${n.sender?._id || ''}`} className="shrink-0 pt-0.5">
                    <Avatar className="h-10 w-10 ring-2 ring-background">
                      <AvatarImage src={n.sender?.profilePhoto} />
                      <AvatarFallback className="font-semibold text-xs">{senderInitials}</AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">
                      <Link href={`/profile/${n.sender?._id || ''}`} className="font-semibold hover:underline">
                        {senderName}
                      </Link>{' '}
                      <span className="text-foreground/80">{actionText}</span>
                    </p>
                    {n.message && n.type !== 'like' && n.type !== 'follow' && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2 italic border-l-2 border-primary/20 pl-2 ml-1">
                        &quot;{n.message}&quot;
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Icon className={cn(
                        "h-3.5 w-3.5",
                        n.type === 'like' && "text-destructive fill-destructive/20",
                        n.type === 'comment' && "text-blue-500 fill-blue-500/20",
                        n.type === 'follow' && "text-green-500 fill-green-500/20",
                        n.type === 'mention' && "text-primary fill-primary/20",
                      )} />
                      <p className="text-xs font-medium text-muted-foreground/80">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  {!n.isRead && (
                    <div className="w-2 h-2 shrink-0 rounded-full bg-primary mt-2 shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <MobileNav />
    </AppLayout>
  );
}
