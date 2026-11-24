import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const roots = [
  join(homedir(), "Downloads"),
  join(homedir(), "Desktop"),
  join(homedir(), "Documents"),
  join(homedir(), "OneDrive", "Documents"),
  join(homedir(), "OneDrive", "Desktop"),
  join(homedir(), "OneDrive", "Downloads"),
  "C:\\Users\\FPT\\OneDrive",
];

const nameRe = /quan|phim|movie|data|list/i;
const extRe = /\.(json|csv|xlsx|xls|txt|md|sql|db|tsv)$/i;
const skip = /node_modules|\.next|AppData|\.git/i;
const hits = [];

function walk(dir, depth) {
  if (depth > 4 || hits.length > 200) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (skip.test(p)) continue;
    if (e.isDirectory()) {
      walk(p, depth + 1);
    } else if (nameRe.test(e.name) && extRe.test(e.name)) {
      try {
        const st = statSync(p);
        hits.push({ p, size: st.size, m: st.mtime.toISOString().slice(0, 19) });
      } catch {}
    }
  }
}

for (const r of roots) walk(r, 0);
console.log(JSON.stringify(hits, null, 1));
