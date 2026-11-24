import { readFileSync, existsSync } from "node:fs";

const p = "C:/Users/FPT/Downloads/quanli-v3.html";
console.log("exists:", existsSync(p));
if (!existsSync(p)) process.exit(0);
const s = readFileSync(p, "utf8");
console.log("bytes:", s.length);

for (const key of ["hero", "Hero", "slider", "Slider", "banner", "Banner", "featured", "Featured"]) {
  let i = 0, n = 0;
  while ((i = s.indexOf(key, i)) >= 0 && n < 4) {
    console.log(`=== ${key} @${i} ===`);
    console.log(JSON.stringify(s.slice(Math.max(0, i - 250), i + 350)));
    i += key.length; n++;
  }
}

// site URL?
const urlMatch = s.match(/https?:\/\/[a-z0-9.-]+\.(com|net|app|fun|wtf|ink|xyz|io)[^"']*/gi) || [];
console.log("\nURLs:", [...new Set(urlMatch)].slice(0, 20).join("\n"));
