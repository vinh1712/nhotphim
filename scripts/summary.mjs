import { readFile } from "node:fs/promises";
const data = JSON.parse(await readFile(new URL("../src/data/home.json", import.meta.url), "utf8"));
for (const s of data.sections) {
  const v = s.items[0]?.variant || "-";
  console.log(s.id, "|", s.heading.slice(0, 34), "| n=" + s.count, "|", v, "| viewAll:", s.viewAll?.href || "-", "| first:", s.items[0]?.title?.slice(0, 26), "| badges:", JSON.stringify(s.items[0]?.badges?.map((b) => b.text)));
}
console.log("\nhero pills:", JSON.stringify(data.hero.pills));
console.log("hero slides:", data.hero.slides.length, "| sample:", JSON.stringify(data.hero.slides.slice(0, 3), null, 0).slice(0, 400));
console.log("topics:", data.topics.map((t) => t.title + "->" + t.href).join(" | "));
console.log("footer:", JSON.stringify(data.footer.links.slice(0, 8)));
console.log("header nav first:", JSON.stringify(data.header.nav.slice(0, 8)));
