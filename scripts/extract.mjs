// Trích xuất dữ liệu trang chủ từ HTML đã lưu -> src/data/home.json
import { readFile, writeFile, mkdir } from "node:fs/promises";
import * as cheerio from "cheerio";

const html = await readFile(new URL("../docs/research/chophim/home.html", import.meta.url), "utf8");
const $ = cheerio.load(html);

const text = (el) => ($(el).text() || "").replace(/\s+/g, " ").trim();
const firstImg = ($el) => {
  const img = $el.find("img").first();
  if (!img.length) return null;
  const src = img.attr("src") || "";
  const srcset = img.attr("srcset") || "";
  const best = srcset ? srcset.split(",").map((s) => s.trim().split(/\s+/)[0]).pop() : src;
  return best || src;
};

// ---------- HERO (S:0) ----------
const heroRoot = $("div#S\\:0").first();
const heroPills = heroRoot.find("nav a").map((i, a) => ({ label: text(a), href: $(a).attr("href") })).get();
const heroBackdrops = [];
heroRoot.find("img").each((i, img) => {
  const $img = $(img);
  const cls = String($img.attr("class") || "");
  const src = $img.attr("src") || "";
  if (src.includes("home-background")) return;
  if (cls.includes("blur")) heroBackdrops.push({ src, alt: $img.attr("alt") || "" });
});
// thumb strip (15 nút ảnh nhỏ)
const heroThumbs = [];
heroRoot.find("button img").each((i, img) => heroThumbs.push($(img).attr("src") || ""));

// ---------- TOPICS (S:1) ----------
const topicRoot = $("div#S\\:1").first();
const topics = [];
topicRoot.find("a.group").each((i, a) => {
  const $a = $(a);
  const inner = $a.find("div.relative").first();
  topics.push({
    href: $a.attr("href"),
    cardClass: $a.attr("class"),
    deco: $a.find("div").slice(0, 3).map((j, d) => $(d).attr("class")).get(),
    title: text(inner.find("h3, p").first()) || text(inner),
    html: $.html(inner),
  });
});
const moreTopics = topicRoot.find("a.mt-2").first();

// ---------- SECTIONS (S:2..S:10) ----------
const SECTION_IDS = ["S:2", "S:3", "S:4", "S:5", "S:6", "S:7", "S:8", "S:9", "S:a", "S:b", "S:c", "S:d", "S:e", "S:10"];

function parseBadges($scope) {
  const badges = [];
  $scope.find("div").each((i, d) => {
    const cls = String($(d).attr("class") || "");
    const isTop = cls.includes("right-1.5") && cls.includes("top-1.5");
    const isBottom = cls.includes("inset-x-0") && cls.includes("bottom-0");
    if (!isTop && !isBottom) return;
    // lấy text ở từng leaf để tách riêng badge con
    const leaves = [];
    $(d).find("*").each((j, e) => {
      if ($(e).children().length === 0) {
        const t = text(e);
        if (t) leaves.push(t);
      }
    });
    if (!leaves.length) {
      const t = text(d);
      if (t) leaves.push(t);
    }
    leaves.forEach((t) => badges.push({ pos: isTop ? "top" : "bottom", text: t, cls }));
  });
  return badges;
}

const sections = [];
for (const id of SECTION_IDS) {
  const root = $(`div#S\\:${id.split(":")[1]}`).first();
  if (!root.length) continue;
  const h2 = root.find("h2").first();
  const headingParts = h2.find("span").length ? h2.find("span").map((i, s) => text(s)).get() : [text(h2)];
  const viewAll = root.find("a").filter((i, a) => text(a).includes("Xem toàn bộ")).first();
  const items = [];
  root.find("a, button").each((i, el) => {
    const $el = $(el);
    const hasPortrait = $el.find("div[class*='aspect-[2/3]']").length > 0;
    const hasLandscape = $el.find("div[class*='aspect-video']").length > 0;
    if (!hasPortrait && !hasLandscape) return;
    const img = firstImg($el);
    if (!img) return;
    const h3 = $el.find("h3").first();
    const p = $el.find("p").first();
    const rankEl = $el.parent().find("[class*='text-6xl'], [class*='font-black']").first();
    const prevText = text($el.prev());
    items.push({
      href: $el.attr("href") || null,
      img,
      alt: $el.find("img").first().attr("alt") || "",
      title: h3.length ? text(h3) : text($el),
      sub: p.length ? text(p) : "",
      badges: parseBadges($el),
      variant: hasPortrait ? "portrait" : "landscape",
      rank: /^\d{1,2}$/.test(prevText) ? prevText : rankEl.length ? text(rankEl) : "",
      itemClass: $el.attr("class") || "",
      imgWrapClass: ($el.find("div[class*='aspect-']").first().attr("class") || ""),
    });
  });
  sections.push({
    id,
    heading: headingParts.join(" "),
    headingParts,
    headingClass: h2.attr("class") || "",
    viewAll: viewAll.length ? { label: text(viewAll), href: viewAll.attr("href") } : null,
    sectionClass: root.find("> div > div").first().attr("class") || "",
    count: items.length,
    items,
  });
}

// ---------- HEADER ----------
const header = {
  class: $("header").attr("class") || "",
  nav: $("header nav a").map((i, a) => ({ label: text(a), href: $(a).attr("href") })).get(),
  dropdowns: [],
};
$("header div.nav-item").each((i, d) => {
  const $d = $(d);
  header.dropdowns.push({
    label: text($d.find("> button, > a, > div > button").first()) || text($d.contents().first()),
    links: $d.find("a").map((j, a) => ({ label: text(a), href: $(a).attr("href") })).get(),
  });
});

// ---------- FOOTER ----------
const footer = {
  flag: { text: text($("footer [class*='rounded-full']").first()), href: null },
  links: $("footer a").map((i, a) => ({ label: text(a), href: $(a).attr("href") })).get(),
  desc: text($("footer p").filter((i, p) => text(p).length > 100).first()),
  socials: $("footer a[href^='http']").map((i, a) => ({ href: $(a).attr("href"), label: $(a).find("img").attr("alt") || text(a) })).get(),
};

const out = { header, hero: { pills: heroPills, backdrops: heroBackdrops, thumbs: heroThumbs }, topics, moreTopics: { label: text(moreTopics), href: moreTopics.attr("href"), class: moreTopics.attr("class") }, sections, footer };
await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../src/data/home.json", import.meta.url), JSON.stringify(out, null, 2), "utf8");

console.log("topics:", topics.length, "| heroBackdrops:", heroBackdrops.length, "| heroThumbs:", heroThumbs.length);
console.log("header nav:", header.nav.length, "dropdowns:", header.dropdowns.map((d) => d.label + "(" + d.links.length + ")").join(", "));
console.log("sections:", sections.map((s) => s.id + ":" + s.heading.slice(0, 22) + "=" + s.count).join(" | "));
console.log("footer links:", footer.links.length, "socials:", footer.socials.length);
