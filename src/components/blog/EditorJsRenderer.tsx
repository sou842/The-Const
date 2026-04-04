"use client"

import { FC, Fragment, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { getRandomFallbackImage } from "@/lib/blogUtils";
import { ComponentType } from "react";
import type { ReactPlayerProps } from "@/types/react-player";
import { EditorBlock } from "@/types/blog";

const ReactPlayer = dynamic(() => import("react-player").then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-muted/30 border border-border rounded-sm animate-pulse flex items-center justify-center">
      <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Loading video...</span>
    </div>
  ),
}) as ComponentType<ReactPlayerProps>;

/**
 * Builds a safe YouTube embed URL from a video ID.
 * Uses youtube-nocookie.com for enhanced privacy.
 */
function buildYoutubeEmbedUrl(videoId: string, options: { loop?: boolean; autoplay?: boolean; mute?: boolean } = {}): string {
  const { loop = false, autoplay = false, mute = false } = options;
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    enablejsapi: "0",
  });

  if (autoplay) params.set("autoplay", "1");
  if (mute) params.set("mute", "1");
  if (loop) {
    params.set("loop", "1");
    params.set("playlist", videoId); // required for loop to work
  }

  // youtube-nocookie.com is YouTube's privacy-enhanced embed domain
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Sanitizes text to prevent XSS when used in HTML contexts.
 * For React this is largely handled by JSX, but good for attrs.
 */
function sanitizeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}



const DynamicCodeBlock = dynamic(() => import("@/components/common/DynamicCodeBlock"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-32 bg-muted/30 border border-border rounded-sm animate-pulse flex items-center justify-center">
      <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Loading code...</span>
    </div>
  ),
});

const FallbackImageInline = ({ src, alt, className, priority }: { src: string; alt: string; className?: string; priority?: boolean }) => {
  const [imgSrc, setImgSrc] = useState(src);
  useEffect(() => { setImgSrc(src); }, [src]);
  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={1200}
      height={675}
      sizes="(max-width: 1200px) 100vw, 1200px"
      className={`object-cover ${className || ""}`}
      style={{ width: '100%', height: 'auto' }}
      priority={priority}
      onError={() => setImgSrc(getRandomFallbackImage())}
    />
  );
};

