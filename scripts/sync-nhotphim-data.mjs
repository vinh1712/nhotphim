/**
 * Đồng bộ dữ liệu phim từ repo quản lí vinh1712/nhotphim-quanli.
 *
 * Admin (index.html) ghi vào Supabase: movies / taxonomies / comments /
 * app_settings.hero_movies / ep_notifs. Web deploy dạng static (output: export)
 * nhưng đọc Supabase trực tiếp ở client (src/lib/live-data.tsx) nên admin thêm
 * hoặc sửa phim là web cập nhật ngay, KHÔNG cần build lại hay quét định kỳ.
 *
 * Script này chỉ dùng một lần để tạo bộ dữ liệu khởi tạo (HTML tĩnh load nhanh
 * và làm fallback khi mạng lỗi). Không còn nối vào prebuild/CI.
 *
 * Chạy:
 *   node scripts/sync-nhotphim-data.mjs            # kéo + ghi đè src/data
 *   node scripts/sync-nhotphim-data.mjs --dry-run  # chỉ báo cáo, không ghi
 */
import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "src", "data");
const FILES = {
  movies: path.join(DATA_DIR, "movies.json"),
  home: path.join(DATA_DIR, "home.json"),
  comments: path.join(DATA_DIR, "comments.json"),
  taxonomies: path.join(DATA_DIR, "taxonomies.json"),
  notifications: path.join(DATA_DIR, "notifications.json"),
};

const SB_URL = "https://tlbumpjugtltznzuwqwt.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYnVtcGp1Z3RsdHpuenV3cXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjc0NDksImV4cCI6MjA5Mzg0MzQ0OX0.EMgx5_nREnfjZaIaLwU9q_KknbnqdxA2fbic_G_Xfdc";
const PAGE = 1000;
const DRY_RUN = process.argv.includes("--dry-run");
const SKIP = !!process.env.SKIP_DATA_SYNC;
const IS_CI = !!process.env.CI;

// Tiêu đề lấy trực tiếp từ homepage chophim.wtf (phần kinh dị, liên kết /the-loai/kinh-di).
const LIVE_HORROR_HEADING = "Tôi Sợ Con Người Em Rồi Đó, Nhưng Không Bằng Sợ Ma";

// ── helpers ────────────────────────────────────────────────────────────────
const str = (v) => (v == null ? "" : String(v).trim());
const pad2 = (n) => String(n ?? "").padStart(2, "0");
const num = (v) => {
  const n = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};
const slugify = (s) =>
  str(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const parseJson = (v) => {
  if (v == null) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

function readJson(file, fallback) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value, pretty = false) {
  if (DRY_RUN) return;
  const text = JSON.stringify(value, null, pretty ? 1 : 0);
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, text, "utf8");
  try {
    renameSync(tmp, file); // thay file cũ (trên Windows vẫn được)
  } catch {
    writeFileSync(file, text, "utf8");
    try {
      unlinkSync(tmp);
    } catch {}
  }
}

