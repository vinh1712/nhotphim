// Thu thập dữ liệu trang chủ chophim.ink -> docs/research/chophim/
// Chạy: node scripts/inspect.mjs
import { mkdir, writeFile } from "node:fs/promises";

const BASE = "https://chophim.ink";
const OUT = new URL("../docs/research/chophim/", import.meta.url);

await mkdir(OUT, { recursive: true });

const res = await fetch(BASE + "/", {
  headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36" },
});
const html = await res.text();
await writeFile(new URL("home.html", OUT), html, "utf8");

// Ghi lại các thẻ <script src>, <link href> để biết CSS/JS
const links = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map((m) => m[1]);
const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
const imgs = [...html.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
const imgData = imgs.map((tag) => {
  const src = (tag.match(/src="([^"]+)"/) || [])[1] || "";
  const alt = (tag.match(/alt="([^"]*)"/) || [])[1] || "";
  const srcset = (tag.match(/srcset="([^"]*)"/) || [])[1] || "";
  return { src, alt, srcset };
});

await writeFile(
  new URL("assets.json", OUT),
  JSON.stringify({ links, scripts, imgs: imgData }, null, 2),
  "utf8",
);

console.log("html bytes:", html.length);
console.log("links:", links.length, "scripts:", scripts.length, "imgs:", imgData.length);
console.log("has 'Phim Hàn Quốc mới':", html.includes("Phim Hàn"));
console.log(links.filter((l) => l.endsWith(".css")).slice(0, 10));
