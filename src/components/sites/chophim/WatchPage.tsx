"use client";

import { withBasePath } from "@/lib/base-path";
import { getProgress, isInList, removeProgress, saveProgress, toggleList } from "@/lib/user-library";
import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { fillStyle } from "./types";
import { CommentItem } from "./DetailPage";
import { IconLanguages, IconLogIn } from "./icons";
import type { DetailComment, MovieDetail } from "./detail-types";
import { enc } from "./detail-types";

/* ── kiểu dữ liệu ───────────────────────────────────────────────────────── */

export type WatchSuggestion = {
  slug: string;
  title: string;
  origin: string;
  poster: string;
  status: string;
};

/* ── icon (lucide paths) ────────────────────────────────────────────────── */

function I({
  d,
  className = "",
  fill = false,
  children,
}: {
  d?: string;
  className?: string;
  fill?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {d ? <path d={d} /> : children}
    </svg>
  );
}

const IcChevronLeft = ({ className }: { className?: string }) => <I d="m15 18-6-6 6-6" className={className} />;
const IcChevronRight = ({ className }: { className?: string }) => <I d="m9 18 6-6-6-6" className={className} />;
const IcChevronDown = ({ className }: { className?: string }) => <I d="M6 9l6 6 6-6" className={className} />;
const IcX = ({ className }: { className?: string }) => <I d="M18 6 6 18M6 6l12 12" className={className} />;
const IcList = ({ className }: { className?: string }) => (
  <I className={className} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
);
const IcInfo = ({ className }: { className?: string }) => (
  <I className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </I>
);
const IcCheck = ({ className }: { className?: string }) => (
  <I className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </I>
);
const IcPlay = ({ className }: { className?: string }) => <I fill className={className} d="M6 3l14 9-14 9V3z" />;
const IcPause = ({ className }: { className?: string }) => (
  <I fill className={className}>
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </I>
);
const IcSkipFwd = ({ className }: { className?: string }) => (
  <I fill className={className}>
    <path d="M5 4l10 8-10 8V4z" />
    <rect x="17" y="4" width="2.5" height="16" rx="1" />
  </I>
);
const IcBack10 = ({ className }: { className?: string }) => (
  <I className={className}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </I>
);
const IcFwd10 = ({ className }: { className?: string }) => (
  <I className={className}>
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </I>
);
const IcVolume = ({ className }: { className?: string }) => (
  <I className={className}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </I>
);
const IcMaximize = ({ className }: { className?: string }) => (
  <I
    className={className}
    d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
  />
);
const IcSettings = ({ className }: { className?: string }) => (
  <I className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </I>
);
const IcHeart = ({ className }: { className?: string }) => (
  <I
    className={className}
    d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
  />
);
const IcFolderPlus = ({ className }: { className?: string }) => (
  <I className={className}>
    <path d="M12 10v6m-3-3h6" />
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  </I>
);
const IcLightbulb = ({ className }: { className?: string }) => (
  <I className={className}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6m-5 3h4" />
  </I>
);
const IcBug = ({ className }: { className?: string }) => (
  <I className={className}>
    <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
    <path d="M12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5M6 13H2M3 21c0-2.1 1.7-3.9 3.8-4M20.97 5c0 2.1-1.6 3.8-3.5 4M22 13h-4M17.2 17c2.1.1 3.8 1.9 3.8 4" />
  </I>
);
const IcQuestion = ({ className }: { className?: string }) => (
  <I className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
  </I>
);
const IcCaptions = ({ className }: { className?: string }) => (
  <I className={className}>
    <rect width="18" height="14" x="3" y="5" rx="2" />
    <path d="M7 15h4M15 15h2M7 11h2M13 11h4" />
  </I>
);
const IcRouter = ({ className }: { className?: string }) => (
  <I className={className}>
    <rect width="20" height="8" x="2" y="14" rx="2" />
    <path d="M6.01 18H6m4 0h.01m3.99 0h.01" />
    <path d="M22 14a17 17 0 0 0-17-7" />
  </I>
);
const IcSignalZero = ({ className }: { className?: string }) => (
  <I className={className}>
    <path d="M2 20h.01M7 20v-4m5 4v-8m5 8V8" />
  </I>
);
const IcMic = ({ className }: { className?: string }) => (
  <I className={className}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
  </I>
);
const IcMessage = ({ className }: { className?: string }) => (
  <I className={className}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </I>
);
const IcTelegram = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"
    />
  </svg>
);

/* ── helpers ────────────────────────────────────────────────────────────── */

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "00:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${p(h)}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
};

// Chỉ coi là HLS khi đường dẫn (pathname) thật sự kết thúc bằng .m3u8.
const isHlsUrl = (u: string | null) => {
  if (!u) return false;
  try {
    return new URL(u, "https://example.com").pathname.toLowerCase().endsWith(".m3u8");
  } catch {
    return false;
  }
};

function preferredServer(movie: MovieDetail): number {
  // Nguồn mặc định của chophim.wtf là kênh chính (link m3u8 trực tiếp).
  const hls = movie.servers.findIndex((s) => s.episodes.some((e) => isHlsUrl(e.url)));
  if (hls >= 0) return hls;
  const playable = movie.servers.findIndex((s) => s.episodes.some((e) => !!e.url));
  return playable >= 0 ? playable : 0;
}

/* ── component chính ────────────────────────────────────────────────────── */

