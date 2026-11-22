import { readFileSync } from "node:fs";
const s = readFileSync("C:/Users/FPT/Downloads/quanli-v3.html", "utf8");

// find how taxonomy slugs map to filtering (category page logic)
for (const key of ["genre.includes", "genre.includes(", "country ===", "country===", "filterMovies", "renderList", "currentCat", "catSlug", "slug ===", "taxonomies", "type === \"category\"", "TYPE_MAP", "mapGenre", "genreMap"]) {
  let i = 0, n = 0;
  while ((i = s.indexOf(key, i)) >= 0 && n < 3) {
    console.log(`=== ${key} @${i} ===`);
    console.log(JSON.stringify(s.slice(Math.max(0, i - 200), i + 320)));
    i += key.length; n++;
  }
}
