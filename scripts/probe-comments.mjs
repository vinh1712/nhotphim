import { readFileSync } from "node:fs";
const s = readFileSync("C:/Users/FPT/Downloads/quanli-v3.html", "utf8");
const count = (k) => s.split(k).length - 1;
for (const k of ["comments", "comment", "favorites", "likes", "users", "profiles", "from(\"", "rest/v1/"]) console.log(k, count(k));

// list all rest/v1/ table references
const re = /rest\/v1\/([a-zA-Z_][a-zA-Z0-9_]*)/g;
const tables = {};
let m;
while ((m = re.exec(s))) tables[m[1]] = (tables[m[1]] || 0) + 1;
console.log("tables:", JSON.stringify(tables, null, 1));

// from("x") patterns
const re2 = /from\("([a-zA-Z_][a-zA-Z0-9_]*)"\)/g;
const t2 = {};
while ((m = re2.exec(s))) t2[m[1]] = (t2[m[1]] || 0) + 1;
console.log('from("x"):', JSON.stringify(t2, null, 1));

// contexts for comment
let i = 0, n = 0;
while ((i = s.toLowerCase().indexOf("comment", i)) >= 0 && n < 20) {
  console.log("---", i, JSON.stringify(s.slice(Math.max(0, i - 100), i + 120)));
  i += 7;
  n++;
}
