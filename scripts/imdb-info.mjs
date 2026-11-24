import { readFileSync } from "node:fs";
const home = JSON.parse(readFileSync("src/data/home.json", "utf8"));
const flight = readFileSync("docs/research/chophim/flight.txt", "utf8");
console.log("imdb occurrences in flight:", (flight.match(/"imdb[^"]*"/g) || []).slice(0, 10));
// find imdb near hero slugs
for (const sl of home.hero.slides.map(s => s.slug)) {
  const i = flight.indexOf('"' + sl + '"');
  if (i < 0) { console.log(sl, "NOT IN FLIGHT"); continue; }
  const seg = flight.slice(i, i + 3000);
  const m = seg.match(/"imdbRating":"([^"]*)"|"imdb[^,]{0,40}/);
  console.log(sl, "|", m ? m[0] : "no imdb nearby");
}
const movies = JSON.parse(readFileSync("docs/research/chophim/movies-by-slug.json", "utf8"));
const k0 = Object.keys(movies)[0];
console.log("movies-by-slug keys sample:", k0, Object.keys(movies[k0] || {}).join(","));
