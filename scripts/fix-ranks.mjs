import { readFile, writeFile } from "node:fs/promises";
const p = new URL("../src/data/home.json", import.meta.url);
const home = JSON.parse(await readFile(p, "utf8"));
for (const id of ["S:9", "S:e"]) {
  const s = home.sections.find((x) => x.id === id);
  if (!s) continue;
  s.items.forEach((it, i) => {
    it.rank = String(i + 1);
  });
  console.log(id, s.items.map((i) => i.rank).join(","));
}
await writeFile(p, JSON.stringify(home, null, 2), "utf8");
console.log("saved");
