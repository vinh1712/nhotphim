import { readFileSync } from "node:fs";
const flight = readFileSync("docs/research/chophim/flight.txt", "utf8");
const i = flight.indexOf('"imdb":{"id"');
console.log("imdb object ctx:", flight.slice(i, i + 300));
// find all hero-slug -> imdb rating mapping
const home = JSON.parse(readFileSync("src/data/home.json", "utf8"));
for (const s of home.hero.slides) {
  const j = flight.indexOf('"' + s.slug + '"');
  if (j < 0) continue;
  const seg = flight.slice(j, j + 4000);
  const m = seg.match(/"imdb":\{[^}]*\}/);
  console.log(s.slug, "=>", m ? m[0] : "none");
}
