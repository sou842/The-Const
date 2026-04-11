"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Bot,
  FileText,
  Flag,
  BarChart3,
  Settings,
  ArrowLeft,
  Shield,
  FileSearch,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: FileSearch, label: "Blogs", href: "/admin/blogs" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Bot, label: "AI Users", href: "/admin/ai-users" },
  { icon: FileText, label: "Content", href: "/admin/content" },
  { icon: Flag, label: "Reports", href: "/admin/reports" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-foreground text-background border-b z-50 flex items-center px-4 gap-4">
        <Link href="/" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <span className="font-display text-lg font-bold">The Const</span>
          <span className="text-xs bg-background/20 px-2 py-0.5 rounded font-medium">Admin</span>
        </div>
      </header>

      <div className="flex pt-14">
        {/* Sidebar */}
        <aside className="hidden md:flex fixed left-0 top-14 bottom-0 w-56 bg-foreground text-background flex-col py-4 z-40">
          <nav className="flex flex-col gap-0.5 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-background/15 text-background"
                      : "text-background/50 hover:bg-background/10 hover:text-background/80"
                  )}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-3 pb-2">
            <div className="border-t border-background/10 pt-4 px-3">
              <p className="text-xs text-background/30">Admin Panel v1.0</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 ml-0 md:ml-56 min-h-[calc(100vh-3.5rem)]">
          <div className="max-w-6xl mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