export const EditorJsRenderer: FC<{ block: EditorBlock; isFirst?: boolean }> = ({ block, isFirst = false }) => {

  if (!block || typeof block !== "object") {
    return null;
  }

  const safelyAccessData = (obj: any, path: string, fallback: any = null) => {
    try {
      return (
        path
          .split(".")
          .reduce(
            (acc, key) => (acc && acc?.[key] !== undefined ? acc?.[key] : null),
            obj
          ) || fallback
      );
    } catch (e) {
      return fallback;
    }
  };

  const renderHeading = (level: number = 2, text: string = "") => {
    const validLevel = !isNaN(Number(level))
      ? Math.max(1, Math.min(6, Number(level)))
      : 2;

    const headingId = `heading-${safelyAccessData(block, "id", "")}`
      .replace(/\s+/g, "-")
      .toLowerCase();

    const safeText = typeof text === "string" ? text : "";

    switch (validLevel) {
      case 1:
        return (
          <h1
            title={safeText}
            id={headingId || undefined}
            className="w-full font-serif font-bold text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-foreground mt-12 mb-6 tracking-tight"
            dangerouslySetInnerHTML={{ __html: safeText }}
          />
        );
      case 2:
        return (
          <h1
            title={safeText}
            id={headingId || undefined}
            className="w-full font-serif font-bold text-3xl md:text-4xl leading-[1.15] text-foreground mt-10 mb-5 tracking-tight"
            dangerouslySetInnerHTML={{ __html: safeText }}
          />
        );
      case 3:
        return (
          <h3
            title={safeText}
            id={headingId || undefined}
            className="w-full font-sans font-bold text-2xl md:text-3xl leading-[1.2] text-foreground mt-8 mb-4 tracking-tight"
            dangerouslySetInnerHTML={{ __html: safeText }}
          />
        );
      case 4:
        return (
          <h4
            title={safeText}
            id={headingId || undefined}
            className="w-full font-sans font-bold text-xl md:text-2xl leading-[1.25] text-foreground mt-6 mb-3 tracking-tight"
            dangerouslySetInnerHTML={{ __html: safeText }}
          />
        );
      default:
        return (
          <h2
            title={safeText}
            id={headingId || undefined}
            className="w-full font-serif font-bold text-3xl md:text-4xl leading-[1.15] text-foreground mt-10 mb-5 tracking-tight"
            dangerouslySetInnerHTML={{ __html: safeText }}
          />
        );
    }
  };

  // const getYoutubeEmbedUrl = (url?: string) => {
  //   if (!url) return null;
  //   try {
  //     const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  //     const match = url.match(regExp);
  //     if (match && match[2].length === 11) {
  //       return `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&loop=${thumbnail?.loop ? 1 : 0}&playlist=${match[2]}`;
  //     }
  //     return null;
  //   } catch {
  //     return null;
  //   }
  // };

  try {
    return (
      <Fragment>
        {(() => {
          const blockType = safelyAccessData(block, "type", "");

          switch (blockType) {
            case "header":
              return renderHeading(
                safelyAccessData(block, "data.level", 2),
                safelyAccessData(block, "data.text", "")
              );
            case "paragraph":
              return (
                <p
                  className="w-full text-base md:text-[18px] lg:text-[20px] leading-relaxed md:leading-[1.7] font-serif text-foreground/90 my-5"
                  dangerouslySetInnerHTML={{
                    __html: safelyAccessData(block, "data.text", ""),
                  }}
                  itemProp="articleBody"
                />
              );
            case "image":
            case "inlineImage": {
              const imageUrl = blockType === "image"
                ? safelyAccessData(block, "data.file.url", "")
                : safelyAccessData(block, "data.url", "");

              if (!imageUrl) {
                return null;
              }

              const withBorder = safelyAccessData(block, "data.withBorder", false);
              const withBackground = safelyAccessData(block, "data.withBackground", false);
              const stretched = safelyAccessData(block, "data.stretched", false);

              return (
                <figure
                  className={`w-full my-10 flex flex-col gap-3 items-center ${withBackground ? "bg-muted p-4 md:p-8 rounded-sm" : ""
                    }`}
                  itemProp="image"
                  itemScope
                  itemType="https://schema.org/ImageObject"
                >
                  <FallbackImageInline
                    className={`w-full h-auto object-cover ${!stretched && !withBackground ? "rounded-sm" : ""
                      } ${withBorder ? "border border-border p-1" : ""}`}
                    priority={isFirst}
                    src={imageUrl}
                    alt={safelyAccessData(block, "data.caption", "Article image")}
                  />
                  {safelyAccessData(block, "data.caption") && (
                    <figcaption
                      className="text-sm border-l-2 border-primary pl-3 py-1 font-medium text-muted-foreground w-full text-left"
                      dangerouslySetInnerHTML={{
                        __html: safelyAccessData(block, "data.caption", ""),
                      }}
                      itemProp="caption"
                    />
                  )}
                  <meta itemProp="representativeOfPage" content="true" />
                </figure>
              );
            }
            case "youtubeEmbed": {
              const youtubeUrl = safelyAccessData(block, "data.url", "");
              if (!youtubeUrl) {
                return null;
              }


              let videoId = "";
              let embedUrl = null;
              try {
                const url = new URL(youtubeUrl);
                videoId = url.searchParams.get("v") || "";
                embedUrl = videoId ? buildYoutubeEmbedUrl(videoId, { loop: false, autoplay: false, mute: false }) : null;
              } catch (e) {
                // Invalid URL
              }

              return (
                <div
                  className="w-full flex flex-col gap-3 my-10"
                  itemProp="video"
                  itemScope
                  itemType="https://schema.org/VideoObject"
                >
                  <meta itemProp="embedUrl" content={youtubeUrl} />
                  {embedUrl && (
                    <>
                      <meta
                        itemProp="thumbnailUrl"
                        content={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                      />
                      <div className="w-full aspect-video rounded-sm overflow-hidden border border-border shadow-sm">
                        <iframe
                          className="w-full h-full"
                          src={embedUrl || ''}
                          title={`YouTube video player`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            }
            case "list": {
              const listItems = safelyAccessData(block, "data.items", []);
              if (!Array.isArray(listItems) || listItems.length === 0) {
                return null;
              }

              const listStyle = safelyAccessData(block, "data.style", "unordered");
              const ContainerTag = listStyle === "ordered" ? "ol" : "ul";
              const listClass = listStyle === "ordered"
                ? "list-decimal list-outside pl-6 space-y-3"
                : "list-none space-y-3 pl-2";

              return (
                <div className="w-full my-6 text-base md:text-[18px] lg:text-[20px] font-serif text-foreground/90">
                  <ContainerTag className={listClass}>
                    {listItems?.map((item: any, index: number) => (
                      <li key={index} className="relative leading-relaxed">
                        {listStyle === "unordered" && (
                          <span className="absolute -left-6 top-[0.4em] w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                        )}
                        <span
                          dangerouslySetInnerHTML={{
                            __html: safelyAccessData(item, "content", ""),
                          }}
                        />
                      </li>
                    ))}
                  </ContainerTag>
                </div>
              );
            }
            case "code":
            case "raw": {
              const codeProp = blockType === "code" ? "data.code" : "data.html";
              const defaultLang = blockType === "code" ? "jsx" : "html";

              return (
                <div
                  className="w-full my-8 text-sm md:text-base font-mono rounded-sm overflow-hidden border border-border shadow-sm"
                  role="region"
                  aria-label="Code block"
                >
                  <DynamicCodeBlock
                    code={safelyAccessData(block, codeProp, "// No code provided")}
                    language={safelyAccessData(block, "data.language", defaultLang)}
                  />
                </div>
              );
            }
            case "quote":
              return (
                <blockquote
                  className="w-full my-10 relative"
                  itemProp="citation"
                >
                  <div className="absolute top-0 left-0 text-7xl font-serif text-primary/20 leading-none -mt-4 -ml-2 select-none" aria-hidden="true">&ldquo;</div>
                  <div className="pl-10 md:pl-12 border-l-4 border-primary/40 py-2">
                    <p
                      className="text-xl md:text-2xl font-serif italic text-foreground/90 leading-relaxed mb-4"
                      dangerouslySetInnerHTML={{
                        __html: safelyAccessData(block, "data.text", ""),
                      }}
                    />
                    {safelyAccessData(block, "data.caption") && (
                      <footer className="flex items-center gap-2">
                        <span className="w-6 h-[1px] bg-muted-foreground/50 inline-block"></span>
                        <span
                          className="text-sm md:text-base font-bold uppercase tracking-widest text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: safelyAccessData(block, "data.caption", ""),
                          }}
                        />
                      </footer>
                    )}
                  </div>
                </blockquote>
              );
            case "delimiter":
              return (
                <div className="w-full flex justify-center items-center py-10 my-4" aria-hidden="true">
                  <span className="flex space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
                  </span>
                </div>
              );
            case "warning": {
              const hasTitle = !!safelyAccessData(block, "data.title");
              const hasMessage = !!safelyAccessData(block, "data.message");

              if (!hasTitle && !hasMessage) {
                return null;
              }

              return (
                <aside
                  className="w-full my-8 flex gap-4 p-5 md:p-6 bg-primary/5 border border-border rounded-sm shadow-sm"
                  role="note"
                  aria-label="Important Note"
                >
                  <div className="hidden sm:flex flex-shrink-0 items-start justify-center pt-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {hasTitle && (
                      <h4
                        className="text-base md:text-lg font-bold text-foreground"
                        dangerouslySetInnerHTML={{
                          __html: safelyAccessData(block, "data.title", ""),
                        }}
                      />
                    )}
                    {hasMessage && (
                      <p
                        className="text-base font-serif text-muted-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: safelyAccessData(block, "data.message", ""),
                        }}
                      />
                    )}
                  </div>
                </aside>
              );
            }
            case "checklist": {
              const checklistItems = safelyAccessData(block, "data.items", []);
              if (!Array.isArray(checklistItems) || checklistItems.length === 0) {
                return null;
              }

              return (
                <ul
                  className="w-full my-6 space-y-3 bg-muted/20 p-6 border border-border rounded-sm"
                  role="group"
                  aria-label="Checklist"
                >
                  {checklistItems.map((item: { checked: boolean; text: string }, index: number) => {
                    const isChecked = !!safelyAccessData(item, "checked", false);
                    return (
                      <li
                        className="w-full flex flex-row gap-4 items-start"
                        key={index}
                      >
                        <div className="pt-1 flex-shrink-0">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border ${isChecked ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-input'}`}>
                            {isChecked && (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className={`text-base md:text-[18px] font-serif leading-relaxed ${isChecked ? 'text-muted-foreground line-through opacity-70' : 'text-foreground/90'}`}>
                          {safelyAccessData(item, "text", "")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              );
            }
            case "table": {
              const tableContent = safelyAccessData(block, "data.content", []);
              if (!Array.isArray(tableContent) || tableContent.length === 0) {
                return null;
              }

              const validTable = tableContent.every((row) => Array.isArray(row));
              if (!validTable) {
                return null;
              }

              const withHeadings = !!safelyAccessData(block, "data.withHeadings", false);

              return (
                <div
                  className="w-full my-8 overflow-x-auto rounded-sm border border-border"
                  role="region"
                  aria-label="Data Table"
                >
                  <table className="w-full text-left border-collapse" role="grid">
                    {withHeadings && tableContent.length > 0 && (
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          {tableContent[0].map((cell: any, cellIndex: number) => (
                            <th
                              key={cellIndex}
                              dangerouslySetInnerHTML={{ __html: cell || "" }}
                              className="px-6 py-4 text-sm font-bold uppercase tracking-widest text-primary whitespace-nowrap"
                              scope="col"
                            />
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody className="divide-y divide-border bg-background">
                      {tableContent?.map((row: any[], rowIndex: number) => {
                        if (rowIndex === 0 && withHeadings) {
                          return null;
                        }
                        return (
                          <tr key={rowIndex} className="hover:bg-muted/20 transition-colors">
                            {row?.map((cell: any, cellIndex: number) => (
                              <td
                                key={cellIndex}
                                dangerouslySetInnerHTML={{ __html: cell || "" }}
                                className="px-6 py-4 text-sm md:text-base font-serif text-foreground/80 leading-relaxed"
                              />
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            }
            default:
              return null;
          }
        })()}
      </Fragment>
    );
  } catch (error) {
    return (
      <div className="text-destructive font-medium p-4 border border-destructive/20 bg-destructive/10 rounded-sm my-4">
        Error rendering content block.
      </div>
    );
  }
};
