import { readFile, writeFile } from "node:fs/promises";

const html = await readFile(new URL("../docs/research/chophim/home.html", import.meta.url), "utf8");

// Gộp flight payload
const parts = [...html.matchAll(/self\.__next_f\.push\(\[1,\s*"((?:[^"\\]|\\.)*)"\]\)/g)].map((m) => {
  try {
    return JSON.parse('"' + m[1] + '"');
  } catch {
    return m[1];
  }
});
const flight = parts.join("");
console.log("flight len:", flight.length);
await writeFile(new URL("../docs/research/chophim/flight.txt", import.meta.url), flight, "utf8");

// Tìm các key dạng "xxx":[ hoặc "xxx":{ ở cấp cao
const keyRe = /"([a-zA-Z_][a-zA-Z0-9_]{2,40})":\s*([\[{])/g;
const counts = {};
let m;
while ((m = keyRe.exec(flight))) {
  const k = m[1] + (m[2] === "[" ? "[]" : "{}");
  counts[k] = (counts[k] || 0) + 1;
}
console.log(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 40));

// Parse mảng JSON cân bằng
function parseArrayAt(s, start) {
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

const arrays = {};
const allKeys = ["movies", "slides", "topics", "comments", "hotMovies", "favoriteMovies", "hotGenres", "genres", "bilingual", "anime", "list", "items"];
for (const key of allKeys) {
  const re = new RegExp('"' + key + '":\\s*\\[', "g");
  let mm;
  let n = 0;
  while ((mm = re.exec(flight))) {
    const arrStart = flight.indexOf("[", mm.index + mm[0].length - 1);
    const raw = parseArrayAt(flight, arrStart);
    try {
      const parsed = JSON.parse(raw);
      (arrays[key] ||= []).push(parsed);
      n++;
    } catch (e) {
      console.log(key, "parse fail:", String(e).slice(0, 80));
    }
  }
  if (n) console.log(key, "-> arrays:", n, "counts:", (arrays[key] || []).map((a) => (Array.isArray(a) ? a.length : typeof a)).join(","));
}
await writeFile(new URL("../docs/research/chophim/flight-arrays.json", import.meta.url), JSON.stringify(arrays, null, 2), "utf8");
if (arrays.movies?.[0]) console.log("movie keys:", Object.keys(arrays.movies[0][0] || arrays.movies[0]));

// Gộp mọi object có slug vào một map
const bySlug = new Map();
function walk(v) {
  if (Array.isArray(v)) return v.forEach(walk);
  if (v && typeof v === "object") {
    if (v.slug && v.name) bySlug.set(v.slug, v);
    Object.values(v).forEach(walk);
  }
}
Object.values(arrays).forEach(walk);
console.log("unique slugs:", bySlug.size);
await writeFile(new URL("../docs/research/chophim/movies-by-slug.json", import.meta.url), JSON.stringify(Object.fromEntries(bySlug), null, 2), "utf8");