async function request(url, headers = {}, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    try {
      const res = await fetch(url, {
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          "Content-Type": "application/json",
          ...headers,
        },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {}
      if (!res.ok) {
        if (res.status >= 500 && i < tries - 1) {
          await new Promise((r) => setTimeout(r, 600 * (i + 1)));
          continue;
        }
        return { ok: false, status: res.status, error: text.slice(0, 300), data };
      }
      return { ok: true, status: res.status, data };
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  return { ok: false, status: 0, error: String(lastErr), data: null };
}

async function fetchTable(table) {
  const all = [];
  for (let off = 0; off < 50 * PAGE; off += PAGE) {
    const res = await request(`${SB_URL}/rest/v1/${table}?select=*`, {
      Range: `${off}-${off + PAGE - 1}`,
      "Range-Unit": "rows",
    });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${res.error || ""}`);
    if (!Array.isArray(res.data)) throw new Error(`${table}: response không phải mảng`);
    all.push(...res.data);
    if (res.data.length < PAGE) break;
  }
  return all;
}

async function fetchHeroIds() {
  const res = await request(`${SB_URL}/rest/v1/app_settings?key=eq.hero_movies&select=value`);
  if (!res.ok || !Array.isArray(res.data) || !res.data.length) return [];
  const value = res.data[0]?.value;
  const list = typeof value === "string" ? parseJson(value) : value;
  return Array.isArray(list) ? list.map((x) => (x && typeof x === "object" ? x.id : x)).filter((x) => x != null) : [];
}

// ── mapping từ row của admin sang dạng mà web đang dùng ────────────────────
const COUNTRY_CODE = {
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

const FALLBACK_GENRE_MAP = {
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

const directM3u8 = (u) => {
  const s = str(u);
  if (!s) return null;
  try {
    const parsed = new URL(s);
    const inner = parsed.searchParams.get("url");
    if (inner && new URL(inner).pathname.toLowerCase().endsWith(".m3u8")) return inner;
    if (parsed.pathname.toLowerCase().endsWith(".m3u8")) return s;
  } catch {}
  return null;
};
const isKkEmbed = (u) => str(u).includes("player.phimapi.com");

// Admin có khi lưu "Tập 1" / "Tập 01" — chỉ lấy số rồi tự tạo một chữ "Tập".
const episodeLabel = (value, type) => {
  if (type === "movie") return "Full";
  const raw = str(value);
  if (!raw || /^full$/i.test(raw)) return "Full";
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? `Tập ${pad2(digits)}` : raw;
};

function buildServers(row, sub) {
  const episodes = parseJson(row.episodes);
  const fields = [
    { key: "link", name: `${sub} (NC)` },
    { key: "link3", name: `${sub} (VP)` },
  ];
  const labelOf = (ep) => episodeLabel(ep?.name, row.type === "movie" ? "movie" : "series");
  const servers = [];

  if (Array.isArray(episodes) && episodes.length) {
    for (const field of fields) {
      const eps = episodes.map((ep) => {
        const raw = str(ep?.[field.key]);
        return { label: labelOf(ep), url: isKkEmbed(raw) ? null : raw || null };
      });
      if (eps.some((e) => e.url)) servers.push({ name: field.name, episodes: eps });
    }
    const m3 = episodes.map((ep) => directM3u8(ep?.link2) || directM3u8(ep?.m3u8_2));
    if (m3.some(Boolean)) {
      servers.push({
        name: `${sub} (KK)`,
        episodes: episodes.map((ep, i) => ({ label: labelOf(ep), url: m3[i] })),
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
      const label = episodeLabel(row.currentep, row.type === "movie" ? "movie" : "series");
      servers.push(...single.map((s) => ({ name: s.name, episodes: [{ label, url: s.url }] })));
    }
  }
  return servers;
}

function makeNormalizer({ genreMap, catNameToSlug, homeSlugs, taxonomies }) {
  const primarySlug = (row) => {
    const candidates = [row.ophim_slug, slugify(row.title), slugify(row.titleen)].filter(Boolean);
    for (const c of candidates) if (homeSlugs.has(c)) return c;
    return candidates[0] || slugify(row.title);
  };

  return (row) => {
    const slug = primarySlug(row);
    const extra = parseJson(row.extra) || {};
    const sub = str(row.sub) || "Vietsub";
    const genreCodes = str(row.genre)
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);
    const genres = genreCodes.map((c) => genreMap[c] || c).filter(Boolean);
    const genreSlugs = [...new Set(genres.map((g) => catNameToSlug[g]).filter(Boolean))];
    const countryCode = str(row.country).toLowerCase();
    const countrySlug = COUNTRY_CODE[countryCode] || null;
    const countries = countrySlug
      ? [taxonomies.find((t) => t?.type === "country" && t?.slug === countrySlug)?.name || countryCode]
      : [];
    const current = num(row.currentep);
    const total = num(row.totalep);
    const epstatus = str(row.epstatus);
    const ratingRaw = row.rating && row.rating !== "N/A" ? parseFloat(row.rating) : null;
    const imdbScore = extra.imdbScore ? parseFloat(extra.imdbScore) : null;
    const rating = Number.isFinite(ratingRaw) ? ratingRaw : Number.isFinite(imdbScore) ? imdbScore : null;

    let status;
    if (epstatus === "Hoàn thành") status = current && total ? `Hoàn Tất (${current}/${total})` : "Hoàn Tất";
    else if (epstatus === "Đang chiếu") status = current && total ? `Đang Tập (${current}/${total})` : "Đang Tập";
    else if (epstatus === "Sắp chiếu") status = "Sắp Chiếu";
    else status = current && total ? (current >= total ? `Hoàn Tất (${current}/${total})` : `Đang Tập (${current}/${total})`) : "Hoàn Tất";

    let episodeLabel;
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
      apiSlug: str(extra.slug) || str(row.ophim_slug) || slug,
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
    };
  };
}

function buildMovieDb(rows, normalize) {
  const bySlug = new Map();
  for (const row of rows) {
    if (row.hidden === true) continue;
    const rec = normalize(row);
    if (!rec.slug || !rec.title) continue;
    const list = bySlug.get(rec.slug) || [];
    list.push({ row, rec });
    bySlug.set(rec.slug, list);
  }

  const normTitle = (s) =>
    str(s)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const score = (x) => (x.servers[0]?.episodes.length || 0) * 100 + (x.current || 0);

  const db = {};
  let collisions = 0;
  for (const [base, entries] of bySlug) {
    const byTitle = new Map();
    for (const e of entries) {
      const key = normTitle(e.rec.title);
      const list = byTitle.get(key) || [];
      list.push(e);
      byTitle.set(key, list);
    }
    const winners = [...byTitle.values()].map((list) =>
      list.reduce((best, e) => (score(e.rec) > score(best.rec) ? e : best))
    );
    collisions += winners.length - 1;
    winners.forEach((e, i) => {
      let slug = base;
      if (i > 0) {
        const suffix = `${base}-${e.row.id ?? "new"}`;
        slug = suffix;
        let n = 2;
        while (db[slug]) slug = `${suffix}-${n++}`;
      }
      e.rec.slug = slug;
      db[slug] = e.rec;
    });
  }
  return { db, collisions };
}

const FALLBACK_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88"><rect width="88" height="88" fill="#2a2d3a"/><circle cx="44" cy="34" r="16" fill="#5b6072"/><ellipse cx="44" cy="76" rx="26" ry="18" fill="#5b6072"/></svg>'
  );

function buildComments(rows, db) {
  const slugById = new Map();
  for (const [slug, m] of Object.entries(db)) {
    slugById.set(m.id, slug);
    if (m.id != null) slugById.set(String(m.id), slug);
  }
  const fmtTime = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const bySlug = {};
  for (const c of rows) {
    const slug = slugById.get(c.movie_id) || slugById.get(Number(c.movie_id));
    if (!slug) continue;
    (bySlug[slug] ||= []).push({
      id: String(c.id),
      pinned: !!c.pinned,
      admin: !!c.is_admin,
      name: c.author_name || "Ẩn danh",
      gender: null,
      time: fmtTime(c.created_at),
      content: c.parent_id && c.reply_to_name ? `@${c.reply_to_name} ${c.content}` : c.content,
      likes: c.likes ?? 0,
      dislikes: c.dislikes ?? 0,
      avatar: c.author_avatar || FALLBACK_AVATAR,
      frame: null,
      emoji: null,
      movieTitle: db[slug].title,
      createdAt: c.created_at,
      parentId: c.parent_id ?? null,
      isSpoiler: !!c.is_spoiler,
    });
  }
  for (const list of Object.values(bySlug)) {
    list.sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
  }
  return bySlug;
}

function buildHome(tpl, db, comments, taxonomies, heroIds) {
  const movies = Object.values(db);
  const createdDesc = (a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  const ratingDesc = (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || createdDesc(a, b);
  const pick = (arr, n) => arr.slice(0, n);
  const sampleItem = tpl.sections?.find((s) => s.items?.length)?.items?.[0] || {};

  const bottomText = (m) => {
    if (m.status === "Sắp Chiếu") return "Sắp chiếu";
    if (m.type === "movie") return "PĐ. Full";
    if (m.current && m.total) return `PĐ. ${m.current}TM. ${m.total}`;
    if (m.current) return `PĐ. ${m.current}`;
    return "PĐ. Full";
  };
  const makeItem = (m, t) => {
    const badges = [];
    const top = (t?.badges || []).find((b) => b.pos === "top");
    if (top) badges.push({ pos: "top", text: m.lang || "Vietsub", cls: top.cls });
    const bottom = (t?.badges || []).find((b) => b.pos === "bottom");
    if (bottom) badges.push({ pos: "bottom", text: bottomText(m), cls: bottom.cls });
    const portrait = t?.variant === "portrait";
    return {
      href: `/phim/${m.slug}`,
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
  const fillSection = (section, list) => {
    const tplItems = section.items?.length ? section.items : [sampleItem];
    const items = list.map((m, i) => makeItem(m, tplItems[i % tplItems.length] || sampleItem));
    return { ...section, items, count: items.length };
  };

  const ofCountry = (slug) => movies.filter((m) => m.countrySlug === slug);
  const series = movies.filter((m) => m.type === "series");
  const films = movies.filter((m) => m.type === "movie");
  const horror = movies.filter((m) => m.genreSlugs.includes("kinh-di"));
  const anime = movies.filter((m) => m.genreCodes.includes("anime"));
  const viet = ofCountry("viet-nam");

  const sections = (tpl.sections || []).map((s) => {
    switch (s.id) {
      case "S:2": return fillSection(s, pick(ofCountry("han-quoc").sort(createdDesc), 15));
      case "S:3": return fillSection(s, pick(ofCountry("trung-quoc").sort(createdDesc), 15));
      case "S:4": return fillSection(s, pick(ofCountry("au-my").sort(createdDesc), 15));
      case "S:7":
        return fillSection(s, pick([...movies].sort((a, b) => Number(b.lang === "Vietsub") - Number(a.lang === "Vietsub") || ratingDesc(a, b)), 36));
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

  const byId = new Map();
  for (const m of movies) {
    byId.set(m.id, m);
    if (m.id != null) byId.set(String(m.id), m);
  }
  const heroMovies = heroIds.map((id) => byId.get(id)).filter(Boolean);
  const logoMovies = movies.filter((m) => m.logo && m.backdrop).sort(createdDesc);
  const heroPool = heroMovies.length ? heroMovies : logoMovies.length >= 8 ? logoMovies : movies.filter((m) => m.backdrop).sort(createdDesc);
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
    hrefWatch: `/xem/${m.slug}`,
    hrefDetail: `/phim/${m.slug}`,
    logoBox: tpl.hero?.slides?.[i % (tpl.hero.slides.length || 1)]?.logoBox,
  }));

  // Chophim có 15 slide anime; bổ sung phim Nhật/hoạt hình nếu admin chưa đủ 15.
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
    href: `/phim/${m.slug}`,
  }));

  const homeComments = [];
  for (const [slug, list] of Object.entries(comments)) {
    const m = db[slug];
    if (!m) continue;
    for (const c of list) {
      if (c.parentId) continue;
      const replies = list.filter((x) => x.parentId === c.id).length;
      homeComments.push({
        id: c.id,
        movieSlug: slug,
        movieName: m.title,
        posterUrl: m.poster,
        backdropUrl: m.backdrop || m.poster,
        content: c.content,
        likes: c.likes,
        dislikes: c.dislikes,
        replies,
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
        createdAt: c.createdAt,
        parentId: c.parentId ?? null,
        isSpoiler: !!c.isSpoiler,
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
    [...movies].filter((m) => !hotSet.has(m.slug)).sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || (b.likes ?? 0) - (a.likes ?? 0)),
    10
  ).map((m, i) => ({
    slug: m.slug,
    name: m.title,
    poster_url: m.poster,
    count: Math.round((m.rating ?? 7) * 100000) + (m.views || 0),
    trendDirection: trend[(i + 2) % trend.length],
  }));
  const catCounts = {};
  for (const m of movies) for (const g of m.genreSlugs) catCounts[g] = (catCounts[g] || 0) + 1;
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
    footer: {
      ...(tpl.footer || {}),
      desc: str(tpl.footer?.desc).replace(/Chợ Phim|ChoPhim/g, "Nhót Phim"),
      socials: [{ href: "https://t.me/nhot2008", label: "Telegram" }],
      links: (tpl.footer?.links || []).map((link) => ({
        ...link,
        href: link?.href === "#" || ["MotChill", "RoPhim", "PhimMoi", "GhienPhim", "MotChillTv"].includes(link?.label) ? null : link?.href,
      })),
    },
    anime: { slides: animeSlides },
    comments: homeComments,
    rankings: { hot, favorite, genres },
    topicsFull: tpl.topicsFull,
  };
}

/** Bảng ep_notifs của admin → danh sách thông báo "Tập mới" trên web.
 *  Chophim lấy thông báo từ /api/notifications; bản static không có API nên
 *  đóng bóng danh sách này lúc build, còn trạng thái đã đọc lưu ở localStorage. */
function buildNotifications(rows, db) {
  const norm = (s) =>
    str(s)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const movies = Object.values(db);
  const findMovie = (title) => {
    const n = norm(title);
    if (!n) return null;
    const exact = movies.find((m) => norm(m.title) === n || norm(m.origin) === n);
    if (exact) return exact;
    const partial = movies.filter(
      (m) => norm(m.title).includes(n) || n.includes(norm(m.title))
    );
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
      const movie = findMovie(row.title);
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
        link: movie ? `/xem/${movie.slug}${hash}` : null,
        createdAt: str(row.created_at),
      };
    })
    .filter((n) => n.title);
}

// ── chạy ───────────────────────────────────────────────────────────────────
if (SKIP) {
  console.log("[sync-data] SKIP_DATA_SYNC — giữ nguyên src/data/*.json");
  process.exit(0);
}
if (!existsSync(FILES.movies) || !existsSync(FILES.home)) {
  console.error("[sync-data] Thiếu src/data/movies.json hoặc home.json — không thể dùng làm template slug.");
  process.exit(IS_CI ? 1 : 0);
}

const currentDb = readJson(FILES.movies, {});
const tpl = readJson(FILES.home, {});
const currentTax = readJson(FILES.taxonomies, []);
const currentComments = readJson(FILES.comments, {});
const currentNotifications = readJson(FILES.notifications, []);

console.log(`[sync-data] Supabase: ${SB_URL}${DRY_RUN ? " (dry-run)" : ""}`);

let movieRows;
try {
  movieRows = await fetchTable("movies");
  if (!movieRows.length) throw new Error("bảng movies trống");
} catch (err) {
  console.error(`[sync-data] Không tải được movies: ${err.message}`);
  if (IS_CI) process.exit(1);
  console.warn("[sync-data] Giữ nguyên src/data/movies.json và home.json.");
  process.exit(0);
}

let taxonomies = currentTax;
try {
  const rows = await fetchTable("taxonomies");
  if (rows.length) taxonomies = rows;
} catch (err) {
  console.warn(`[sync-data] taxonomies: ${err.message} — giữ file cũ.`);
}

let commentRows = null;
try {
  commentRows = await fetchTable("comments");
} catch (err) {
  console.warn(`[sync-data] comments: ${err.message} — giữ file cũ.`);
}

let heroIds = [];
try {
  heroIds = await fetchHeroIds();
} catch (err) {
  console.warn(`[sync-data] hero_movies: ${err.message} — dùng fallback.`);
}

let noticeRows = null;
try {
  noticeRows = await fetchTable("ep_notifs");
} catch (err) {
  console.warn(`[sync-data] ep_notifs: ${err.message} — giữ file cũ.`);
}

// map thể loại: ưu tiên dữ liệu đang có, bổ sung cho code mới bằng fallback
const derivedGenreMap = {};
for (const m of Object.values(currentDb)) {
  (m.genreCodes || []).forEach((code, i) => {
    const name = (m.genres || [])[i];
    if (code && name && !derivedGenreMap[code]) derivedGenreMap[code] = name;
  });
}
const genreMap = { ...FALLBACK_GENRE_MAP, ...derivedGenreMap };
const catNameToSlug = {};
for (const t of taxonomies) if (t?.type === "category" && t?.name && t?.slug) catNameToSlug[t.name] = t.slug;

const homeSlugs = new Set(Object.keys(currentDb));
for (const s of tpl.sections || []) for (const it of s.items || []) if (it?.slug) homeSlugs.add(it.slug);
for (const s of tpl.hero?.slides || []) if (s?.slug) homeSlugs.add(s.slug);
for (const s of tpl.anime?.slides || []) if (s?.slug) homeSlugs.add(s.slug);

const normalize = makeNormalizer({ genreMap, catNameToSlug, homeSlugs, taxonomies });
const { db, collisions } = buildMovieDb(movieRows, normalize);
const comments = commentRows === null ? currentComments : buildComments(commentRows, db);
const notifications =
  noticeRows === null ? currentNotifications : buildNotifications(noticeRows, db);
const home = buildHome(tpl, db, comments, taxonomies, heroIds);

const added = Object.keys(db).filter((s) => !currentDb[s]);
const removed = Object.keys(currentDb).filter((s) => !db[s]);
console.log(
  `[sync-data] movies.json: ${Object.keys(db).length} phim` +
    ` (thêm ${added.length}, bỏ ${removed.length}, trùng slug ${collisions})`
);
if (added.length) console.log(`  mới: ${added.slice(0, 12).join(", ")}${added.length > 12 ? " …" : ""}`);
if (removed.length) console.log(`  bỏ: ${removed.slice(0, 12).join(", ")}${removed.length > 12 ? " …" : ""}`);
console.log(
  `[sync-data] home.json: hero=${home.hero.slides.length}, anime=${home.anime.slides.length},` +
    ` comments=${home.comments.length}, sections=${home.sections.filter((s) => s.items?.length).length}`
);
console.log(
  `[sync-data] taxonomies=${taxonomies.length}, comments=${Object.values(comments).reduce((n, l) => n + l.length, 0)},` +
    ` notifications=${notifications.length}`
);

writeJson(FILES.movies, db);
writeJson(FILES.home, home);
writeJson(FILES.taxonomies, taxonomies, true);
writeJson(FILES.comments, comments);
writeJson(FILES.notifications, notifications);
console.log(DRY_RUN ? "[sync-data] Dry-run xong (không ghi file)." : "[sync-data] Đã cập nhật src/data/*.json.");
