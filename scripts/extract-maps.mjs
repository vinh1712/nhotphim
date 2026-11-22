import { readFileSync, writeFileSync } from "node:fs";
const s = readFileSync("C:/Users/FPT/Downloads/quanli-v3.html", "utf8");

function extractDecl(name) {
  const i = s.indexOf(`const ${name} = `);
  if (i < 0) return null;
  const start = s.indexOf(s[i + `const ${name} = `.length] === "{" ? "{" : "[", i);
  let depth = 0;
  let end = start;
  const open = s[start];
  const close = open === "{" ? "}" : "]";
  for (let j = start; j < s.length; j++) {
    const c = s[j];
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) { end = j; break; }
    }
  }
  const literal = s.slice(start, end + 1);
  try {
    return JSON.parse(literal.replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":').replace(/'/g, '"'));
  } catch (e) {
    return { _raw: literal.slice(0, 2000), _err: String(e) };
  }
}

for (const n of ["GENRE_MAP", "COUNTRY_MAP", "GENRE_IMPORT_MAP"]) {
  const v = extractDecl(n);
  console.log("=== " + n);
  console.log(JSON.stringify(v, null, 1).slice(0, 3000));
  if (v && !v._raw) writeFileSync(`docs/research/quanli/${n}.json`, JSON.stringify(v, null, 1), "utf8");
}
