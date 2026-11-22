import { readFileSync, writeFileSync } from "node:fs";

// ── helpers ────────────────────────────────────────────────────────────────
const slugify = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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

const genreMap = JSON.parse(readFileSync("docs/research/quanli/GENRE_MAP.json", "utf8"));
const taxonomies = JSON.parse(readFileSync("docs/research/quanli/taxonomies.json", "utf8"));
const quanli = JSON.parse(readFileSync("docs/research/quanli/movies.json", "utf8"));
const homeTpl = JSON.parse(readFileSync("docs/research/chophim/home-template.json", "utf8"));

// taxonomy lookup: VN category name -> slug
const catNameToSlug = {};
for (const t of taxonomies) if (t.type === "category") catNameToSlug[t.name] = t.slug;

const pad2 = (n) => String(n).padStart(2, "0");
const num = (v) => {
  const n = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};
const parseJson = (v) => {
  if (v == null) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};
const str = (v) => (v == null ? "" : String(v).trim());

// ── home slug index (prefer slugs the old site already linked to) ──────────
const homeSlugs = new Set();
for (const s of homeTpl.sections) for (const it of s.items) if (it.slug) homeSlugs.add(it.slug);
for (const s of homeTpl.hero?.slides || []) if (s.slug) homeSlugs.add(s.slug);
for (const s of homeTpl.anime?.slides || []) if (s.slug) homeSlugs.add(s.slug);

function primarySlug(r) {
  const cands = [r.ophim_slug, slugify(r.title), slugify(r.titleen)].filter(Boolean);
  for (const c of cands) if (homeSlugs.has(c)) return c;
  return cands[0] || slugify(r.title);
}

// ── episode servers ────────────────────────────────────────────────────────
// KK (link2) thực chất là manifest .m3u8, có khi bọc trong /player/?url=...
// Nên gộp vào nguồn KK dạng phát trực tiếp và bỏ hẳn dạng embed.
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

function buildServers(r, sub) {
  const episodes = parseJson(r.episodes);
  const fields = [
    { key: "link", name: `${sub} (NC)` },
    { key: "link3", name: `${sub} (VP)` },
  ];
  const labelOf = (ep) => (r.type === "movie" ? "Full" : `Tập ${pad2(ep.name)}`);
  const servers = [];
  if (Array.isArray(episodes) && episodes.length) {
    for (const f of fields) {
      const eps = episodes.map((ep) => {
        const raw = str(ep?.[f.key]);
        return { label: labelOf(ep), url: isKkEmbed(raw) ? null : raw || null };
      });
      if (eps.some((e) => e.url)) servers.push({ name: f.name, episodes: eps });
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
      { url: isKkEmbed(r.embedurl) ? null : str(r.embedurl), name: `${sub} (NC)` },
      { url: isKkEmbed(r.embedurl3) ? null : str(r.embedurl3), name: `${sub} (VP)` },
      { url: directM3u8(r.embedurl2) || directM3u8(r.m3u8url), name: `${sub} (KK)` },
    ].filter((x) => x.url);
    if (single.length) {
      const label = r.type === "movie" ? "Full" : r.currentep ? `Tập ${pad2(r.currentep)}` : "Full";
      servers.push(...single.map((s) => ({ name: s.name, episodes: [{ label, url: s.url }] })));
    }
  }
  return servers;
}

