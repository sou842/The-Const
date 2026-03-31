"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import useSWR from "swr";
import { getter } from "@/lib/api";
import { saveToDB, removeFromDB, getAllFromDB, clearDB } from "@/lib/idb";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

interface Blog {
  _id: string;
  title: string;
  [key: string]: any;
}

interface SavedContextType {
  savedIds: Set<string>;
  isSaved: (id: string) => boolean;
  toggleSave: (post: Blog) => Promise<void>;
  isLoading: boolean;
}

const SavedContext = createContext<SavedContextType | null>(null);

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { data, mutate, isLoading: swrLoading } = useSWR(
    isAuthenticated ? "/api/saved" : null,
    getter
  );

  const [localSavedIds, setLocalSavedIds] = useState<Set<string>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load from IDB on mount
  useEffect(() => {
    async function loadFromDB() {
      try {
        const posts = await getAllFromDB();
        const ids = new Set<string>(posts.map((p: any) => p._id as string));
        setLocalSavedIds(ids);
      } catch (err) {
        console.error("Failed to load from IDB", err);
      } finally {
        setIsInitialLoad(false);
      }
    }
    loadFromDB();
  }, []);

  // Sync SWR data to IDB and Local State
  useEffect(() => {
    if (data?.savedBlogs) {
      const blogs = data.savedBlogs;
      const ids = new Set(blogs.map((b: Blog) => b._id));
      setLocalSavedIds(ids);
      
      const syncDB = async () => {
        await clearDB();
        for (const blog of blogs) {
          await saveToDB(blog);
        }
      };
      syncDB();
    }
  }, [data]);

  const isSaved = useCallback((id: string) => localSavedIds.has(id), [localSavedIds]);

  const toggleSave = useCallback(async (post: Blog) => {
    if (!isAuthenticated) {
      toast.error("Please login to save posts");
      return;
    }

    const id = post._id;
    const currentlySaved = localSavedIds.has(id);
    
    // 1. Optimistic Update Local State
    const nextIds = new Set(localSavedIds);
    if (currentlySaved) {
      nextIds.delete(id);
    } else {
      nextIds.add(id);
    }
    setLocalSavedIds(nextIds);

    // 2. Optimistic Update IDB
    try {
      if (currentlySaved) {
        await removeFromDB(id);
      } else {
        await saveToDB(post);
      }
    } catch (err) {
      console.error("IDB update failed", err);
    }

    // 3. API Call
    try {
      const res = await fetch("/api/saved", {
        method: currentlySaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId: id }),
      });

      if (!res.ok) throw new Error("Failed to sync with server");
      
      mutate();
      toast.success(currentlySaved ? "Removed from bookmarks" : "Added to bookmarks");
    } catch {
      setLocalSavedIds(localSavedIds);
      if (currentlySaved) {
        await saveToDB(post);
      } else {
        await removeFromDB(id);
      }
      toast.error("Could not update bookmarks");
    }
  }, [isAuthenticated, localSavedIds, mutate]);

  const value = useMemo(() => ({
    savedIds: localSavedIds,
    isSaved,
    toggleSave,
    isLoading: swrLoading && isInitialLoad
  }), [localSavedIds, isSaved, toggleSave, swrLoading, isInitialLoad]);

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used inside SavedProvider");
  return ctx;
}
