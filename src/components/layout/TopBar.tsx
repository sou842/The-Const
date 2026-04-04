"use client";

import { Search, MessageCircle, Bell, PenSquare, LogIn, LogOut, User, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user, loading, logout } = useAuth();
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
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-card/80 backdrop-blur-xl border-b border-border/50 flex items-center px-4 md:px-6 gap-3">
      {/* Logo */}
      <Link href="/" className="font-display text-2xl font-bold tracking-tight mr-2 shrink-0 hover:opacity-70 transition-opacity">
        The Const
      </Link>

      {/* Search */}
      <div className="relative flex-1 max-w-sm hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
        <Input
          placeholder="Search..."
          className="pl-9 bg-muted/60 border-0 h-9 rounded-full text-sm placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:bg-muted"
        />
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-0.5">
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="hidden md:block h-8 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          </div>
        ) : user ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex h-9 gap-2 rounded-full px-4 text-xs font-semibold hover:bg-foreground hover:text-primary-foreground transition-all"
              asChild
            >
              <Link href="/write">
                <PenSquare className="h-4 w-4" />
                Write
              </Link>
            </Button>

            <div className="h-5 w-px bg-border mx-1.5 hidden sm:block" />

            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative" asChild>
              <Link href="/messages">
                <MessageCircle className="h-[18px] w-[18px]" />
                {/* Assuming no unread count for messages for now as per Untitled-1 */}
              </Link>
            </Button>
            
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative" asChild>
              <Link href="/notifications">
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
                )}
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="ml-1.5">
                  <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-border hover:ring-foreground/30 transition-all">
                    <AvatarImage src={user.profilePhoto} />
                    <AvatarFallback className="text-[10px] font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <div className="flex items-center gap-3 px-3 py-3 border-b bg-muted/20">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profilePhoto} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <div className="p-1">
                  <DropdownMenuItem asChild className="rounded-md">
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-md">
                    <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild className="rounded-md">
                      <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                        <ShieldCheck className="h-4 w-4" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                </div>
                <DropdownMenuSeparator />
                <div className="p-1">
                  <DropdownMenuItem
                    className="text-destructive gap-2 rounded-md cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button size="sm" asChild className="gap-2 rounded-full px-5">
            <Link href="/login">
              <LogIn className="h-4 w-4" /> Log In
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
};
