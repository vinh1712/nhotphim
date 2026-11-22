// Dump outerHTML từng section + header/footer ra docs/research/chophim/sections/ (rút gọn srcset)
import { readFile, writeFile, mkdir } from "node:fs/promises";
import * as cheerio from "cheerio";

const html = await readFile(new URL("../docs/research/chophim/home.html", import.meta.url), "utf8");
const $ = cheerio.load(html);
const outDir = new URL("../docs/research/chophim/sections/", import.meta.url);
await mkdir(outDir, { recursive: true });

function tidy(s) {
  return s
    .replace(/\s*srcset="[^"]*"/g, "")
    .replace(/src="(https?:\/\/[^"]{60,})"/g, 'src="$1..."')
    .replace(/style="color:transparent"/g, "");
}

const files = {};
files["header"] = $.html($("header").first());
files["footer"] = $.html($("footer").first());

// hero: slide mobile (SSR) + wrapper
const heroRoot = $("div#S\\:0").first();
files["hero-wrapper"] = tidy($.html(heroRoot));

for (const id of ["S:1", "S:2", "S:5", "S:6", "S:7", "S:8", "S:9", "S:a", "S:c", "S:10"]) {
  const key = id.replace(":", "");
  const root = $(`div#S\\:${id.split(":")[1]}`).first();
  if (!root.length) continue;
  const h = tidy($.html(root));
  files[key] = h;
}

// card samples nhỏ hơn
function sample(sel, name) {
  const el = $(sel).first();
  if (el.length) files[name] = tidy($.html(el));
}
sample("div#S\\:2 a.shrink-0", "card-landscape");
sample("div#S\\:8 .movie-card", "card-poster");
sample("div#S\\:9 .group", "card-top10");
sample("div#S\\:a .movie-card", "card-featured");
sample("div#S\\:5 .swiper-slide", "card-comment");
sample("div#S\\:6 > div > div", "rank-col");
sample("div#S\\:7 a.movie-card", "card-bilingual");
sample("div#S\\:10 .swiper-slide", "card-anime");
sample("div#S\\:1 a.group", "card-topic");
sample("div#S\\:10 > div > div > a", "anime-link");

for (const [name, content] of Object.entries(files)) {
  await writeFile(new URL(name + ".html", outDir), content, "utf8");
  console.log(name, content.length);
}
