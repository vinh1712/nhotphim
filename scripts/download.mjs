// Tải toàn bộ ảnh/icontext dùng trên trang chủ về public/sites/chophim/ và rewrite JSON
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const SITE = "https://chophim.ink";
const homePath = new URL("../src/data/home.json", import.meta.url);
const outDir = new URL("../public/sites/chophim/", import.meta.url);
await mkdir(outDir, { recursive: true });

const home = JSON.parse(await readFile(homePath, "utf8"));

const IMG_EXT = /\.(png|jpe?g|webp|gif|svg|avif|ico|woff2?|ttf|mp4|webm)(\?|$)/i;
const isAsset = (s) => {
  if (typeof s !== "string" || s.length < 2) return false;
  if (s.startsWith("/")) return IMG_EXT.test(s) || /^\/(images|icons|branding|api\/hero-banner-assets)\//.test(s);
  if (!/^https?:\/\//.test(s)) return false;
  if (s.includes("chophim.ink")) return IMG_EXT.test(s) || /^https?:\/\/[^/]+\/(images|icons|branding|api\/hero-banner-assets)\//.test(s);
  // ảnh proxy/tmdb
  return IMG_EXT.test(s) || /wsrv\.nl|tmdb\.org|themoviedb\.org|ibyteimg\.com|phimimg\.com|upanhlaylink\.com/.test(s);
};

// thu thập
const urls = new Set();
(function walk(v) {
  if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === "object") Object.values(v).forEach(walk);
  else if (isAsset(v)) urls.add(v);
})(home);
console.log("unique assets:", urls.size);

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";
const map = {};
let done = 0;
let failed = [];

async function dl(url) {
  const abs = url.startsWith("/") ? SITE + url : url;
  try {
    const res = await fetch(abs, { headers: { "user-agent": UA, referer: SITE + "/" }, signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const ct = (res.headers.get("content-type") || "").split(";")[0].trim();
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 40) throw new Error("too small");
    let ext = (path.extname(new URL(abs, SITE).pathname) || "").toLowerCase().replace(".", "");
    if (!ext || !/^(png|jpe?g|webp|gif|svg|avif|ico|woff2?|ttf|mp4|webm)$/.test(ext)) {
      const map2 = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg", "image/avif": "avif", "image/x-icon": "ico", "font/woff2": "woff2", "font/woff": "woff", "video/mp4": "mp4", "video/webm": "webm" };
      ext = map2[ct] || "bin";
    }
    const name = createHash("sha1").update(abs).digest("hex").slice(0, 16) + "." + ext;
    await writeFile(new URL(name, outDir), buf);
    map[url] = "/sites/chophim/" + name;
    done++;
    return true;
  } catch (e) {
    failed.push(url + " :: " + String(e).slice(0, 60));
    return false;
  }
}

const list = [...urls];
const CONC = 8;
for (let i = 0; i < list.length; i += CONC) {
  await Promise.all(list.slice(i, i + CONC).map(dl));
  if (i % 80 === 0) console.log("progress", Math.min(i + CONC, list.length), "/", list.length);
}

// rewrite JSON
let replaced = 0;
(function rewrite(v) {
  if (Array.isArray(v)) v.forEach(rewrite);
  else if (v && typeof v === "object") {
    for (const k of Object.keys(v)) {
      const val = v[k];
      if (typeof val === "string" && map[val]) {
        v[k] = map[val];
        replaced++;
      } else rewrite(val);
    }
  }
})(home);

await writeFile(homePath, JSON.stringify(home, null, 2), "utf8");
await writeFile(new URL("../docs/research/chophim/assets-map.json", import.meta.url), JSON.stringify(map, null, 2), "utf8");
console.log("downloaded:", done, "failed:", failed.length, "replaced:", replaced);
if (failed.length) console.log(failed.slice(0, 20).join("\n"));
