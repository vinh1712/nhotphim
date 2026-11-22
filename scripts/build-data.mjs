// Ghép dữ liệu trang chủ: HTML đã trích + flight payload (metadata phim)
import { readFile, writeFile } from "node:fs/promises";

const home = JSON.parse(await readFile(new URL("../src/data/home.json", import.meta.url), "utf8"));
const flight = JSON.parse(await readFile(new URL("../docs/research/chophim/flight-arrays.json", import.meta.url), "utf8"));
const bySlug = JSON.parse(await readFile(new URL("../docs/research/chophim/movies-by-slug.json", import.meta.url), "utf8"));

const meta = (slug) => {
  const m = bySlug[slug];
  if (!m) return null;
  return {
    year: m.year,
    quality: m.quality,
    episode: m.episode_current,
    tmdb: m.tmdb?.vote_average ?? null,
    content: m.content,
    poster: m.poster_url,
    thumb: m.thumb_url,
    genres: (m.category || []).map((c) => c.name),
    countries: (m.country || []).map((c) => c.name),
    origin: m.origin_name,
    logo: m.titleLogoUrl || null,
  };
};

const slugOf = (href) => {
  const m = /\/phim\/([^/?#]+)/.exec(href || "");
  return m ? m[1] : null;
};

// 1) enrich từng card
for (const s of home.sections) {
  for (const it of s.items) {
    const slug = slugOf(it.href);
    it.slug = slug;
    const mm = meta(slug);
    if (mm) it.meta = mm;
  }
}

// 2) hero slides (15)
home.hero.slides = flight.movies[0].map((m) => ({
  slug: m.slug,
  title: m.name,
  origin: m.origin_name,
  logo: m.titleLogoUrl || null,
  backdrop: m.thumb_url,
  content: m.content,
  year: m.year,
  quality: m.quality,
  episode: m.episode_current,
  tmdb: m.tmdb?.vote_average ?? null,
  genres: (m.category || []).map((c) => c.name),
  hrefWatch: "/xem/" + m.slug,
  hrefDetail: "/phim/" + m.slug,
}));

// 3) anime slides (15)
home.anime = {
  slides: flight.movies[12].map((m) => ({
    slug: m.slug,
    title: m.name,
    origin: m.origin_name,
    backdrop: m.thumb_url,
    poster: m.poster_url,
    content: m.content,
    year: m.year,
    quality: m.quality,
    episode: m.episode_current,
    tmdb: m.tmdb?.vote_average ?? null,
    genres: (m.category || []).map((c) => c.name),
    href: "/phim/" + m.slug,
  })),
};

// 4) comments (10)
home.comments = flight.comments[0].map((c) => ({
  id: c.id,
  movieSlug: c.movieSlug,
  movieName: c.movieName,
  posterUrl: c.posterUrl,
  backdropUrl: c.backdropUrl,
  content: c.content,
  likes: c.likesCount,
  dislikes: c.dislikesCount,
  replies: c.replyCount,
  user: c.user,
}));

// 5) 3 bảng xếp hạng (5 dòng mỗi bảng)
home.rankings = {
  hot: flight.hotMovies[0].slice(0, 5),
  favorite: flight.favoriteMovies[0].slice(0, 5),
  genres: flight.hotGenres[0].slice(0, 5),
};

// 6) topics đầy đủ (20) — lấy màu từ flight, class từ HTML
home.topicsFull = flight.topics[0];

await writeFile(new URL("../src/data/home.json", import.meta.url), JSON.stringify(home, null, 2), "utf8");
console.log("sections:", home.sections.length, "| hero slides:", home.hero.slides.length, "| anime:", home.anime.slides.length, "| comments:", home.comments.length);
console.log("enriched items with meta:", home.sections.reduce((n, s) => n + s.items.filter((i) => i.meta).length, 0), "/", home.sections.reduce((n, s) => n + s.items.length, 0));
console.log("rankings:", home.rankings.hot.length, home.rankings.favorite.length, home.rankings.genres.length);
console.log("comment user keys:", Object.keys(home.comments[0].user || {}));
