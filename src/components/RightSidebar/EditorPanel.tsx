"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { X, Tag, LayoutGrid } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

interface EditorPanelProps {
  category: string;
  setCategory: (cat: string) => void;
  tags: string[];
  addTag: () => void;
  removeTag: (tag: string) => void;
  tagInput: string;
  setTagInput: (val: string) => void;
}

const EditorPanel = ({
  category,
  setCategory,
  tags,
  addTag,
  removeTag,
  tagInput,
  setTagInput,
}: EditorPanelProps) => {
  return (
    <aside className="hidden xl:flex fixed right-0 top-14 bottom-0 w-80 bg-card border-l flex-col z-40 overflow-y-auto custom-scrollbar">
      <div className="p-6 space-y-8">
        {/* Category Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground/80 font-semibold text-sm">
            <LayoutGrid className="h-4 w-4" />
            <h3>Category</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 border ${
                  category === cat
                    ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                    : "bg-muted/50 text-muted-foreground border-transparent hover:border-border hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <Separator className="opacity-50" />

        {/* Tags Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground/80 font-semibold text-sm">
            <Tag className="h-4 w-4" />
            <h3>Tags</h3>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Type tag..."
                className="h-9 text-xs bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
              />
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={addTag} 
                disabled={tags.length >= 5 || !tagInput.trim()}
                className="h-9 px-3 text-xs"
              >
                Add
              </Button>
            </div>
            
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="gap-1.5 py-1 pl-2 pr-1.5 text-[10px] bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    #{tag}
                    <button 
                      onClick={() => removeTag(tag)}
                      className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic pl-1">
                Add up to 5 tags to help readers find your story.
              </p>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
          <p className="text-xs font-semibold text-primary">Pro Tip</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Choose a category and relevant tags to increase your post&apos;s visibility to the right audience.
          </p>
        </div>
      </div>

      <div className="mt-auto p-6 border-t bg-muted/20">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Need help? Check our{" "}
          <a href="#" className="text-primary hover:underline">writing guidelines</a>.
        </p>
      </div>
    </aside>
  );
};

export default EditorPanel;