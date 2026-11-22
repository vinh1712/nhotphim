import { readFileSync, writeFileSync } from "node:fs";
const home = JSON.parse(readFileSync("src/data/home.json", "utf8"));
const html = readFileSync("docs/research/chophim/home.html", "utf8");

// 1. full section meta
for (const s of home.sections) {
  const { items, ...rest } = s;
  console.log("==", s.id, "| items:", items.length, "|", JSON.stringify(rest).slice(0, 600));
}

// 2. S6 column headings
const s6 = readFileSync("docs/research/chophim/sections/S6.html", "utf8");
console.log("\n== S6 headings ==");
for (const m of s6.matchAll(/<h3[^>]*>([^<]*)<\/h3>/g)) console.log(" ", JSON.stringify(m[1]));

// 3. login banner from home.html
const li = html.indexOf("Đăng nhập để lưu phim xem tiếp");
const lstart = html.lastIndexOf("<section", li);
const lend = html.indexOf("</section>", li) + 10;
const login = html.slice(lstart, lend);
writeFileSync("docs/research/chophim/sections/login.html", login);
console.log("\nlogin len:", login.length);

// 4. topics section S:1 head
const ti = html.indexOf('id="S:1"');
const seg = html.slice(ti, ti + 1200);
console.log("\n== S:1 head ==\n", seg.replace(/></g, ">\n<"));

// 5. hero thumb strip buttons (first 2)
const hi = html.indexOf('data-hero-thumb-index');
console.log("\n== hero thumbs SSR ==", hi >= 0 ? html.slice(hi - 300, hi + 700).replace(/srcset="[^"]*"/g, "") : "not in SSR");
