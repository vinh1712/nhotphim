import { readFileSync, writeFileSync, existsSync } from "node:fs";

// Quét JSON-LD (schema.org) từ trang chi tiết chophim.ink cho các phim
// đang có trong DB — lấy director / countryOfOrigin / actor / duration.

const movies = JSON.parse(readFileSync("src/data/movies.json", "utf8"));
const targets = Object.values(movies)
  .filter((m) => m.homeMatched)
  .map((m) => m.slug);
console.log("targets:", targets.length);

const outPath = "docs/research/chophim/detail-ld.json";
const out = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : {};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

async function one(slug) {
  const r = await fetch(`https://chophim.ink/phim/${slug}`, {
    headers: { "user-agent": UA },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const html = await r.text();
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("no ld+json");
  const ld = JSON.parse(m[1]);
  const clean = (arr) => (Array.isArray(arr) ? arr.map((x) => (typeof x === "string" ? x : x?.name)).filter(Boolean) : []);
  return {
    "@type": ld["@type"] || null,
    director: clean(ld.director),
    actor: clean(ld.actor),
    country: clean(ld.countryOfOrigin),
    genre: clean(ld.genre),
    duration: typeof ld.duration === "string" ? ld.duration : null,
    year: ld.copyrightYear ?? null,
    sameAs: typeof ld.sameAs === "string" ? [ld.sameAs] : Array.isArray(ld.sameAs) ? ld.sameAs : null,
  };
}

const queue = targets.filter((s) => !out[s]);
console.log("to fetch:", queue.length, "| already:", targets.length - queue.length);

let ok = 0,
  fail = 0;
const WORKERS = 5;
let idx = 0;

async function worker() {
  for (;;) {
    const i = idx++;
    if (i >= queue.length) return;
    const slug = queue[i];
    let lastErr = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        out[slug] = await one(slug);
        ok++;
        lastErr = "";
        break;
      } catch (e) {
        lastErr = String(e).slice(0, 80);
        await new Promise((res) => setTimeout(res, 800 * (attempt + 1)));
      }
    }
    if (lastErr) {
      fail++;
      console.log("FAIL", slug, lastErr);
    }
    if ((ok + fail) % 25 === 0) console.log(`progress ${ok + fail}/${queue.length}`);
  }
}

await Promise.all(Array.from({ length: WORKERS }, worker));
writeFileSync(outPath, JSON.stringify(out, null, 1), "utf8");

const withDir = Object.values(out).filter((x) => x.director?.length).length;
const withCountry = Object.values(out).filter((x) => x.country?.length).length;
const withActor = Object.values(out).filter((x) => x.actor?.length).length;
console.log(`done ok=${ok} fail=${fail} | saved ${Object.keys(out).length}`);
console.log(`ld: director=${withDir} country=${withCountry} actor=${withActor}`);
