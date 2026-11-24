import { readFileSync } from "node:fs";
const s = readFileSync("docs/research/chophim/home.html", "utf8");
const re = /<div hidden id="(S:[^"]+)">/g;
let m;
while ((m = re.exec(s))) {
  const seg = s.slice(m.index + m[0].length, m.index + m[0].length + 420);
  console.log("==", m[1]);
  console.log(seg.replace(/></g, ">\n<"));
  console.log("");
}
