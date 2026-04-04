/**
 * Validates that a URL is safe to use (HTTPS only, no javascript:, data:, etc.)
 */
export function isSafeUrl(url: string, maxLength: number = 2048): boolean {
  if (!url || url.trim() === "") return false;
  if (url.length > maxLength) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates a YouTube URL and returns the video ID if valid.
 */
export function extractYoutubeId(url: string): string | null {
  if (!url || !isSafeUrl(url)) return null;
  try {
    const parsed = new URL(url);
    const isYoutube =
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "youtu.be";
    if (!isYoutube) {
      // Check for embed URLs or other formats if needed
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) return match[2];
      return null;
    }

    let videoId: string | null = null;
    if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.slice(1);
    } else {
      videoId = parsed.searchParams.get("v");
    }
    // YouTube IDs are exactly 11 alphanumeric chars (+ - _)
    if (videoId && /^[\w-]{11}$/.test(videoId)) return videoId;
    return null;
  } catch {
    return null;
  }
}

interface EmbedOptions {
  loop?: boolean;
  autoplay?: boolean;
  mute?: boolean;
}

/**
 * Builds a safe YouTube embed URL from a video ID.
 * Uses youtube-nocookie.com for enhanced privacy.
 */
export function buildYoutubeEmbedUrl(videoId: string, options: EmbedOptions = {}): string {
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
    // To loop a single video, the playlist parameter must be set to the same video ID
    params.set("playlist", videoId);
  }

  // youtube-nocookie.com is YouTube's privacy-enhanced embed domain
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
