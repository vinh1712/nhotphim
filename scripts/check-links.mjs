import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(name)) files.push(p);
  }
};
walk("src");

const hrefs = new Set();
for (const f of files) {
  const s = readFileSync(f, "utf8");
  for (const m of s.matchAll(/href="([^"]+)"/g)) {
    const h = m[1];
    if (h.startsWith("/") && !h.startsWith("//")) hrefs.add(h);
  }
  for (const m of s.matchAll(/href=\{`([^`]+)`\}/g)) {
    const h = m[1];
    if (h.startsWith("/")) hrefs.add(h + " [dynamic]");
  }
}

// route đã có
const routes = new Set();
const walkRoutes = (dir, base) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkRoutes(p, base + "/" + name);
    else if (name === "page.tsx") routes.add(base);
  }
};
walkRoutes("src/app", "");

console.log("=== routes ===");
console.log([...routes].sort().join("\n"));
console.log("\n=== hrefs ===");
for (const h of [...hrefs].sort()) console.log(h);
