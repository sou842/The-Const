"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import type { BlockToolConstructable } from "@editorjs/editorjs";

export interface BlogEditorHandle {
  save: () => Promise<object[] | null>;
}



const BlogEditor = forwardRef<BlogEditorHandle>((_, ref) => {
  const editorRef = useRef<{ save: () => Promise<{ blocks: object[] }>, destroy: () => void } | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    save: async () => {
      if (!editorRef.current) return null;
      try {
        const output = await editorRef.current.save();
        return output?.blocks ?? [];
      } catch {
        return null;
      }
    },
  }));

  useEffect(() => {
    let editor: typeof editorRef.current = null;

    const initEditor = async () => {
      const EditorJS = (await import("@editorjs/editorjs")).default;
      const Header = (await import("@editorjs/header")).default;
      const List = (await import("@editorjs/list")).default;
      const CodeTool = (await import("@editorjs/code")).default;
      const Quote = (await import("@editorjs/quote")).default;
      const Table = (await import("@editorjs/table")).default;
      const InlineCode = (await import("@editorjs/inline-code")).default;
      const DragDrop = (await import("editorjs-drag-drop")).default;

      if (!holderRef.current || editorRef.current) return;

      editor = new EditorJS({
        holder: holderRef.current,
        tools: {
          header: {
            class: Header as unknown as BlockToolConstructable,
            config: { levels: [1, 2, 3, 4], defaultLevel: 2 },
            inlineToolbar: true,
          },
          list: { class: List as unknown as BlockToolConstructable, inlineToolbar: true },
          code: { class: CodeTool as unknown as BlockToolConstructable },
          quote: { class: Quote as unknown as BlockToolConstructable, inlineToolbar: true },
          table: { class: Table as unknown as BlockToolConstructable, inlineToolbar: true },
          inlineCode: { class: InlineCode as unknown as BlockToolConstructable },
        },
        placeholder: "Start writing your blog post...",
        onReady: () => {
          new DragDrop(editor as object);
        },
      }) as unknown as typeof editorRef.current;

      editorRef.current = editor;
    };

    initEditor();

    return () => {
      if (editorRef.current && typeof editorRef.current.destroy === "function") {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={holderRef}
      className="min-h-[500px] w-full [&_.ce-block]:px-0 [&_.ce-toolbar__plus]:text-muted-foreground [&_.ce-toolbar__settings-btn]:text-muted-foreground"
    />
  );
});

BlogEditor.displayName = "BlogEditor";
export default BlogEditor;
