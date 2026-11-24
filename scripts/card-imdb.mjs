import { readFileSync } from "node:fs";
const home = JSON.parse(readFileSync("src/data/home.json", "utf8"));
// does any item meta have imdb?
const withImdb = [];
for (const s of home.sections) for (const it of s.items) if (it.meta && it.meta.imdb) withImdb.push(s.id + " " + it.slug);
console.log("items with meta.imdb:", withImdb.length, withImdb.slice(0, 5));
console.log("item meta keys:", Object.keys(home.sections[0].items[0].meta));
// find which SSR cards have IMDb rows: locate href preceding each occurrence
const html = readFileSync("docs/research/chophim/home.html", "utf8");
let idx = -1;
while ((idx = html.indexOf(">IMDb<", idx + 1)) >= 0) {
  const seg = html.slice(Math.max(0, idx - 4000), idx);
  const hrefs = [...seg.matchAll(/href="(\/phim\/[^"]+)"/g)];
  const last = hrefs[hrefs.length - 1];
  // full meta row html
  const rowStart = seg.lastIndexOf('<div class="flex items-center flex-wrap gap-1.5 mb-2');
  const rowEnd = html.indexOf("</div></div>", idx);
  console.log("href:", last && last[1], "| row:", html.slice(rowStart, rowEnd + 11).slice(0, 700));
}
