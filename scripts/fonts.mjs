// Tải font thật của trang (Be Vietnam Pro, Tektur) từ CSS của site về public/fonts/
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const cssPath = new URL("../docs/research/chophim/css/70fe5e839f30e6e6.css", import.meta.url);
let css = await readFile(cssPath, "utf8");
const outDir = new URL("../public/fonts/", import.meta.url);
await mkdir(outDir, { recursive: true });

const urls = [...new Set([...css.matchAll(/url\((\.\.\/media\/[^)]+)\)/g)].map((m) => m[1]))];
console.log("font files:", urls.size);

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131";
let ok = 0;
for (const u of urls) {
  const abs = "https://chophim.ink/_next/static/" + u.replace("../", "");
  try {
    const res = await fetch(abs, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    const name = createHash("sha1").update(u).digest("hex").slice(0, 12) + ".woff2";
    await writeFile(new URL(name, outDir), buf);
    css = css.split(u).join("/fonts/" + name);
    ok++;
  } catch (e) {
    console.log("fail", u, String(e).slice(0, 60));
  }
}
await writeFile(new URL("../src/app/fonts.css", import.meta.url), css, "utf8");
console.log("downloaded:", ok, "/", urls.length, "-> src/app/fonts.css");
