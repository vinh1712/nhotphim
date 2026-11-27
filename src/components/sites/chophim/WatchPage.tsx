"use client";

import { withBasePath } from "@/lib/base-path";
import { detailHref } from "@/lib/live-data";
import { PartSelector } from "./PartSelector";
import { getProgress, isInList, removeProgress, saveProgress, toggleList } from "@/lib/user-library";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hls, {
  type LoaderCallbacks,
  type LoaderConfiguration,
  type LoaderContext,
  type LoaderResponse,
  type LoaderStats,
} from "hls.js";
import { loadKkAdRanges, stripConvertAds, stripKkAds, type AdRange } from "./kk-ads";
import { fillStyle } from "./types";
import { CommentsSection } from "./DetailPage";
import { IconLanguages } from "./icons";
import type { DetailComment, MovieDetail } from "./detail-types";
import {
  enc,
  nearestPlayableIndex,
  nextPlayableIndex,
  playableCount,
  playableEpisodes,
  serverEpisodeProgress,
} from "./detail-types";

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
const IcVolumeX = ({ className }: { className?: string }) => (
  <I className={className}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M22 9l-6 6" />
    <path d="M16 9l6 6" />
  </I>
);
const IcMaximize = ({ className }: { className?: string }) => (
  <I
    className={className}
    d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
  />
);
const IcPip = ({ className }: { className?: string }) => (
  <I className={className}>
    <path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4" />
    <rect width="10" height="7" x="12" y="13" rx="2" />
  </I>
);
const IcLock = ({ className }: { className?: string }) => (
  <I className={className}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </I>
);
const IcLockOpen = ({ className }: { className?: string }) => (
  <I className={className}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </I>
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
const IcTelegram = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"
    />
  </svg>
);

/* ── popover Cài đặt (giống chophim.fit) ────────────────────────────────── */

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function MenuRow({ label, value, onClick, chevron = true }: { label: string; value: string; onClick: () => void; chevron?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-between gap-3 px-3.5 text-left transition-colors hover:bg-white/[0.06] focus:bg-white/[0.06] focus:outline-none"
    >
      <span className="truncate text-[13px] text-white/90">{label}</span>
      <span className="flex shrink-0 items-center gap-1 text-[12px] text-white/50">
        <span className="max-w-[9rem] truncate">{value}</span>
        {chevron && <IcChevronRight className="w-3.5 h-3.5" />}
      </span>
    </button>
  );
}

function MenuOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[12px] transition-colors focus:outline-none ${
        selected ? "bg-white/[0.08] text-[#FFD166]" : "text-white/75 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      <span className="truncate">{label}</span>
      {selected && <IcCheck className="w-3.5 h-3.5 shrink-0" />}
    </button>
  );
}

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

type HlsLoaderCtor = new (config: unknown) => {
  load(ctx: LoaderContext, cfg: LoaderConfiguration, cb: LoaderCallbacks<LoaderContext>): void;
  destroy(): void;
  abort(): void;
  context: LoaderContext | null;
  stats: LoaderStats;
};

// Cắt hẳn các dòng quảng cáo khỏi playlist trước khi hls.js đọc — giống
// chế độ desktop của chophim.wtf, QC không bao giờ được tải về.
function makeAdFreeLoader(): HlsLoaderCtor {
  const Base = Hls.DefaultConfig.loader as unknown as HlsLoaderCtor;
  return class AdFreeLoader extends Base {
    load(ctx: LoaderContext, cfg: LoaderConfiguration, cb: LoaderCallbacks<LoaderContext>) {
      const success = cb.onSuccess;
      cb.onSuccess = (
        response: LoaderResponse,
        stats: LoaderStats,
        context: LoaderContext,
        networkDetails
      ) => {
        if (
          ((ctx.type as string) === "manifest" || (ctx.type as string) === "level") &&
          typeof response.data === "string"
        ) {
          // KK (Máy chủ 2): block /vN/ đã có stripKkAds xử lý; chỉ bổ sung
          // cắt block convertvN/ (chữ bet ở ~02:57) mà hàm cũ không bắt được.
          const kkClean = stripKkAds(response.data);
          const stripped = kkClean ?? response.data;
          response.data = stripConvertAds(stripped) ?? stripped;
        }
        success(response, stats, context, networkDetails);
      };
      super.load(ctx, cfg, cb);
    }
  };
}

function preferredServer(movie: MovieDetail): number {
  // Nguồn mặc định của chophim.wtf là kênh chính (link m3u8 trực tiếp).
  const hls = movie.servers.findIndex((s) => s.episodes.some((e) => isHlsUrl(e.url)));
  if (hls >= 0) return hls;
  const playable = movie.servers.findIndex((s) => s.episodes.some((e) => !!e.url));
  return playable >= 0 ? playable : 0;
}

/** still lưu theo số tập ("1" / "01" đều được) */
function stillFor(stills: Record<string, string> | null, label: string): string | null {
  if (!stills) return null;
  const digits = label.match(/\d+/)?.[0];
  if (!digits) return null;
  return stills[digits] || stills[String(Number(digits))] || null;
}

type ServerChannel = {
  /** chỉ số trong movie.servers (giữ nguyên cho hash/tiến trình) */
  idx: number;
  name: string;
  kind: "vs" | "dub" | "other";
  count: number;
};
type ServerHost = { key: string; name: string; channels: ServerChannel[] };

/**
 * chophim.fit chia làm 2 cấp: "Chọn Server" là nhóm máy chủ (OP/NC…),
 * còn chip bên trong danh sách tập là kênh/phên bản (Vietsub / Thuyết minh).
 * Nhóm 6 link của mình theo nguồn NC → KK → VP cho khớp SV1/SV2/SV3.
 */
