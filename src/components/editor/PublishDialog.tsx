"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { isSafeUrl, extractYoutubeId, buildYoutubeEmbedUrl } from "@/lib/videoUtils";
import {
  Image as ImageIcon,
  Layers,
  Video,
  Plus,
  Trash2,
  Loader2,
  ExternalLink,
  Info,
  Rocket,
  AlertCircle,
  CheckCircle2,
  FileText,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 300;
const MAX_GALLERY_IMAGES = 5;
const MAX_URL_LENGTH = 2048;

const ALLOWED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".svg",
];
const ALLOWED_IMAGE_HOSTS_PATTERN =
  /^https:\/\/([\w.-]+\.)?(imgur\.com|cloudinary\.com|unsplash\.com|images\.unsplash\.com|placehold\.co|picsum\.photos|i\.ibb\.co|imagekit\.io|res\.cloudinary\.com|cdn\.|media\.|assets\.|static\.|img\.|images\.)/i;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContentType = "blog" | "project";
export type ThumbType = "image" | "multiple-images" | "video";

export interface ThumbnailData {
  type: ThumbType;
  title: string;
  description: string;
  url?: string;
  urls?: string[];
  loop?: boolean;
}

export interface PublishData {
  contentType: ContentType;
  thumbnail: ThumbnailData;
}

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: PublishData) => Promise<void>;
  publishing: boolean;
  initialData: {
    title: string;
  };
}

