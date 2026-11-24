// Tải avatar frames về local
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const home = JSON.parse(await readFile(new URL("../src/data/home.json", import.meta.url), "utf8"));
const outDir = new URL("../public/sites/chophim/", import.meta.url);
await mkdir(outDir, { recursive: true });

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131";
const frames = [...new Set(home.comments.map(c => c.user.avatarFrame).filter(Boolean))];
let ok = 0, fail = 0;
for (const f of frames) {
  if (f.startsWith("/sites/")) continue;
  try {
    const url = "https://chophim.ink" + f;
    const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    const name = createHash("sha1").update(f).digest("hex").slice(0, 16) + ".png";
    await writeFile(new URL(name, outDir), buf);
    const local = "/sites/chophim/" + name;
    for (const c of home.comments) if (c.user.avatarFrame === f) c.user.avatarFrame = local;
    ok++;
  } catch (e) {
    console.log("FAIL", f, String(e).slice(0, 70));
    fail++;
  }
}
console.log("frames ok:", ok, "fail:", fail, "total:", frames.length);
await writeFile(new URL("../src/data/home.json", import.meta.url), JSON.stringify(home, null, 2), "utf8");