// ── normalize one admin row ────────────────────────────────────────────────
function normalize(r) {
  const slug = primarySlug(r);
  const extra = parseJson(r.extra) || {};
  const sub = str(r.sub) || "Vietsub";
  const genreCodes = String(r.genre || "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  const genres = genreCodes.map((c) => genreMap[c] || c).filter(Boolean);
  const genreSlugs = [...new Set(genres.map((g) => catNameToSlug[g]).filter(Boolean))];
  const countryCode = str(r.country).toLowerCase();
  const countrySlug = COUNTRY_CODE[countryCode] || null;
  const countries = countrySlug ? [taxonomies.find((t) => t.type === "country" && t.slug === countrySlug)?.name || countryCode] : [];
  const formatSlug = str(r.quality).toLowerCase() || null;
  const movietypeSlug = r.type === "movie" ? "phim-le" : "phim-bo";

  const current = num(r.currentep);
  const total = num(r.totalep);
  const epstatus = str(r.epstatus);

  let status;
  if (epstatus === "Hoàn thành") status = current && total ? `Hoàn Tất (${current}/${total})` : "Hoàn Tất";
  else if (epstatus === "Đang chiếu") status = current && total ? `Đang Tập (${current}/${total})` : "Đang Tập";
  else if (epstatus === "Sắp chiếu") status = "Sắp Chiếu";
  else status = current && total ? (current >= total ? `Hoàn Tất (${current}/${total})` : `Đang Tập (${current}/${total})`) : "Hoàn Tất";

  const ratingRaw = r.rating && r.rating !== "N/A" ? parseFloat(r.rating) : null;
  const imdbScore = extra.imdbScore ? parseFloat(extra.imdbScore) : null;
  const rating = Number.isFinite(ratingRaw) ? ratingRaw : Number.isFinite(imdbScore) ? imdbScore : null;

  let episodeLabel;
  if (r.type === "movie") episodeLabel = r.ep && !/^full$/i.test(str(r.ep)) ? str(r.ep) : "";
  else episodeLabel = current ? `Tập ${current}` : str(r.ep).replace(/^Full\s*/i, "") || "";

  return {
    slug,
    title: str(r.title),
    origin: str(r.titleen),
    poster: str(r.poster),
    backdrop: str(r.backdrop),
    logo: str(r.logo) || null,
    year: num(r.year),
    quality: str(r.quality) || "FHD",
    lang: sub,
    episodeLabel,
    status,
    current,
    total,
    type: r.type === "movie" ? "movie" : "series",
    genres,
    countries,
    rating,
    description: str(r.description) || str(r.desc) || str(extra.metaDesc),
    director: str(extra.director) || null,
    duration: str(extra.duration) || null,
    trailer: str(extra.trailer) || null,
    imdbId: str(extra.imdbId) || null,
    source: "quanli",
    // filter / list fields
    id: r.id,
    createdAt: str(r.created_at),
    epstatus: epstatus || null,
    genreCodes,
    genreSlugs,
    countryCode: countryCode || null,
    countrySlug,
    formatSlug,
    movietypeSlug,
    views: num(extra.views) ?? 0,
    likes: num(extra.likes) ?? 0,
    theater: !!extra.theater,
    servers: buildServers(r, sub),
  };
}

// ── assemble database (quanli only) ────────────────────────────────────────
const db = {};
const collisions = [];
let count = 0;

for (const r of quanli) {
  if (r.hidden) continue;
  const rec = normalize(r);
  if (!rec.slug || !rec.title) continue;
  const prev = db[rec.slug];
  if (prev) {
    // keep the richer record (more episodes / higher progress)
    const score = (x) => (x.servers[0]?.episodes.length || 0) * 100 + (x.current || 0);
    collisions.push(`${rec.slug}: id ${prev.id} vs ${r.id}`);
    if (score(rec) > score(prev)) db[rec.slug] = rec;
    continue;
  }
  db[rec.slug] = rec;
  count++;
}

writeFileSync("src/data/movies.json", JSON.stringify(db), "utf8");
const slugs = Object.keys(db);
console.log(`movies.json: ${slugs.length} entries (quanli only, ${count} unique)`);
if (collisions.length) console.log(`collisions (${collisions.length}):\n  ` + collisions.join("\n  "));

// coverage stats
const noDesc = slugs.filter((s) => !db[s].description).length;
const noServers = slugs.filter((s) => !db[s].servers.length).length;
const noPoster = slugs.filter((s) => !db[s].poster).length;
const noCountry = slugs.filter((s) => !db[s].countrySlug).length;
console.log(`no description: ${noDesc} | no servers: ${noServers} | no poster: ${noPoster} | no country: ${noCountry}`);
console.log(`series: ${slugs.filter((s) => db[s].type === "series").length} | movies: ${slugs.filter((s) => db[s].type === "movie").length}`);
console.log("bytes:", readFileSync("src/data/movies.json").length);