export function WatchPage({
  movie,
  comments,
  suggestions,
}: {
  movie: MovieDetail;
  comments: DetailComment[];
  suggestions: WatchSuggestion[];
}) {
  const [serverIdx, setServerIdx] = useState(() => preferredServer(movie));
  const [epIdx, setEpIdx] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [autoSkip, setAutoSkip] = useState(false);
  const [fav, setFav] = useState(false);
  const [added, setAdded] = useState(false);
  const [hideImg, setHideImg] = useState(false);
  const [ambient, setAmbient] = useState(false);
  const [notice, setNotice] = useState("");
  const [descOpen, setDescOpen] = useState(false);
  const [sort, setSort] = useState<"new" | "top">("new");
  const [showMore, setShowMore] = useState(false);
  const [hover, setHover] = useState(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(1);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pendingTimeRef = useRef(0);
  const lastSavedRef = useRef(0);

  const sIdx = Math.min(serverIdx, Math.max(movie.servers.length - 1, 0));
  const server = movie.servers[sIdx];
  const eIdx = server ? Math.min(epIdx, Math.max(server.episodes.length - 1, 0)) : 0;
  const episode = server?.episodes[eIdx] ?? null;
  const url = episode?.url ?? null;
  const hls = isHlsUrl(url);
  const isEmbed = !!url && !hls;
  const firstPlayable = server?.episodes.findIndex((e) => !!e.url) ?? -1;

  /* ── khôi phục tiến trình + đọc hash (#tap=tap-N&sv=...&server_id=N&t=giây) ── */
  useEffect(() => {
    const saved = getProgress(movie.slug)[0];
    let si = preferredServer(movie);
    let ei = 0;
    let resumeTime = 0;

    if (saved) {
      si = Math.min(Math.max(0, saved.server), Math.max(movie.servers.length - 1, 0));
      ei = saved.episode;
      resumeTime = saved.time;
    }

    const raw = window.location.hash.replace(/^#/, "");
    if (raw) {
      const p = new URLSearchParams(raw);
      const sid = p.get("server_id");
      const svName = p.get("sv");
      if (sid && /^\d+$/.test(sid) && movie.servers[Number(sid)]) si = Number(sid);
      else if (svName) {
        const i = movie.servers.findIndex((s) => s.name === svName);
        if (i >= 0) si = i;
      }
      const tap = (p.get("tap") || "").match(/^tap-(\d+)$/);
      if (tap) {
        ei = Number(tap[1]) - 1;
        resumeTime = 0;
      }
      const t = Number(p.get("t") ?? "");
      if (Number.isFinite(t) && t > 0) resumeTime = t;
    }

    ei = Math.max(0, Math.min(ei, (movie.servers[si]?.episodes.length ?? 1) - 1));
    setServerIdx(si);
    setEpIdx(ei);
    pendingTimeRef.current = Number.isFinite(resumeTime) && resumeTime > 0 ? resumeTime : 0;
  }, [movie]);

  const writeHash = useCallback(
    (si: number, ei: number) => {
      const s = movie.servers[si];
      if (!s || typeof window === "undefined") return;
      const hash = `#tap=tap-${ei + 1}&sv=${enc(s.name)}&channel=0&server_id=${si}`;
      window.history.replaceState(null, "", window.location.pathname + window.location.search + hash);
    },
    [movie]
  );

  const selectEp = useCallback(
    (si: number, ei: number) => {
      setServerIdx(si);
      setEpIdx(ei);
      setStarted(false);
      setPlaying(false);
      setCur(0);
      setDur(0);
      pendingTimeRef.current = 0;
      writeHash(si, ei);
      document.getElementById("watch-player")?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [writeHash]
  );

  const changeServer = useCallback(
    (si: number) => {
      const ei = Math.min(epIdx, Math.max((movie.servers[si]?.episodes.length ?? 1) - 1, 0));
      selectEp(si, ei);
    },
    [epIdx, movie, selectEp]
  );

  useEffect(() => {
    setFav(isInList("favorites", movie.slug));
    setAdded(isInList("watchlist", movie.slug));
  }, [movie.slug]);

  useEffect(() => {
    lastSavedRef.current = 0;
  }, [sIdx, eIdx]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const scrollToServers = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("episodes-section")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const libraryEntry = {
    slug: movie.slug,
    title: movie.title,
    poster: movie.poster || movie.backdrop,
    origin: movie.origin,
  };

  const toggleFavorite = () => setFav(toggleList("favorites", libraryEntry));
  const toggleWatchlist = () => setAdded(toggleList("watchlist", libraryEntry));

  const persist = useCallback(
    (time: number, total?: number) => {
      if (!Number.isFinite(time) || time < 1) return;
      saveProgress({
        ...libraryEntry,
        server: sIdx,
        serverName: server?.name ?? "",
        episode: eIdx,
        time,
        duration: total ?? dur,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dur, eIdx, movie, sIdx, server?.name]
  );

  /* ── HLS cho link .m3u8 ── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !url || !hls) return;
    if (Hls.isSupported()) {
      const inst = new Hls();
      inst.loadSource(url);
      inst.attachMedia(v);
      return () => inst.destroy();
    }
    v.src = url; // Safari phát HLS gốc
  }, [url, hls]);

  /* ── điều khiển video ── */
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };
  const seekBy = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
  };
  const nextEpisode = useCallback(() => {
    if (server && eIdx < server.episodes.length - 1) selectEp(sIdx, eIdx + 1);
  }, [eIdx, selectEp, server, sIdx]);

  const skipIntro = useCallback(() => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= 180) return;
    v.currentTime = Math.min(90, v.duration - 30);
    setNotice("Đã bỏ qua intro");
  }, []);

  const onEnded = () => {
    setPlaying(false);
    if (autoNext) nextEpisode();
  };

  // Auto skip intro cũng chạy khi người dùng bật tính năng lúc video đang phát.
  useEffect(() => {
    if (!autoSkip || !hls) return;
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= 180) return;
    if (v.currentTime < 0 || v.currentTime >= 90) return;
    skipIntro();
  }, [autoSkip, cur, hls, skipIntro]);

  // Phím tắt chuyển tập, đúng với nhãn "Tập kế tiếp (N)".
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key.toLowerCase() === "n") nextEpisode();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextEpisode]);
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void wrapRef.current?.requestFullscreen?.();
  };

  const showCtl = hover || (started && !playing);
  const curCount = movie.current ?? server?.episodes.length ?? 0;
  const totalCount = movie.total ?? server?.episodes.length ?? 0;

  const sorted = sort === "top" ? [...comments].sort((a, b) => b.likes - a.likes) : comments;
  const visible = showMore ? sorted : sorted.slice(0, 5);
  const allShown = sorted.length <= 5;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-4 sm:py-6">
      <div className="relative isolate">
        {/* ── Trình phát ── */}
        <div className="flex flex-col mb-6 -mx-4 overflow-visible transition-all duration-500 sm:mx-0 sm:rounded-xl">
          <div
            id="watch-player"
            ref={wrapRef}
            className={`relative w-full aspect-video transition-shadow duration-[350ms] ${ambient ? "shadow-[0_0_70px_rgba(255,209,102,0.18)]" : ""}`}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <div className="absolute inset-0 w-full h-full">
              <div className="relative flex h-full w-full items-center justify-center overflow-visible font-sans select-none focus:outline-none" tabIndex={0}>
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[-2] bg-black" />
                <div className="absolute inset-0 overflow-hidden bg-black sm:rounded-l-xl">
                  {url && hls && (
                    <video
                      ref={videoRef}
                      className="h-full w-full object-contain"
                      playsInline
                      preload="auto"
                      poster={movie.backdrop || movie.poster}
                      onClick={togglePlay}
                      onPlay={() => {
                        setPlaying(true);
                        setStarted(true);
                      }}
                      onPause={(e) => {
                        setPlaying(false);
                        persist(e.currentTarget.currentTime, e.currentTarget.duration || dur);
                      }}
                      onTimeUpdate={(e) => {
                        const t = e.currentTarget.currentTime;
                        setCur(t);
                        if (t - lastSavedRef.current >= 5) {
                          lastSavedRef.current = t;
                          persist(t, e.currentTarget.duration || dur);
                        }
                      }}
                      onLoadedMetadata={(e) => {
                        const v = e.currentTarget;
                        const d = v.duration || 0;
                        setDur(d);
                        if (pendingTimeRef.current > 0 && d > 0) {
                          v.currentTime = Math.min(pendingTimeRef.current, Math.max(0, d - 5));
                          pendingTimeRef.current = 0;
                        }
                      }}
                      onEnded={() => {
                        persist(dur || 0, dur || 0);
                        onEnded();
                      }}
                      onVolumeChange={(e) => setVol(e.currentTarget.volume)}
                    />
                  )}
                  {url && !hls && (
                    <iframe
                      src={url}
                      title={`${movie.title} - ${episode?.label ?? ""}`}
                      className="h-full w-full border-0"
                      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  )}
                  {!url && (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center text-white/70">
                      <IcPlay className="w-10 h-10 text-white/30" />
                      <p className="text-sm">Tập này chưa có nguồn xem.</p>
                      {firstPlayable >= 0 ? (
                        <button
                          type="button"
                          onClick={() => selectEp(sIdx, firstPlayable)}
                          className="rounded-lg bg-[#FFD166] px-4 py-2 text-[13px] font-bold text-[#171717] transition-colors hover:bg-[#FFE099]"
                        >
                          Chuyển sang {server?.episodes[firstPlayable]?.label ?? "tập có nguồn"}
                        </button>
                      ) : (
                        <p className="text-[12px] text-white/45">Hãy thử máy chủ khác bên dưới.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* thanh tiêu đề (hiện khi rê chuột) */}
                <div
                  className={`absolute top-0 left-0 right-0 p-3 sm:p-6 transition-opacity duration-500 z-10 flex items-start justify-between ${
                    showCtl ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  <h2 className="text-white font-medium text-sm sm:text-lg lg:text-xl drop-shadow-md truncate tracking-wide flex-1 mr-4">
                    {movie.title}
                    {server && server.episodes.length > 1 ? ` - ${episode?.label}` : ""}
                  </h2>
                  <div className="pointer-events-auto flex shrink-0 flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDrawer(true)}
                      className="hidden flex-row items-center gap-1.5 p-1 text-xs font-medium text-white/90 transition-colors hover:text-[#eab308] sm:flex sm:text-[15px]"
                    >
                      <IcList className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Danh sách tập</span>
                    </button>
                  </div>
                </div>

                {/* ngăn kéo danh sách tập */}
                <div className={`absolute inset-0 right-0 z-50 overflow-hidden transition-all duration-300 ease-in-out ${drawer ? "" : "pointer-events-none delay-200"}`}>
                  <button
                    type="button"
                    aria-label="Đóng danh sách tập"
                    tabIndex={-1}
                    onClick={() => setDrawer(false)}
                    className={`absolute inset-0 z-0 bg-black/50 transition-opacity duration-300 ease-in-out ${drawer ? "opacity-100" : "opacity-0"}`}
                  />
                  <div
                    className={`absolute right-0 top-0 z-10 h-full w-full max-w-full bg-[#1a1b20] border-l border-white/5 shadow-2xl flex flex-col transition-transform duration-300 ease-out sm:w-[350px] ${
                      drawer ? "translate-x-0" : "translate-x-full"
                    }`}
                  >
                    <div className="flex items-center justify-between p-3 sm:px-4 sm:py-3.5 border-b border-white/5">
                      <h3 className="text-white font-bold text-[15px] leading-tight line-clamp-1 pr-4">{movie.title}</h3>
                      <button
                        type="button"
                        onClick={() => setDrawer(false)}
                        className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors shrink-0"
                      >
                        <IcX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col content-start">
                      {(server?.episodes ?? []).map((ep, i) => {
                        const active = i === eIdx;
                        return (
                          <button
                            key={`${server?.name}-${i}`}
                            type="button"
                            onClick={() => {
                              selectEp(sIdx, i);
                              setDrawer(false);
                            }}
                            className={`flex items-center gap-3.5 p-3 sm:px-4 sm:py-3 border-b border-white/5 transition-colors outline-none text-left cursor-pointer ${
                              active ? "bg-white/10" : "bg-transparent hover:bg-white/5 text-white/80 hover:text-white"
                            }`}
                          >
                            <div
                              className={`relative w-[90px] sm:w-[100px] aspect-[16/9] rounded shrink-0 overflow-hidden bg-black/50 bg-cover bg-center ${
                                active ? "ring-2 ring-[#eab308] ring-offset-[2px] ring-offset-[#1f2025]" : ""
                              }`}
                              style={
                                hideImg
                                  ? { backgroundColor: "#10121b" }
                                  : { backgroundImage: `url("${movie.backdrop || movie.poster}")` }
                              }
                              aria-label={ep.label}
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${active ? "text-[#eab308]" : "text-white/90"}`}>{ep.label}</p>
                            </div>
                          </button>
                        );
                      })}
                      {(!server || server.episodes.length === 0) && (
                        <p className="p-4 text-sm text-white/50">Chưa có tập nào.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* thanh điều khiển video */}
                {url && hls && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 pt-10 sm:pt-20 pb-2 sm:pb-4 px-3 sm:px-6 transition-all duration-300 ease-out z-20 ${
                      showCtl ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
                    }`}
                  >
                    <div className="max-w-screen-2xl mx-auto flex flex-col gap-1 sm:gap-4">
                      <div className="flex items-center gap-2 w-full">
                        <span className="md:hidden shrink-0 text-[10px] font-medium text-white/80 tabular-nums">{fmt(cur)}</span>
                        <div
                          className="flex-1 relative flex flex-col justify-center h-7 cursor-pointer group/scrub"
                          onClick={(e) => {
                            const v = videoRef.current;
                            const box = e.currentTarget.getBoundingClientRect();
                            if (v && v.duration) v.currentTime = ((e.clientX - box.left) / box.width) * v.duration;
                          }}
                        >
                          <div className="relative w-full h-[6px] rounded-sm bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition-all duration-200 group-hover/scrub:h-2">
                            <div
                              className="absolute top-0 left-0 h-full rounded-sm bg-[#FFD166]"
                              style={{ width: dur ? `${(cur / dur) * 100}%` : "0%" }}
                            />
                          </div>
                        </div>
                        <span className="md:hidden shrink-0 text-[10px] font-medium text-white/80 tabular-nums">{fmt(dur)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-7">
                          <button type="button" onClick={togglePlay} className="text-white hover:text-white/80 transition-all focus:outline-none flex h-10 w-10 sm:h-auto sm:w-auto items-center justify-center">
                            {playing ? <IcPause className="w-6 h-6 sm:w-9 sm:h-9" /> : <IcPlay className="w-6 h-6 sm:w-9 sm:h-9" />}
                          </button>
                          <div className="flex items-center gap-1 sm:gap-6">
                            <button type="button" aria-label="Tua lui 10 giây" onClick={() => seekBy(-10)} className="text-white hover:text-white/80 transition-all focus:outline-none h-10 w-10 sm:h-auto sm:w-auto flex items-center justify-center">
                              <IcBack10 className="w-5 h-5 sm:w-7 sm:h-7" />
                            </button>
                            <button type="button" aria-label="Tua tới 10 giây" onClick={() => seekBy(10)} className="text-white hover:text-white/80 transition-all focus:outline-none h-10 w-10 sm:h-auto sm:w-auto flex items-center justify-center">
                              <IcFwd10 className="w-5 h-5 sm:w-7 sm:h-7" />
                            </button>
                          </div>
                          <div className="hidden sm:flex items-center gap-4">
                            <div className="flex items-center gap-2 group/volume">
                              <button
                                type="button"
                                onClick={() => {
                                  const v = videoRef.current;
                                  if (v) v.muted = !v.muted;
                                }}
                                className="text-white hover:text-white/80 transition-all focus:outline-none flex items-center justify-center"
                              >
                                <IcVolume className="w-7 h-7" />
                              </button>
                              <div className="overflow-hidden transition-all duration-300 ease-out flex items-center h-5 w-0 group-hover/volume:w-24">
                                <div className="relative w-20 h-1 bg-white/30 rounded-full flex items-center">
                                  <div className="absolute h-full bg-white rounded-full pointer-events-none" style={{ width: `${vol * 100}%` }} />
                                  <input
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    type="range"
                                    value={vol}
                                    onChange={(e) => {
                                      const v = videoRef.current;
                                      if (v) v.volume = Number(e.target.value);
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="hidden md:flex items-center whitespace-nowrap text-[14px] font-medium text-white/80 tabular-nums">
                              <span>{fmt(cur)}</span>
                              <span className="px-1.5 text-white/50">/</span>
                              <span>{fmt(dur)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-6 relative">
                          {hls && dur > 180 && cur < 90 && (
                            <button
                              type="button"
                              title="Bỏ qua intro"
                              onClick={skipIntro}
                              className="flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-white/80 transition-colors hover:text-[#FFD166] sm:text-[13px]"
                            >
                              Bỏ qua intro
                            </button>
                          )}
                          <div className="flex items-center border-r border-white/20 pr-1.5 sm:pr-6 mr-0.5 sm:mr-2">
                            <button
                              type="button"
                              title="Tập kế tiếp (N)"
                              onClick={nextEpisode}
                              className="text-white hover:text-[#FFD166] transition-all focus:outline-none flex h-9 w-9 sm:h-auto sm:w-auto items-center justify-center"
                            >
                              <IcSkipFwd className="w-5 h-5 sm:w-7 sm:h-7" />
                            </button>
                          </div>
                          <button
                            type="button"
                            aria-label="Phụ đề"
                            title="Phụ đề"
                            onClick={() => setNotice(`Ngôn ngữ phim: ${movie.lang}.`)}
                            className="hidden transition-colors hover:text-white/80 focus:outline-none sm:flex items-center justify-center text-white"
                          >
                            <IcCaptions className="h-7 w-7" />
                          </button>
                          <div className="relative flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setNotice("Đây là bản song ngữ/gốc; chọn máy chủ để đổi bản lồng tiếng nếu có.")}
                              className="text-white transition-colors hover:text-white/80 focus:outline-none flex h-9 w-9 sm:h-auto sm:w-auto items-center justify-center relative active:scale-[0.97] motion-reduce:transform-none group"
                            >
                              <IcMic className="w-5 h-5 sm:w-7 sm:h-7 transition-[transform] duration-[220ms] group-hover:rotate-12 motion-reduce:transform-none" />
                              <div className="absolute -top-1.5 -right-3 bg-white text-black text-[9px] font-bold px-1 rounded-sm shadow-sm pointer-events-none leading-tight">Song</div>
                            </button>
                          </div>
                          <div className="hidden sm:flex">
                            <div className="relative flex items-center justify-center">
                              <button type="button" aria-label="Máy chủ" title="Máy chủ" onClick={scrollToServers} className="group relative flex h-9 sm:h-auto w-9 sm:w-auto items-center justify-center text-white transition-colors hover:text-white/80 active:scale-[0.97] focus:outline-none motion-reduce:transform-none">
                                <IcRouter className="h-5 w-5 sm:h-7 sm:w-7 transition-transform duration-300" />
                                <IcSignalZero className="pointer-events-none absolute -right-3 -top-1.5 h-4 w-4 rounded-sm bg-black/60 p-0.5 shadow-sm text-white/45" />
                              </button>
                            </div>
                          </div>
                          <button
                            type="button"
                            aria-label="Bật/tắt ánh sáng môi trường"
                            aria-pressed={ambient}
                            title="Ánh sáng môi trường"
                            onClick={() => setAmbient((v) => !v)}
                            className="relative flex h-9 w-9 items-center justify-center text-white transition-colors hover:text-white/80 focus:outline-none sm:h-auto sm:w-auto"
                          >
                            <IcSettings className={`w-5 h-5 sm:h-7 sm:w-7 ${ambient ? "text-[#FFD166]" : ""}`} />
                          </button>
                          <button type="button" onClick={fullscreen} aria-label="Toàn màn hình" className="text-white hover:text-white/80 transition-all focus:outline-none flex h-9 w-9 sm:h-auto sm:w-auto items-center justify-center">
                            <IcMaximize className="w-5 h-5 sm:w-7 sm:w-7 sm:h-7" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* thanh di động dưới trình phát */}
          <div className="relative z-30 flex items-center justify-between gap-3 bg-white/[0.04] px-4 py-2 text-white md:hidden">
            <button type="button" onClick={scrollToServers} className="group relative flex h-8 min-h-8 min-w-0 items-center justify-center gap-1 px-0 text-white/80 transition-colors hover:text-white focus:outline-none">
              <IcRouter className="h-4 w-4" />
              <span className="text-xs font-semibold leading-none">Kiểm tra máy chủ</span>
              <IcSignalZero className="pointer-events-none absolute -right-3 -top-1.5 h-4 w-4 rounded-sm bg-black/60 p-0.5 shadow-sm text-white/45" />
            </button>
            <button
              type="button"
              onClick={() => setNotice(`Ngôn ngữ phim: ${movie.lang}.`)}
              className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-white/75 transition-colors hover:text-white whitespace-nowrap"
              title={movie.lang}
            >
              <IcCaptions className="h-4 w-4" />
              <span>{movie.lang}</span>
            </button>
          </div>

          {/* thanh hành động */}
          <div className="relative z-20 flex items-center justify-between gap-10 overflow-x-auto bg-white/[0.04] px-4 py-3 text-white hide-scrollbar md:gap-0 md:px-6 md:py-4 xl:px-8">
            <div className="flex items-center gap-6 md:gap-8 shrink-0">
              <button
                type="button"
                title="Yêu thích"
                aria-pressed={fav}
                onClick={toggleFavorite}
                className="group/fav flex items-center justify-center gap-2.5 transition-colors outline-none active:scale-[0.97] motion-reduce:transform-none"
              >
                <IcHeart className={`w-4 h-4 transition-colors ${fav ? "fill-[#FFD166] text-[#FFD166]" : "text-white/90"}`} />
                <span className="hidden sm:inline-block text-[13px] font-medium transition-colors text-white">Yêu thích</span>
              </button>
              <div className="relative">
                <button
                  type="button"
                  title="Thêm vào danh sách"
                  aria-pressed={added}
                  onClick={toggleWatchlist}
                  className="group/add flex items-center justify-center gap-2.5 transition-colors outline-none active:scale-[0.97] motion-reduce:transform-none"
                >
                  <IcFolderPlus className={`w-4 h-4 transition-colors ${added ? "text-[#FFD166]" : "text-white/90"}`} />
                  <span className="hidden sm:inline-block text-[13px] font-medium transition-colors text-white">{added ? "Đã thêm" : "Thêm vào"}</span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 shrink-0">
              <button
                type="button"
                aria-pressed={autoNext}
                onClick={() => {
                  const next = !autoNext;
                  setAutoNext(next);
                  setNotice(next ? "Đã bật tự động chuyển tập" : "Đã tắt tự động chuyển tập");
                }}
                className="flex items-center gap-2 hover:bg-white/10 transition-colors group outline-none py-1.5 px-2 md:px-3 rounded-lg"
              >
                <IcSkipFwd className={`w-5 h-5 ${autoNext ? "text-[#FFD166]" : "text-white/70"}`} />
                <span className={`hidden md:inline-block text-[13px] font-medium transition-colors ${autoNext ? "text-[#FFD166]" : "text-white/90"}`}>Tự động chuyển tập</span>
                <span
                  className={`hidden md:inline-block text-[10px] font-bold px-1.5 py-[3px] rounded transition-colors ${
                    autoNext ? "text-[#FECF59] bg-[#FECF59]/10" : "text-white/40 bg-white/5"
                  }`}
                >
                  {autoNext ? "ON" : "OFF"}
                </span>
              </button>
              <button
                type="button"
                title={isEmbed ? "Nguồn embed không hỗ trợ tua intro" : "Tự động bỏ qua intro"}
                aria-pressed={autoSkip && !isEmbed}
                onClick={() => {
                  if (isEmbed) {
                    setNotice("Nguồn embed không hỗ trợ bỏ qua intro. Chọn nguồn M3U8 để dùng tính năng này.");
                    return;
                  }
                  const next = !autoSkip;
                  setAutoSkip(next);
                  setNotice(next ? "Đã bật tự động bỏ qua intro" : "Đã tắt tự động bỏ qua intro");
                }}
                className={`hidden items-center gap-2 rounded-lg px-3 py-1.5 outline-none transition-colors hover:bg-white/10 md:flex group ${isEmbed ? "opacity-50" : ""}`}
              >
                <IcSkipFwd className={`w-5 h-5 ${autoSkip && !isEmbed ? "text-[#FFD166]" : "text-white/70 group-hover:text-white"}`} />
                <span className={`hidden md:inline-block text-[13px] font-medium group-hover:text-white ${autoSkip && !isEmbed ? "text-[#FFD166]" : "text-white/90"}`}>Auto skip intro</span>
                <span className={`hidden md:inline-block text-[10px] font-bold px-1.5 py-[3px] rounded transition-colors ${autoSkip && !isEmbed ? "text-[#FECF59] bg-[#FECF59]/10" : "text-white/40"}`}>
                  {isEmbed ? "—" : autoSkip ? "ON" : "OFF"}
                </span>
              </button>
              <button
                type="button"
                title="Bật/tắt ánh sáng môi trường"
                aria-pressed={ambient}
                onClick={() => setAmbient((v) => !v)}
                className={`hidden items-center gap-2 rounded-lg px-3 py-1.5 outline-none transition-colors hover:bg-white/10 md:flex group ${ambient ? "text-[#FFD166]" : ""}`}
              >
                <IcLightbulb className="w-5 h-5 text-white/70 transition-colors group-hover:text-[#FFD166]" />
                <span className="hidden md:inline-block text-[13px] font-medium text-white/90 transition-colors group-hover:text-[#FFD166]">Ánh sáng môi trường</span>
                <span className="hidden md:inline-block rounded bg-white/[0.06] px-1.5 py-[3px] text-[10px] font-bold text-white/40 transition-colors group-hover:bg-[#FECF59]/10 group-hover:text-[#FECF59]">
                  {ambient ? "ON" : "CÀI ĐẶT"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setNotice("Gặp lỗi phát? Đổi máy chủ ở danh sách tập hoặc báo qua Telegram @nhot2008.")}
                className="flex items-center gap-2 hover:bg-white/10 transition-colors group outline-none py-1.5 px-2 md:px-3 rounded-lg"
              >
                <IcBug className="w-5 h-5 text-white/70 group-hover:text-[#eab308] transition-colors" />
                <span className="hidden md:inline-block text-[13px] font-medium text-white/70 group-hover:text-[#eab308] transition-colors">Báo lỗi</span>
              </button>
              <button
                type="button"
                onClick={() => setNotice("Phím tắt: Space = phát/dừng, ←/→ = tua 10s, F = toàn màn hình.")}
                className="flex items-center justify-center py-1.5 px-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Hướng dẫn thao tác"
                title="Hướng dẫn thao tác"
              >
                <IcQuestion className="w-5 h-5 transition-colors text-white/40" />
              </button>
            </div>
          </div>
        </div>

        {notice && (
          <div
            role="status"
            className="animate-fade-in mt-3 rounded-lg border border-[#FFD166]/20 bg-[#FFD166]/10 px-4 py-2.5 text-[13px] text-[#FFD166]"
          >
            {notice}
          </div>
        )}

        {/* ── Nội dung ── */}
        <div className="flex flex-col xl:flex-row gap-8 mt-4 xl:mt-8">
          <div className="flex-1 min-w-0">
            {/* back link (mobile) */}
            <div className="flex sm:hidden items-center mb-4">
              <a href={withBasePath(`/phim/${movie.slug}`)} className="flex items-center gap-3 text-white hover:text-[#FFD166] transition-colors">
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                  <IcChevronLeft className="w-4 h-4" />
                </div>
                <h1 className="text-[13px] font-bold leading-tight line-clamp-1">Xem phim: {movie.title}</h1>
              </a>
            </div>

            {/* thông báo */}
            <div className="mb-2.5 flex items-start gap-2.5 rounded-lg border border-[#eab308]/20 bg-[#eab308]/10 px-3 py-2 sm:items-center sm:py-3">
              <IcInfo className="w-4 h-4 text-[#eab308] shrink-0 mt-0.5 sm:mt-0" />
              <p className="text-[12px] md:text-[13px] text-white/80 leading-relaxed font-medium">
                Phim bị lỗi âm thanh, giật lag, chất lượng kém ? Vui lòng chuyển sang <span className="text-[#eab308]">Máy chủ Dự phòng</span> bên dưới.
              </p>
            </div>

            {/* telegram */}
            <div className="mb-4">
              <a
                href="https://t.me/nhot2008"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#229ED9]/20 bg-[#229ED9]/10 px-3 py-2.5 text-[12px] font-medium text-[#8bd8ff] transition-colors hover:border-[#229ED9]/35 hover:bg-[#229ED9]/15 hover:text-white sm:w-auto"
              >
                <IcTelegram className="h-4 w-4 shrink-0" />
                Liên hệ Telegram @nhot2008 để được hỗ trợ
              </a>
            </div>

            {/* poster + thông tin */}
            <div className="hidden sm:flex flex-col sm:flex-row items-center sm:items-start gap-6 lg:gap-8">
              <div className="shrink-0 relative w-32 md:w-40 lg:w-[150px] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl bg-[#16161e]">
                <img alt={movie.title} decoding="async" className="object-cover" style={fillStyle} src={movie.poster} />
              </div>
              <div className="flex-1 flex flex-col gap-4 pt-1 w-full text-center sm:text-left">
                <div>
                  <h1 className="text-2xl md:text-[28px] font-bold text-white mb-2 leading-tight">{movie.title}</h1>
                  <h2 className="text-[#eab308] text-sm md:text-[15px] font-medium opacity-90">{movie.origin}</h2>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                  {movie.rating != null && (
                    <div className="flex items-center text-[11px] font-bold rounded overflow-hidden border border-solid border-[rgba(1,180,228,0.5)]">
                      <span className="bg-[#01B4E4] text-white px-1.5 py-0.5">TMDb</span>
                      <span className="bg-[rgba(1,180,228,0.1)] text-white px-1.5 py-0.5">{movie.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {movie.year && <span className="text-[11px] font-medium px-2 py-0.5 border border-white/20 rounded text-white/90">{movie.year}</span>}
                  {movie.episodeLabel && <span className="text-[11px] font-medium px-2 py-0.5 border border-white/20 rounded text-white/90">{movie.episodeLabel}</span>}
                  <span className="text-[11px] font-medium px-2 py-0.5 border border-white/20 rounded text-white/90">{movie.status}</span>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                  {movie.genres.map((g) => (
                    <span key={g} className="text-[11px] font-medium px-2.5 py-1 bg-white/5 rounded text-white/70">
                      {g}
                    </span>
                  ))}
                </div>
                <div className="inline-flex self-center sm:self-start items-center gap-1.5 px-3 py-1.5 rounded-full mt-2 border bg-[#00b14f]/10 border-[#00b14f]/20 text-[#00b14f]">
                  <IcCheck className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{movie.status}</span>
                </div>
                <div className="mt-2 text-left">
                  <p className={`text-[13px] md:text-sm text-white/70 leading-relaxed ${descOpen ? "" : "line-clamp-3"}`}>
                    {movie.description || "Đang cập nhật nội dung phim..."}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <button type="button" onClick={() => setDescOpen((v) => !v)} className="text-white/40 hover:text-white/70 text-[12px] font-medium transition-colors">
                      {descOpen ? "Thu gọn" : "Xem thêm"}
                    </button>
                    <a className="inline-flex items-center gap-1 text-[13px] text-[#eab308] hover:text-[#eab308]/80 transition-colors font-medium" href={withBasePath(`/phim/${movie.slug}`)}>
                      Thông tin phim <IcChevronRight className="w-4 h-4 ml-0.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Danh sách tập ── */}
            <div id="episodes-section" className="mt-8 mb-12 scroll-mt-24">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4 md:flex-nowrap">
                <h3 className="flex items-center gap-2 text-[17px] font-bold text-white md:text-lg">
                  <IcList className="h-5 w-5" />
                  Danh sách tập
                </h3>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-[13px] text-white/60 font-medium hidden sm:inline-block shrink-0">Chọn Server:</span>
                  <div className="relative min-w-0 sm:w-auto">
                    <select
                      value={sIdx}
                      onChange={(e) => changeServer(Number(e.target.value))}
                      className="appearance-none w-full sm:w-auto sm:min-w-[180px] bg-[#12121a] hover:bg-[#15151f] border border-white/10 text-white text-[13px] md:text-sm font-medium rounded-lg px-3.5 sm:px-4 py-2 pr-8 focus:outline-none focus:border-[#eab308]/50 transition-colors cursor-pointer"
                    >
                      {movie.servers.map((s, i) => (
                        <option key={s.name} value={i}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <IcChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  </div>
                </div>
              </div>

              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-sm font-bold text-white/80">
                  Danh sách tập <span className="text-white/60">( {curCount} / <span className="text-[#FFD166]">{totalCount}</span> )</span>
                </h3>
                <button
                  type="button"
                  aria-pressed={hideImg}
                  onClick={() => setHideImg((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-1 py-0.5 text-xs font-normal text-white/65 transition-colors hover:text-white"
                >
                  <span>Ẩn ảnh</span>
                  <span className={`relative h-6 w-10 rounded-full transition-colors ${hideImg ? "bg-[#FFD166]/70" : "bg-white/20"}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${hideImg ? "left-[18px]" : "left-0.5"}`} />
                  </span>
                </button>
              </div>

              {/* chip máy chủ / ngôn ngữ */}
              <div className="mb-6 flex flex-wrap gap-2">
                {movie.servers.map((s, i) => {
                  const active = i === sIdx;
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => changeServer(i)}
                      className={`group flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                        active ? "border border-white/30 text-white bg-white/5 font-medium" : "text-white/60 hover:text-white border border-transparent bg-white/5"
                      }`}
                    >
                      {i % 2 === 0 ? <IconLanguages className="h-3.5 w-3.5" /> : <IcCaptions className="h-3.5 w-3.5" />}
                      <span>{s.name}</span>
                      <span
                        className={`ml-1 flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold transition-colors ${
                          active ? "bg-white text-black" : "bg-white/10 text-white/50 group-hover:text-white/80"
                        }`}
                      >
                        {s.episodes.length}
                      </span>
                    </button>
                  );
                })}
                {movie.servers.length === 0 && <span className="text-sm text-white/50">Chưa có máy chủ nào.</span>}
              </div>

              {/* lưới tập */}
              <div className="grid grid-cols-3 gap-x-2.5 gap-y-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {(server?.episodes ?? []).map((ep, i) => {
                  const active = i === eIdx;
                  return (
                    <button
                      key={`${server?.name}-grid-${i}`}
                      type="button"
                      onClick={() => selectEp(sIdx, i)}
                      disabled={!ep.url && firstPlayable >= 0}
                      title={!ep.url ? "Tập này chưa có nguồn" : ep.label}
                      className={`group flex items-center justify-center gap-1.5 rounded-lg border-2 border-transparent px-2 py-2 text-[13px] transition-colors ${
                        !ep.url && firstPlayable >= 0
                          ? "cursor-not-allowed bg-[#191b24] text-white/35"
                          : active
                            ? "bg-[#FFD166] text-[#1c1c1c] font-semibold shadow-[0_4px_20px_rgba(255,209,102,0.2)]"
                            : "bg-[#191b24] text-white/90 hover:border-[#FFD166] hover:text-[#FFD166] shadow-sm"
                      }`}
                    >
                      <IcPlay className={`h-3 w-3 shrink-0 ${active ? "fill-[#1c1c1c]" : "fill-white/80 group-hover:fill-[#FFD166]"}`} />
                      {ep.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Bình luận ── */}
            <div className="mb-12">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <IcMessage className="w-6 h-6 text-white fill-white" />
                  <h2 className="text-xl font-bold text-white">
                    Bình luận <span className="text-white/60">({comments.length})</span>
                  </h2>
                </div>
                <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5 text-[12px] font-medium">
                  <button
                    type="button"
                    aria-pressed={sort === "new"}
                    onClick={() => setSort("new")}
                    className={`rounded-md px-2.5 py-1.5 transition-colors ${sort === "new" ? "bg-white/10 text-white" : "text-white/45 hover:text-white/80"}`}
                  >
                    Mới nhất
                  </button>
                  <button
                    type="button"
                    aria-pressed={sort === "top"}
                    onClick={() => setSort("top")}
                    className={`rounded-md px-2.5 py-1.5 transition-colors ${sort === "top" ? "bg-white/10 text-white" : "text-white/45 hover:text-white/80"}`}
                  >
                    Nổi bật
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-8 p-4 bg-[#1a1a24] border border-white/10 rounded-xl">
                <IconLogIn className="w-5 h-5 text-text-muted shrink-0" />
                <p className="text-sm text-text-muted">Đăng nhập để bình luận về phim này.</p>
              </div>

              {comments.length > 0 && (
                <div className="divide-y divide-white/5">
                  {visible.map((c) => (
                    <CommentItem key={c.id} c={c} />
                  ))}
                </div>
              )}

              {comments.length > 0 && (
                <div className="flex justify-center gap-3 mt-4">
                  <button
                    disabled={allShown}
                    onClick={() => setShowMore(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-white/70 hover:text-white transition-all disabled:opacity-50"
                  >
                    <IcChevronDown className="w-4 h-4" />
                    Xem thêm bình luận
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Đề xuất ── */}
          <aside className="xl:w-[320px] shrink-0 xl:border-l xl:border-white/5 xl:pl-8">
            <div className="px-4 xl:px-0">
              <h3 className="text-xl font-bold text-white mb-6">Đề xuất cho bạn</h3>
              <div className="flex flex-col gap-4">
                {suggestions.map((s) => (
                  <a key={s.slug} href={withBasePath(`/phim/${s.slug}`)} className="flex gap-3 rounded overflow-hidden bg-[#1A1A24] group">
                    <div className="relative w-[56px] sm:w-[64px] shrink-0 aspect-[2/3] bg-[#10121b]">
                      <img alt={s.title} loading="lazy" decoding="async" className="object-cover" style={fillStyle} src={s.poster} />
                    </div>
                    <div className="flex flex-col justify-center gap-1.5 py-2 pr-3 min-w-0">
                      <h4 className="text-[13px] sm:text-[14px] font-medium text-white/90 leading-snug line-clamp-2 group-hover:text-yellow-400 transition-colors">{s.title}</h4>
                      <p className="text-[11px] sm:text-[12px] text-white/50 truncate">{s.origin}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] sm:text-[11px] text-white/40">{s.status.includes("Tập") ? "Phần 1" : "Phim Lẻ"}</span>
                        <div className="w-[3px] h-[3px] rounded-full bg-white/20" />
                        <span className="text-[10px] sm:text-[11px] text-white/40 truncate">{s.status}</span>
                      </div>
                    </div>
                  </a>
                ))}
                {suggestions.length === 0 && <p className="text-sm text-white/50">Chưa có phim đề xuất.</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
