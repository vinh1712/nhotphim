import { readFile } from "node:fs/promises";
import * as cheerio from "cheerio";

const html = await readFile(new URL("../docs/research/chophim/home.html", import.meta.url), "utf8");
const $ = cheerio.load(html);

const sel = process.argv[2] || "S:2";
const maxDepth = Number(process.argv[3] || 7);
const root = /^S:/.test(sel) ? $(`div#S\\:${sel.split(":")[1]}`).first() : $(sel).first();
if (!root.length) {
  console.log("not found:", sel);
  process.exit(1);
}

function outline(el, depth) {
  if (depth > maxDepth || !el.tagName) return;
  const $el = $(el);
  const cls = String($el.attr("class") || "").slice(0, 90);
  const txt = $el.children().length === 0 ? $el.text().trim().slice(0, 70) : "";
  const at = [];
  if ($el.attr("href")) at.push("href=" + $el.attr("href"));
  if ($el.attr("src")) at.push("src=" + String($el.attr("src")).slice(0, 70));
  if ($el.attr("alt")) at.push("alt=" + $el.attr("alt"));
  if ($el.attr("style")) at.push("style=" + String($el.attr("style")).slice(0, 90));
  console.log("  ".repeat(depth) + el.tagName + (cls ? " ." + cls : "") + (at.length ? " [" + at.join(" ") + "]" : "") + (txt ? ' "' + txt + '"' : ""));
  $el.contents().each((i, c) => {
    if (c.tagName) outline(c, depth + 1);
  });
}
outline(root.get(0), 0);
