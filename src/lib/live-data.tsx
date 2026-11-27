"use client";

/**
 * Lớp dữ liệu cho bản static export.
 *
 * HTML tĩnh (752 route) là nguồn ban đầu — mở trang KHÔNG kéo bảng movies.
 * Client chỉ hỏi 1 giá trị cực nhỏ: app_settings.site_version (~250 bytes).
 * Admin sửa phim/comment/tập/hero/taxonomy -> trigger tăng site_version -> client
 * fetch danh sách đúng 1 lần rồi cache. Realtime chỉ nhận "chuông" thay đổi,
 * không nhận/kéo payload của bảng lớn.
 *
 * Khi mạng lỗi hoặc trigger chưa được cài, bản tĩnh vẫn dùng được nên trang
 * không bao giờ trống.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { commentsData, moviesData, notificationsData, taxonomiesData } from "@/data";
import { VN_FLAG_AVATAR } from "./avatar-fallback";
import { stripBasePath, withBasePath } from "./base-path";
import { SKIP_OVERLAY_KEY } from "./overlay";
import { SB_KEY, SB_URL, sbFetch, sbTable } from "./supabase";
import { commentTimestamp, playableCount } from "@/components/sites/chophim/detail-types";
import type {
  DetailComment,
  MovieDetail,
  MovieServer,
} from "@/components/sites/chophim/detail-types";
import { home as staticHomeValue, type HomeData, type Section } from "@/components/sites/chophim/types";
import { hasVpSource } from "@/components/sites/chophim/movie-filter";

const SONG_NGU_TOP_CLS =
  "pointer-events-none absolute right-1.5 top-1.5 z-40 flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[9px] font-bold text-[#141414] shadow-sm md:right-2 md:top-2 md:text-[10px]";

type Row = Record<string, any>;
type Taxonomy = { type: string; name: string; slug: string };

export type LiveNotice = {
  id: string;
  type: string;
  title: string;
  movieName: string;
  ep: string;
  message: string;
  poster: string;
  link: string | null;
  createdAt: string;
};

type LiveState = {
  movies: Record<string, MovieDetail>;
  home: HomeData;
  comments: Record<string, DetailComment[]>;
  notifications: LiveNotice[];
  taxonomies: Taxonomy[];
  ready: boolean;
  refreshing: boolean;
  updatedAt: number | null;
  error: string | null;
};

type LiveContextValue = LiveState & {
  refresh: () => Promise<void>;
  /** Chỉ gọi cho phim mới không có trong bản tĩnh: tải đúng 1 dòng có episodes. */
  loadDetail: (id: number | string) => Promise<MovieDetail | null>;
};

const CACHE_KEY = "nhotphim:live:v3";
/** Cờ thay đổi do trigger Supabase cập nhật. Chỉ đọc/localStorage, ~250B/request. */
const VERSION_KEY = "nhotphim:site:version";
/** Chỉ dùng khi trigger site_version chưa có: fallback cache 10 phút. */
const CACHE_TTL_MS = 10 * 60 * 1000;

/** 22 cột gọn cho danh sách: 329 dòng chỉ ~165 KB (select=* là ~3,4 MB).
 *  Chỉ kéo 2 field điểm từ extra thay vì cả cột JSON episodes/dubEmbeds.
 *  Mô tả/backdrop/logo/episodes chỉ lấy ở bản tĩnh hoặc trang chi tiết. */
const MOVIE_LIST_COLUMNS = [
  "id,hidden,created_at,ophim_slug,title,titleen,poster,year,quality,sub,epstatus,currentep,totalep,ep,rating,genre,country,type,series_group,part_number",
  "extra->>imdbScore",
  "extra->>tmdbScore",
].join(",");
/** Chỉ dùng cho phim admin thêm mới (không có trong bản tĩnh): đúng 1 dòng. */
const MOVIE_DETAIL_COLUMNS = [
  MOVIE_LIST_COLUMNS,
  "backdrop",
  "logo",
  "description",
  "desc",
  "episodes",
  "embedurl",
  "embedurl2",
  "embedurl3",
  "m3u8url",
  "nguonc_embed_lt",
  "extra",
].join(",");

const staticMovies = moviesData as unknown as Record<string, MovieDetail>;
const staticSlugs = new Set(Object.keys(staticMovies));

function staticState(): LiveState {
  return {
    movies: staticMovies,
    home: staticHomeValue as HomeData,
    comments: commentsData as unknown as Record<string, DetailComment[]>,
    notifications: notificationsData as unknown as LiveNotice[],
    taxonomies: taxonomiesData as unknown as Taxonomy[],
    ready: false,
    refreshing: false,
    updatedAt: null,
    error: null,
  };
}

/* ── helper ─────────────────────────────────────────────────────────────── */

const str = (v: unknown): string => (v == null ? "" : String(v).trim());
const pad2 = (n: unknown): string => String(n ?? "").padStart(2, "0");
const num = (v: unknown): number | null => {
  const n = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};
/** Điểm 0–10: "N/A"/"" / null đều thành null, không thành NaN. */
const score = (v: unknown): number | null => {
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) && n > 0 && n <= 10 ? n : null;
};
const slugify = (s: string): string =>
  str(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const parseJson = (v: unknown): any => {
  if (v == null) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return null;
  }
};

const COUNTRY_CODE: Record<string, string> = {
  kr: "han-quoc",
  cn: "trung-quoc",
  tw: "dai-loan",
  hk: "hong-kong",
  jp: "nhat-ban",
  us: "au-my",
  in: "an-do",
  vn: "viet-nam",
  th: "thai-lan",
  // 14 mã mới từ admin, khớp slug bộ lọc Quốc gia trên web
  gb: "anh",
  fr: "phap",
  ca: "canada",
  ru: "nga",
  ph: "philippines",
  au: "uc",
  de: "duc",
  es: "tay-ban-nha",
  it: "y",
  tr: "tho-nhi-ky",
  id: "indonesia",
  mal: "malaysia",
  br: "brazil",
  nl: "ha-lan",
};

const FALLBACK_GENRE_MAP: Record<string, string> = {
  action: "Hành Động",
  romance: "Tình Cảm",
  comedy: "Hài Hước",
  drama: "Chính Kịch",
  horror: "Kinh Dị",
  mystery: "Bí Ẩn",
  psychology: "Tâm Lý",
  crime: "Hình Sự",
  war: "Chiến Tranh",
  adventure: "Phiêu Lưu",
  scifi: "Khoa Học",
  fantasy: "Viễn Tưởng",
  family: "Gia Đình",
  costumes: "Cổ Trang",
  anime: "Hoạt Hình",
  hoatHinh: "Hoạt Hình",
  langMan: "Lãng Mạn",
  school: "Học Đường",
  sport: "Thể Thao",
  sports: "Thể Thao",
  documentary: "Tài Liệu",
  music: "Âm Nhạc",
};

