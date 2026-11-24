import { readFileSync } from "node:fs";

const dir = "docs/research/chophim/sections/";

function firstCard(f, marker) {
  const s = readFileSync(dir + f + ".html", "utf8");
  const i = s.indexOf(marker);
  if (i < 0) return console.log("==", f, "MARKER NOT FOUND");
  const seg = s.slice(i, i + 2600);
  const img = seg.match(/<img[^>]*class="([^"]*)"/);
  const overlay = seg.includes('class="overlay');
  const svg = seg.includes('<svg class="absolute w-12 h-12');
  console.log("==", f, "| imgClass:", img && img[1], "| overlay:", overlay, "| placeholderSVG:", svg);
}

firstCard("Sa", "shrink-0 w-[160px]");
firstCard("S8", "movie-card block group");
firstCard("S7", "movie-card block group");
firstCard("card-landscape", "aspect-video rounded-xl");
firstCard("card-top10", "aspect-[2/3] rounded-b-2xl");
firstCard("Sc", "movie-card block group");
