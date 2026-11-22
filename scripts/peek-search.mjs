import { readFileSync } from "node:fs";
const s = readFileSync("docs/research/chophim/sections/search-rendered.html", "utf8");
console.log("bytes:", s.length);
console.log("main tags:", (s.match(/<main/g) || []).length);
console.log("/phim/ links:", (s.match(/href="\/phim\//g) || []).length);
console.log("skeletons:", (s.match(/animate-pulse/g) || []).length);
const i = s.indexOf('href="/phim/');
console.log("--- around first /phim/ link ---");
console.log(s.slice(Math.max(0, i - 1500), i + 600).replace(/></g, ">\n<"));