const LIVE_HORROR_HEADING = "Tôi Sợ Con Người Em Rồi Đó, Nhưng Không Bằng Sợ Ma";

const directM3u8 = (u: unknown): string | null => {
  const s = str(u);
  if (!s) return null;
  try {
    const parsed = new URL(s);
    const inner = parsed.searchParams.get("url");
    if (inner && new URL(inner).pathname.toLowerCase().endsWith(".m3u8")) return inner;
    if (parsed.pathname.toLowerCase().endsWith(".m3u8")) return s;
  } catch {
    /* không phải URL hợp lệ */
  }
  return null;
};
const isKkEmbed = (u: unknown): boolean => str(u).includes("player.phimapi.com");

/** Admin có khi lưu tên tập là "Tập 1" / "Tập 01"; đừng thêm chữ "Tập" lần nữa. */
const episodeLabel = (value: unknown, type: "series" | "movie"): string => {
  if (type === "movie") return "Full";
  const raw = str(value);
  if (!raw || /^full$/i.test(raw)) return "Full";
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? `Tập ${pad2(digits)}` : raw;
};

function buildServers(row: Row, sub: string): MovieServer[] {
  const episodes = parseJson(row.episodes);
  const extra = parseJson(row.extra) || {};
  const dubEmbeds: Record<string, any> = (extra.dubEmbeds && typeof extra.dubEmbeds === "object") ? extra.dubEmbeds : {};
  const m3u8Dub: any[] = Array.isArray(extra.m3u8Dub) ? extra.m3u8Dub : [];
  // Phim cũ có thể lưu sub = "Thuyết minh"; ô Vietsub vẫn phải hiện là Vietsub để không trùng tên server dub.
  const vs = /thuy[eế]t|lồng|long/i.test(sub) ? "Vietsub" : (sub || "Vietsub");
  const fields = [
    { key: "link", name: `${vs} (NC)` },
    { key: "link3", name: `${vs} (VP)` },
  ];
  const dubFields = [
    { key: "linkDub", name: "Thuyết minh (NC)" },
    { key: "link3Dub", name: "Thuyết minh (VP)" },
  ];
  const labelOf = (ep: any): string => episodeLabel(ep?.name, row.type === "movie" ? "movie" : "series");
  const servers: MovieServer[] = [];

  if (Array.isArray(episodes) && episodes.length) {
    for (const field of fields.concat(dubFields)) {
      const eps = episodes.map((ep: any) => {
        const raw = str(ep?.[field.key]);
        return { label: labelOf(ep), url: isKkEmbed(raw) ? null : raw || null };
      });
      if (eps.some((e: { url: string | null }) => e.url)) servers.push({ name: field.name, episodes: eps });
    }
    const m3 = episodes.map((ep: any) => directM3u8(ep?.link2) || directM3u8(ep?.m3u8_2));
    if (m3.some(Boolean)) {
      servers.push({
        name: `${vs} (KK)`,
        episodes: episodes.map((ep: any, i: number) => ({ label: labelOf(ep), url: m3[i] })),
      });
    }
    const kkDub = episodes.map((ep: any) => directM3u8(ep?.link2Dub) || directM3u8(ep?.m3u8_2Dub));
    if (kkDub.some(Boolean)) {
      servers.push({
        name: "Thuyết minh (KK)",
        episodes: episodes.map((ep: any, i: number) => ({ label: labelOf(ep), url: kkDub[i] })),
      });
    }
  }

  if (servers.length === 0) {
    const single = [
      { url: isKkEmbed(row.embedurl) ? null : str(row.embedurl), name: `${vs} (NC)` },
      { url: isKkEmbed(row.embedurl3) ? null : str(row.embedurl3), name: `${vs} (VP)` },
      { url: directM3u8(row.embedurl2) || directM3u8(row.m3u8url), name: `${vs} (KK)` },
      { url: str(dubEmbeds.nc) || str(row.nguonc_embed_lt), name: "Thuyết minh (NC)" },
      { url: directM3u8(dubEmbeds.kk) || directM3u8(m3u8Dub[1]), name: "Thuyết minh (KK)" },
      { url: str(dubEmbeds.vp), name: "Thuyết minh (VP)" },
    ].filter((x) => x.url);
    if (single.length) {
      const label = episodeLabel(row.currentep, row.type === "movie" ? "movie" : "series");
      servers.push(
        ...single.map((s) => ({ name: s.name, episodes: [{ label, url: s.url }] }))
      );
    }
  }
  return servers;
}

/** Admin có khi copy totalep của phần trước sang phần sau (cùng ophim_slug).
 *  Chỉ đánh dấu các row phần sau đang chiếu có tổng trùng row khác đã chiếu nhiều
 *  tập hơn — lúc đó totalep không phải tổng của phần này. */
function borrowedSequelTotalIds(rows: Row[]): Set<string> {
  const byApi = new Map<string, Row[]>();
  for (const row of rows) {
    const api = str(row.ophim_slug);
    if (!api) continue;
    const list = byApi.get(api) || [];
    list.push(row);
    byApi.set(api, list);
  }
  const ids = new Set<string>();
  for (const group of byApi.values()) {
    if (group.length < 2) continue;
    for (const row of group) {
      if ((num(row.part_number) ?? 0) < 2) continue;
      const total = num(row.totalep);
      const current = num(row.currentep) ?? 0;
      if (total == null) continue;
      if (
        group.some(
          (other) =>
            other !== row &&
            num(other.totalep) === total &&
            (num(other.currentep) ?? 0) > current
        )
      ) {
        ids.add(String(row.id));
      }
    }
  }
  return ids;
}

