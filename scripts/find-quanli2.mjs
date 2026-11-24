import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["C:\\Users\\FPT"];
const skip = /node_modules|\.next|AppData\\Local\\(?!Temp)|\.git|Windows|Program Files/i;
const hits = [];

function walk(dir, depth) {
  if (depth > 6 || hits.length > 300) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (/\\node_modules|\\\.next|\\\.git\\/.test(p)) continue;
    if (e.isDirectory()) walk(p, depth + 1);
    else if (/quan\s*li|quanli|qu[aả]n\s*l[iý]|admin.*data|data.*phim/i.test(e.name)) {
      try {
        const st = statSync(p);
        hits.push({ p, size: st.size, m: st.mtime.toISOString().slice(0, 19) });
      } catch {}
    }
  }
}

for (const r of roots) walk(r, 0);
console.log(JSON.stringify(hits.slice(0, 200), null, 1));
