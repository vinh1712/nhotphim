"use client";

/**
 * Lớp dữ liệu "sống" cho bản static export.
 *
 * Trang vẫn được build sẵn (HTML tĩnh, lên nhanh, giữ nguyên giao diện chophim),
 * nhưng ngay khi mở trang client sẽ đọc trực tiếp các bảng Supabase của repo
 * quản lí vinh1712/nhotphim-quanli và đăng ký realtime. Admin thêm/sửa phim,
 * bình luận hay tập mới là homepage / danh mục / thông báo đổi luôn — không cần
 * quét lại 10 phút và không cần build lại.
 *
 * Khi mạng lỗi hoặc Supabase chưa kịp trả về, toàn bộ dữ liệu build sẵn vẫn dùng
 * được nên trang không bao giờ trống.
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
import { stripBasePath, withBasePath } from "./base-path";
import { SB_KEY, SB_URL, sbFetch, sbTable } from "./supabase";
import type {
  DetailComment,
  MovieDetail,
  MovieServer,
} from "@/components/sites/chophim/detail-types";
import { home as staticHomeValue, type HomeData, type Section } from "@/components/sites/chophim/types";

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
};

const CACHE_KEY = "nhotphim:live:v2";
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
  scifi: "Khoa Học VT",
  fantasy: "Viễn Tưởng",
  family: "Gia Đình",
  costumes: "Cổ Trang",
  anime: "Anime & Hoạt Hình",
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

function buildServers(row: Row, sub: string): MovieServer[] {
  const episodes = parseJson(row.episodes);
  const fields = [
    { key: "link", name: `${sub} (NC)` },
    { key: "link3", name: `${sub} (VP)` },
  ];
  const labelOf = (ep: any): string => (row.type === "movie" ? "Full" : `Tập ${pad2(ep?.name)}`);
  const servers: MovieServer[] = [];

  if (Array.isArray(episodes) && episodes.length) {
    for (const field of fields) {
      const eps = episodes.map((ep: any) => {
        const raw = str(ep?.[field.key]);
        return { label: labelOf(ep), url: isKkEmbed(raw) ? null : raw || null };
      });
      if (eps.some((e: { url: string | null }) => e.url)) servers.push({ name: field.name, episodes: eps });
    }
    const m3 = episodes.map((ep: any) => directM3u8(ep?.link2) || directM3u8(ep?.m3u8_2));
    if (m3.some(Boolean)) {
      servers.push({
        name: `${sub} (KK)`,
        episodes: episodes.map((ep: any, i: number) => ({ label: labelOf(ep), url: m3[i] })),
      });
    }
  }

  if (servers.length === 0) {
    const single = [
      { url: isKkEmbed(row.embedurl) ? null : str(row.embedurl), name: `${sub} (NC)` },
      { url: isKkEmbed(row.embedurl3) ? null : str(row.embedurl3), name: `${sub} (VP)` },
      { url: directM3u8(row.embedurl2) || directM3u8(row.m3u8url), name: `${sub} (KK)` },
    ].filter((x) => x.url);
    if (single.length) {
      const label =
        row.type === "movie" ? "Full" : row.currentep ? `Tập ${pad2(row.currentep)}` : "Full";
      servers.push(
        ...single.map((s) => ({ name: s.name, episodes: [{ label, url: s.url }] }))
      );
    }
  }
  return servers;
}

function makeNormalizer(ctx: {
  genreMap: Record<string, string>;
  catNameToSlug: Record<string, string>;
  homeSlugs: Set<string>;
  taxonomies: Taxonomy[];
}) {
  const primarySlug = (row: Row): string => {
    const candidates = [row.ophim_slug, slugify(str(row.title)), slugify(str(row.titleen))].filter(Boolean);
    for (const c of candidates) if (ctx.homeSlugs.has(c)) return c;
    return candidates[0] || slugify(str(row.title));
  };

  return (row: Row): MovieDetail => {
    const slug = primarySlug(row);
    const extra = parseJson(row.extra) || {};
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
    const current = num(row.currentep);
    const total = num(row.totalep);
    const epstatus = str(row.epstatus);
    const ratingRaw = row.rating && row.rating !== "N/A" ? parseFloat(row.rating) : null;
    const imdbScore = extra.imdbScore ? parseFloat(extra.imdbScore) : null;
    const rating = Number.isFinite(ratingRaw) ? ratingRaw : Number.isFinite(imdbScore) ? imdbScore : null;

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
      backdrop: str(row.backdrop),
      logo: str(row.logo) || null,
      year: num(row.year),
      quality: str(row.quality) || "FHD",
      lang: sub,
      episodeLabel,
      status,
      current,
      total,
      type: row.type === "movie" ? "movie" : "series",
      genres,
      countries,
      rating,
      description: str(row.description) || str(row.desc) || str(extra.metaDesc),
      director: str(extra.director) || null,
      duration: str(extra.duration) || null,
      trailer: str(extra.trailer) || null,
      imdbId: str(extra.imdbId) || null,
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
      views: num(extra.views) ?? 0,
      likes: num(extra.likes) ?? 0,
      theater: !!extra.theater,
      servers: buildServers(row, sub),
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

const movieScore = (m: MovieDetail): number => (m.servers[0]?.episodes.length || 0) * 100 + (m.current || 0);

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

const FALLBACK_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88"><rect width="88" height="88" fill="#2a2d3a"/><circle cx="44" cy="34" r="16" fill="#5b6072"/><ellipse cx="44" cy="76" rx="26" ry="18" fill="#5b6072"/></svg>'
  );

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
    } as DetailComment & { createdAt?: string; parentId?: string | null; isSpoiler?: boolean });
    const entry = bySlug[slug][bySlug[slug].length - 1] as DetailComment & { createdAt: string };
    entry.createdAt = str(c.created_at);
    (entry as any).parentId = c.parent_id ?? null;
    (entry as any).isSpoiler = !!c.is_spoiler;
    (entry as any).movieTitle = db[slug].title;
  }
  for (const list of Object.values(bySlug)) {
    list.sort((a, b) =>
      String((a as any).createdAt || "").localeCompare(String((b as any).createdAt || ""))
    );
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
  const makeItem = (m: MovieDetail, t: any): any => {
    const badges: any[] = [];
    const top = (t?.badges || []).find((b: any) => b.pos === "top");
    if (top) badges.push({ pos: "top", text: m.lang || "Vietsub", cls: top.cls });
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
        tmdb: m.rating,
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
  const fillSection = (section: Section, list: MovieDetail[]): Section => {
    const tplItems = section.items?.length ? section.items : [sampleItem];
    const items = list.map((m, i) => makeItem(m, tplItems[i % tplItems.length] || sampleItem));
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
      case "S:2": return fillSection(s, pick(ofCountry("han-quoc").sort(createdDesc), 15));
      case "S:3": return fillSection(s, pick(ofCountry("trung-quoc").sort(createdDesc), 15));
      case "S:4": return fillSection(s, pick(ofCountry("au-my").sort(createdDesc), 15));
      case "S:7":
        return fillSection(
          s,
          pick([...movies].sort((a, b) => Number(b.lang === "Vietsub") - Number(a.lang === "Vietsub") || ratingDesc(a, b)), 36)
        );
      case "S:8": return fillSection(s, pick([...movies].sort(createdDesc), 24));
      case "S:9": return fillSection(s, pick([...series].sort(ratingDesc), 10));
      case "S:a":
        return {
          ...fillSection(s, pick([...horror].sort(ratingDesc), 24)),
          heading: LIVE_HORROR_HEADING,
          headingParts: [LIVE_HORROR_HEADING],
        };
      case "S:b": return fillSection(s, pick([...series].sort(createdDesc), 24));
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
    tmdb: m.rating ?? 0,
    genres: m.genres.slice(0, 3),
    hrefWatch: watchHref(m.slug),
    hrefDetail: detailHref(m.slug),
    logoBox: tpl.hero?.slides?.[i % (tpl.hero.slides.length || 1)]?.logoBox,
  }));

  const animeExtra = movies.filter(
    (m) => m.countrySlug === "nhat-ban" || (m.genres || []).some((g) => /hoạt hình|anime/i.test(g))
  );
  const animePool = [...anime, ...animeExtra]
    .filter((m, i, arr) => arr.findIndex((x) => x.slug === m.slug) === i)
    .sort(createdDesc);
  for (const m of [...movies].sort(createdDesc)) {
    if (animePool.length >= 15) break;
    if (!animePool.some((x) => x.slug === m.slug)) animePool.push(m);
  }
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
    tmdb: m.rating ?? 0,
    genres: m.genres.slice(0, 3),
    href: detailHref(m.slug),
  }));

  const homeComments: any[] = [];
  for (const [slug, list] of Object.entries(comments)) {
    const m = db[slug];
    if (!m) continue;
    for (const c of list) {
      const raw = c as any;
      if (raw.parentId) continue;
      homeComments.push({
        id: c.id,
        movieSlug: slug,
        movieName: m.title,
        posterUrl: m.poster,
        backdropUrl: m.backdrop || m.poster,
        content: c.content,
        likes: c.likes,
        dislikes: c.dislikes,
        replies: list.filter((x) => (x as any).parentId === c.id).length,
        user: {
          displayName: c.name,
          avatarUrl: c.avatar,
          avatarFrame: null,
          subscriptionTier: "free",
          role: c.admin ? "admin" : "user",
          gender: c.gender,
          selectedEmoji: null,
          showPremiumBadge: false,
        },
        createdAt: raw.createdAt,
        parentId: raw.parentId ?? null,
        isSpoiler: !!raw.isSpoiler,
      });
    }
  }
  homeComments.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

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
      updatedAt: value.updatedAt || Date.now(),
      error: null,
    };
  } catch {
    return null;
  }
}

function rowSignature(rows: Row[]): string {
  return rows
    .map((r) =>
      [
        r.id,
        r.updated_at,
        r.created_at,
        r.title,
        r.titleen,
        r.currentep,
        r.totalep,
        r.epstatus,
        r.rating,
        r.hidden,
        r.description,
        r.poster,
        Array.isArray(r.episodes) ? r.episodes.length : 0,
      ].join("~")
    )
    .join("|");
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

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LiveState>(staticState);
  const inFlight = useRef<Promise<void> | null>(null);
  const lastSig = useRef("");
  const lastSigRef = lastSig;

  const refresh = useCallback(async (force = false): Promise<void> => {
    if (typeof window === "undefined") return;
    if (inFlight.current) return inFlight.current;
    const task = (async () => {
      try {
        setState((s) => ({ ...s, refreshing: true }));
        const rows = (await sbTable<Row>("movies")) as Row[];
        if (!rows.length) throw new Error("movies trống");
        const sig = rowSignature(rows);
        if (!force && sig === lastSigRef.current) return;

        const [taxRows, commentRows, noticeRows, heroIds] = await Promise.all([
          sbTable<Row>("taxonomies").catch(() => [] as Row[]),
          sbTable<Row>("comments").catch(() => [] as Row[]),
          sbTable<Row>("ep_notifs").catch(() => [] as Row[]),
          fetchHeroIds().catch(() => [] as Array<string | number>),
        ]);

        const taxonomies = taxRows.length ? (taxRows as Taxonomy[]) : staticState().taxonomies;
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

        const normalize = makeNormalizer({ genreMap, catNameToSlug, homeSlugs, taxonomies });
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
        lastSigRef.current = sig;
        setState(next);
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

  useEffect(() => {
    const cached = readCache();
    if (cached) setState(cached);
    void refresh();
  }, [refresh]);

  // Realtime của Supabase + poll dự phòng. Poll vẫn chạy nếu publication chưa bật
  // hoặc WebSocket bị chặn, nên admin sửa xong là client nhận trong vài giây.
  useEffect(() => {
    let stopped = false;
    let ws: WebSocket | null = null;
    let reconnect: number | undefined;
    let heartbeat: number | undefined;
    let debounce: number | undefined;
    let attempts = 0;
    let seq = 1;

    const onChange = () => {
      if (stopped) return;
      if (debounce) window.clearTimeout(debounce);
      debounce = window.setTimeout(() => void refresh(true), 700);
    };

    const connect = () => {
      if (stopped || typeof WebSocket === "undefined") return;
      try {
        const url = `${SB_URL.replace(/^http/, "ws")}/realtime/v1/websocket?apikey=${encodeURIComponent(SB_KEY)}&vsn=1.0.0`;
        ws = new WebSocket(url);
        ws.onopen = () => {
          attempts = 0;
          ws?.send(
            JSON.stringify({
              topic: "realtime:movies",
              event: "phx_join",
              payload: {
                config: {
                  postgres_changes: [
                    "movies",
                    "comments",
                    "ep_notifs",
                    "taxonomies",
                    "app_settings",
                  ].map((table) => ({ event: "*", schema: "public", table })),
                },
              },
              ref: "1",
            })
          );
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
            if (msg?.event === "postgres_changes") onChange();
          } catch {
            /* bỏ qua frame không đọc được */
          }
        };
        ws.onclose = () => scheduleReconnect();
        ws.onerror = () => {
          try { ws?.close(); } catch { /* đã đóng */ }
        };
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
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh(false);
    }, 20000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh(false);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      if (reconnect) window.clearTimeout(reconnect);
      if (heartbeat) window.clearInterval(heartbeat);
      if (debounce) window.clearTimeout(debounce);
      window.clearInterval(poll);
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
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const value = useMemo<LiveContextValue>(() => ({ ...state, refresh }), [state, refresh]);
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
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
