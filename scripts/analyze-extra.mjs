import { readFileSync } from "node:fs";
const rows = JSON.parse(readFileSync("docs/research/quanli/movies.json", "utf8"));
const f = ["director", "cast", "trailer", "duration", "tmdbId", "imdbId", "imdbScore", "tmdbScore", "tags", "countries", "status"];
const cnt = {};
for (const k of f) cnt[k] = 0;
for (const r of rows) {
  let e = r.extra;
  if (typeof e === "string") { try { e = JSON.parse(e); } catch { e = null; } }
  if (!e || typeof e !== "object") continue;
  for (const k of f) if (e[k] != null && String(e[k]).trim() !== "" && String(e[k]) !== "N/A") cnt[k]++;
}
console.log("non-empty extra fields:", JSON.stringify(cnt));
// sample director/cast/trailer values
for (const r of rows) {
  let e = r.extra; if (typeof e === "string") { try { e = JSON.parse(e); } catch { continue; } }
  if (e && (e.director || e.cast || e.trailer || e.duration)) {
    console.log(r.title, "| dir:", JSON.stringify(e.director), "| cast:", JSON.stringify(e.cast).slice(0,120), "| trailer:", JSON.stringify(e.trailer), "| dur:", JSON.stringify(e.duration));
  }
}
// rating distribution
const rat = {};
for (const r of rows) rat[r.rating] = (rat[r.rating] || 0) + 1;
console.log("ratings:", JSON.stringify(rat));
// sub / ep
console.log("sub:", JSON.stringify(rows.reduce((a, r) => (a[r.sub] = (a[r.sub] || 0) + 1, a), {})));
console.log("ep samples:", JSON.stringify(rows.slice(0, 8).map((r) => r.ep)));
console.log("currentep/totalep samples:", JSON.stringify(rows.slice(0, 6).map((r) => [r.currentep, r.totalep, r.epstatus])));
