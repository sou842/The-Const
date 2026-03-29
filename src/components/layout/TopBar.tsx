"use client";

import { Search, Bell, LogIn, LogOut, PenLine } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const TopBar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b flex items-center px-4 md:px-6 gap-4">
      <Link href="/" className="font-display text-2xl font-bold tracking-tight mr-4 shrink-0">
        The Const
      </Link>

      <div className="relative flex-1 max-w-md hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search people, posts, topics..."
          className="pl-9 bg-muted border-0 h-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        {user ? (
          <>
            <Button variant="ghost" size="sm" asChild className="gap-1.5 hidden md:flex">
              <Link href="/write">
                <PenLine className="h-4 w-4" /> Write
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href="/notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 translate-x-1/2 -translate-y-1/2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 ml-2 cursor-pointer">
                  <AvatarImage src={user.profilePhoto} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button size="sm" asChild className="gap-2">
            <Link href="/login">
              <LogIn className="h-4 w-4" /> Log In
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
};