function makeNormalizer(ctx: {
  genreMap: Record<string, string>;
  catNameToSlug: Record<string, string>;
  homeSlugs: Set<string>;
  taxonomies: Taxonomy[];
  borrowedTotals?: Set<string>;
}) {
  const primarySlug = (row: Row): string => {
    const candidates = [row.ophim_slug, slugify(str(row.title)), slugify(str(row.titleen))].filter(Boolean);
    for (const c of candidates) if (ctx.homeSlugs.has(c)) return c;
    return candidates[0] || slugify(str(row.title));
  };

  return (row: Row): MovieDetail => {
    const slug = primarySlug(row);
    const extra = parseJson(row.extra) || {};
    const stillsRaw = extra.episodeStills;
    const episodeStills =
      stillsRaw && typeof stillsRaw === "object" && !Array.isArray(stillsRaw)
        ? (stillsRaw as Record<string, string>)
        : null;
    const sub = str(row.sub) || "Vietsub";
    const genreCodes = str(row.genre)
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);
    const genres = genreCodes.map((c) => ctx.genreMap[c] || c).filter(Boolean);
    const genreSlugs = [...new Set(genres.map((g) => ctx.catNameToSlug[g]).filter(Boolean))];
    const countryCode = str(row.country).toLowerCase();
    const countrySlug = COUNTRY_CODE[countryCode] || null;
    const countries = countrySlug
      ? [ctx.taxonomies.find((t) => t.type === "country" && t.slug === countrySlug)?.name || countryCode]
      : [];
    const servers = buildServers(row, sub);
    // Danh sách không tải episodes. Mượn servers của đúng phim trong bản tĩnh:
    // nhiều row dùng chung ophim_slug (vd 2 phần "Cộng Sự Hoàn Hảo"), tra theo
    // slug lúc này sẽ lấy nhầm tập của phần kia trước khi buildMovieDb tách slug.
    const fallback =
      (row.id != null ? staticById.get(String(row.id)) : undefined) ||
      staticByTitle.get(normTitle(str(row.title))) ||
      (staticMovies[slug] as MovieDetail | undefined);
    const resolvedServers = servers.length ? servers : fallback?.servers || servers;
    // current không được vượt số tập có link thật (kẻo báo "Tập 16" khi mới có 2 link).
    // total vẫn giữ tổng số tập admin lưu (vd 12), trừ khi tổng đó bị copy nhầm
    // từ phần khác cùng ophim_slug.
    const available = resolvedServers.reduce((max, s) => Math.max(max, playableCount(s)), 0);
    const rawCurrent = num(row.currentep);
    const rawTotal = num(row.totalep);
    const current = available && rawCurrent != null && rawCurrent > available ? available : rawCurrent;
    const total = ctx.borrowedTotals?.has(String(row.id)) ? available : rawTotal ?? available;
    const epstatus = str(row.epstatus);
    const ratingRaw = score(row.rating);
    const rawImdb = score(row.imdbScore ?? extra.imdbScore);
    const rawTmdb = score(row.tmdbScore ?? extra.tmdbScore);
    // Admin ghi cột rating như "Điểm IMDb"; vài phim import từ TMDB lại ghi
    // vote_average vào cột này. Ưu tiên 2 field riêng trong extra, chỉ dùng
    // rating làm IMDb khi nó không trùng điểm TMDb đã lưu.
    const imdbRating = rawImdb ?? (ratingRaw != null && ratingRaw !== rawTmdb ? ratingRaw : null);
    const tmdbRating = rawTmdb;
    const rating = ratingRaw ?? imdbRating ?? tmdbRating;

    let status: string;
    if (epstatus === "Hoàn thành") status = current && total ? `Hoàn Tất (${current}/${total})` : "Hoàn Tất";
    else if (epstatus === "Đang chiếu") status = current && total ? `Đang Tập (${current}/${total})` : "Đang Tập";
    else if (epstatus === "Sắp chiếu") status = "Sắp Chiếu";
    else status = current && total ? (current >= total ? `Hoàn Tất (${current}/${total})` : `Đang Tập (${current}/${total})`) : "Hoàn Tất";

    let episodeLabel: string;
    if (row.type === "movie") episodeLabel = row.ep && !/^full$/i.test(str(row.ep)) ? str(row.ep) : "";
    else episodeLabel = current ? `Tập ${current}` : str(row.ep).replace(/^Full\s*/i, "") || "";

    return {
      slug,
      title: str(row.title),
      origin: str(row.titleen),
      poster: str(row.poster),
      backdrop: str(row.backdrop) || fallback?.backdrop || null,
      logo: str(row.logo) || fallback?.logo || null,
      year: num(row.year),
      quality: str(row.quality) || "FHD",
      lang: sub,
      episodeLabel,
      episodeStills: episodeStills || fallback?.episodeStills || null,
      status,
      current,
      total,
      type: row.type === "movie" ? "movie" : "series",
      genres,
      countries,
      rating,
      imdbRating,
      tmdbRating,
      description: str(row.description) || str(row.desc) || str(extra.metaDesc) || fallback?.description || "",
      director: str(extra.director) || fallback?.director || null,
      duration: str(extra.duration) || fallback?.duration || null,
      apiSlug: str(extra.slug) || str(row.ophim_slug) || fallback?.apiSlug || slug,
      trailer: str(extra.trailer) || fallback?.trailer || null,
      imdbId: str(extra.imdbId) || fallback?.imdbId || null,
      source: "quanli",
      seriesGroup: str(row.series_group) || null,
      partNumber: num(row.part_number),
      id: row.id,
      createdAt: str(row.created_at),
      epstatus: epstatus || null,
      genreCodes,
      genreSlugs,
      countryCode: countryCode || null,
      countrySlug,
      formatSlug: str(row.quality).toLowerCase() || null,
      movietypeSlug: row.type === "movie" ? "phim-le" : "phim-bo",
      views: num(extra.views) ?? fallback?.views ?? 0,
      likes: num(extra.likes) ?? fallback?.likes ?? 0,
      theater: !!extra.theater || !!fallback?.theater,
      servers: resolvedServers,
    } as MovieDetail;
  };
}

