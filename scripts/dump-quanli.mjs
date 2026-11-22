import { readFileSync, writeFileSync } from "node:fs";
const p = "C:/Users/FPT/Downloads/quanli-v3.html";
const s = readFileSync(p, "utf8");
const out = s.slice(213500, 226500);
writeFileSync("docs/research/quanli/movies-chunk.txt", out, "utf8");
console.log("written", out.length);
console.log(out.slice(0, 4000));
