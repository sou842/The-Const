"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { PenLine, X, Loader2 } from "lucide-react";
import type { BlogEditorHandle } from "@/components/editor/BlogEditor";

// Dynamic import — EditorJS needs browser APIs
const BlogEditor = dynamic(() => import("@/components/editor/BlogEditor"), { ssr: false });

import { poster } from "@/lib/api";

const CATEGORIES = [
  "Technology", "Design", "Engineering", "Career", "Product",
  "AI & ML", "Startup", "Science", "Finance", "Productivity",
];

export default function WritePage() {
  const { user } = useAuth();
  const router = useRouter();
  const editorRef = useRef<BlogEditorHandle>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishing, setPublishing] = useState(false);

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

  const confirmPublish = async () => {
    setPublishing(true);
    try {
      const blocks = await editorRef.current?.save();
      if (!blocks || blocks.length === 0) {
        toast.error("Blog content is empty. Please write something.");
        return;
      }

      await poster("/api/blogs", {
        title: title.trim(),
        content: blocks,
        category,
        tags,
        url: title.trim().toLowerCase().replace(/\s+/g, "-"),
        thumbnail: { image: thumbnailUrl, title: title.trim() },
        language: "en",
      });

      toast.success("Blog submitted! It will appear in the feed once approved.");
      setShowPublishDialog(false);
      router.push("/");
    } catch (error) {
      // Errors are already toasted by the poster utility
      console.error("Publish error:", error);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <AppLayout>
      <div className="pb-20 md:pb-8 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Write a Blog</h1>
          </div>
          <Button
            onClick={handlePublish}
            disabled={!title.trim() || !category}
            className="gap-2"
          >
            Publish
          </Button>
        </div>

        {/* Author info */}
        {user && (
          <p className="text-xs text-muted-foreground mb-4">
            Writing as <span className="font-semibold text-foreground">{user.name}</span>
          </p>
        )}

        {/* Title */}
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Your blog title..."
          className="text-2xl font-bold h-auto py-3 px-0 border-0 border-b rounded-none shadow-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/50 mb-4"
        />

        {/* Editor */}
        <div className="bg-card rounded-xl border p-4 md:p-6 min-h-[500px] mb-4">
          <BlogEditor ref={editorRef} />
        </div>

        {/* Category & Tags */}
        <div className="bg-card rounded-xl border p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category *</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    category === cat
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

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish your blog</DialogTitle>
            <DialogDescription>
              Add a cover image URL before submitting. Your blog will be reviewed and published once approved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Cover Image URL (optional)</Label>
              <Input
                id="thumbnail"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg border mt-2"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
            </div>

            <div className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
              <p className="font-medium text-foreground mb-1">📋 Before you publish</p>
              <ul className="space-y-1 text-xs">
                <li>• Your blog is submitted as <strong>pending</strong> and needs admin approval.</li>
                <li>• Once approved, it will appear live in the feed.</li>
                <li>• Make sure your content follows community guidelines.</li>
              </ul>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowPublishDialog(false)} disabled={publishing}>
                Cancel
              </Button>
              <Button onClick={confirmPublish} disabled={publishing}>
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit for Review"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