const normTitle = (s: string): string =>
  str(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Tra bản tĩnh theo id/tên trước, không tra theo slug đang bị trùng. */
const staticById = new Map<string, MovieDetail>();
const staticByTitle = new Map<string, MovieDetail>();
for (const m of Object.values(staticMovies)) {
  if (m.id != null) staticById.set(String(m.id), m);
  staticByTitle.set(normTitle(str(m.title)), m);
}

const movieScore = (m: MovieDetail): number => playableCount(m.servers[0]) * 100 + (m.current || 0);

/** Nhiều row trong bảng admin có cùng ophim_slug (dữ liệu cũ bị lặp). Mỗi tên
 *  phim khác nhau được cấp một slug riêng; slug gốc luôn giữ cho phim đã có trong
 *  bản tĩnh để link/bookmark cũ không đổi. Các row trùng tên vẫn gộp như trước. */
function buildMovieDb(rows: Row[], normalize: (row: Row) => MovieDetail) {
  type Entry = { row: Row; rec: MovieDetail };
  const bySlug = new Map<string, Entry[]>();
  for (const row of rows) {
    if (row.hidden === true) continue;
    const rec = normalize(row);
    if (!rec.slug || !rec.title) continue;
    const list = bySlug.get(rec.slug) || [];
    list.push({ row, rec });
    bySlug.set(rec.slug, list);
  }

  const db: Record<string, MovieDetail> = {};
  const owners = new Map<string, string>();
  for (const [base, entries] of bySlug) {
    const byTitle = new Map<string, Entry[]>();
    for (const e of entries) {
      const key = normTitle(e.rec.title);
      const list = byTitle.get(key) || [];
      list.push(e);
      byTitle.set(key, list);
    }
    const winners = [...byTitle.values()].map((list) =>
      list.reduce((best, e) => (movieScore(e.rec) > movieScore(best.rec) ? e : best))
    );

    const expected = staticMovies[base]?.title;
    let baseIndex = expected
      ? winners.findIndex((e) => normTitle(e.rec.title) === normTitle(expected))
      : -1;
    if (baseIndex < 0) {
      baseIndex = winners.reduce(
        (best, e, i) => (movieScore(e.rec) > movieScore(winners[best].rec) ? i : best),
        0
      );
    }

    winners.forEach((e, i) => {
      let slug = base;
      if (i !== baseIndex) {
        const suffix = `${base}-${e.row.id ?? "new"}`;
        slug = suffix;
        let n = 2;
        while (db[slug] || owners.has(slug)) slug = `${suffix}-${n++}`;
      }
      e.rec.slug = slug;
      owners.set(slug, String(e.row.id ?? ""));
      db[slug] = e.rec;
    });
  }
  return db;
}

/** Comment cũ bị mất ảnh dùng lá cờ VN thay cho silhouette xám. */
const FALLBACK_AVATAR = VN_FLAG_AVATAR;

function buildComments(rows: Row[], db: Record<string, MovieDetail>): Record<string, DetailComment[]> {
  const slugById = new Map<string, string>();
  for (const [slug, m] of Object.entries(db)) {
    const id = String((m as any).id ?? "");
    if (id) slugById.set(id, slug);
  }
  const fmtTime = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const bySlug: Record<string, DetailComment[]> = {};
  for (const c of rows) {
    const slug = slugById.get(String(c.movie_id));
    if (!slug) continue;
    (bySlug[slug] ||= []).push({
      id: String(c.id),
      pinned: !!c.pinned,
      admin: !!c.is_admin,
      name: c.author_name || "Ẩn danh",
      gender: null,
      time: fmtTime(str(c.created_at)),
      content: c.parent_id && c.reply_to_name ? `@${c.reply_to_name} ${c.content}` : c.content,
      likes: c.likes ?? 0,
      dislikes: c.dislikes ?? 0,
      avatar: c.author_avatar || FALLBACK_AVATAR,
      frame: null,
      emoji: null,
      role: str(c.role) || null,
      subscriptionTier: str(c.subscription_tier) || null,
    } as DetailComment & { createdAt?: string; parentId?: string | null; isSpoiler?: boolean });
    const entry = bySlug[slug][bySlug[slug].length - 1] as DetailComment & { createdAt: string };
    entry.createdAt = str(c.created_at);
    entry.parentId = c.parent_id ? String(c.parent_id) : null;
    entry.replyToName = str(c.reply_to_name) || null;
    (entry as any).isSpoiler = !!c.is_spoiler;
    (entry as any).movieTitle = db[slug].title;
  }
  for (const list of Object.values(bySlug)) {
    // "Mới nhất" của chophim là mặc định: mới trước, cùng thời giữ thứ tự gốc.
    list.sort((a, b) => commentTimestamp(b) - commentTimestamp(a));
  }
  return bySlug;
}

function buildHome(
  tpl: HomeData,
  db: Record<string, MovieDetail>,
  comments: Record<string, DetailComment[]>,
  taxonomies: Taxonomy[],
  heroIds: Array<string | number>
): HomeData {
  const movies = Object.values(db);
  const createdDesc = (a: MovieDetail, b: MovieDetail) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  /** Các tab "mới" xếp theo năm phát hành, cùng năm thì theo ngày đưa lên admin. */
  const releaseDesc = (a: MovieDetail, b: MovieDetail) =>
    (b.year ?? 0) - (a.year ?? 0) || createdDesc(a, b);
  const ratingDesc = (a: MovieDetail, b: MovieDetail) =>
    (b.rating ?? -1) - (a.rating ?? -1) || createdDesc(a, b);
  const pick = <T,>(arr: T[], n: number): T[] => arr.slice(0, n);
  const sampleItem = tpl.sections?.find((s) => s.items?.length)?.items?.[0] || {};

  const bottomText = (m: MovieDetail): string => {
    if (m.status === "Sắp Chiếu") return "Sắp chiếu";
    if (m.type === "movie") return "PĐ. Full";
    if (m.current && m.total) return `PĐ. ${m.current}TM. ${m.total}`;
    if (m.current) return `PĐ. ${m.current}`;
    return "PĐ. Full";
  };
  const makeItem = (m: MovieDetail, t: any, topBadge?: string): any => {
    const badges: any[] = [];
    const top = (t?.badges || []).find((b: any) => b.pos === "top");
    // Badge đi theo phim: phim có server VP luôn hiện "Song Ngữ" ở mọi section.
    const songNgu = hasVpSource(m);
    const topText = songNgu ? "Song Ngữ" : topBadge || m.lang || "Vietsub";
    if (top || songNgu || topBadge) {
      badges.push({ pos: "top", text: topText, cls: top?.cls || SONG_NGU_TOP_CLS });
    }
    const bottom = (t?.badges || []).find((b: any) => b.pos === "bottom");
    if (bottom) badges.push({ pos: "bottom", text: bottomText(m), cls: bottom.cls });
    const portrait = t?.variant === "portrait";
    return {
      href: detailHref(m.slug),
      img: portrait ? m.poster || m.backdrop : m.backdrop || m.poster,
      alt: m.title,
      title: m.title,
      sub: m.origin || "",
      badges,
      variant: t?.variant,
      rank: t?.rank || "",
      itemClass: t?.itemClass,
      imgWrapClass: t?.imgWrapClass,
      slug: m.slug,
      meta: {
        imdb: m.imdbRating ?? null,
        tmdb: m.tmdbRating ?? null,
        poster: m.poster,
        genres: m.genres,
        countries: m.countries,
        year: m.year,
        quality: m.quality,
        episode: m.status,
        origin: m.origin,
        logo: m.logo,
        thumb: m.backdrop || m.poster,
      },
    };
  };
  const fillSection = (section: Section, list: MovieDetail[], topBadge?: string): Section => {
    const tplItems = section.items?.length ? section.items : [sampleItem];
    const items = list.map((m, i) => makeItem(m, tplItems[i % tplItems.length] || sampleItem, topBadge));
    return { ...section, items, count: items.length };
  };

  const ofCountry = (slug: string) => movies.filter((m) => m.countrySlug === slug);
  const series = movies.filter((m) => m.type === "series");
  const films = movies.filter((m) => m.type === "movie");
  const horror = movies.filter((m) => (m.genreSlugs || []).includes("kinh-di"));
  const anime = movies.filter((m) => (m as any).genreCodes?.includes("anime"));
  const viet = ofCountry("viet-nam");

  const sections = (tpl.sections || []).map((s): Section => {
    switch (s.id) {
      case "S:2": return fillSection(s, pick(ofCountry("han-quoc").sort(releaseDesc), 15));
      case "S:3": return fillSection(s, pick(ofCountry("trung-quoc").sort(releaseDesc), 15));
      case "S:4": return fillSection(s, pick(ofCountry("au-my").sort(releaseDesc), 15));
      case "S:7":
        return fillSection(
          s,
          pick([...movies].filter(hasVpSource).sort(ratingDesc), 36),
          "Song Ngữ"
        );
      case "S:8": return fillSection(s, pick([...movies].sort(releaseDesc), 24));
      case "S:9": return fillSection(s, pick([...series].sort(ratingDesc), 10));
      case "S:a":
        return {
          ...fillSection(s, pick([...horror].sort(ratingDesc), 24)),
          heading: LIVE_HORROR_HEADING,
          headingParts: [LIVE_HORROR_HEADING],
        };
      case "S:b": return fillSection(s, pick([...series].sort(releaseDesc), 24));
      case "S:c": return fillSection(s, pick([...viet].sort(createdDesc), 16));
      case "S:d": return fillSection(s, pick([...films].sort(createdDesc), 24));
      case "S:e": return fillSection(s, pick([...films].sort(ratingDesc), 10));
      default: return { ...s, items: [], count: 0 };
    }
  });

  const byId = new Map<string, MovieDetail>();
  for (const m of movies) {
    const id = String((m as any).id ?? "");
    if (id) byId.set(id, m);
  }
  const heroMovies = heroIds.map((id) => byId.get(String(id))).filter(Boolean) as MovieDetail[];
  const logoMovies = movies.filter((m) => m.logo && m.backdrop).sort(createdDesc);
  const heroPool = heroMovies.length
    ? heroMovies
    : logoMovies.length >= 8
      ? logoMovies
      : movies.filter((m) => m.backdrop).sort(createdDesc);
  const heroSlides = pick(heroPool, 15).map((m, i) => ({
    slug: m.slug,
    title: m.title,
    origin: m.origin || m.title,
    logo: m.logo,
    backdrop: m.backdrop,
    poster: m.poster,
    content: m.description,
    year: m.year || new Date().getFullYear(),
    quality: m.quality,
    episode: m.episodeLabel || m.status,
    imdb: m.imdbRating ?? undefined,
    tmdb: m.tmdbRating ?? 0,
    genres: m.genres.slice(0, 3),
    hrefWatch: watchHref(m.slug),
    hrefDetail: detailHref(m.slug),
    logoBox: tpl.hero?.slides?.[i % (tpl.hero.slides.length || 1)]?.logoBox,
  }));

  // Chỉ lấy phim anime/hoạt hình — không kể phim Nhật live-action và không chêm
  // phim thường cho đủ 15 slide (chophim có nhiều anime hơn nên mới đủ 15).
  const animePool = [...anime, ...movies.filter((m) => (m.genres || []).some((g) => /hoạt hình|anime/i.test(g)))]
    .filter((m, i, arr) => arr.findIndex((x) => x.slug === m.slug) === i)
    .sort(createdDesc);
  const animeSlides = pick(animePool, 15).map((m) => ({
    slug: m.slug,
    title: m.title,
    origin: m.origin || m.title,
    backdrop: m.backdrop || m.poster,
    poster: m.poster,
    content: m.description,
    year: m.year || new Date().getFullYear(),
    quality: m.quality,
    episode: m.episodeLabel || m.status,
    imdb: m.imdbRating ?? undefined,
    tmdb: m.tmdbRating ?? 0,
    genres: m.genres.slice(0, 3),
    href: detailHref(m.slug),
  }));

  const homeComments: any[] = [];
  for (const [slug, list] of Object.entries(comments)) {
    const m = db[slug];
    if (!m) continue;
    for (const c of list) {
      const raw = c as DetailComment & { isSpoiler?: boolean };
      const parentId = raw.parentId ? String(raw.parentId) : null;
      homeComments.push({
        id: c.id,
        movieSlug: slug,
        movieName: m.title,
        posterUrl: m.poster,
        backdropUrl: m.backdrop || m.poster,
        content: c.content,
        likes: c.likes,
        dislikes: c.dislikes,
        replies: parentId ? 0 : list.filter((x) => x.parentId && String(x.parentId) === c.id).length,
        user: {
          displayName: c.name,
          avatarUrl: c.avatar,
          avatarFrame: null,
          subscriptionTier: str(c.subscriptionTier) || "free",
          role: c.admin || c.role === "admin" ? "admin" : "user",
          gender: c.gender,
          selectedEmoji: null,
          showPremiumBadge: false,
        },
        createdAt: raw.createdAt,
        parentId,
        isSpoiler: !!raw.isSpoiler,
      });
    }
  }
  homeComments.sort(
    (a, b) => Date.parse(String(b.createdAt || "")) - Date.parse(String(a.createdAt || ""))
  );

  const trend = ["up", "down", "same", "up", "down", "same", "up", "down", "same", "up"];
  const hot = pick([...movies].sort(ratingDesc), 10).map((m, i) => ({
    slug: m.slug,
    name: m.title,
    poster_url: m.poster,
    score: Math.round((m.rating ?? 0) * 100),
    trendDirection: trend[i],
  }));
  const hotSet = new Set(hot.map((r) => r.slug));
  const favorite = pick(
    [...movies]
      .filter((m) => !hotSet.has(m.slug))
      .sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || ((b as any).likes ?? 0) - ((a as any).likes ?? 0)),
    10
  ).map((m, i) => ({
    slug: m.slug,
    name: m.title,
    poster_url: m.poster,
    count: Math.round((m.rating ?? 7) * 100000) + ((m as any).views || 0),
    trendDirection: trend[(i + 2) % trend.length],
  }));
  const catCounts: Record<string, number> = {};
  for (const m of movies) for (const g of m.genreSlugs || []) catCounts[g] = (catCounts[g] || 0) + 1;
  const genres = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([slug, count], i) => ({
      name: taxonomies.find((t) => t.type === "category" && t.slug === slug)?.name || slug,
      slug,
      count,
      trendDirection: trend[i],
    }));

  return {
    header: tpl.header,
    hero: { pills: tpl.hero?.pills, slides: heroSlides, thumbs: heroSlides.map((s) => s.backdrop) },
    topics: tpl.topics,
    moreTopics: tpl.moreTopics,
    sections,
    footer: tpl.footer,
    anime: { slides: animeSlides },
    comments: homeComments,
    rankings: { hot, favorite, genres },
    topicsFull: tpl.topicsFull,
  } as unknown as HomeData;
}

