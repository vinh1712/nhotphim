import { writeFileSync, mkdirSync } from "node:fs";

mkdirSync("docs/research/nhotphim", { recursive: true });
for (const [name, url] of [
  ["index.html", "https://raw.githubusercontent.com/vinh1712/nhotphim-web/main/index.html"],
  ["router.js", "https://raw.githubusercontent.com/vinh1712/nhotphim-web/main/router.js"],
]) {
  const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
  const t = await r.text();
  writeFileSync(`docs/research/nhotphim/${name}`, t, "utf8");
  console.log(name, r.status, t.length, "bytes");
}
