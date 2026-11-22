// Tải các asset local còn thiếu (logo, icons, avatars, images) trực tiếp từ site
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const SITE = "https://chophim.ink";
const outDir = new URL("../public/sites/chophim/", import.meta.url);
await mkdir(outDir, { recursive: true });

const urls = [
  "/branding/logo.png?v=20260510&w=384",
  "/branding/logo.png?v=20260510&w=640",
  "/branding/logo.png?v=20260510&w=256",
  "/icons/vn_flag.svg?w=48",
  "/icons/telegram-icon.svg?w=48",
  "/icons/discord-icon.svg?w=48",
  "/icons/x-icon.svg?w=32",
  "/icons/facebook-icon.svg?w=48",
  "/icons/tiktok-icon.svg?w=48",
  "/icons/youtube-icon.svg?w=48",
  "/icons/threads-icon.svg?w=48",
  "/icons/instagram-icon.svg?w=48",
  "/images/xem-tiep.webp?w=640",
  "/images/home-background.jpg?w=1920",
];

// avatars trong comments + comment cards
import { readFile } from "node:fs/promises";
const home = JSON.parse(await readFile(new URL("../src/data/home.json", import.meta.url), "utf8"));
for (const c of home.comments) {
  if (c.user?.avatarUrl && c.user.avatarUrl.startsWith("/") && !c.user.avatarUrl.startsWith("/sites/")) urls.push(c.user.avatarUrl);
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131";
const map = {};
let ok = 0, fail = 0;
for (const u of [...new Set(urls)]) {
  try {
    const res = await fetch(SITE + u, { headers: { "user-agent": UA, referer: SITE + "/" }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const ct = (res.headers.get("content-type") || "").split(";")[0].trim();
    const buf = Buffer.from(await res.arrayBuffer());
    const map2 = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg", "image/avif": "avif", "image/x-icon": "ico" };
    let ext = (path.extname(new URL(u, SITE).pathname) || "").toLowerCase().replace(".", "");
    if (!/^(png|jpe?g|webp|svg|avif|ico)$/.test(ext)) ext = map2[ct] || "bin";
    const name = createHash("sha1").update(SITE + u).digest("hex").slice(0, 16) + "." + ext;
    await writeFile(new URL(name, outDir), buf);
    map[u] = "/sites/chophim/" + name;
    ok++;
  } catch (e) {
    console.log("FAIL", u, String(e).slice(0, 60));
    fail++;
  }
}
console.log("ok:", ok, "fail:", fail);
await writeFile(new URL("../docs/research/chophim/assets-map-extra.json", import.meta.url), JSON.stringify(map, null, 2), "utf8");
console.log(JSON.stringify(map, null, 1));
