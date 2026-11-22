import { readFileSync } from "node:fs";
const rows = JSON.parse(readFileSync("docs/research/quanli/movies.json", "utf8"));
const home = JSON.parse(readFileSync("src/data/home.json", "utf8"));

const slugify = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const quanliSlugs = new Set();
for (const r of rows) {
  quanliSlugs.add(slugify(r.title));
  quanliSlugs.add(slugify(r.titleen));
  if (r.ophim_slug) quanliSlugs.add(r.ophim_slug);
}

const hrefs = new Set();
for (const s of home.sections) for (const it of s.items) if (it.href) hrefs.add(it.href);
for (const c of home.comments) if (c.movieSlug) hrefs.add("/phim/" + c.movieSlug);
for (const r of home.rankings.hot) hrefs.add("/phim/" + r.slug);
for (const h of home.hero.slides) if (h.slug) hrefs.add("/phim/" + h.slug);
for (const a of home.anime.slides) if (a.slug) hrefs.add("/phim/" + a.slug);

const phim = [...hrefs].filter((h) => h.startsWith("/phim/"));
const matched = phim.filter((h) => quanliSlugs.has(h.slice(6)));
console.log("home /phim/ links:", phim.length, "matched in quanli:", matched.length);
console.log("unmatched sample:", phim.filter((h) => !quanliSlugs.has(h.slice(6))).slice(0, 25));
console.log("matched sample:", matched.slice(0, 15));
console.log("quanli total unique slugs:", quanliSlugs.size);

// does quanli have anime titles matching home anime slides?
const anime = home.anime.slides.map((s) => s.title);
console.log("anime slides:", anime.length, anime.slice(0, 6));
for (const a of anime.slice(0, 6)) {
  const hit = rows.find((r) => r.title === a || slugify(r.title) === slugify(a));
  console.log("  anime hit:", a, "->", hit ? "yes" : "no");
}
