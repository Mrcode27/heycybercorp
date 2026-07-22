/** Extract the video id from any common YouTube URL form (watch, youtu.be, embed, shorts, live). */
export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/,
  );
  return m ? m[1] : null;
}

/** Privacy-friendly embed URL for an <iframe>, or null if the URL isn't YouTube. */
export function youtubeEmbedUrl(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

/** Canonical watch URL (for the "open on YouTube" link), or null. */
export function youtubeWatchUrl(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}
