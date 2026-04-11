"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { extractYoutubeId, buildYoutubeEmbedUrl } from "@/lib/videoUtils";
import { X, Maximize2 } from "lucide-react";

interface ThumbnailData {
  type?: "image" | "multiple-images" | "video" | "default";
  image?: string;
  title?: string;
  description?: string;
  url?: string;
  urls?: string[];
  loop?: boolean;
}

interface ThumbnailGalleryProps {
  thumbnail: ThumbnailData;
  title: string;
}

export function ThumbnailGallery({ thumbnail, title }: ThumbnailGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const images = thumbnail.type === "multiple-images" 
    ? (thumbnail.urls || []) 
    : (thumbnail.url || thumbnail.image ? [thumbnail.url || thumbnail.image] : []);

  const hasImages = images.length > 0;

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  if (!thumbnail) return null;

  return (
    <div className="mb-0 overflow-hidden">
      <div className="mb-8 overflow-hidden rounded-2xl border border-border/40 bg-muted/30 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        {/* 1. Multiple Images (Gallery) */}
        {thumbnail.type === "multiple-images" && thumbnail.urls && thumbnail.urls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1 h-84 md:h-[420px]">
            {thumbnail.urls.slice(0, 3).map((url, i, arr) => (
              <div
                key={i}
                onClick={() => openLightbox(i)}
                className={cn(
                  "relative overflow-hidden group bg-muted transition-all duration-500 cursor-zoom-in",
                  arr.length === 1 ? "col-span-1 md:col-span-2 row-span-2" :
                  arr.length === 2 ? "col-span-1 row-span-2" :
                  i === 0 ? "col-span-1 row-span-2" : "col-span-1 row-span-1"
                )}
              >
                <img
                  src={url}
                  alt={title ? `${title} - Gallery ${i + 1}` : `Gallery ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading={i === 0 ? "eager" : "lazy"}
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 h-8 w-8 drop-shadow-md" />
                </div>

                {i === 2 && thumbnail.urls && thumbnail.urls.length > 3 && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center text-white text-lg font-bold">
                    +{thumbnail.urls.length - 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) :
        /* 2. Video Thumbnail */
        thumbnail.type === "video" && thumbnail.url ? (
          <div className="aspect-video w-full bg-black flex items-center justify-center">
            {(() => {
              const videoId = extractYoutubeId(thumbnail.url);
              if (videoId) {
                return (
                  <iframe
                    className="w-full h-full"
                    src={buildYoutubeEmbedUrl(videoId, { loop: !!thumbnail.loop })}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                );
              }
              return <p className="text-muted-foreground text-sm">Invalid video URL</p>;
            })()}
          </div>
        ) :
        /* 3. Single Image (Default/Fallback) */
        (thumbnail.url || thumbnail.image) ? (
          <div 
            onClick={() => openLightbox(0)}
            className="h-64 md:h-96 w-full relative group cursor-zoom-in overflow-hidden"
          >
            <img
              src={thumbnail.url || thumbnail.image}
              alt={title || "Cover image"}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              loading="eager"
            />
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 h-10 w-10 drop-shadow-md" />
            </div>
          </div>
        ) : null}
      </div>

      {/* Lightbox Dialog */}
      {hasImages && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-7xl w-[calc(100vw-2rem)] md:w-[95vw] h-[85vh] p-0 border-none bg-black/95 backdrop-blur-md overflow-hidden flex flex-col items-center justify-center shadow-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>Image Gallery</DialogTitle>
              <DialogDescription>Full-screen view of post images</DialogDescription>
            </DialogHeader>
            
            <div className="relative w-full h-full flex flex-col">
              {/* Top Bar */}
              <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
                <span className="text-white/60 text-xs font-mono bg-white/5 px-2 py-1 rounded-md backdrop-blur-sm">
                  {activeIndex + 1} / {images.length}
                </span>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Title Overlay */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                <div className="px-6 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90 text-sm font-medium shadow-lg">
                  {title}
                </div>
              </div>

              {/* Main Carousel */}
              <div className="flex-1 flex items-center justify-center">
                <Carousel 
                  opts={{ 
                    startIndex: activeIndex,
                    loop: true,
                  }} 
                  setApi={(api) => {
                    api?.on("select", () => {
                      setActiveIndex(api.selectedScrollSnap());
                    });
                  }}
                  className="w-full h-full"
                >
                  <CarouselContent className="h-full ml-0">
                    {images?.map((url, index) => (
                      <CarouselItem key={index} className="pl-0 h-[85vh] w-full flex items-center justify-center">
                        <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
                          <img
                            src={url}
                            alt={`${title} - View ${index + 1}`}
                            className="max-w-full max-h-full object-contain shadow-2xl"
                            loading={index === activeIndex ? "eager" : "lazy"}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="hidden md:block">
                    <CarouselPrevious className="left-8 scale-125 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white" />
                    <CarouselNext className="right-8 scale-125 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white" />
                  </div>
                </Carousel>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
