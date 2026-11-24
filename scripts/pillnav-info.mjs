import { readFileSync } from "node:fs";
const s = readFileSync("docs/research/chophim/home.html", "utf8");
const i = s.indexOf("Khám phá phim");
console.log("--- pill nav ctx ---");
console.log(s.slice(Math.max(0, i - 1500), i + 900).replace(/></g, ">\n<"));
console.log("IMDb in SSR html:", s.includes("IMDb"), "| count:", (s.match(/IMDb/g) || []).length);
console.log("TMDb count:", (s.match(/TMDb/g) || []).length);
