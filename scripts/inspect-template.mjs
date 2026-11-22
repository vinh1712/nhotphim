import { readFileSync } from "node:fs";
const h = JSON.parse(readFileSync("docs/research/chophim/home-template.json", "utf8"));

console.log("=== badge texts per section ===");
for (const s of h.sections) {
  const texts = {};
  for (const it of s.items || []) {
    for (const b of it.badges || []) {
      const key = b.pos + "|" + b.cls.slice(0, 60);
      (texts[key] ||= new Set()).add(b.text);
    }
  }
  console.log(`\n${s.id} (${(s.items || []).length} items)`);
  for (const [k, v] of Object.entries(texts)) console.log(`  ${k}  =>  ${[...v].slice(0, 6).join(" // ")}`);
}

console.log("\n=== variants / itemClass per section ===");
for (const s of h.sections) {
  const seen = new Set();
  for (const it of s.items || []) seen.add(`${it.variant} | ${it.itemClass.slice(0, 50)} | rank=${JSON.stringify(it.rank)}`);
  console.log(s.id, [...seen].slice(0, 3));
}

console.log("\n=== rankings ===");
for (const [k, v] of Object.entries(h.rankings)) {
  console.log(k, v.length, JSON.stringify(v.slice(0, 2)));
  const dirs = [...new Set(v.map((r) => r.trendDirection))];
  console.log("  dirs:", dirs.join(","));
}

console.log("\n=== hero thumbs sample ===", JSON.stringify(h.hero.thumbs.slice(0, 3)));
console.log("hero pills:", JSON.stringify(h.hero.pills).slice(0, 300));
console.log("hero slide logoBox variants:", JSON.stringify([...new Set(h.hero.slides.map((s) => JSON.stringify(s.logoBox)))]).slice(0, 500));
