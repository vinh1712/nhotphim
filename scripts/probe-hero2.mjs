import { readFileSync } from "node:fs";
const s = readFileSync("C:/Users/FPT/Downloads/quanli-v3.html", "utf8");

const keys = ["heroFilms", "hero-films", "heroList", "hero-films-panel", "loadHero", "renderHero", "buildHero", "heroSlides", "saveHero", "HERO"];
for (const key of keys) {
  let i = 0, n = 0;
  while ((i = s.indexOf(key, i)) >= 0 && n < 5) {
    console.log(`=== ${key} @${i} ===`);
    console.log(JSON.stringify(s.slice(Math.max(0, i - 250), i + 450)));
    console.log();
    i += key.length; n++;
  }
  if (n === 0) console.log(`--- ${key}: none`);
}
