import { readFileSync, writeFileSync } from "node:fs";
const s = readFileSync("docs/research/chophim/sections/S10.html", "utf8");
const i = s.indexOf("anime-banner-wrap-mobile");
const j = s.indexOf('class="swiper-slide"', i);
const end = s.indexOf('class="swiper-slide"', j + 10);
const slide = s.slice(j, end > 0 ? end : j + 6000);
writeFileSync("docs/research/chophim/sections/anime-slide-mobile.html", slide);
console.log("mobile slide len:", slide.length);
console.log(slide.replace(/srcset="[^"]*"/g, "").replace(/sizes="[^"]*"/g, "").replace(/></g, ">\n<"));
