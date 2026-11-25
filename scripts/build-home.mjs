import { readFileSync, writeFileSync } from "node:fs";

// ── inputs ─────────────────────────────────────────────────────────────────
const db = JSON.parse(readFileSync("src/data/movies.json", "utf8"));
const comments = JSON.parse(readFileSync("src/data/comments.json", "utf8"));
const taxonomies = JSON.parse(readFileSync("docs/research/quanli/taxonomies.json", "utf8"));
const tpl = JSON.parse(readFileSync("docs/research/chophim/home-template.json", "utf8"));

const movies = Object.values(db);
const bySlug = db;

const createdDesc = (a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
const ratingDesc = (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || createdDesc(a, b);
const pick = (arr, n) => arr.slice(0, n);
const hasVpSource = (m) =>
  (m.servers || []).some(
    (server) => /\(VP\)|VodPhim/i.test(server.name) && (server.episodes || []).some((ep) => !!ep.url)
  );
const SONG_NGU_TOP_CLS =
  "pointer-events-none absolute right-1.5 top-1.5 z-40 flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[9px] font-bold text-[#141414] shadow-sm md:right-2 md:top-2 md:text-[10px]";

// ── item builder (giữ nguyên class của template, thay nội dung bằng quanli) ──
function bottomText(m) {
  if (m.status === "Sắp Chiếu") return "Sắp chiếu";
  if (m.type === "movie") return "PĐ. Full";
  if (m.current && m.total) return `PĐ. ${m.current}TM. ${m.total}`;
  if (m.current) return `PĐ. ${m.current}`;
  return "PĐ. Full";
}

function makeItem(m, t, topBadge) {
  const badges = [];
  const top = (t?.badges || []).find((b) => b.pos === "top");
  // Badge đi theo phim: phim có server VP luôn hiện "Song Ngữ" ở mọi section.
  const songNgu = hasVpSource(m);
  const topText = songNgu ? "Song Ngữ" : topBadge || m.lang || "Vietsub";
  if (top || songNgu || topBadge) {
    badges.push({ pos: "top", text: topText, cls: top?.cls || SONG_NGU_TOP_CLS });
  }
  const bottom = (t?.badges || []).find((b) => b.pos === "bottom");
  if (bottom) badges.push({ pos: "bottom", text: bottomText(m), cls: bottom.cls });

  const portrait = t.variant === "portrait";
  return {
    href: `/phim/${m.slug}`,
    img: portrait ? m.poster || m.backdrop : m.backdrop || m.poster,
    alt: m.title,
    title: m.title,
    sub: m.origin || "",
    badges,
    variant: t.variant,
    rank: t.rank || "",
    itemClass: t.itemClass,
    imgWrapClass: t.imgWrapClass,
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
}

function fillSection(section, list, topBadge) {
  const tplItems = section.items || [];
  const items = list.map((m, i) => makeItem(m, tplItems[i % tplItems.length] || tplItems[0], topBadge));
  return { ...section, items, count: items.length };
}

// ── bộ lọc ─────────────────────────────────────────────────────────────────
const ofCountry = (slug) => movies.filter((m) => m.countrySlug === slug);
const series = movies.filter((m) => m.type === "series");
const films = movies.filter((m) => m.type === "movie");
const horror = movies.filter((m) => m.genreSlugs.includes("kinh-di"));
const anime = movies.filter((m) => m.genreCodes.includes("anime"));
const viet = ofCountry("viet-nam");

// ── sections ───────────────────────────────────────────────────────────────
const sections = tpl.sections.map((s) => {
  switch (s.id) {
    case "S:2":
      return fillSection(s, pick(ofCountry("han-quoc").sort(createdDesc), 15));
    case "S:3":
      return fillSection(s, pick(ofCountry("trung-quoc").sort(createdDesc), 15));
    case "S:4":
      return fillSection(s, pick(ofCountry("au-my").sort(createdDesc), 15));
    case "S:7": {
      // Phim Song Ngữ: chỉ lấy phim có nguồn Server VP (VodPhim) trong trang quản lý.
      const vp = [...movies].filter(hasVpSource).sort(ratingDesc);
      return fillSection(s, pick(vp, 36), "Song Ngữ");
    }
    case "S:8":
      return fillSection(s, pick([...movies].sort(createdDesc), 24));
    case "S:9":
      return fillSection(s, pick([...series].sort(ratingDesc), 10));
    case "S:a": {
      const top = [...horror].sort(ratingDesc)[0];
      const heading = top ? top.title : "Kinh Dị Gay Cấn";
      return { ...fillSection(s, pick([...horror].sort(ratingDesc), 24)), heading, headingParts: [heading] };
    }
    case "S:b":
      return fillSection(s, pick([...series].sort(createdDesc), 24));
    case "S:c":
      return fillSection(s, pick([...viet].sort(createdDesc), 16));
    case "S:d":
      return fillSection(s, pick([...films].sort(createdDesc), 24));
    case "S:e":
      return fillSection(s, pick([...films].sort(ratingDesc), 10));
    default:
      return { ...s, items: [], count: 0 };
  }
});

// ── hero (theo danh sách admin chọn ở trang quản lí "Hero / Banner") ───────
// Nguồn: Supabase app_settings.key = "hero_movies" → docs/research/quanli/hero_movies.json
let heroIds = [];
try {
  heroIds = JSON.parse(readFileSync("docs/research/quanli/hero_movies.json", "utf8")).map((x) => x.id);
} catch {
  heroIds = [];
}

const byId = new Map(movies.map((m) => [m.id, m]));
const heroMovies = heroIds.map((id) => byId.get(id)).filter(Boolean);

// fallback: không có selection → phim có logo mới nhất (giữ hành vi cũ)
const logoMovies = movies.filter((m) => m.logo && m.backdrop).sort(createdDesc);
const heroPool =
  heroMovies.length > 0 ? heroMovies : logoMovies.length >= 8 ? logoMovies : [...movies].filter((m) => m.backdrop).sort(createdDesc);

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
  logoBox: tpl.hero.slides[i % tpl.hero.slides.length]?.logoBox,
}));
console.log(`hero: ${heroSlides.length} slide (${heroMovies.length > 0 ? "admin selection" : "fallback logo movies"})`);

