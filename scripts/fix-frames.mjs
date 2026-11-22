import { readFile, writeFile } from "node:fs/promises";
const p = new URL("../src/data/home.json", import.meta.url);
const home = JSON.parse(await readFile(p, "utf8"));
for (const c of home.comments) {
  const f = c.user.avatarFrame;
  if (f && !f.startsWith("/sites/")) {
    const name = f.split("/").pop();
    c.user.avatarFrame = "/sites/chophim/" + name;
  }
}
await writeFile(p, JSON.stringify(home, null, 2), "utf8");
console.log("frames:", home.comments.filter(c => c.user.avatarFrame).map(c => c.user.avatarFrame));