function buildNotifications(rows: Row[], db: Record<string, MovieDetail>): LiveNotice[] {
  const norm = (s: string): string =>
    str(s)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const movies = Object.values(db);
  const findMovie = (title: string): MovieDetail | null => {
    const n = norm(title);
    if (!n) return null;
    const exact = movies.find((m) => norm(m.title) === n || norm(m.origin) === n);
    if (exact) return exact;
    const partial = movies.filter((m) => norm(m.title).includes(n) || n.includes(norm(m.title)));
    if (partial.length) return partial.sort((a, b) => norm(a.title).length - norm(b.title).length)[0];
    const words = n.split(" ").filter((w) => w.length > 2);
    if (!words.length) return null;
    return (
      movies
        .map((m) => {
          const hay = `${norm(m.title)} ${norm(m.origin)}`;
          return { m, score: words.filter((w) => hay.includes(w)).length / words.length };
        })
        .filter((x) => x.score >= 0.7)
        .sort((a, b) => b.score - a.score)[0]?.m || null
    );
  };

  return rows
    .slice()
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 60)
    .map((row) => {
      const movie = findMovie(str(row.title));
      const ep = str(row.ep);
      const epNum = /Tập\s*(\d+)/i.exec(ep)?.[1];
      const hash = epNum ? `#tap=tap-${epNum}` : /full/i.test(ep) ? "#tap=full" : "";
      return {
        id: String(row.id),
        type: "new_episode",
        title: str(row.title),
        movieName: movie?.title || str(row.title),
        ep,
        message: `${ep || "Tập mới"} vừa được cập nhật`,
        poster: str(row.poster) || movie?.poster || "",
        link: movie ? watchHref(movie.slug, hash) : null,
        createdAt: str(row.created_at),
      };
    })
    .filter((n) => n.title);
}

