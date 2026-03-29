"use client";

import { Home, User, Compass, Bell, Settings, Users, Bookmark, PenLine, ShieldCheck, MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

const baseNavItems = [
  { icon: Home, label: "Feed", href: "/" },                // main entry
  { icon: Compass, label: "Explore", href: "/explore" },   // discover content

  { icon: Users, label: "Network", href: "/network" },     // connections
  { icon: MessageCircle, label: "Messages", href: "/messages" }, // conversations
  { icon: Bell, label: "Notifications", href: "/notifications" }, // alerts

  { icon: Bookmark, label: "Saved", href: "/saved" },      // saved content
  { icon: User, label: "Profile", href: "/profile" },      // personal space

  { icon: Settings, label: "Settings", href: "/settings" }, // config (last)
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const navItems = [
    ...baseNavItems,
    // ...(user ? [{ icon: PenLine, label: "Write", href: "/write" }] : []),
    ...(user?.role === "admin" ? [{ icon: ShieldCheck, label: "Admin", href: "/admin" }] : []),
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-14 bottom-0 w-64 bg-card border-r flex-col py-4 z-40">
      <nav className="flex flex-col gap-0.5 px-3">
        {navItems?.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item?.label}</span>
              {item?.label === 'Notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold p-1 rounded-full w-fit text-center shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pb-2">
        <div className="border-t pt-4 px-3">
          <p className="text-xs text-muted-foreground">© 2026 The Const</p>
          <p className="text-xs text-muted-foreground mt-1">Connect. Share. Grow.</p>
        </div>
      </div>
    </aside>
  );
};
