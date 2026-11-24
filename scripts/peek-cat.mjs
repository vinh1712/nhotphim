import { readFileSync } from "node:fs";

const file = process.argv[2] || "docs/research/chophim/sections/phim-bo-main.pretty.html";
const s = readFileSync(file, "utf8");

const show = (label, idx, len) => {
  console.log(`\n===== ${label} @${idx} =====`);
  if (idx < 0) return console.log("NOT FOUND");
  console.log(s.slice(idx, idx + len));
};

// header + toggle button
show("H2", s.indexOf("<h2"), 600);
show("BUTTON", s.indexOf("mb-8 font-sans"), 900);

// pagination: search for page links / nav
const pagIdx = s.search(/page=\d+|pagination|Phân trang|Trang \d/i);
show("PAGINATION", pagIdx, 1600);

// "xem them" / view all
const moreIdx = s.search(/Xem thêm|Xem tất cả|Hiện thêm/i);
show("MORE", moreIdx, 500);

// end of grid area (before </main>)
const endIdx = s.lastIndexOf("</main>");
show("BEFORE-MAIN-END", Math.max(0, endIdx - 2500), 2500);