/* ── Provider ───────────────────────────────────────────────────────────── */

const LiveContext = createContext<LiveContextValue>({
  ...staticState(),
  refresh: async () => {},
  loadDetail: async () => null,
});

function readCache(): LiveState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<LiveState>;
    if (!value || !value.movies || !value.home?.sections?.length) return null;
    return {
      movies: value.movies as Record<string, MovieDetail>,
      home: value.home as HomeData,
      comments: (value.comments || {}) as Record<string, DetailComment[]>,
      notifications: (value.notifications || []) as LiveNotice[],
      taxonomies: (value.taxonomies || []) as Taxonomy[],
      ready: true,
      refreshing: false,
      // Giữ mốc thật để mount effect biết cache đã hết hạn chưa.
      updatedAt: value.updatedAt || null,
      error: null,
    };
  } catch {
    return null;
  }
}

type NormalizeContext = {
  genreMap: Record<string, string>;
  catNameToSlug: Record<string, string>;
  homeSlugs: Set<string>;
  taxonomies: Taxonomy[];
  borrowedTotals?: Set<string>;
};

function buildNormalizeContext(taxonomies: Taxonomy[]): NormalizeContext {
  const genreMap: Record<string, string> = { ...FALLBACK_GENRE_MAP };
  for (const m of Object.values(staticMovies)) {
    (m as any).genreCodes?.forEach((code: string, i: number) => {
      const name = m.genres?.[i];
      if (code && name && !genreMap[code]) genreMap[code] = name;
    });
  }
  const catNameToSlug: Record<string, string> = {};
  for (const t of taxonomies) if (t.type === "category" && t.name && t.slug) catNameToSlug[t.name] = t.slug;
  const homeSlugs = new Set(staticSlugs);
  for (const s of staticHomeValue.sections || []) for (const it of s.items || []) if (it?.slug) homeSlugs.add(it.slug);
  for (const s of staticHomeValue.hero?.slides || []) if (s?.slug) homeSlugs.add(s.slug);
  for (const s of staticHomeValue.anime?.slides || []) if (s?.slug) homeSlugs.add(s.slug);
  return { genreMap, catNameToSlug, homeSlugs, taxonomies };
}

async function fetchHeroIds(): Promise<Array<string | number>> {
  const res = await sbFetch("/rest/v1/app_settings?key=eq.hero_movies&select=value");
  if (!res.ok) return [];
  const data = await res.json();
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return [];
  const value = typeof row.value === "string" ? parseJson(row.value) : row.value;
  if (!Array.isArray(value)) return [];
  return value
    .map((x: any) => (x && typeof x === "object" ? x.id : x))
    .filter((x: any) => x != null);
}

