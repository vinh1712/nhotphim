import { readFileSync } from "node:fs";
const s = readFileSync("docs/research/chophim/home.html", "utf8");
// find all IMDb badge occurrences with context
let idx = -1;
while ((idx = s.indexOf(">IMDb<", idx + 1)) >= 0) {
  console.log("---");
  console.log(s.slice(idx - 300, idx + 200).replace(/srcset="[^"]*"/g, ""));
}
