"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "creator";
  profilePhoto?: string;
  username?: string;
  profession?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const savedUser = Cookies.get(process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME!);
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!user);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        Cookies.set(process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME!, JSON.stringify(data.user), { expires: 7 }); // Sync cookie with latest data
      } else {
        setUser(null);
        Cookies.remove(process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME!);
      }
    } catch {
      setUser(null);
      Cookies.remove(process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME!);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    Cookies.remove(process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME!);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