// ── anime ──────────────────────────────────────────────────────────────────
const animeSlides = [...anime].sort(createdDesc).map((m) => ({
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

// ── bình luận trang chủ (từ bảng comments của trang quản lí) ──────────────
const homeComments = [];
for (const [slug, list] of Object.entries(comments)) {
  const m = bySlug[slug];
  if (!m) continue;
  for (const c of list) {
    const parentId = c.parentId ? String(c.parentId) : null;
    const replies = parentId ? 0 : list.filter((x) => x.parentId && String(x.parentId) === String(c.id)).length;
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
      parentId,
      isSpoiler: !!c.isSpoiler,
    });
  }
}
homeComments.sort(
  (a, b) => Date.parse(String(b.createdAt || "")) - Date.parse(String(a.createdAt || ""))
);

// ── bảng xếp hạng ─────────────────────────────────────────────────────────
const trend = ["up", "down", "same", "up", "down"];
const hot = pick([...movies].sort(ratingDesc), 5).map((m, i) => ({
  slug: m.slug,
  name: m.title,
  poster_url: m.poster,
  score: Math.round((m.rating ?? 0) * 100),
  trendDirection: trend[i],
}));
const hotSet = new Set(hot.map((r) => r.slug));
const favorite = pick(
  [...movies].filter((m) => !hotSet.has(m.slug)).sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || (b.likes ?? 0) - (a.likes ?? 0)),
  5
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
  .slice(0, 5)
  .map(([slug, count], i) => ({
    name: taxonomies.find((t) => t.type === "category" && t.slug === slug)?.name || slug,
    slug,
    count,
    trendDirection: trend[i],
  }));

// ── assemble ───────────────────────────────────────────────────────────────
const home = {
  header: tpl.header,
  hero: { pills: tpl.hero.pills, slides: heroSlides, thumbs: heroSlides.map((s) => s.backdrop) },
  topics: tpl.topics,
  moreTopics: tpl.moreTopics,
  sections,
  footer: tpl.footer,
  anime: { slides: animeSlides },
  comments: homeComments,
  rankings: { hot, favorite, genres },
  topicsFull: tpl.topicsFull,
};

writeFileSync("src/data/home.json", JSON.stringify(home), "utf8");
console.log(`home.json rebuilt: hero=${heroSlides.length} anime=${animeSlides.length} comments=${homeComments.length} rankings=${hot.length}/${favorite.length}/${genres.length}`);
for (const s of sections) console.log(`  ${s.id} "${s.heading.slice(0, 40)}" -> ${s.items.length} items`);
console.log("bytes:", readFileSync("src/data/home.json").length);
