import { readFileSync } from "node:fs";
const s = readFileSync("C:/Users/FPT/Downloads/quanli-v3.html", "utf8");

// Tìm phần tử hero trong HTML (body) và hàm JS dựng hero cho trang chủ công khai
const keys = ['class="hero', "id=\"hero", "heroBanner", "hero-banner", "heroDots", "heroThumbs", "goHero", "setHero", "heroIdx", "heroIndex", "currentHero"];
for (const key of keys) {
  let i = 0, n = 0;
  while ((i = s.indexOf(key, i)) >= 0 && n < 4) {
    console.log(`=== ${key} @${i} ===`);
    console.log(JSON.stringify(s.slice(Math.max(0, i - 200), i + 400)));
    console.log();
    i += key.length; n++;
  }
  if (n === 0) console.log(`--- ${key}: none`);
}
