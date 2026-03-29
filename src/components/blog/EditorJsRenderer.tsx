import React from "react";

interface Block {
  type: string;
  data: Record<string, unknown>;
}

interface EditorJsRendererProps {
  blocks: Block[];
}

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export function EditorJsRenderer({ blocks }: EditorJsRendererProps) {
  if (!blocks || blocks.length === 0) {
    return <p className="text-muted-foreground italic">No content available.</p>;
  }

  return (
    <div className="prose prose-neutral max-w-none space-y-4">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "header": {
            const level = (block.data.level as number) || 2;
            const Tag: HeadingLevel = `h${Math.min(Math.max(level, 1), 6)}` as HeadingLevel;
            return (
              <Tag key={index} className="font-display font-bold mt-6 mb-2 leading-tight">
                {block.data.text as string}
              </Tag>
            );
          }

          case "paragraph":
            return (
              <p
                key={index}
                className="text-base leading-relaxed text-foreground"
                dangerouslySetInnerHTML={{ __html: (block.data.text as string) || "" }}
              />
            );

          case "list": {
            const isOrdered = block.data.style === "ordered";
            const items = block.data.items as string[];
            return isOrdered ? (
              <ol key={index} className="pl-5 space-y-1 text-base list-decimal">
                {items?.map((item, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </ol>
            ) : (
              <ul key={index} className="pl-5 space-y-1 text-base list-disc">
                {items?.map((item, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </ul>
            );
          }

          case "code":
            return (
              <pre
                key={index}
                className="bg-muted rounded-lg p-4 overflow-x-auto text-sm font-mono border"
              >
                <code>{block.data.code as string}</code>
              </pre>
            );

          case "quote":
            return (
              <blockquote
                key={index}
                className="border-l-4 border-primary pl-4 py-1 italic text-muted-foreground"
              >
                <p dangerouslySetInnerHTML={{ __html: (block.data.text as string) || "" }} />
                {!!block.data.caption && (
                  <cite className="text-xs font-medium not-italic mt-1 block">
                    — {block.data.caption as string}
                  </cite>
                )}
              </blockquote>
            );

          case "table": {
            const rows = block.data.content as string[][];
            return (
              <div key={index} className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {rows?.map((row, ri) => (
                      <tr key={ri} className={ri === 0 ? "bg-muted font-semibold" : "border-t"}>
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className="border px-3 py-2"
                            dangerouslySetInnerHTML={{ __html: cell }}
                          />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          case "image": {
            const fileUrl = (block.data.file as { url?: string })?.url || (block.data.url as string);
            return (
              <figure key={index} className="my-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileUrl}
                  alt={(block.data.caption as string) || ""}
                  className="w-full rounded-lg border object-cover"
                />
                {!!block.data.caption && (
                  <figcaption className="text-xs text-center text-muted-foreground mt-2">
                    {block.data.caption as string}
                  </figcaption>
                )}
              </figure>
            );
          }

          case "delimiter":
            return <hr key={index} className="border-border my-6" />;

          case "warning":
            return (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                {!!block.data.title && (
                  <p className="font-semibold text-yellow-800 mb-1">{block.data.title as string}</p>
                )}
                <p className="text-sm text-yellow-700">{block.data.message as string}</p>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
