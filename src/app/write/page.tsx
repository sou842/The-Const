"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PublishDialog, type PublishData } from "@/components/editor/PublishDialog";
import { toast } from "sonner";
import { PenLine, X, Loader2 } from "lucide-react";
import type { BlogEditorHandle } from "@/components/editor/BlogEditor";

// Dynamic import — EditorJS needs browser APIs
const BlogEditor = dynamic(() => import("@/components/editor/BlogEditor"), { ssr: false });

import { poster, patcher, getter } from "@/lib/api";
import { EditorPanel } from "@/components/RightSidebar";

import { CATEGORIES } from "@/lib/constants";

export default function WritePage() {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <WritePageContent />
    </Suspense>
  );
}

function WritePageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const editorRef = useRef<BlogEditorHandle>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Edit Mode state
  const searchParams = useSearchParams();
  const urlParam = searchParams.get("url");
  const [isEditMode, setIsEditMode] = useState(false);
  const [initialBlocks, setInitialBlocks] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (urlParam && !authLoading) {
      if (!user) {
        router.push("/login"); // Fixed: redirect to login if not logged in
        return;
      }

      setIsEditMode(true);
      setFetching(true);
      getter(`/api/blogs/${urlParam}`)
        .then((data) => {
          if (data.blog) {
            // Permission Check: Author or Admin
            const isAuthor = String(data.blog.authorId) === String(user._id);
            const isAdmin = user.role === "admin";

            if (!isAuthor && !isAdmin) {
              toast.error("Unauthorized: You don't have permission to edit this post.");
              router.push("/");
              return;
            }

            setTitle(data.blog.title);
            setCategory(data.blog.category);
            setTags(data.blog.tags || []);
            setInitialBlocks(data.blog.body || []);
          }
        })
        .catch((err) => {
          console.error("Fetch blog error:", err);
          toast.error("Failed to load blog for editing.");
          router.push("/");
        })
        .finally(() => setFetching(false));
    }
  }, [urlParam, authLoading, user, router]);

  // Global loading state to prevent unauthorized UI flickers
  if (authLoading || (urlParam && fetching && !isEditMode)) {
    return (
      <AppLayout layout="editor">
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Verifying permissions...</p>
        </div>
      </AppLayout>
    );
  }

  const addTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error("Please add a title before publishing.");
      return;
    }
    if (!category) {
      toast.error("Please select a category.");
      return;
    }
    setShowPublishDialog(true);
  };

  const confirmPublish = async (publishData: PublishData) => {
    setPublishing(true);
    try {
      const blocks = await editorRef.current?.save();
      if (!blocks || blocks.length === 0) {
        toast.error("Blog content is empty. Please write something.");
        return;
      }

      const payload = {
        title: title.trim(),
        content: blocks,
        category: publishData.category,
        tags,
        thumbnail: publishData.thumbnail,
        contentType: publishData.contentType,
        language: "en",
      };

      if (isEditMode) {
        await patcher(`/api/blogs/${urlParam}`, payload);
        toast.success("Blog updated successfully!");
        router.push(`/blog/${urlParam}`);
      } else {
        await poster("/api/blogs", {
          ...payload,
          url: title.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-"),
        });
        toast.success("Blog submitted! It will appear in the feed once approved.");
        router.push("/");
      }

      setShowPublishDialog(false);
    } catch (error) {
      console.error("Publish error:", error);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <AppLayout layout="editor">
      <div className="pb-20 md:pb-8 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{isEditMode ? "Edit Blog" : "Write a Blog"}</h1>
          </div>
          <Button
            onClick={handlePublish}
            disabled={!title.trim() || !category || fetching}
            className="gap-2"
          >
            {isEditMode ? "Update" : "Publish"}
          </Button>
        </div>

        {/* Author info */}
        {/* {user && (
          <p className="text-xs text-muted-foreground mb-4">
            Writing as <span className="font-semibold text-foreground">{user.name}</span>
          </p>
        )} */}

        <div className="bg-card rounded-xl border p-4 md:p-6">
          {/* Title */}
          <div className="w-full h-auto md:px-10 px-0">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your headline here…"
              className="w-full text-4xl font-bold h-auto py-3 md:px-6 px-0 border-b rounded-none shadow-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/50 mb-6"
            />
          </div>

          {/* Editor */}
          <div className="min-h-[500px] mb-4 relative">
            {fetching && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <BlogEditor ref={editorRef} initialBlocks={initialBlocks} />
          </div>
        </div>

        {/* Category & Tags - Hidden on desktop as they are in the sidebar */}
        <div className="bg-card rounded-xl border p-4 space-y-4 xl:hidden">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category *</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${category === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-transparent hover:border-border"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Tags (up to 5)</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add a tag and press Enter..."
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" onClick={addTag} disabled={tags.length >= 5}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    #{tag}
                    <button onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <MobileNav />

      <EditorPanel
        category={category}
        setCategory={setCategory}
        tags={tags}
        addTag={addTag}
        removeTag={removeTag}
        tagInput={tagInput}
        setTagInput={setTagInput}
      />

      <PublishDialog
        category={category}
        publishing={publishing}
        open={showPublishDialog}
        initialData={{ title, category }}
        setCategory={setCategory}
        onConfirm={confirmPublish}
        onOpenChange={setShowPublishDialog}
      />
    </AppLayout>
  );
}
