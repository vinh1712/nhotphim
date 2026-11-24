import { readFileSync } from "node:fs";
const s6 = readFileSync("docs/research/chophim/sections/S6.html", "utf8");
// third column: find "Thể Loại Hot" and print its column
const i = s6.indexOf("Thể Loại Hot");
const colStart = s6.lastIndexOf('<div class="w-[85vw]', i);
console.log("== genres col ==");
console.log(s6.slice(colStart, colStart + 2600).replace(/srcset="[^"]*"/g, "").replace(/></g, ">\n<"));
// premium avatar in S5
const s5 = readFileSync("docs/research/chophim/sections/S5.html", "utf8");
const j = s5.indexOf("avatar-ring-premium");
console.log("\n== premium avatar ==");
console.log(s5.slice(Math.max(0, j - 500), j + 500).replace(/></g, ">\n<"));