function serverHosts(movie: MovieDetail): ServerHost[] {
  const order = ["NC", "KK", "VP"];
  const hosts: ServerHost[] = [];
  movie.servers.forEach((s, idx) => {
    const tag = (s.name.match(/\((NC|KK|VP)\)\s*$/i)?.[1] || "NC").toUpperCase();
    let host = hosts.find((h) => h.key === tag);
    if (!host) {
      host = { key: tag, name: "", channels: [] };
      hosts.push(host);
    }
    const kind: ServerChannel["kind"] = /thuy[eế]t|lồng|long/i.test(s.name)
      ? "dub"
      : /vietsub/i.test(s.name)
        ? "vs"
        : "other";
    host.channels.push({
      idx,
      name: kind === "dub" ? "Thuyết minh" : kind === "vs" ? "Vietsub" : s.name,
      kind,
      count: playableCount(s),
    });
  });
  hosts.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  hosts.forEach((h) => {
    h.name = `Máy chủ ${order.indexOf(h.key) + 1} (${h.key})`;
    h.channels.sort((a, b) => (a.kind === "dub" ? 1 : 0) - (b.kind === "dub" ? 1 : 0));
  });
  return hosts;
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
  const [hideImg, setHideImg] = useState(true);
  const [ambient, setAmbient] = useState(false);
  const [notice, setNotice] = useState("");
  const [descOpen, setDescOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(1);
  const [muted, setMuted] = useState(false);
  const [menu, setMenu] = useState<null | "settings" | "servers">(null);
  const [sub, setSub] = useState<null | "quality" | "speed" | "aspect" | "ambient" | "subs">(null);
  const [speed, setSpeed] = useState(1);
  const [fit, setFit] = useState<"contain" | "cover">("contain");
  const [qualityIdx, setQualityIdx] = useState(-1);
  const [levels, setLevels] = useState<{ idx: number; label: string }[]>([]);
  const [locked, setLocked] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [subLabels, setSubLabels] = useState<string[]>([]);
  const [subTrack, setSubTrack] = useState<number | null>(null);
  const [pings, setPings] = useState<Record<number, { ms: number | null; label: string }>>({});
  const [helpOpen, setHelpOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pendingTimeRef = useRef(0);
  const lastSeekTargetRef = useRef(0);
  const pendingAttemptsRef = useRef(0);
  const pendingStartedRef = useRef(0);
  const fallbackDurationRef = useRef(0);
  const lastTouchSeekRef = useRef(0);
  const lastSavedRef = useRef(0);
  /** Mốc phát thật gần nhất, dùng khi rời trang mà <video> đã bị gỡ. */
  const lastTimeRef = useRef(0);
  const adRangesRef = useRef<AdRange[]>([]);
  const nativeHlsRef = useRef(false);
  const hlsRef = useRef<Hls | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  /** Hiện thanh điều khiển rồi tự ẩn sau ~2.8s chuột đứng yên.
   *  Một số browser (Coc Coc) phát liên tục mousemove dù chuột không nhúc nhích;
   *  nên chỉ tính là "động tác" khi tọa độ đổi thực sự (> 3px). */
  const bumpIdle = useCallback((e?: { clientX?: number; clientY?: number }) => {
    if (e && typeof e.clientX === "number" && typeof e.clientY === "number") {
      const last = lastPointerRef.current;
      if (last && Math.abs(last.x - e.clientX) < 3 && Math.abs(last.y - e.clientY) < 3) return;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    }
    setHover((prev) => (prev ? prev : true));
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      setHover(false);
      lastPointerRef.current = null;
    }, 2800);
  }, []);

  const restIdle = useCallback(() => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = null;
    lastPointerRef.current = null;
    setHover(false);
  }, []);

  useEffect(
    () => () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    },
    []
  );

  const hosts = useMemo(() => serverHosts(movie), [movie]);
  const sIdx = Math.min(serverIdx, Math.max(movie.servers.length - 1, 0));
  const activeHostIdx = Math.max(0, hosts.findIndex((h) => h.channels.some((c) => c.idx === sIdx)));
  const channels = hosts[activeHostIdx]?.channels ?? [];
  const server = movie.servers[sIdx];
  const hasStills = !!movie.episodeStills && Object.keys(movie.episodeStills).length > 0;
  const showThumb = hasStills && !hideImg;
  // Không cho phép đứng ở dòng tập trống của server khác (vd KK có 6 dòng nhưng chỉ 2 link).
  const eIdx = server ? nearestPlayableIndex(server, epIdx) : 0;
  const episode = server?.episodes[eIdx] ?? null;
  const url = episode?.url ?? null;
  const hls = isHlsUrl(url);
  const isEmbed = !!url && !hls;
  const firstPlayable = server?.episodes.findIndex((e) => !!e.url) ?? -1;

  // Đổi nguồn/tập thì <video> cũ bị thay bằng phần tử mới (mặc định có tiếng).
  // Reset audio state NGAY TRONG render để phần tử mới luôn mount với muted=false,
  // không phụ thuộc vào thứ tự chạy effect/ref (Coc Coc hay để state cũ sót lại).
  const audioKeyRef = useRef("");
  const audioKey = `${sIdx}:${eIdx}:${url ?? ""}`;
  if (audioKeyRef.current !== audioKey) {
    audioKeyRef.current = audioKey;
    setMuted(false);
    setVol(1);
  }

  // intro_end lấy từ /api/skip-times của chophim. Với desktop QC bị cắt khỏi
  // playlist; với Safari/iOS (native HLS) phát link gốc rồi tự tua qua QC.
  // Chỉ dùng mốc intro khi API của phim cung cấp — không tự giả định 90 giây.
  const introEnd =
    typeof movie.introEnd === "number" && Number.isFinite(movie.introEnd) ? movie.introEnd : null;
  const hasIntro = introEnd !== null;

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
    let hashEpisode: number | null = null;
    let hashServer: number | null = null;
    let explicitTime = 0;
    let fallbackDuration = 0;
    if (raw) {
      const p = new URLSearchParams(raw);
      const sid = p.get("server_id");
      const svName = p.get("sv");
      if (sid && /^\d+$/.test(sid) && movie.servers[Number(sid)]) {
        si = Number(sid);
        hashServer = si;
      } else if (svName) {
        const i = movie.servers.findIndex((s) => s.name === svName);
        if (i >= 0) {
          si = i;
          hashServer = i;
        }
      }
      const tapValue = p.get("tap") || "";
      const tap = tapValue.match(/^tap-(\d+)$/);
      if (tap) {
        hashEpisode = Number(tap[1]) - 1;
        ei = hashEpisode;
      } else if (/^full$/i.test(tapValue)) {
        // Link dạng /xem/slug#tap=full (chophim dùng cho phim lẻ).
        const fullIdx = movie.servers[si]?.episodes.findIndex((ep) => /full/i.test(ep.label)) ?? -1;
        hashEpisode = fullIdx >= 0 ? fullIdx : 0;
        ei = hashEpisode;
      }
      const t = Number(p.get("t") ?? "");
      if (Number.isFinite(t) && t > 0) explicitTime = t;
      // ContinueWatching gửi kèm tổng thời lượng để Safari 15.5 còn dùng được
      // thanh tua lúc native HLS chưa kịp trả duration (0 hoặc Infinity).
      const d = Number(p.get("d") ?? "");
      if (Number.isFinite(d) && d > 0) fallbackDuration = d;
    }

    if (explicitTime > 0) {
      // Link "Xem tiếp" có thể được render trước khi mốc mới kịp lưu. Bản trong
      // localStorage là bản cuối cùng, nên thắng hash khi hai bên lệch nhau.
      resumeTime =
        saved && saved.time > 0 && saved.time > explicitTime + 2 ? saved.time : explicitTime;
    } else if (
      saved &&
      (hashEpisode === null || hashEpisode === saved.episode) &&
      (hashServer === null || hashServer === saved.server)
    ) {
      // Cùng phim/cùng tập/cùng server -> tiếp tục đúng mốc đã xem (chophim làm vậy).
      resumeTime = saved.time;
    } else {
      // Chọn tập mới hoặc server khác thì bắt đầu từ đầu.
      resumeTime = 0;
    }

    if (
      fallbackDuration <= 0 &&
      saved &&
      (hashEpisode === null || hashEpisode === saved.episode) &&
      (hashServer === null || hashServer === saved.server) &&
      Number.isFinite(saved.duration) &&
      saved.duration > 0
    ) {
      // Không chỉ dùng cho link có #t=: iOS 15.5 native HLS cũng có lúc báo
      // duration sai ngay sau khi mở phim, cần mốc tổng thời lượng đã lưu.
      fallbackDuration = saved.duration;
    }
    fallbackDurationRef.current = fallbackDuration;
    setDur(fallbackDuration);
    lastSeekTargetRef.current = 0;
    pendingAttemptsRef.current = 0;
    pendingStartedRef.current = Date.now();

    ei = nearestPlayableIndex(movie.servers[si], ei);
    setServerIdx(si);
    setEpIdx(ei);
    pendingTimeRef.current = Number.isFinite(resumeTime) && resumeTime > 0 ? resumeTime : 0;
    lastTimeRef.current = pendingTimeRef.current;
    lastSavedRef.current = pendingTimeRef.current;
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
      // Bấm lại đúng tập/server đang xem không được reload player.
      if (si === sIdx && ei === eIdx) return;
      setServerIdx(si);
      setEpIdx(ei);
      setStarted(false);
      setPlaying(false);
      setLocked(false);
      setCur(0);
      setDur(0);
      pendingTimeRef.current = 0;
      lastSeekTargetRef.current = 0;
      pendingAttemptsRef.current = 0;
      pendingStartedRef.current = 0;
      fallbackDurationRef.current = 0;
      writeHash(si, ei);
      document.getElementById("watch-player")?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [eIdx, sIdx, writeHash]
  );

  const changeServer = useCallback(
    (si: number) => {
      const ei = nearestPlayableIndex(movie.servers[si], epIdx);
      selectEp(si, ei);
    },
    [epIdx, movie, selectEp]
  );

  /** Chọn máy chủ (nhóm nguồn): giữ nguyên phên bản Vietsub/Thuyết minh nếu có. */
  const changeHost = useCallback(
    (hi: number) => {
      const host = hosts[hi];
      if (!host) return;
      const current = host.channels.find((c) => c.idx === sIdx);
      const next = current || host.channels.find((c) => c.kind === "vs") || host.channels[0];
      if (next) changeServer(next.idx);
    },
    [changeServer, hosts, sIdx]
  );

  /** iOS Safari native HLS có lúc báo duration = 0/Infinity. Ưu tiên duration
   *  thật, không thì dùng tổng thời lượng gửi từ Xem tiếp / đã lưu. Không dùng
   *  seekable.end làm tổng thời lượng vì lúc mới buffer nó rất nhỏ, sẽ làm tua
   *  nhầm về đầu rồi xóa mốc resume. */
  const getPlayableDuration = useCallback((v: HTMLVideoElement | null) => {
    if (!v) return 0;
    const fallback = fallbackDurationRef.current;
    if (Number.isFinite(v.duration) && v.duration > 0) {
      // Native HLS trên iOS 15.5 có lúc báo duration = đoạn đã buffer trước khi
      // đọc xong manifest. Tổng thời lượng từ "Xem tiếp" đáng tin hơn trong
      // lúc này để không tua/ghi tiến trình nhầm về đầu phim.
      if (nativeHlsRef.current && fallback > v.duration) return fallback;
      return v.duration;
    }
    return fallback;
  }, []);

  /** Thử áp mốc "Xem tiếp" ở mọi sự kiện media có thể có metadata mới.
   *  Chỉ xóa pending khi currentTime đã tới gần mốc đó — nếu Safari từ chối
   *  seek lúc chưa buffer thì sự kiện sau vẫn thử lại. */
  const applyPendingTime = useCallback(() => {
    const v = videoRef.current;
    if (!v || pendingTimeRef.current <= 0) return;
    // Không thử vô hạn nếu browser không bao giờ seek được (mạng quá chậm).
    if (
      pendingAttemptsRef.current >= 120 ||
      (pendingStartedRef.current > 0 && Date.now() - pendingStartedRef.current > 30000)
    ) {
      pendingTimeRef.current = 0;
      return;
    }
    pendingAttemptsRef.current += 1;

    // iOS Safari drop lệnh seek khi video còn đang pause và chưa có frame
    // (readyState < HAVE_CURRENT_DATA): currentTime báo đúng mốc đã xin nhưng
    // phim vẫn phát từ đầu, seeking kẹt và các lần tua sau cũng bị bỏ qua.
    // Giữ mốc lại, chỉ áp ở onPlay hoặc onLoadedData (khi đã có frame).
    if (nativeHlsRef.current && v.paused && v.readyState < 2) return;

    let target = pendingTimeRef.current;
    // iOS 15.5 native HLS có lúc trả duration = đoạn đã buffer (rất nhỏ) rồi
    // mới đúng sau vài giây. Nếu clamp theo duration đó thì "Xem tiếp" bị kẹt
    // về đầu phim. Khi có tổng thời lượng gửi từ hash/saved thì tin nó trước.
    const seekLimit = Math.max(getPlayableDuration(v), fallbackDurationRef.current);
    if (seekLimit > 0) target = Math.min(target, Math.max(0, seekLimit - 1));
    if (target <= 0) return;
    // Đã ở đúng mốc thì không gán currentTime lặp lại làm giật phát lại.
    // Với native HLS vẫn giữ pending để đợi sự kiện `seeked` xác nhận thật.
    if (Math.abs(v.currentTime - target) < 1) {
      if (!nativeHlsRef.current) pendingTimeRef.current = 0;
      return;
    }
    lastSeekTargetRef.current = target;
    try {
      v.currentTime = target;
      setCur(target);
    } catch {
      // Safari có thể chưa cho seek — giữ pending cho lần thử sau.
    }
  }, [getPlayableDuration]);

  /** Chỉ xóa mốc khi Safari/HLS bắn `seeked` — `currentTime` có thể đổi ngay
   *  dù video chưa thật sự tua tới đó, nhất là native HLS trên iOS. */
  const confirmPendingTime = useCallback(() => {
    const v = videoRef.current;
    if (!v || pendingTimeRef.current <= 0) return;
    const target = lastSeekTargetRef.current;
    if (target > 0 && v.currentTime >= target - 2) pendingTimeRef.current = 0;
  }, []);

  useEffect(() => {
    const load = () => {
      setFav(isInList("favorites", movie.slug));
      setAdded(isInList("watchlist", movie.slug));
    };
    load();
    window.addEventListener("storage", load);
    window.addEventListener("nhotphim:library-change", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("nhotphim:library-change", load);
    };
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

  const songServerIdx = movie.servers.findIndex((s) => /song|song ngữ|việt-anh|bilingual/i.test(s.name));
  const switchToSong = () => {
    if (songServerIdx < 0) {
      setNotice("Phim này chưa có máy chủ Song Ngữ.");
      scrollToServers();
      return;
    }
    if (songServerIdx === sIdx) {
      setNotice("Đang dùng bản Song Ngữ.");
      scrollToServers();
      return;
    }
    changeServer(songServerIdx);
    setNotice("Đã chuyển sang bản Song Ngữ.");
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
      // Ghi ngay vào ref để flush lúc đóng tab không đọc lại mốc cũ nếu <video>
      // đã bị gỡ trước khi sự kiện pagehide/visibilitychange chạy.
      lastSavedRef.current = time;
      lastTimeRef.current = time;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dur, eIdx, movie, sIdx, server?.name]
  );

  /** Tua theo vị trí chạm/click trên thanh thời gian. Ghi luôn tiến trình để
   *  đổi tập/tắt tab ngay sau khi tua vẫn giữ đúng mốc. Khi kéo (commit=false)
   *  chỉ tua thật, không ghi — ghi một lần lúc thả chuột. */
  const seekToClientX = useCallback(
    (clientX: number, rect: DOMRect, commit = true) => {
      const v = videoRef.current;
      const total = getPlayableDuration(v);
      if (!v || total <= 0 || rect.width <= 0) return;
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const next = ratio * total;
      v.currentTime = next;
      setCur(next);
      // Khi tua bằng tay thì mốc "Xem tiếp" cũ không còn ý nghĩa nữa.
      pendingTimeRef.current = 0;
      if (commit) persist(next, total);
    },
    [getPlayableDuration, persist]
  );

  // Lưu mốc hiện tại khi rời trang / ẩn tab / đổi tập (iOS dùng pagehide).
  // Gọi cả lúc tab hiện lại: vài browser không bắn visibilitychange lúc ẩn,
  // hoặc khôi phục từ bfcache mà chỉ có pageshow.
  useEffect(() => {
    const flush = () => {
      const pending = pendingTimeRef.current;
      const v = videoRef.current;
      let time = lastTimeRef.current;
      let total = dur;
      if (v && Number.isFinite(v.currentTime)) {
        // Đang chờ "Xem tiếp" áp mốc thì currentTime có thể là vị trí tạm/sai.
        // Chỉ bỏ qua khi video vẫn đứng trước mốc đó; nếu đã tua tới/xem quá
        // mốc thì currentTime là mốc thật và phải ghi dù pending chưa kịp xóa.
        if (pending > 0 && v.currentTime < pending - 2) return;
        time = v.currentTime;
        total = getPlayableDuration(v) || dur;
      }
      if (Number.isFinite(time) && time >= 1) persist(time, total);
    };
    const onVisibility = () => flush();
    const onPageShow = () => flush();
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [dur, getPlayableDuration, persist]);

  /* ── HLS cho link .m3u8 ──
   * Desktop: hls.js cắt hẳn dòng QC khỏi playlist trước khi parse.
   * Safari/iOS: không có MediaSource nên phát native HLS từ link gốc; QC sẽ
   * bị tự tua qua ở skipNativeAds() bên dưới. blob: playlist không dùng được
   * ở đây nên tuyệt đối không gán blob URL cho <video>.
   */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !url || !hls) {
      adRangesRef.current = [];
      nativeHlsRef.current = false;
      hlsRef.current = null;
      setLevels((prev) => (prev.length ? [] : prev));
      v?.removeAttribute("src");
      return;
    }

    if (Hls.isSupported()) {
      adRangesRef.current = [];
      nativeHlsRef.current = false;
      // hls.js có cấu hình startPosition riêng — dùng nó thay vì chỉ gán
      // currentTime, vì hls.js có thể ghi đè currentTime lúc manifest vừa xong.
      const startPosition =
        pendingTimeRef.current > 0
          ? Math.min(
              pendingTimeRef.current,
              fallbackDurationRef.current > 0 ? Math.max(0, fallbackDurationRef.current - 1) : pendingTimeRef.current
            )
          : -1;
      const inst = new Hls({ loader: makeAdFreeLoader(), startPosition });
      inst.loadSource(url);
      inst.attachMedia(v);
      // Ép DOM theo state đã reset ở render: nguồn mới luôn có tiếng, kể cả
      // khi browser cũ giữ lại thuộc tính muted của phần tử video cũ.
      v.muted = false;
      v.volume = 1;
      hlsRef.current = inst;
      // Level chỉ có sau khi manifest được parse — nghe MANIFEST_PARSED.
      const applyLevels = (list: { bitrate?: number; height?: number }[]) =>
        setLevels(
          list
            .map((lv, i) => ({ idx: i, bitrate: lv.bitrate || 0, h: lv.height || 0 }))
            .sort((a, b) => b.bitrate - a.bitrate)
            .map((lv, i) => ({ idx: lv.idx, label: `Luồng ${i + 1}${lv.h ? ` (${lv.h}p)` : ""}` }))
        );
      inst.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        applyLevels(data.levels);
        applyPendingTime();
      });
      if (inst.levels.length) applyLevels(inst.levels);
      return () => {
        inst.destroy();
        hlsRef.current = null;
        setLevels((prev) => (prev.length ? [] : prev));
      };
    }

    const controller = new AbortController();
    adRangesRef.current = [];
    nativeHlsRef.current = true;
    hlsRef.current = null;
    setLevels((prev) => (prev.length ? [] : prev));
    v.src = url;
    v.muted = false;
    v.volume = 1;
    void loadKkAdRanges(url, controller.signal)
      .then((ranges) => {
        if (!controller.signal.aborted) adRangesRef.current = ranges;
      })
      .catch(() => {
        // Host chặn CORS thì vẫn phát phim, chỉ là không tua được đoạn QC.
        adRangesRef.current = [];
      });
    return () => {
      controller.abort();
      adRangesRef.current = [];
      nativeHlsRef.current = false;
      v.removeAttribute("src");
    };
  }, [url, hls, applyPendingTime]);

  // Giữ volume của DOM khớp state (React type không có prop `volume` cho <video>).
  useEffect(() => {
    const v = videoRef.current;
    if (v && v.volume !== vol) v.volume = vol;
  }, [vol]);

  // Đổi nguồn HLS <-> iframe làm <video> bị tạo lại: đồng bộ nút mute/thanh âm
  // lượng với phần tử mới, nếu không nút hiện "đã tắt" nhưng video mới vẫn có tiếng.
  useEffect(() => {
    const v = videoRef.current;
    setMuted(v ? v.muted : false);
    setVol(v ? v.volume : 1);
  }, [url, hls]);

  // Áp tốc độ phát đã chọn trong popover Cài đặt.
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = speed;
  }, [speed, url]);

  // Áp chất lượng (hls.currentLevel; -1 = Auto).
  useEffect(() => {
    const h = hlsRef.current;
    if (h) h.currentLevel = qualityIdx;
  }, [qualityIdx, url]);

  // iPhone mở fullscreen native qua webkitEnterFullscreen(): cần controls=true
  // và ẩn lớp điều khiển tự vẽ trong lúc native player chiếm màn hình.
  useEffect(() => {
    const v = videoRef.current as (HTMLVideoElement & {
      webkitbeginfullscreen?: unknown;
      webkitendfullscreen?: unknown;
    }) | null;
    if (!v) return;
    const onBegin = () => setNativeFullscreen(true);
    const onEnd = () => {
      setNativeFullscreen(false);
      v.controls = false;
    };
    v.addEventListener("webkitbeginfullscreen", onBegin);
    v.addEventListener("webkitendfullscreen", onEnd);
    return () => {
      v.removeEventListener("webkitbeginfullscreen", onBegin);
      v.removeEventListener("webkitendfullscreen", onEnd);
      v.controls = false;
    };
  }, [url, hls]);

  /* ── điều khiển video ── */
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }, []);
  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    const total = getPlayableDuration(v);
    v.currentTime = Math.max(0, Math.min(total > 0 ? total : v.currentTime + delta, v.currentTime + delta));
  }, [getPlayableDuration]);
  const adjustVolume = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    const next = Math.min(1, Math.max(0, (v.muted ? 0 : v.volume) + delta));
    v.volume = next;
    if (next > 0 && v.muted) v.muted = false;
  }, []);
  const nextEpisode = useCallback(() => {
    // Tự sang tập kế tiếp có link thật; bỏ qua các dòng trống của server này.
    const next = nextPlayableIndex(server, eIdx);
    if (next >= 0) selectEp(sIdx, next);
  }, [eIdx, selectEp, server, sIdx]);

  const skipIntro = useCallback(() => {
    const v = videoRef.current;
    if (introEnd === null) return;
    if (!v || !Number.isFinite(v.duration) || v.duration <= introEnd + 30) return;
    v.currentTime = Math.min(introEnd + 0.05, Math.max(0, v.duration - 1));
    setNotice("Đã bỏ qua phần giới thiệu");
  }, [introEnd]);

  // Safari/iOS phát playlist gốc nên timeline vẫn có đoạn QC. Tự tua qua
  // ngay khi chạm vào khoảng QC — không cần nút bấm, không hiện quảng cáo.
  const skipNativeAds = useCallback(() => {
    if (!nativeHlsRef.current) return;
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return;
    const t = v.currentTime;
    const range = adRangesRef.current.find((r) => t >= r.start - 0.12 && t < r.end);
    if (!range) return;
    const target = Math.min(range.end + 0.08, Math.max(0, v.duration - 0.2));
    if (target > t + 0.01) v.currentTime = target;
  }, []);

  useEffect(() => {
    if (!playing || !hls || !nativeHlsRef.current) return;
    let raf = 0;
    const tick = () => {
      skipNativeAds();
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [playing, hls, skipNativeAds]);

  const onEnded = () => {
    setPlaying(false);
    // Tập đã xem xong thì bỏ khỏi "Xem tiếp" dù có tự chuyển tập hay không.
    removeProgress(movie.slug);
    if (autoNext) nextEpisode();
  };

  // Auto skip intro cũng chạy khi bật tính năng lúc video đang phát.
  useEffect(() => {
    if (!autoSkip || !hls || introEnd === null) return;
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= introEnd + 30) return;
    if (v.currentTime > 0 && v.currentTime < introEnd) skipIntro();
  }, [autoSkip, cur, hls, introEnd, skipIntro]);

  const fullscreen = useCallback(() => {
    // iPhone Safari không có HTMLElement.requestFullscreen(); nó chỉ mở fullscreen
    // qua API riêng của <video>. Giữ requestFullscreen cho desktop/iPad, fallback
    // webkitEnterFullscreen cho iPhone/iOS 15.
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => void;
    };
    const v = videoRef.current as (HTMLVideoElement & {
      webkitDisplayingFullscreen?: boolean;
      webkitEnterFullscreen?: () => void;
      webkitExitFullscreen?: () => void;
    }) | null;

    const enterNativeFullscreen = () => {
      if (!v || typeof v.webkitEnterFullscreen !== "function") return;
      // WebKit iOS chỉ cho phép webkitEnterFullscreen khi video có native controls.
      v.controls = true;
      try {
        v.webkitEnterFullscreen();
      } catch {
        v.controls = false;
      }
    };

    if (v?.webkitDisplayingFullscreen) {
      v.webkitExitFullscreen?.();
      v.controls = false;
      return;
    }
    if (doc.fullscreenElement) {
      void doc.exitFullscreen();
      return;
    }
    if (doc.webkitFullscreenElement) {
      doc.webkitExitFullscreen?.();
      return;
    }

    const wrap = wrapRef.current;
    if (wrap && typeof wrap.requestFullscreen === "function") {
      const p = wrap.requestFullscreen();
      if (p && typeof p.catch === "function") {
        p.catch(enterNativeFullscreen);
      }
      return;
    }
    enterNativeFullscreen();
  }, []);

  /** Bàn phím desktop — đúng bảng "Hướng dẫn thao tác" của chophim.fit:
   *  Space = phát/dừng, F = toàn màn hình, ←/→ = tua 10s, ↑/↓ = âm lượng, N = tập kế tiếp. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const k = e.key;
      // Ô nhập luôn được ưu tiên; Escape thì vẫn đóng menu kể cả khi nút đang focus.
      if (
        el?.closest?.("input, textarea, select, [contenteditable='true'], [role='textbox']")
      ) {
        return;
      }
      if (k === "Escape" && menu) {
        setMenu(null);
        setSub(null);
        bumpIdle();
        return;
      }
      // Space/Enter trên nút hoặc link đang focus phải kích hoạt chính nút đó.
      if (
        el?.closest?.("button, a, [role='button'], [role='menuitem'], [tabindex]:not([tabindex='-1'])")
      ) {
        return;
      }
      if (k === " " || k === "Spacebar") {
        e.preventDefault();
        bumpIdle();
        togglePlay();
        return;
      }
      if (k === "ArrowRight") {
        e.preventDefault();
        bumpIdle();
        seekBy(10);
        return;
      }
      if (k === "ArrowLeft") {
        e.preventDefault();
        bumpIdle();
        seekBy(-10);
        return;
      }
      if (k === "ArrowUp") {
        e.preventDefault();
        bumpIdle();
        adjustVolume(0.05);
        return;
      }
      if (k === "ArrowDown") {
        e.preventDefault();
        bumpIdle();
        adjustVolume(-0.05);
        return;
      }
      const low = k.toLowerCase();
      if (low === "f") {
        bumpIdle();
        fullscreen();
        return;
      }
      if (low === "m") {
        bumpIdle();
        const v = videoRef.current;
        if (v) v.muted = !v.muted;
        return;
      }
      if (low === "n") {
        bumpIdle();
        nextEpisode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [adjustVolume, bumpIdle, fullscreen, menu, nextEpisode, seekBy, togglePlay]);

  // Đóng popover Cài đặt / Máy chủ khi bấm ra ngoài.
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && !t.closest("[data-player-menu]")) {
        setMenu(null);
        setSub(null);
        bumpIdle();
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [bumpIdle, menu]);

  // "Hướng dẫn thao tác" là popover có aria-expanded như trang gốc.
  useEffect(() => {
    if (!helpOpen) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && !t.closest("[data-help-panel], [data-help-toggle]")) setHelpOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelpOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [helpOpen]);

  // Đo độ trễ từng máy chủ khi mở popover "Máy chủ": Mượt / Ổn / Chậm + ms (giống chophim).
  useEffect(() => {
    if (menu !== "servers") return;
    let alive = true;
    const results: Record<number, { ms: number | null; label: string }> = {};
    setPings({});
    void Promise.all(
      movie.servers.map(async (s, i) => {
        const target = s.episodes.find((e) => !!e.url)?.url;
        if (!target) {
          results[i] = { ms: null, label: "Chưa có nguồn" };
          return;
        }
        const ctrl = new AbortController();
        const tid = window.setTimeout(() => ctrl.abort(), 4000);
        const t0 = performance.now();
        try {
          await fetch(target, { mode: "no-cors", cache: "no-store", signal: ctrl.signal });
        } catch {
          // Hết hạn hoặc mạng lỗi: vẫn lấy số ms đo được.
        } finally {
          window.clearTimeout(tid);
        }
        const ms = Math.round(performance.now() - t0);
        results[i] = { ms, label: ms < 250 ? "Mượt" : ms < 600 ? "Ổn" : "Chậm" };
      })
    ).then(() => {
      if (alive) setPings(results);
    });
    return () => {
      alive = false;
    };
  }, [menu, movie.servers]);

  /** Picture-in-Picture — nút giống chophim; trình duyệt không hỗ trợ thì báo nhẹ. */
  const togglePiP = useCallback(async () => {
    const v = videoRef.current;
    if (!v || typeof v.requestPictureInPicture !== "function") {
      setNotice("Trình duyệt này không hỗ trợ Picture-in-Picture.");
      return;
    }
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch {
      setNotice("Không mở được Picture-in-Picture.");
    }
  }, []);

  // Shell submenu trong popover Cài đặt: header + nút quay lại (cấu trúc source).
  const submenu = (title: string, body: React.ReactNode) => (
    <>
      <div className="flex items-center gap-1.5 border-b border-white/10 px-2 py-1.5">
        <button
          type="button"
          aria-label="Quay lại cài đặt"
          onClick={() => setSub(null)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none"
        >
          <IcChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[13px] font-semibold text-white">{title}</span>
      </div>
      <div className="max-h-[38vh] overflow-y-auto p-1.5 sm:max-h-[52vh]">{body}</div>
    </>
  );

  const qualityValue = levels.find((l) => l.idx === qualityIdx)?.label ?? "Auto";

  // Popover dùng token motion của skill animate-ui: vào = transition.menu
  // (0.22s, ease.soft), ra = transition.dismiss (0.2s, ease.away) — viết bằng
  // Tailwind transition cho khớp motion sẵn có của player (không thêm package).
  const popBase =
    "absolute bottom-full right-0 z-50 mb-1 origin-bottom-right overflow-hidden rounded-xl border border-white/10 bg-[#1c1c1e]/80 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all motion-reduce:transition-none";
  const popState = (open: boolean) =>
    open
      ? "opacity-100 scale-100 duration-[220ms] [transition-timing-function:cubic-bezier(0.215,0.61,0.355,1)]"
      : "pointer-events-none scale-95 opacity-0 duration-200 [transition-timing-function:cubic-bezier(0.33,0.17,0.67,0.5)]";

  const settingsPopover = (
    <div
      data-player-menu=""
      aria-hidden={menu !== "settings"}
      inert={menu !== "settings"}
      className={`${popBase} w-56 max-w-[calc(100vw-2rem)] sm:w-64 ${popState(menu === "settings")}`}
    >
      {sub === null ? (
        <>
          <div className="border-b border-white/10 px-3.5 py-2.5 text-[13px] font-semibold text-white">Cài đặt</div>
          <div className="max-h-[38vh] overflow-y-auto py-1.5 sm:max-h-[52vh]">
            <MenuRow label="Chất lượng" value={qualityValue} onClick={() => setSub("quality")} />
            <MenuRow label="Tốc độ" value={`${speed}x`} onClick={() => setSub("speed")} />
            <MenuRow
              label="Tỉ lệ màn hình"
              value={fit === "contain" ? "Vừa màn hình" : "Lấp đầy"}
              onClick={() => setSub("aspect")}
            />
            <MenuRow label="Ánh sáng môi trường" value={ambient ? "Bật" : "Tắt"} onClick={() => setSub("ambient")} />
            <MenuRow
              label="Phụ đề"
              value={subLabels.length > 0 ? (subTrack != null ? subLabels[subTrack] : "Tắt") : movie.lang || "Tiếng Việt"}
              chevron={subLabels.length > 0}
              onClick={() => {
                if (subLabels.length > 0) setSub("subs");
                else setNotice("Nguồn này chưa có phụ đề nhúng để chọn.");
              }}
            />
          </div>
        </>
      ) : sub === "quality" ? (
        submenu(
          "Chất lượng",
          <>
            <MenuOption label="Auto" selected={qualityIdx === -1} onClick={() => setQualityIdx(-1)} />
            {levels.map((l) => (
              <MenuOption key={l.idx} label={l.label} selected={qualityIdx === l.idx} onClick={() => setQualityIdx(l.idx)} />
            ))}
            {levels.length === 0 && <p className="px-3 py-2 text-[12px] text-white/45">Nguồn này chỉ có một chất lượng.</p>}
          </>
        )
      ) : sub === "speed" ? (
        submenu(
          "Tốc độ phát",
          SPEEDS.map((s) => <MenuOption key={s} label={`${s}x`} selected={speed === s} onClick={() => setSpeed(s)} />)
        )
      ) : sub === "aspect" ? (
        submenu(
          "Tỉ lệ màn hình",
          <>
            <MenuOption label="Vừa màn hình" selected={fit === "contain"} onClick={() => setFit("contain")} />
            <MenuOption label="Lấp đầy" selected={fit === "cover"} onClick={() => setFit("cover")} />
          </>
        )
      ) : sub === "ambient" ? (
        submenu(
          "Ánh sáng môi trường",
          <>
            <MenuOption label="Tắt" selected={!ambient} onClick={() => setAmbient(false)} />
            <MenuOption label="Bật" selected={ambient} onClick={() => setAmbient(true)} />
          </>
        )
      ) : (
        submenu(
          "Phụ đề",
          <>
            <MenuOption
              label="Tắt"
              selected={subTrack === null}
              onClick={() => {
                const tracks = videoRef.current?.textTracks;
                if (tracks) for (let i = 0; i < tracks.length; i++) tracks[i].mode = "disabled";
                setSubTrack(null);
              }}
            />
            {subLabels.map((lbl, i) => (
              <MenuOption
                key={`${lbl}-${i}`}
                label={lbl}
                selected={subTrack === i}
                onClick={() => {
                  const tracks = videoRef.current?.textTracks;
                  if (tracks) for (let t = 0; t < tracks.length; t++) tracks[t].mode = t === i ? "showing" : "disabled";
                  setSubTrack(i);
                }}
              />
            ))}
          </>
        )
      )}
    </div>
  );

  const pingPill = (p: { ms: number | null; label: string } | undefined) => {
    if (!p) return <span className="shrink-0 rounded bg-white/5 px-1.5 py-1 text-[10px] font-bold text-white/40">Đo...</span>;
    const tone =
      p.label === "Mượt"
        ? "bg-[#4ade80]/10 text-[#4ade80]"
        : p.label === "Ổn"
          ? "bg-[#FFD166]/10 text-[#FFD166]"
          : p.label === "Chậm"
            ? "bg-[#f87171]/10 text-[#f87171]"
            : "bg-white/5 text-white/40";
    return (
      <span className={`shrink-0 rounded px-1.5 py-1 text-[10px] font-bold ${tone}`}>
        {p.label}
        {p.ms != null ? ` ${p.ms} ms` : ""}
      </span>
    );
  };

  const serverPopover = (
    <div
      data-player-menu=""
      aria-hidden={menu !== "servers"}
      inert={menu !== "servers"}
      className={`${popBase} w-[23rem] max-w-[calc(100vw-2rem)] ${popState(menu === "servers")}`}
    >
      <div className="border-b border-white/10 px-3.5 py-2.5 text-[13px] font-semibold text-white">Máy chủ</div>
      <div className="max-h-[46vh] overflow-y-auto py-1.5">
        {hosts.map((h) => (
          <div key={h.key} className="border-b border-white/5 pb-1 last:border-b-0">
            <div className="px-3.5 pt-2 text-[10px] font-bold uppercase tracking-wide text-white/40">{h.name}</div>
            {h.channels.map((c) => (
              <button
                key={c.idx}
                type="button"
                onClick={() => {
                  changeServer(c.idx);
                  setMenu(null);
                  setSub(null);
                  bumpIdle();
                }}
                className={`flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left transition-colors focus:outline-none ${
                  c.idx === sIdx ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[13px] font-medium ${c.idx === sIdx ? "text-[#FFD166]" : "text-white/90"}`}>
                    {c.name}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-white/45">{c.count} tập</span>
                </span>
                {pingPill(pings[c.idx])}
              </button>
            ))}
          </div>
        ))}
        {hosts.length === 0 && <p className="px-3.5 py-3 text-[12px] text-white/50">Chưa có máy chủ nào.</p>}
      </div>
    </div>
  );

  // Luôn tự ẩn sau khi hết idle — kể cả đang phát, đang tạm dừng hay fullscreen.
  // Chỉ giữ hiện khi đang kéo thanh tua hoặc đang mở popover.
  const showCtl = !nativeFullscreen && !locked && (hover || scrubbing || menu !== null);
  const { current: curCount, total: totalCount } = serverEpisodeProgress(movie, server);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-4 sm:py-6">
      <div className="relative isolate">
        {/* ── Trình phát ── */}
        <div className="flex flex-col mb-6 -mx-4 overflow-visible transition-all duration-500 sm:mx-0 sm:rounded-xl">
          <div
            id="watch-player"
            ref={wrapRef}
            className={`relative w-full aspect-video transition-shadow duration-[350ms] ${ambient ? "shadow-[0_0_70px_rgba(255,209,102,0.18)]" : ""} ${
              showCtl || locked ? "" : "cursor-none"
            }`}
            onMouseEnter={bumpIdle}
            onMouseMove={bumpIdle}
            onMouseLeave={restIdle}
            onTouchStart={() => bumpIdle()}
          >
            <div className="absolute inset-0 w-full h-full">
              <div className="relative flex h-full w-full items-center justify-center overflow-visible font-sans select-none focus:outline-none" tabIndex={0}>
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[-2] bg-black" />
                <div className="absolute inset-0 overflow-hidden bg-black sm:rounded-l-xl">
                  {url && hls && (
                    <video
                      ref={videoRef}
                      className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
                      playsInline
                      preload="auto"
                      muted={muted}
                      poster={movie.backdrop || movie.poster}
                      onClick={() => {
                        if (!locked) togglePlay();
                      }}
                      onPlay={() => {
                        setPlaying(true);
                        setStarted(true);
                        // iOS: mốc "Xem tiếp" có thể đã bị giữ lại vì lúc đó
                        // video chưa có frame. Áp ngay khi người dùng bấm play.
                        applyPendingTime();
                      }}
                      onPause={(e) => {
                        setPlaying(false);
                        if (pendingTimeRef.current <= 0) {
                          persist(e.currentTarget.currentTime, getPlayableDuration(e.currentTarget) || dur);
                        }
                      }}
                      onTimeUpdate={(e) => {
                        const v = e.currentTarget;
                        if (pendingTimeRef.current > 0) {
                          applyPendingTime();
                          skipNativeAds();
                          setCur(v.currentTime);
                          return;
                        }
                        skipNativeAds();
                        const t = v.currentTime;
                        setCur(t);
                        lastTimeRef.current = t;
                        if (t - lastSavedRef.current >= 5) {
                          lastSavedRef.current = t;
                          persist(t, getPlayableDuration(v) || dur);
                        }
                      }}
                      onSeeking={skipNativeAds}
                      onSeeked={confirmPendingTime}
                      onLoadedMetadata={(e) => {
                        const v = e.currentTarget;
                        const d = getPlayableDuration(v);
                        setDur(d);
                        setMuted(v.muted);
                        setVol(v.volume);
                        v.playbackRate = speed;
                        applyPendingTime();
                        const tracks = Array.from(v.textTracks);
                        setSubLabels(tracks.map((t, i) => t.label || t.language || `Phụ đề ${i + 1}`));
                        const showing = tracks.findIndex((t) => t.mode === "showing");
                        setSubTrack(showing >= 0 ? showing : null);
                        skipNativeAds();
                      }}
                      onLoadedData={applyPendingTime}
                      onCanPlay={applyPendingTime}
                      onDurationChange={(e) => {
                        const d = getPlayableDuration(e.currentTarget);
                        if (d > 0) setDur(d);
                        applyPendingTime();
                      }}
                      onProgress={applyPendingTime}
                      onEnded={() => {
                        persist(dur || 0, dur || 0);
                        onEnded();
                      }}
                      onVolumeChange={(e) => {
                        setVol(e.currentTarget.volume);
                        setMuted(e.currentTarget.muted);
                      }}
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

                {/* khóa màn hình — chỉ có ý nghĩa với video HLS, ẩn hẳn trên sv embed */}
                {url && hls && (
                  <button
                    type="button"
                    aria-label={locked ? "Mở khóa màn hình" : "Khóa màn hình"}
                    aria-pressed={locked}
                    title={locked ? "Mở khóa màn hình" : "Khóa màn hình"}
                    onClick={() => setLocked((v) => !v)}
                    className={`absolute left-2 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white/85 shadow-sm backdrop-blur-sm transition-all duration-200 hover:text-white focus:outline-none motion-reduce:transition-none ${
                      showCtl || locked ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                  >
                    {locked ? <IcLock className="w-5 h-5" /> : <IcLockOpen className="w-5 h-5" />}
                  </button>
                )}

                {/* thanh tiêu đề (hiện khi rê chuột) */}
                <div
                  className={`absolute top-0 left-0 right-0 p-3 sm:p-6 transition-opacity duration-500 z-10 flex items-start justify-between ${
                    showCtl ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  <h2 className="text-white font-medium text-sm sm:text-lg lg:text-xl drop-shadow-md truncate tracking-wide flex-1 mr-4">
                    {movie.title}
                    {playableCount(server) > 1 ? ` - ${episode?.label}` : ""}
                  </h2>
                  <div className="pointer-events-auto flex shrink-0 flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDrawer(true)}
                      aria-label="Danh sách tập"
                      className="flex flex-row items-center gap-1.5 p-1 text-xs font-medium text-white/90 transition-colors hover:text-[#eab308] sm:text-[15px]"
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
                      {playableEpisodes(server).map(({ index: i, episode: ep }) => {
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
                            {/* Ngăn kéo nổi trên player luôn có ảnh tập (giống chophim), không bị Ẩn ảnh của lưới bên dưới ảnh hưởng. */}
                            <div
                              className={`relative w-[90px] sm:w-[100px] aspect-[16/9] rounded shrink-0 overflow-hidden bg-black/50 bg-cover bg-center ${
                                active ? "ring-2 ring-[#eab308] ring-offset-[2px] ring-offset-[#1f2025]" : ""
                              }`}
                              style={{ backgroundImage: `url("${stillFor(movie.episodeStills, ep.label) || movie.backdrop || movie.poster}")` }}
                              aria-label={ep.label}
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${active ? "text-[#eab308]" : "text-white/90"}`}>{ep.label}</p>
                            </div>
                          </button>
                        );
                      })}
                      {playableCount(server) === 0 && (
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
                          style={{ touchAction: "none" }}
                          onClick={(e) => {
                            // Safari 15.5 có thể phát click giả sau touch với clientX = 0;
                            // bỏ qua để không tua nhầm về đầu phim.
                            if (Date.now() - lastTouchSeekRef.current < 800) return;
                            seekToClientX(e.clientX, e.currentTarget.getBoundingClientRect());
                          }}
                          onPointerDown={(e) => {
                            if (e.pointerType === "touch") return; // dùng touch handler bên dưới
                            try {
                              e.currentTarget.setPointerCapture(e.pointerId);
                            } catch {
                              // pointer không capture được vẫn kéo bình thường
                            }
                            setScrubbing(true);
                            seekToClientX(e.clientX, e.currentTarget.getBoundingClientRect());
                          }}
                          onPointerMove={(e) => {
                            if (e.pointerType === "touch" || !scrubbing) return;
                            seekToClientX(e.clientX, e.currentTarget.getBoundingClientRect(), false);
                          }}
                          onPointerUp={(e) => {
                            if (e.pointerType === "touch") return;
                            setScrubbing(false);
                            seekToClientX(e.clientX, e.currentTarget.getBoundingClientRect());
                            try {
                              if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
                            } catch {
                              // đã tự giải phóng
                            }
                          }}
                          onPointerCancel={() => setScrubbing(false)}
                          onTouchStart={(e) => {
                            const touch = e.touches[0];
                            if (!touch) return;
                            lastTouchSeekRef.current = Date.now();
                            setScrubbing(true);
                            seekToClientX(touch.clientX, e.currentTarget.getBoundingClientRect());
                          }}
                          onTouchMove={(e) => {
                            if (!scrubbing) return;
                            const touch = e.touches[0];
                            if (!touch) return;
                            lastTouchSeekRef.current = Date.now();
                            try {
                              e.preventDefault();
                            } catch {
                              // React có thể đăng ký touchmove dạng passive; touchAction:none đã chặn cuộn.
                            }
                            seekToClientX(touch.clientX, e.currentTarget.getBoundingClientRect(), false);
                          }}
                          onTouchEnd={(e) => {
                            const touch = e.changedTouches[0];
                            setScrubbing(false);
                            if (!touch) return;
                            lastTouchSeekRef.current = Date.now();
                            seekToClientX(touch.clientX, e.currentTarget.getBoundingClientRect());
                          }}
                          onTouchCancel={() => setScrubbing(false)}
                        >
                          <div className="relative w-full h-[6px] rounded-sm bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition-all duration-200 group-hover/scrub:h-2">
                            <div
                              className="absolute top-0 left-0 h-full rounded-sm bg-[#FFD166]"
                              style={{
                                width:
                                  dur > 0 ? `${Math.min(100, Math.max(0, (cur / dur) * 100))}%` : "0%",
                              }}
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
                                aria-label={muted ? "Bật âm thanh (M)" : "Tắt âm thanh (M)"}
                                aria-pressed={muted}
                                title={muted ? "Bật âm thanh (M)" : "Tắt âm thanh (M)"}
                                onClick={() => {
                                  const v = videoRef.current;
                                  if (v) v.muted = !v.muted;
                                }}
                                className="text-white hover:text-white/80 transition-all focus:outline-none flex items-center justify-center"
                              >
                                {muted || vol === 0 ? <IcVolumeX className="w-7 h-7" /> : <IcVolume className="w-7 h-7" />}
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
                          {hls && introEnd !== null && dur > introEnd + 30 && cur < introEnd + 1 && (
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
                            onClick={() => {
                              if (subLabels.length === 0) {
                                setNotice("Nguồn này chưa có phụ đề nhúng để chọn.");
                                return;
                              }
                              setMenu("settings");
                              setSub("subs");
                              bumpIdle();
                            }}
                            className="hidden transition-colors hover:text-white/80 focus:outline-none sm:flex items-center justify-center text-white"
                          >
                            <IcCaptions className="h-7 w-7" />
                          </button>
                          <div className="relative flex items-center justify-center">
                            <button
                              type="button"
                              aria-label="Song Ngữ"
                              title={movie.servers[songServerIdx]?.name || "Song Ngữ"}
                              onClick={switchToSong}
                              className="text-white transition-colors hover:text-white/80 focus:outline-none flex h-9 w-9 sm:h-auto sm:w-auto items-center justify-center relative active:scale-[0.97] motion-reduce:transform-none group"
                            >
                              <IcMic className="w-5 h-5 sm:w-7 sm:h-7 transition-[transform] duration-[220ms] group-hover:rotate-12 motion-reduce:transform-none" />
                              <div className="absolute -top-1.5 -right-3 bg-white text-black text-[9px] font-bold px-1 rounded-sm shadow-sm pointer-events-none leading-tight">Song</div>
                            </button>
                          </div>
                          <div className="hidden sm:flex">
                            <div className="relative flex items-center justify-center" data-player-menu="">
                              <button
                                type="button"
                                aria-label="Máy chủ"
                                title="Máy chủ"
                                aria-expanded={menu === "servers"}
                                onClick={() => {
                                  setMenu((m) => (m === "servers" ? null : "servers"));
                                  setSub(null);
                                  bumpIdle();
                                }}
                                className="group relative flex h-9 sm:h-auto w-9 sm:w-auto items-center justify-center text-white transition-colors hover:text-white/80 active:scale-[0.97] focus:outline-none motion-reduce:transform-none"
                              >
                                <IcRouter className="h-5 w-5 sm:h-7 sm:w-7 transition-transform duration-300" />
                                <IcSignalZero className="pointer-events-none absolute -right-3 -top-1.5 h-4 w-4 rounded-sm bg-black/60 p-0.5 shadow-sm text-white/45" />
                              </button>
                              {serverPopover}
                            </div>
                          </div>
                          <button
                            type="button"
                            aria-label="Picture-in-Picture"
                            title="Picture-in-Picture"
                            onClick={() => void togglePiP()}
                            className="flex h-9 w-9 items-center justify-center text-white transition-colors hover:text-white/80 active:scale-[0.97] focus:outline-none motion-reduce:transform-none sm:h-auto sm:w-auto"
                          >
                            <IcPip className="h-5 w-5 sm:h-7 sm:w-7" />
                          </button>
                          <div className="relative flex items-center justify-center" data-player-menu="">
                            <button
                              type="button"
                              aria-label="Cài đặt"
                              title="Cài đặt"
                              aria-expanded={menu === "settings"}
                              onClick={() => {
                                setMenu((m) => (m === "settings" ? null : "settings"));
                                setSub(null);
                                bumpIdle();
                              }}
                              className="relative flex h-9 w-9 items-center justify-center text-white transition-colors hover:text-white/80 focus:outline-none sm:h-auto sm:w-auto"
                            >
                              <IcSettings className={`w-5 h-5 sm:h-7 sm:w-7 ${menu === "settings" ? "text-[#FFD166]" : ""}`} />
                            </button>
                            {settingsPopover}
                          </div>
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
              aria-label="Song Ngữ"
              title={movie.servers[songServerIdx]?.name || "Song Ngữ"}
              onClick={switchToSong}
              className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-white/75 transition-colors hover:text-white whitespace-nowrap"
            >
              <IcCaptions className="h-4 w-4" />
              <span>Song Ngữ</span>
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
                title={!hasIntro ? "Nguồn này chưa có mốc intro" : isEmbed ? "Nguồn embed không hỗ trợ tua intro" : "Tự động bỏ qua intro"}
                aria-pressed={autoSkip && hasIntro && !isEmbed}
                onClick={() => {
                  if (!hasIntro) {
                    setNotice("Nguồn này chưa có mốc intro để tự động bỏ qua.");
                    return;
                  }
                  if (isEmbed) {
                    setNotice("Nguồn embed không hỗ trợ bỏ qua intro. Chọn nguồn KK để dùng tính năng này.");
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
                onClick={() => {
                  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                  document.getElementById("report-banner")?.scrollIntoView({
                    behavior: reduce ? "auto" : "smooth",
                    block: "center",
                  });
                }}
                className="flex items-center gap-2 hover:bg-white/10 transition-colors group outline-none py-1.5 px-2 md:px-3 rounded-lg"
              >
                <IcBug className="w-5 h-5 text-white/70 group-hover:text-[#eab308] transition-colors" />
                <span className="hidden md:inline-block text-[13px] font-medium text-white/70 group-hover:text-[#eab308] transition-colors">Báo lỗi</span>
              </button>
              <button
                type="button"
                data-help-toggle=""
                onClick={() => setHelpOpen((v) => !v)}
                aria-expanded={helpOpen}
                className="flex items-center justify-center py-1.5 px-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Hướng dẫn thao tác"
                title="Hướng dẫn thao tác"
              >
                <IcQuestion className="w-5 h-5 transition-colors text-white/40" />
              </button>
            </div>

          </div>
        </div>

        {helpOpen && (
          <div
            data-help-panel=""
            className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-4 text-[12px] text-white/65"
          >
            <p className="mb-3 font-semibold text-white">Hướng dẫn thao tác</p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Phát / tạm dừng", "Space"],
                ["Toàn màn hình", "F"],
                ["Tua lùi / tới 10 giây", "← / →"],
                ["Tăng / giảm âm lượng", "↑ / ↓"],
                ["Chuyển tập kế tiếp", "N"],
              ].map(([label, key]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-md bg-white/[0.04] px-3 py-2">
                  <span>{label}</span>
                  <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-semibold text-white/90">{key}</kbd>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-white/[0.06] pt-3">
              <p className="mb-2 font-semibold text-white/90">Mobile</p>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                <li>Chạm một lần để hiện / ẩn thanh điều khiển</li>
                <li>Chạm đúp bên trái / phải để tua 10 giây</li>
                <li>Nhấn giữ trên video để tua nhanh 2x, thả tay để trở lại tốc độ cũ</li>
              </ul>
            </div>
            <p className="mt-3 border-t border-white/[0.06] pt-3 text-white/45">
              Nút dưới video: Tự động chuyển tập • Tự động bỏ qua intro • Ánh sáng môi trường • Báo lỗi phim. Vàng = đang bật.
            </p>
          </div>
        )}

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
              <a href={detailHref(movie.slug)} className="flex items-center gap-3 text-white hover:text-[#FFD166] transition-colors">
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                  <IcChevronLeft className="w-4 h-4" />
                </div>
                <h1 className="text-[13px] font-bold leading-tight line-clamp-1">Xem phim: {movie.title}</h1>
              </a>
            </div>

            {/* thông báo — mục tiêu cuộn khi bấm "Báo lỗi" */}
            <div id="report-banner" className="mb-2.5 flex items-start gap-2.5 rounded-lg border border-[#eab308]/20 bg-[#eab308]/10 px-3 py-2 sm:items-center sm:py-3 scroll-mt-24">
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
                  {!!movie.imdbRating && (
                    <div className="flex items-center text-[11px] font-bold rounded overflow-hidden border border-solid border-[rgba(245,197,24,0.5)]">
                      <span className="bg-[#F5C518] text-black px-1.5 py-0.5">IMDb</span>
                      <span className="bg-[rgba(245,197,24,0.1)] text-white px-1.5 py-0.5">{movie.imdbRating.toFixed(1)}</span>
                    </div>
                  )}
                  {!!movie.tmdbRating && (
                    <div className="flex items-center text-[11px] font-bold rounded overflow-hidden border border-solid border-[rgba(1,180,228,0.5)]">
                      <span className="bg-[#01B4E4] text-white px-1.5 py-0.5">TMDb</span>
                      <span className="bg-[rgba(1,180,228,0.1)] text-white px-1.5 py-0.5">{movie.tmdbRating.toFixed(1)}</span>
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
                    <a className="inline-flex items-center gap-1 text-[13px] text-[#eab308] hover:text-[#eab308]/80 transition-colors font-medium" href={detailHref(movie.slug)}>
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
                  <PartSelector movie={movie} mode="watch" />
                  <span className="text-[13px] text-white/60 font-medium hidden sm:inline-block shrink-0">Chọn Server:</span>
                  <div className="relative min-w-0 sm:w-auto">
                    <select
                      value={activeHostIdx}
                      onChange={(e) => changeHost(Number(e.target.value))}
                      className="appearance-none w-full sm:w-auto sm:min-w-[180px] bg-[#12121a] hover:bg-[#15151f] border border-white/10 text-white text-[13px] md:text-sm font-medium rounded-lg px-3.5 sm:px-4 py-2 pr-8 focus:outline-none focus:border-[#eab308]/50 transition-colors cursor-pointer"
                    >
                      {hosts.map((h, i) => (
                        <option key={h.key} value={i}>
                          {h.name}
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
                {hasStills && (
                  <button
                    type="button"
                    aria-pressed={!hideImg}
                    onClick={() => setHideImg((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-1 py-0.5 text-xs font-normal text-white/65 transition-colors hover:text-white"
                  >
                    <span>{hideImg ? "Ẩn ảnh" : "Hiện ảnh"}</span>
                    <span className={`relative h-6 w-10 rounded-full transition-colors ${!hideImg ? "bg-[#FFD166]/70" : "bg-white/20"}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${!hideImg ? "left-[18px]" : "left-0.5"}`} />
                    </span>
                  </button>
                )}
              </div>

              {/* chip phên bản (kênh) trong máy chủ đang chọn */}
              <div className="mb-6 flex flex-wrap gap-2">
                {channels.map((c) => {
                  const active = c.idx === sIdx;
                  return (
                    <button
                      key={c.idx}
                      type="button"
                      onClick={() => changeServer(c.idx)}
                      className={`group flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                        active ? "border border-white/30 text-white bg-white/5 font-medium" : "text-white/60 hover:text-white border border-transparent bg-white/5"
                      }`}
                    >
                      {c.kind === "dub" ? <IcCaptions className="h-3.5 w-3.5" /> : <IconLanguages className="h-3.5 w-3.5" />}
                      <span>{c.name}</span>
                      <span
                        className={`ml-1 flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold transition-colors ${
                          active ? "bg-white text-black" : "bg-white/10 text-white/50 group-hover:text-white/80"
                        }`}
                      >
                        {c.count}
                      </span>
                    </button>
                  );
                })}
                {channels.length === 0 && <span className="text-sm text-white/50">Chưa có máy chủ nào.</span>}
              </div>

              {/* lưới tập */}
              <div className={showThumb ? "grid grid-cols-2 items-start gap-3 lg:grid-cols-4" : "grid grid-cols-3 gap-x-2.5 gap-y-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"}>
                {playableEpisodes(server).map(({ index: i, episode: ep }) => {
                  const active = i === eIdx;
                  const disabled = !ep.url && firstPlayable >= 0;
                  const still = showThumb ? stillFor(movie.episodeStills, ep.label) : null;
                  if (still) {
                    return (
                      <button
                        key={`${server?.name}-grid-${i}`}
                        type="button"
                        onClick={() => selectEp(sIdx, i)}
                        disabled={disabled}
                        title={disabled ? "Tập này chưa có nguồn" : ep.label}
                        className={`group isolate overflow-hidden rounded-lg border bg-[#191b24] shadow-sm transition-shadow hover:ring-2 hover:ring-[#FFD166] ${
                          active ? "border-[#FFD166]" : "border-white/[0.08]"
                        } ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
                      >
                        <div className="relative z-0 aspect-video overflow-hidden">
                          <img
                            src={still}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none"
                          />
                          <span className="absolute inset-x-0 bottom-0 text-left bg-gradient-to-t from-black/90 via-black/45 to-transparent px-2.5 pb-2 pt-6 text-xs font-bold text-white sm:text-sm">
                            {ep.label}
                          </span>
                        </div>
                      </button>
                    );
                  }
                  return (
                    <button
                      key={`${server?.name}-grid-${i}`}
                      type="button"
                      onClick={() => selectEp(sIdx, i)}
                      disabled={disabled}
                      title={disabled ? "Tập này chưa có nguồn" : ep.label}
                      className={`group flex items-center justify-center gap-1.5 rounded-lg border-2 border-transparent px-2 py-2 text-[13px] transition-colors ${
                        disabled
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
            <CommentsSection slug={movie.slug} comments={comments} className="mb-12" />
          </div>

          {/* ── Đề xuất ── */}
          <aside className="xl:w-[320px] shrink-0 xl:border-l xl:border-white/5 xl:pl-8">
            <div className="px-4 xl:px-0">
              <h3 className="text-xl font-bold text-white mb-6">Đề xuất cho bạn</h3>
              <div className="flex flex-col gap-4">
                {suggestions.map((s) => (
                  <a key={s.slug} href={detailHref(s.slug)} className="flex gap-3 rounded overflow-hidden bg-[#1A1A24] group">
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
