import { readFileSync, writeFileSync } from "node:fs";
const s = readFileSync("C:/Users/FPT/Downloads/quanli-v3.html", "utf8");
const i = s.indexOf("supabase");
console.log(JSON.stringify(s.slice(i - 1500, i + 1500)));
// fallbacks
let j = 0;
while ((j = s.indexOf("fallback", j)) >= 0) {
  console.log("---fallback@" + j, JSON.stringify(s.slice(j - 200, j + 200)));
  j += 8;
}
