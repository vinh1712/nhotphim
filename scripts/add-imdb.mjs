import { readFileSync, writeFileSync } from "node:fs";
const arrs = JSON.parse(readFileSync("docs/research/chophim/flight-arrays.json", "utf8"));
const map = {};
const seen = new Set();
const walk = (o) => {
  if (!o || typeof o !== "object" || seen.has(o)) return;
  seen.add(o);
  if (Array.isArray(o)) return o.forEach(walk);
  if (typeof o.slug === "string" && o.imdb && typeof o.imdb === "object") {
    if (!(o.slug in map)) map[o.slug] = o.imdb;
  }
  for (const v of Object.values(o)) walk(v);
};
walk(arrs);
const home = JSON.parse(readFileSync("src/data/home.json", "utf8"));
let added = 0;
for (const s of home.hero.slides) {
  const imdb = map[s.slug];
  if (imdb && imdb.vote_average > 0) { s.imdb = imdb.vote_average; added++; }
}
console.log("imdb map size:", Object.keys(map).length, "| hero slides with imdb>0:", added);
for (const s of home.hero.slides) console.log(" ", s.slug, "=>", s.imdb ?? "-", "| tmdb", s.tmdb);
writeFileSync("src/data/home.json", JSON.stringify(home, null, 2));
