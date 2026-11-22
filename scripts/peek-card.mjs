import { readFileSync } from "node:fs";

const file = process.argv[2] || "docs/research/chophim/sections/phim-bo-main.pretty.html";
const s = readFileSync(file, "utf8");
const start = s.indexOf('<div class="relative movie-card-wrapper">');
const end = s.indexOf('<div class="relative movie-card-wrapper">', start + 10);
console.log(s.slice(start, end));
