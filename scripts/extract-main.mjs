import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2] || "docs/research/chophim/sections/watch-rendered.html";
const out = process.argv[3] || "docs/research/chophim/sections/watch-main";
const maxDepth = Number(process.argv[4] || 10);
const s = readFileSync(file, "utf8");

const m = s.match(/<main[\s\S]*?<\/main>/);
if (!m) { console.log("no main"); process.exit(1); }
let html = m[0];

// strip scripts + ad anchors (chúng ta không clone quảng cáo)
html = html.replace(/<script[\s\S]*?<\/script>/g, "");
html = html.replace(/<a [^>]*href="https?:\/\/(hpasoj\.cc|thlink\.pages\.dev)[\s\S]*?<\/a>/g, "");
html = html.replace(/<a [^>]*target="_blank"[^>]*>[\s\S]*?<\/a>/g, (t) => (/<img[^>]*\/ads\//.test(t) ? "" : t));

const pretty = html.replace(/></g, ">\n<");
writeFileSync(out + ".clean.html", html, "utf8");
writeFileSync(out + ".pretty.html", pretty, "utf8");

// outline: proper depth tracking, only element opens
const tokens = pretty.split("\n");
const VOID = new Set(["img", "br", "hr", "input", "meta", "link", "source", "path", "circle", "rect", "ellipse", "use", "col", "wbr"]);
const stack = [];
const lines = [];
let depth = 0;
for (const t of tokens) {
  if (t.startsWith("</")) { stack.pop(); depth = stack.length; continue; }
  if (!t.startsWith("<")) continue; // text
  const name = (t.match(/^<([a-zA-Z][a-zA-Z0-9-]*)/) || [])[1];
  if (!name) continue;
  const selfClose = t.endsWith("/>") || VOID.has(name.toLowerCase());
  if (depth <= maxDepth) {
    const cls = (t.match(/class="([^"]{0,170})/) || [])[1] || "";
    const id = (t.match(/\sid="([^"]*)/) || [])[1] || "";
    const href = (t.match(/href="([^"]{0,60})/) || [])[1] || "";
    lines.push("  ".repeat(depth) + "<" + name + (id ? "#" + id : "") + (cls ? " ." + cls.replaceAll(" ", ".") : "") + (href ? " href=" + href : ""));
  }
  if (!selfClose) { stack.push(name); depth = stack.length; }
}
writeFileSync(out + ".outline.txt", lines.join("\n"), "utf8");
console.log("clean bytes:", html.length, "| pretty lines:", pretty.split("\n").length, "| outline lines:", lines.length);