/** Đọc cờ phiên bản: 1 row của app_settings, không đụng bảng movies. */
async function fetchSiteVersion(): Promise<string | null> {
  const res = await sbFetch("/rest/v1/app_settings?key=eq.site_version&select=value");
  if (!res.ok) return null;
  const data = await res.json();
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return null;
  const raw = typeof row.value === "string" ? parseJson(row.value) : row.value;
  if (raw == null || Array.isArray(raw)) return null;
  if (typeof raw === "object") return String((raw as any).v ?? (raw as any).version ?? "");
  return String(raw);
}
function readSiteVersion(): string | null {
  try { return window.localStorage.getItem(VERSION_KEY); } catch { return null; }
}
function writeSiteVersion(value: string): void {
  try { window.localStorage.setItem(VERSION_KEY, value); } catch { /* private mode */ }
}

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LiveState>(staticState);
  const inFlight = useRef<Promise<void> | null>(null);
  const ctxRef = useRef<NormalizeContext>(buildNormalizeContext(staticState().taxonomies));
  const detailCache = useRef<Map<string, MovieDetail>>(new Map());
  const detailPending = useRef<Map<string, Promise<MovieDetail | null>>>(new Map());

  const refresh = useCallback(async (): Promise<void> => {
    if (typeof window === "undefined") return;
    if (inFlight.current) return inFlight.current;
    const task = (async () => {
      try {
        setState((s) => ({ ...s, refreshing: true }));
        // Version được đọc cùng lúc: chỉ ghi localStorage sau khi fetch thành công.
        const [rows, serverVersion] = await Promise.all([
          sbTable<Row>("movies", MOVIE_LIST_COLUMNS),
          fetchSiteVersion().catch(() => null),
        ]);
        if (!rows.length) throw new Error("movies trống");

        const [taxRows, commentRows, noticeRows, heroIds] = await Promise.all([
          sbTable<Row>("taxonomies", "id,type,name,slug").catch(() => [] as Row[]),
          sbTable<Row>(
            "comments",
            "id,movie_id,movie_title,author_name,content,created_at,parent_id,reply_to_name,likes,dislikes,is_admin,author_avatar"
          ).catch(() => [] as Row[]),
          sbTable<Row>("ep_notifs", "id,title,ep,poster,created_at").catch(() => [] as Row[]),
          fetchHeroIds().catch(() => [] as Array<string | number>),
        ]);

        const taxonomies = taxRows.length ? (taxRows as Taxonomy[]) : staticState().taxonomies;
        const ctx = buildNormalizeContext(taxonomies);
        ctx.borrowedTotals = borrowedSequelTotalIds(rows);
        ctxRef.current = ctx;
        const normalize = makeNormalizer(ctx);
        const db = buildMovieDb(rows, normalize);
        const comments = commentRows.length
          ? buildComments(commentRows, db)
          : staticState().comments;
        const notifications = noticeRows.length
          ? buildNotifications(noticeRows, db)
          : staticState().notifications;
        const next: LiveState = {
          movies: db,
          home: buildHome(staticHomeValue, db, comments, taxonomies, heroIds),
          comments,
          notifications,
          taxonomies,
          ready: true,
          refreshing: false,
          updatedAt: Date.now(),
          error: null,
        };
        setState(next);
        if (serverVersion) writeSiteVersion(serverVersion);
        try {
          window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(next));
        } catch {
          /* private mode / quota — bỏ qua */
        }
      } catch (err) {
        setState((s) => ({ ...s, refreshing: false, error: String(err) }));
      }
    })().finally(() => {
      inFlight.current = null;
    });
    inFlight.current = task;
    return task;
  }, []);

  const loadDetail = useCallback(async (id: number | string): Promise<MovieDetail | null> => {
    const key = String(id);
    if (!key || key === "undefined" || key === "null") return null;
    const cached = detailCache.current.get(key);
    if (cached) return cached;
    const running = detailPending.current.get(key);
    if (running) return running;
    // Đúng 1 dòng, có episodes/extra: chỉ cần cho phim mới chưa có bản tĩnh.
    // React có thể chạy effect 2 lần — chia chung 1 promise để chỉ fetch 1 lần.
    const task = (async () => {
      const rows = await sbTable<Row>("movies", MOVIE_DETAIL_COLUMNS, { id: `eq.${key}` });
      const row = rows[0];
      if (!row) return null;
      const rec = makeNormalizer(ctxRef.current)(row);
      detailCache.current.set(key, rec);
      return rec;
    })().finally(() => {
      detailPending.current.delete(key);
    });
    detailPending.current.set(key, task);
    return task;
  }, []);

  // Mở trang: JSON tĩnh render ngay. Chỉ fetch khi cờ trên server khác cờ đã lưu.
  useEffect(() => {
    let cancelled = false;
    const cached = readCache();
    if (cached) {
      setState(cached);
      ctxRef.current = buildNormalizeContext(cached.taxonomies);
    }
    void (async () => {
      const serverVersion = await fetchSiteVersion().catch(() => null);
      if (cancelled) return;
      if (serverVersion && cached && readSiteVersion() === serverVersion) return;
      // Chưa cài trigger: giữ hành vi cache 10 phút để không tải lặp.
      if (!serverVersion && cached && cached.updatedAt && Date.now() - cached.updatedAt < CACHE_TTL_MS) return;
      void refresh();
    })();
    return () => { cancelled = true; };
  }, [refresh]);

  // Realtime CHỈ nhận tín hiệu từ row site_version. Không subscribe 5 bảng,
  // không poll, không kéo payload của bảng lớn.
  useEffect(() => {
    if (typeof window === "undefined" || typeof WebSocket === "undefined") return;
    let stopped = false;
    let ws: WebSocket | null = null;
    let reconnect: number | undefined;
    let heartbeat: number | undefined;
    let poll: number | undefined;
    let debounce: number | undefined;
    let attempts = 0;
    let seq = 1;

    const onChange = () => {
      if (stopped) return;
      if (debounce) window.clearTimeout(debounce);
      debounce = window.setTimeout(() => void refresh(), 500);
    };

    const connect = () => {
      if (stopped) return;
      try {
        const url = `${SB_URL.replace(/^http/, "ws")}/realtime/v1/websocket?apikey=${encodeURIComponent(SB_KEY)}&vsn=1.0.0`;
        ws = new WebSocket(url);
        ws.onopen = () => {
          attempts = 0;
          ws?.send(JSON.stringify({
            topic: "realtime:public:app_settings",
            event: "phx_join",
            payload: {
              config: {
                postgres_changes: [
                  { id: 1, event: "*", schema: "public", table: "app_settings", filter: "key=eq.site_version" },
                ],
              },
            },
            ref: "1",
          }));
          if (heartbeat) window.clearInterval(heartbeat);
          heartbeat = window.setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(seq++) }));
            }
          }, 25000);
        };
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(String(ev.data));
            if (msg?.event === "postgres_changes" || msg?.event === "change") onChange();
          } catch { /* bỏ qua frame lạ */ }
        };
        ws.onclose = () => scheduleReconnect();
        ws.onerror = () => { try { ws?.close(); } catch { /* đã đóng */ } };
      } catch {
        scheduleReconnect();
      }
    };

    const scheduleReconnect = () => {
      if (stopped) return;
      if (heartbeat) window.clearInterval(heartbeat);
      attempts = Math.min(attempts + 1, 6);
      if (reconnect) window.clearTimeout(reconnect);
      reconnect = window.setTimeout(connect, Math.min(1000 * 2 ** attempts, 30000));
    };

    connect();

    // Dự phòng khi publication Realtime chưa bật: chỉ hỏi cờ (~250B)/20s.
    // Khác với poll cũ: KHÔNG kéo danh sách phim, chỉ so sánh 1 số.
    const checkVersion = async () => {
      const v = await fetchSiteVersion().catch(() => null);
      if (v && v !== readSiteVersion()) onChange();
    };
    poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void checkVersion();
    }, 20000);

    // Quay lại tab: hỏi cờ ngay, không fetch danh sách.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void checkVersion();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      if (reconnect) window.clearTimeout(reconnect);
      if (heartbeat) window.clearInterval(heartbeat);
      if (poll) window.clearInterval(poll);
      if (debounce) window.clearTimeout(debounce);
      document.removeEventListener("visibilitychange", onVisible);
      try { ws?.close(); } catch { /* đã đóng */ }
    };
  }, [refresh]);

  // Phim mới chưa có route tĩnh: đổi link /phim/<slug>, /xem/<slug> sang dạng
  // ?slug=<slug> ngay khi bấm. Phim có sẵn vẫn giữ URL đẹp như cũ.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor || !anchor.href) return;
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        const path = stripBasePath(url.pathname);
        const match = /^\/(phim|xem)\/([^/]+)\/?$/.exec(path);
        if (!match) return;
        let slug: string;
        try { slug = decodeURIComponent(match[2]); } catch { slug = match[2]; }
        if (staticSlugs.has(slug)) return;
        anchor.setAttribute(
          "href",
          withBasePath(`/${match[1]}/?slug=${encodeURIComponent(slug)}`) + url.search + url.hash
        );
      } catch {
        /* link lạ — giữ nguyên */
      }
    };
    // Đánh dấu link nội bộ thật (bản static export load lại cả trang). Dùng phase
    // bubble để Next Link kịp preventDefault khi chuyển trang mềm; referrer cùng
    // origin không còn được dùng để đoán vì trình duyệt tự reload tab cũng trùng.
    const markInternalNav = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor || !anchor.href) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.protocol !== "http:" && url.protocol !== "https:") return;
        // clicking #anchor trên cùng trang không reload thì không đánh dấu.
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search &&
          url.hash
        )
          return;
        window.sessionStorage.setItem(SKIP_OVERLAY_KEY, String(Date.now()));
      } catch {
        /* không đọc được storage thì cứ để overlay hiện bình thường */
      }
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("click", markInternalNav);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("click", markInternalNav);
    };
  }, []);

  const value = useMemo<LiveContextValue>(
    () => ({ ...state, refresh, loadDetail }),
    [state, refresh, loadDetail]
  );
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

