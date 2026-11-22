// Lấy cấu hình bỏ qua intro/outro từ chophim.wtf cho từng phim.
// Chạy: node scripts/fetch-skip-times.mjs
import fs from "node:fs";

const FILE = "src/data/movies.json";
const db = JSON.parse(fs.readFileSync(FILE, "utf8"));
const slugs = Object.keys(db);

let done = 0;
let added = 0;
let failed = 0;
let cursor = 0;

async function fetchOne(slug) {
  const url = `https://chophim.wtf/api/skip-times?movie_slug=${encodeURIComponent(slug)}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const introEnd = Number(data?.intro_end);
      const outroStart = Number(data?.outro_start);
      if (Number.isFinite(introEnd) && introEnd > 0) {
        db[slug].introEnd = Math.round(introEnd * 100) / 100;
        added++;
      } else {
        delete db[slug].introEnd;
      }
      if (Number.isFinite(outroStart) && outroStart > 0) {
        db[slug].outroStart = Math.round(outroStart * 100) / 100;
      } else {
        delete db[slug].outroStart;
      }
      return;
    } catch {
      if (attempt === 1) failed++;
    }
  }
}

async function worker() {
  while (cursor < slugs.length) {
    const slug = slugs[cursor++];
    await fetchOne(slug);
    done++;
    if (done % 50 === 0) console.log(`${done}/${slugs.length}`);
  }
}

await Promise.all(Array.from({ length: 8 }, worker));

fs.writeFileSync(FILE, JSON.stringify(db));
console.log({ total: slugs.length, added, failed });
