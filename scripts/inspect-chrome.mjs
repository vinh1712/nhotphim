import { readFileSync } from "node:fs";
const h = JSON.parse(readFileSync("docs/research/chophim/home-template.json", "utf8"));

const pick = (label, obj) => {
  const hrefs = new Set();
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      if (typeof v.href === "string") hrefs.add(v.href);
      Object.values(v).forEach(walk);
    }
  };
  walk(obj);
  const arr = [...hrefs];
  const movieLinks = arr.filter((x) => x.startsWith("/phim/"));
  console.log(`${label}: ${arr.length} hrefs, ${movieLinks.length} movie links`);
  if (movieLinks.length) console.log("  " + movieLinks.slice(0, 20).join(" "));
  return arr;
};

const header = pick("header", h.header);
console.log("header nav:", JSON.stringify(h.header.nav?.map((n) => n.label + "=" + n.href)));
console.log("dropdowns:", JSON.stringify(h.header.dropdowns?.map((d) => ({ label: d.label, href: d.href, items: (d.items || []).length }))));
const footer = pick("footer", h.footer);
pick("topics", h.topics);
pick("moreTopics", h.moreTopics);
pick("topicsFull", h.topicsFull);
pick("hero.pills", h.hero.pills);
console.log("\nfooter link sample:", footer.slice(0, 30).join(" "));