/** Admin thường để trống extra.duration; chophim lấy thời lượng từ phimapi.com.
 *  Gọi theo slug gốc (extra.slug) nên phim bị đổi slug do trùng vẫn lấy đúng. */
const DURATION_CACHE_KEY = "nhotphim:duration:v1:";

function formatApiTime(raw: unknown, type: "series" | "movie"): string | null {
  const text = str(raw);
  if (!text) return null;
  const match = /(\d+)\s*phút/i.exec(text);
  if (!match) return text;
  return `${match[1]} phút${type === "series" ? " / tập" : ""}`;
}

export function useMovieDuration(movie: MovieDetail): string | null {
  const apiSlug = (movie.apiSlug || movie.slug || "").trim();
  const [duration, setDuration] = useState<string | null>(() =>
    formatApiTime(movie.duration, movie.type)
  );

  useEffect(() => {
    let active = true;
    const own = formatApiTime(movie.duration, movie.type);
    if (own) {
      setDuration(own);
      return () => {
        active = false;
      };
    }
    if (!apiSlug) return;
    const key = DURATION_CACHE_KEY + apiSlug;
    try {
      const cached = window.localStorage.getItem(key);
      if (cached) {
        setDuration(cached);
        return;
      }
    } catch {
      /* localStorage có thể bị chặn */
    }
    void fetch(`https://phimapi.com/phim/${encodeURIComponent(apiSlug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const value = formatApiTime(json?.movie?.time, movie.type);
        if (!value) return;
        try {
          window.localStorage.setItem(key, value);
        } catch {
          /* bỏ qua */
        }
        if (active) setDuration(value);
      })
      .catch(() => {
        /* mạng lỗi thì giữ nguyên, không hiện lỗi lên giao diện */
      });
    return () => {
      active = false;
    };
  }, [apiSlug, movie.duration, movie.type]);

  return duration;
}

export function useLiveData(): LiveContextValue {
  return useContext(LiveContext);
}

export function useLiveHome(): HomeData {
  return useContext(LiveContext).home;
}

export function useLiveMovie(slug: string): MovieDetail | null {
  return useContext(LiveContext).movies[slug] || null;
}

export function useLiveNotifications(): LiveNotice[] {
  return useContext(LiveContext).notifications;
}

/** Gợi ý phim dùng chung cho trang chi tiết và trang xem. */
export function liveSuggestions(
  movies: Record<string, MovieDetail>,
  movie: MovieDetail,
  limit: number
): Array<{ slug: string; title: string; poster: string; year: number | null; quality: string }> {
  const pool = Object.values(movies).filter(
    (m) => m.slug !== movie.slug && m.genres.some((g) => movie.genres.includes(g))
  );
  return pool
    .sort(
      (a, b) =>
        (b.rating ?? -1) - (a.rating ?? -1) ||
        String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    )
    .slice(0, limit)
    .map((m) => ({ slug: m.slug, title: m.title, poster: m.poster, year: m.year, quality: m.quality }));
}

export function detailHref(slug: string): string {
  return staticSlugs.has(slug)
    ? withBasePath(`/phim/${slug}`)
    : withBasePath(`/phim/?slug=${encodeURIComponent(slug)}`);
}

export function watchHref(slug: string, hash = ""): string {
  return staticSlugs.has(slug)
    ? withBasePath(`/xem/${slug}${hash}`)
    : withBasePath(`/xem/?slug=${encodeURIComponent(slug)}${hash}`);
}