interface FieldError {
  title?: string;
  description?: string;
  url?: string;
  urls?: Record<number, string>;
  videoUrl?: string;
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

function validateFields(
  title: string,
  description: string,
  thumbType: ThumbType,
  singleUrl: string,
  multiUrls: string[],
  videoUrl: string
): FieldError {
  const errors: FieldError = {};

  if (!title.trim()) {
    errors.title = "Title is required.";
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.title = `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`;
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`;
  }

  if (thumbType === "image") {
    if (!singleUrl.trim()) {
      errors.url = "Cover image URL is required.";
    } else if (!isSafeUrl(singleUrl)) {
      errors.url = "Please enter a valid HTTPS URL.";
    }
  }

  if (thumbType === "multiple-images") {
    const urlErrors: Record<number, string> = {};
    const validUrls = multiUrls.filter((u) => u.trim());
    if (validUrls.length === 0) {
      urlErrors[0] = "At least one image URL is required.";
    }
    multiUrls.forEach((url, i) => {
      if (url.trim() && !isSafeUrl(url)) {
        urlErrors[i] = "Must be a valid HTTPS URL.";
      }
    });
    if (Object.keys(urlErrors).length > 0) errors.urls = urlErrors;
  }

  if (thumbType === "video") {
    if (!videoUrl.trim()) {
      errors.videoUrl = "YouTube URL is required.";
    } else if (!extractYoutubeId(videoUrl)) {
      errors.videoUrl = "Please enter a valid YouTube video URL.";
    }
  }

  return errors;
}

function hasErrors(errors: FieldError): boolean {
  return (
    !!errors.title ||
    !!errors.description ||
    !!errors.url ||
    !!errors.videoUrl ||
    (!!errors.urls && Object.keys(errors.urls).length > 0)
  );
}

function CharCount({
  value,
  max,
}: {
  value: string;
  max: number;
}) {
  const len = value.length;
  const pct = len / max;
  return (
    <span
      className={cn(
        "text-[10px] tabular-nums transition-colors",
        pct > 0.9
          ? "text-destructive font-semibold"
          : pct > 0.7
          ? "text-amber-500"
          : "text-muted-foreground"
      )}
    >
      {len}/{max}
    </span>
  );
}

function FieldErrorMsg({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1 mt-1.5" role="alert">
      <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
      <p className="text-[11px] text-destructive">{message}</p>
    </div>
  );
}

function TypeToggle({
  value,
  onChange,
}: {
  value: ContentType;
  onChange: (v: ContentType) => void;
}) {
  return (
    <div
      className="flex p-1 bg-muted/70 rounded-xl w-fit gap-0.5"
      role="group"
      aria-label="Content type"
    >
      {(
        [
          { v: "blog", label: "Blog Post", Icon: FileText },
          { v: "project", label: "Project", Icon: Briefcase },
        ] as const
      ).map(({ v, label, Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            value === v
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

function MediaTabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-selected={active}
      role="tab"
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// ─── Preview Card ─────────────────────────────────────────────────────────────

interface PreviewCardProps {
  contentType: ContentType;
  thumbType: ThumbType;
  title: string;
  description: string;
  singleUrl: string;
  multiUrls: string[];
  videoUrl: string;
  loop: boolean;
}

function PreviewCard({
  contentType,
  thumbType,
  title,
  description,
  singleUrl,
  multiUrls,
  videoUrl,
  loop,
}: PreviewCardProps) {
  const videoId = extractYoutubeId(videoUrl);
  const embedUrl = videoId ? buildYoutubeEmbedUrl(videoId, { loop }) : null;
  const validMultiUrls = multiUrls.filter((u) => isSafeUrl(u)).slice(0, 3);
  const isSingleValid = isSafeUrl(singleUrl);

  const hasMedia =
    (thumbType === "image" && isSingleValid) ||
    (thumbType === "multiple-images" && validMultiUrls.length > 0) ||
    (thumbType === "video" && !!embedUrl);

  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border/60 shadow-lg group transition-all duration-300 hover:shadow-xl hover:border-primary/20 hover:-translate-y-0.5">
      {/* Media area */}
      <div className="aspect-[16/9] bg-muted/50 relative overflow-hidden">
        {thumbType === "image" && isSingleValid ? (
          <img
            src={singleUrl}
            alt={sanitizeText(title) || "Preview image"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/600x400/1a1a2e/666?text=Image+unavailable";
            }}
          />
        ) : thumbType === "multiple-images" && validMultiUrls.length > 0 ? (
          <div className="w-full h-full flex gap-1 p-1">
            {validMultiUrls.map((url, i) => (
              <div
                key={i}
                className="flex-1 h-full rounded-sm overflow-hidden bg-muted"
              >
                <img
                  src={url}
                  alt={`Gallery image ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/200x200/1a1a2e/666?text=Error";
                  }}
                />
              </div>
            ))}
          </div>
        ) : thumbType === "video" && embedUrl ? (
          <iframe
            className="w-full h-full pointer-events-none"
            src={embedUrl}
            title={`Video preview: ${sanitizeText(title)}`}
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <EmptyMediaPlaceholder />
        )}

        {/* Content-type badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-[9px] font-bold uppercase tracking-widest text-foreground border border-border/30 shadow-sm">
            {contentType === "blog" ? (
              <FileText className="h-2.5 w-2.5" />
            ) : (
              <Briefcase className="h-2.5 w-2.5" />
            )}
            {contentType}
          </span>
        </div>

        {/* Gradient overlay for text legibility */}
        {hasMedia && (
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Card body */}
      <div className="p-4 space-y-2.5">
        {/* Skeleton line */}
        <div className="h-2 w-1/3 rounded-full bg-muted animate-pulse" />

        <h4 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors duration-200">
          {title || (
            <span className="text-muted-foreground italic font-normal">
              Untitled post
            </span>
          )}
        </h4>

        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {description || (
            <span className="italic">
              Your description will hook readers here…
            </span>
          )}
        </p>

        <div className="pt-1.5 flex items-center gap-2 border-t border-border/40">
          <div className="h-6 w-6 rounded-full bg-muted shrink-0 ring-1 ring-border/30" />
          <div className="flex flex-col gap-1 flex-1">
            <div className="h-2 w-20 rounded-full bg-muted" />
          </div>
          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>
    </div>
  );
}

function EmptyMediaPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted/40">
      <div className="text-center space-y-2 select-none">
        <div className="relative w-10 h-10 mx-auto">
          <div className="absolute inset-0 rounded-xl bg-muted-foreground/10 animate-pulse" />
          <ImageIcon className="h-10 w-10 text-muted-foreground/20 relative" />
        </div>
        <p className="text-[10px] text-muted-foreground/50 tracking-wide">
          Add media to preview
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PublishDialog({
  open,
  onOpenChange,
  onConfirm,
  publishing,
  initialData,
}: PublishDialogProps) {
  const [contentType, setContentType] = useState<ContentType>("blog");
  const [thumbType, setThumbType] = useState<ThumbType>("image");
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState("");
  const [singleUrl, setSingleUrl] = useState("");
  const [multiUrls, setMultiUrls] = useState<string[]>([""]);
  const [videoUrl, setVideoUrl] = useState("");
  const [loop, setLoop] = useState(true);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  // Sync title from parent
  useEffect(() => {
    if (initialData.title && initialData.title !== title) {
      setTitle(initialData.title.slice(0, MAX_TITLE_LENGTH));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData.title]);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setErrors({});
      setTouched({});
      setSubmitted(false);
    }
  }, [open]);

  // Re-validate when relevant fields change (only after first submit attempt)
  useEffect(() => {
    if (submitted) {
      const e = validateFields(
        title,
        description,
        thumbType,
        singleUrl,
        multiUrls,
        videoUrl
      );
      setErrors(e);
    }
  }, [title, description, thumbType, singleUrl, multiUrls, videoUrl, submitted]);

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleAddUrl = useCallback(() => {
    setMultiUrls((prev) =>
      prev.length < MAX_GALLERY_IMAGES ? [...prev, ""] : prev
    );
  }, []);

  const handleRemoveUrl = useCallback((index: number) => {
    setMultiUrls((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateUrl = useCallback((index: number, val: string) => {
    setMultiUrls((prev) => {
      const next = [...prev];
      next[index] = val.slice(0, MAX_URL_LENGTH);
      return next;
    });
  }, []);

  const handleConfirm = async () => {
    setSubmitted(true);
    const e = validateFields(
      title,
      description,
      thumbType,
      singleUrl,
      multiUrls,
      videoUrl
    );
    setErrors(e);
    if (hasErrors(e)) return;

    const data: PublishData = {
      contentType,
      thumbnail: {
        type: thumbType,
        title: title.trim(),
        description: description.trim(),
        ...(thumbType === "image" && { url: singleUrl.trim() }),
        ...(thumbType === "multiple-images" && {
          urls: multiUrls.map((u) => u.trim()).filter((u) => isSafeUrl(u)),
        }),
        ...(thumbType === "video" && {
          url: videoUrl.trim(),
          loop,
        }),
      },
    };

    await onConfirm(data);
  };

  const handleDismiss = () => {
    if (!publishing) onOpenChange(false);
  };

  // Derived
  const videoId = extractYoutubeId(videoUrl);
  const isValid = !hasErrors(
    validateFields(title, description, thumbType, singleUrl, multiUrls, videoUrl)
  );

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent
        className="max-w-4xl p-0 overflow-hidden border border-border/60 bg-card shadow-2xl focus:outline-none"
        aria-labelledby="publish-dialog-title"
        aria-describedby="publish-dialog-desc"
        // Prevent closing while publishing
        onPointerDownOutside={(e) => publishing && e.preventDefault()}
        onEscapeKeyDown={(e) => publishing && e.preventDefault()}
      >
        <div className="flex flex-col md:flex-row max-h-[90vh]">
          {/* ── Left: Configuration ───────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto border-r border-border/50 bg-background/60">
            {/* Header */}
            <div className="px-7 pt-7 pb-5 border-b border-border/40 bg-gradient-to-b from-background to-transparent">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <Rocket className="h-5 w-5 text-primary" />
                  </div>
                  <DialogTitle
                    id="publish-dialog-title"
                    className="text-xl font-bold tracking-tight"
                  >
                    Publish Content
                  </DialogTitle>
                </div>
                <DialogDescription
                  id="publish-dialog-desc"
                  className="text-sm text-muted-foreground ml-[52px]"
                >
                  Configure how your post appears in the main feed.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-7 py-6 space-y-6 flex-1">
              {/* Content Type */}
              <section aria-label="Content type">
                <Label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Content Type
                </Label>
                <TypeToggle value={contentType} onChange={setContentType} />
              </section>

              <Separator className="opacity-40" />

              {/* Card details */}
              <section aria-label="Promotion card details" className="space-y-4">
                <Label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Promotion Card
                </Label>

                {/* Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pub-title" className="text-sm">
                      Title{" "}
                      <span className="text-destructive" aria-hidden>
                        *
                      </span>
                    </Label>
                    <CharCount value={title} max={MAX_TITLE_LENGTH} />
                  </div>
                  <Input
                    id="pub-title"
                    value={title}
                    onChange={(e) =>
                      setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))
                    }
                    onBlur={() => handleBlur("title")}
                    placeholder="Enter a captivating title…"
                    aria-required="true"
                    aria-invalid={!!errors.title}
                    aria-describedby={errors.title ? "title-error" : undefined}
                    className={cn(
                      "bg-background transition-colors",
                      errors.title &&
                        (touched.title || submitted) &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {(touched.title || submitted) && (
                    <FieldErrorMsg message={errors.title} />
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pub-desc" className="text-sm">
                      Short Description
                    </Label>
                    <CharCount value={description} max={MAX_DESCRIPTION_LENGTH} />
                  </div>
                  <Textarea
                    id="pub-desc"
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value.slice(0, MAX_DESCRIPTION_LENGTH)
                      )
                    }
                    onBlur={() => handleBlur("description")}
                    placeholder="A brief summary to hook your readers…"
                    className={cn(
                      "resize-none h-20 bg-background transition-colors",
                      errors.description &&
                        (touched.description || submitted) &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                    aria-invalid={!!errors.description}
                    aria-describedby={
                      errors.description ? "desc-error" : undefined
                    }
                  />
                  {(touched.description || submitted) && (
                    <FieldErrorMsg message={errors.description} />
                  )}
                </div>
              </section>

              <Separator className="opacity-40" />

              {/* Media Type Tabs */}
              <section aria-label="Media type" className="space-y-4">
                <Label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Cover Media
                </Label>

                {/* Custom tab bar */}
                <div
                  className="flex p-1 bg-muted/70 rounded-xl gap-0.5"
                  role="tablist"
                  aria-label="Cover media type"
                >
                  <MediaTabButton
                    active={thumbType === "image"}
                    onClick={() => setThumbType("image")}
                    icon={ImageIcon}
                    label="Image"
                  />
                  <MediaTabButton
                    active={thumbType === "multiple-images"}
                    onClick={() => setThumbType("multiple-images")}
                    icon={Layers}
                    label="Gallery"
                  />
                  <MediaTabButton
                    active={thumbType === "video"}
                    onClick={() => setThumbType("video")}
                    icon={Video}
                    label="Video"
                  />
                </div>

                {/* Tab panels */}
                <div role="tabpanel" className="space-y-3">
                  {thumbType === "image" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="single-url" className="text-sm">
                        Cover Image URL{" "}
                        <span className="text-destructive" aria-hidden>
                          *
                        </span>
                      </Label>
                      <Input
                        id="single-url"
                        type="url"
                        placeholder="https://example.com/cover.jpg"
                        value={singleUrl}
                        onChange={(e) =>
                          setSingleUrl(e.target.value.slice(0, MAX_URL_LENGTH))
                        }
                        onBlur={() => handleBlur("url")}
                        aria-invalid={!!errors.url}
                        className={cn(
                          "bg-background font-mono text-sm",
                          errors.url &&
                            (touched.url || submitted) &&
                            "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Use a publicly accessible HTTPS image URL.
                      </p>
                      {(touched.url || submitted) && (
                        <FieldErrorMsg message={errors.url} />
                      )}
                    </div>
                  )}

                  {thumbType === "multiple-images" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">
                          Gallery URLs{" "}
                          <span className="text-destructive" aria-hidden>
                            *
                          </span>
                        </Label>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {multiUrls.length} / {MAX_GALLERY_IMAGES}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {multiUrls.map((url, i) => (
                          <div key={i} className="flex gap-2">
                            <div className="flex-1 space-y-0">
                              <Input
                                type="url"
                                placeholder={`Image ${i + 1} URL`}
                                value={url}
                                onChange={(e) =>
                                  handleUpdateUrl(
                                    i,
                                    e.target.value.slice(0, MAX_URL_LENGTH)
                                  )
                                }
                                onBlur={() => handleBlur(`url_${i}`)}
                                aria-label={`Gallery image ${i + 1} URL`}
                                aria-invalid={!!errors.urls?.[i]}
                                className={cn(
                                  "bg-background font-mono text-sm",
                                  errors.urls?.[i] &&
                                    (touched[`url_${i}`] || submitted) &&
                                    "border-destructive focus-visible:ring-destructive"
                                )}
                              />
                              {errors.urls?.[i] &&
                                (touched[`url_${i}`] || submitted) && (
                                  <FieldErrorMsg message={errors.urls[i]} />
                                )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="shrink-0 h-10 w-10"
                              onClick={() => handleRemoveUrl(i)}
                              disabled={multiUrls.length === 1}
                              aria-label={`Remove image ${i + 1}`}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                            </Button>
                          </div>
                        ))}
                        {multiUrls.length < MAX_GALLERY_IMAGES && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full border-dashed gap-2 h-9 text-sm text-muted-foreground hover:text-foreground"
                            onClick={handleAddUrl}
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Image
                          </Button>
                        )}
                      </div>
                      {submitted && errors.urls?.[0] && multiUrls.every(u => !u.trim()) && (
                        <FieldErrorMsg message={errors.urls[0]} />
                      )}
                    </div>
                  )}

                  {thumbType === "video" && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="video-url" className="text-sm">
                          YouTube URL{" "}
                          <span className="text-destructive" aria-hidden>
                            *
                          </span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="video-url"
                            type="url"
                            placeholder="https://youtube.com/watch?v=…"
                            value={videoUrl}
                            onChange={(e) =>
                              setVideoUrl(
                                e.target.value.slice(0, MAX_URL_LENGTH)
                              )
                            }
                            onBlur={() => handleBlur("videoUrl")}
                            aria-invalid={!!errors.videoUrl}
                            className={cn(
                              "bg-background font-mono text-sm pr-8",
                              errors.videoUrl &&
                                (touched.videoUrl || submitted) &&
                                "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                          {videoId && (
                            <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                          )}
                        </div>
                        {(touched.videoUrl || submitted) && (
                          <FieldErrorMsg message={errors.videoUrl} />
                        )}
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/50 border border-border/40">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="loop-switch"
                            className="text-sm cursor-pointer"
                          >
                            Loop Preview
                          </Label>
                          <p className="text-[10px] text-muted-foreground">
                            Replay video automatically in the feed card
                          </p>
                        </div>
                        <Switch
                          id="loop-switch"
                          checked={loop}
                          onCheckedChange={setLoop}
                          aria-label="Loop video preview"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Footer actions */}
            <div className="px-7 py-5 border-t border-border/40 bg-background/40 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleDismiss}
                disabled={publishing}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                className="flex-1 gap-2 relative"
                onClick={handleConfirm}
                disabled={publishing}
                aria-busy={publishing}
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Submit for Review
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* ── Right: Preview ────────────────────────────────────────────── */}
          <aside
            className="md:w-[320px] shrink-0 p-6 bg-muted/20 flex flex-col gap-5 overflow-y-auto"
            aria-label="Feed preview"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Feed Preview
              </p>
              <PreviewCard
                contentType={contentType}
                thumbType={thumbType}
                title={title}
                description={description}
                singleUrl={singleUrl}
                multiUrls={multiUrls}
                videoUrl={videoUrl}
                loop={loop}
              />
            </div>

            {/* Status indicators */}
            <div className="space-y-2 mt-auto">
              <div
                className={cn(
                  "flex items-start gap-2.5 p-3 rounded-xl border text-[11px] leading-relaxed transition-colors",
                  submitted && hasErrors(errors)
                    ? "bg-destructive/5 border-destructive/20 text-destructive"
                    : submitted && isValid
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-400"
                )}
              >
                {submitted && hasErrors(errors) ? (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                ) : submitted && isValid ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                ) : (
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                )}
                <p>
                  {submitted && hasErrors(errors)
                    ? "Please fix the highlighted errors before submitting."
                    : submitted && isValid
                    ? "Everything looks good! Ready to submit."
                    : "Once submitted, your post will be reviewed by an admin before going live."}
                </p>
              </div>

              <p className="text-[9px] text-muted-foreground/50 text-center px-2">
                Only HTTPS media URLs are accepted. All content is subject to
                our community guidelines.
              </p>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}