/**
 * The 60-second Buckets film ("AWS S3, Understood.").
 * Source of truth: s3Console/blog-assets/hero/promo-video (v3, 15 Oct 2026).
 * Re-encode with the commands in that folder's README before replacing files.
 */
export const FILM = {
  title: "Buckets: the 60-second film",
  description:
    "Folder Sync, Drop Zones and AI agents that ask before they write, plus security scans, money leaks, search inside files and Time Travel. Buckets is a desktop client for Amazon S3 and S3-compatible storage on macOS, Windows and Linux.",
  durationSeconds: 58,
  durationLabel: "0:58",
  uploadDate: "2026-10-15",
  /** Streams from YouTube (privacy-enhanced embed), loaded only after a click. */
  youtubeId: "fu0EahYCMe8",
  poster: "/video/buckets-film-poster.webp",
  /** Silent 8-second montage that loops inside the section card. */
  previewSources: [
    { src: "/video/buckets-film-preview.mp4", type: 'video/mp4; codecs="avc1.64001f"' },
    { src: "/video/buckets-film-preview.webm", type: 'video/webm; codecs="vp9"' },
  ],
  previewPoster: "/video/buckets-film-preview-poster.webp",
  chapters: [
    { t: 0, label: "Why S3 is hard" },
    { t: 10.8, label: "Folder Sync" },
    { t: 18.2, label: "Drop Zones" },
    { t: 26.9, label: "AI agents (MCP)" },
    { t: 37, label: "Everything else" },
  ],
} as const;

export const FILM_WATCH_URL = `https://www.youtube.com/watch?v=${FILM.youtubeId}`;
export const FILM_EMBED_URL = `https://www.youtube.com/embed/${FILM.youtubeId}`;

/** Privacy-enhanced embed: no YouTube cookies until the viewer presses play. */
export function filmEmbedSrc(start = 0, origin?: string) {
  const p = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    playsinline: "1",
    cc_load_policy: "1",
    cc_lang_pref: "en",
    hl: "en",
    enablejsapi: "1",
  });
  if (start > 0) p.set("start", String(Math.floor(start)));
  if (origin) p.set("origin", origin);
  return `https://www.youtube-nocookie.com/embed/${FILM.youtubeId}?${p}`;
}

export function formatFilmTime(seconds: number) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
