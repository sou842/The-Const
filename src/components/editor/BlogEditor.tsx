"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import type { BlockToolConstructable } from "@editorjs/editorjs";

export interface BlogEditorHandle {
  save: () => Promise<object[] | null>;
}

const DRAFT_KEY = "blog_editor_draft";

const BlogEditor = forwardRef<BlogEditorHandle>((_, ref) => {
  const editorInstance = useRef<any>(null);
  const holderRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    save: async () => {
      if (!editorInstance.current) return null;
      try {
        const output = await editorInstance.current.save();
        return output?.blocks ?? [];
      } catch (error) {
        console.error("Editor save error:", error);
        return null;
      }
    },
  }));

  const handleSaveDraft = async (editor: any) => {
    try {
      const output = await editor.save();
      localStorage.setItem(DRAFT_KEY, JSON.stringify(output.blocks));
    } catch (error) {
      console.error("Draft save error:", error);
    }
  };

  const contentManager = () => {
    if (typeof window === "undefined") return [];
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      return draft ? JSON.parse(draft) : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    let editor: any = null;

    const initEditor = async () => {
      if (!holderRef.current || editorInstance.current) return;

      const [
        EditorJS,
        Header,
        List,
        CodeTool,
        Quote,
        Table,
        InlineCode,
        DragDrop,
        Marker,
        Warning,
        LinkTool,
        InlineImage,
        CustomYouTubeEmbed,
      ] = await Promise.all([
        import("@editorjs/editorjs").then((m) => m.default),
        import("@editorjs/header").then((m) => m.default),
        import("@editorjs/list").then((m) => m.default),
        import("@editorjs/code").then((m) => m.default),
        import("@editorjs/quote").then((m) => m.default),
        import("@editorjs/table").then((m) => m.default),
        import("@editorjs/inline-code").then((m) => m.default),
        import("editorjs-drag-drop").then((m) => m.default),
        import("@editorjs/marker").then((m) => m.default),
        import("@editorjs/warning").then((m) => m.default),
        import("@editorjs/link").then((m) => m.default),
        import("editorjs-inline-image").then((m) => m.default),
        import("./tools/CustomYouTubeEmbed").then((m) => m.default),
      ]);

      editor = new EditorJS({
        holder: holderRef.current,
        tools: {
          header: {
            class: Header as unknown as BlockToolConstructable,
            config: {
              placeholder: "Start writing your content...",
              levels: [1, 2, 3, 4],
              defaultLevel: 2,
            },
            inlineToolbar: true,
          },
          list: {
            class: List as unknown as BlockToolConstructable,
            inlineToolbar: true,
          },
          code: { class: CodeTool as unknown as BlockToolConstructable },
          // image: {
          //   class: ImageTool as unknown as BlockToolConstructable,
          //   config: {
          //     endpoints: { byFile: "https://your-server.com/uploadImage" },
          //   },
          // },
          quote: {
            class: Quote as unknown as BlockToolConstructable,
            inlineToolbar: true,
          },
          table: {
            class: Table as unknown as BlockToolConstructable,
            inlineToolbar: true,
          },
          inlineCode: {
            class: InlineCode as unknown as BlockToolConstructable,
          },
          inlineImage: {
            class: InlineImage as unknown as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              embed: {
                display: true,
              },
            },
          },
          youtubeEmbed: {
            class: CustomYouTubeEmbed as unknown as BlockToolConstructable,
            config: {
              placeholder: "Enter YouTube video link",
            },
          },
          marker: {
            class: Marker as unknown as BlockToolConstructable,
            shortcut: "CMD+SHIFT+M",
          },
          linkTool: {
            class: LinkTool as unknown as BlockToolConstructable,
            config: {
              endpoint: "http://localhost:8008/fetchUrl", // Your endpoint that provides URL metadata
            },
          },
          warning: {
            class: Warning as unknown as BlockToolConstructable,
            config: {
              titlePlaceholder: "Title",
              messagePlaceholder: "Message",
            },
          },
        },
        data: {
          blocks: contentManager(),
        },
        onChange: () => {
          handleSaveDraft(editor);
        },
        onReady: () => {
          if (editor) {
            new DragDrop(editor as object);
          }
        },
        placeholder: "Start writing your content...",
      });

      editorInstance.current = editor;
    };

    initEditor();

    return () => {
      if (editorInstance.current && typeof editorInstance.current.destroy === "function") {
        editorInstance.current.destroy();
        editorInstance.current = null;
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

