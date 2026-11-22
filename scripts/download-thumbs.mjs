// Tải hero thumbs (wsrv.nl) về local
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const home = JSON.parse(await readFile(new URL("../src/data/home.json", import.meta.url), "utf8"));
const outDir = new URL("../public/sites/chophim/", import.meta.url);
await mkdir(outDir, { recursive: true });

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131";
let ok = 0, fail = 0;
for (let i = 0; i < home.hero.thumbs.length; i++) {
  const u = home.hero.thumbs[i];
  if (u.startsWith("/")) continue;
  try {
    const res = await fetch(u, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(25000) });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    const name = createHash("sha1").update(u).digest("hex").slice(0, 16) + ".webp";
    await writeFile(new URL(name, outDir), buf);
    home.hero.thumbs[i] = "/sites/chophim/" + name;
    ok++;
  } catch (e) {
    console.log("FAIL", i, String(e).slice(0, 70));
    fail++;
  }
}
console.log("ok:", ok, "fail:", fail);
await writeFile(new URL("../src/data/home.json", import.meta.url), JSON.stringify(home, null, 2), "utf8");
console.log("home.json updated");
