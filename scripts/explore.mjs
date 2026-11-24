import { readFile } from "node:fs/promises";
import * as cheerio from "cheerio";
const html = await readFile(new URL("../docs/research/chophim/home.html", import.meta.url), "utf8");
const $ = cheerio.load(html);

// S:7 slider structure
const s7box = $("#S\\:7").first().find("div.relative.group\\/slider").first();
console.log("=== S:7 slider ===");
console.log("box:", String(s7box.parent().attr("class")));
console.log("slider:", String(s7box.attr("class")));
s7box.children().each((i, c) => console.log("  child", i, c.tagName, String($(c).attr("class") || "").slice(0, 200)));

// scroll container + first card wrapper
const sc = s7box.find(".scroll-container, [class*='overflow-x-auto']").first();
console.log("scroll:", String(sc.attr("class") || "").slice(0, 300));
console.log("cardwrap:", String(sc.children().first().attr("class") || "").slice(0, 300));

// S:10 anime: dots + slide count + wrapper of swiper
console.log("\n=== S:10 dots ===");
const s10 = $("#S\\:10").first();
const dots = s10.find("button");
console.log("buttons:", dots.length, "| first:", String(dots.first().attr("class")), "| second:", String(dots.eq(1).attr("class")));

// S:9/S:e rank number element
console.log("\n=== S:9 rank ===");
const rank = $("#S\\:9").first().find("[class*='font-black']").first();
console.log("rank cls:", String(rank.attr("class")).slice(0, 300));
console.log("rank style:", String(rank.attr("style") || "").slice(0, 400));

// S:9 arrows + scroll container class
const s9 = $("#S\\:9").first();
console.log("\n=== S:9 root children ===");
s9.contents().filter((i, c) => c.tagName).each((i, c) => console.log(" ", c.tagName, String($(c).attr("class") || "").slice(0, 180)));

// S:5 comment: full first slide remainder (after line 60)
console.log("\n=== S:5 slide rest ===");
const slide = $("#S\\:5").first().find(".swiper-slide").first();
const html5 = $.html(slide).replace(/\s*srcset="[^"]*"/g, "");
console.log("len:", html5.length);
console.log(html5.slice(1800, 4300));
