"use client";

import { Home, Compass, MessageCircle, Bell, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

const items = [
  { icon: Home, href: "/" },
  { icon: Compass, href: "/explore" },
  { icon: MessageCircle, href: "/messages" },
  { icon: Bell, href: "/notifications" },
  { icon: User, href: "/profile" },
];

export const MobileNav = () => {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t flex md:hidden">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex items-center justify-center py-3 transition-colors relative",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5 relative" />
            {item.href === '/notifications' && unreadCount > 0 && (
              <span className="absolute top-2 right-1/4 translate-x-1/2 bg-destructive text-destructive-foreground text-[10px] sm:text-[8px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
};
