import { readFileSync, writeFileSync } from "node:fs";

const inFile = process.argv[2];
const outFile = process.argv[3];
let s = readFileSync(inFile, "utf8");

// collapse svg internals but keep the svg tag itself (icon classes)
s = s.replace(/<svg([\s\S]*?)<\/svg>/g, (m, attrs) => {
  const cls = (attrs.match(/class="([^"]*)"/) || [])[1] || "";
  const extra = (attrs.match(/viewBox="([^"]*)"/) || [])[1] || "";
  return `<svg class="${cls}" viewBox="${extra}">…</svg>`;
});

// collapse each comment item (đã clone sẵn ở DetailPage)
s = s.replace(/<div id="comment-[^"]*"[\s\S]*?(?=<div id="comment-|<div class="flex justify-center gap-3 mt-4"|<\/main>)/g, (m) => {
  const id = (m.match(/id="comment-([^"]*)"/) || [])[1];
  const name = (m.match(/class="font-bold text-\[12px\][^"]*"[^>]*>([^<]{0,30})/) || [])[1] || "";
  return `<!-- COMMENT ${id} ${name.trim()} (${m.length}B, markup giống DetailPage) -->\n`;
});

// pretty
const pretty = s.replace(/></g, ">\n<");
writeFileSync(outFile, pretty, "utf8");
console.log("bytes:", pretty.length, "lines:", pretty.split("\n").length);
