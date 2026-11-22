import { readFileSync } from "node:fs";
for (const f of ["search-rendered.html", "dang-nhap-rendered.html", "phim-bo-rendered.html", "watch-rendered.html", "the-loai-kinh-di-rendered.html", "quoc-gia-han-quoc-rendered.html"]) {
  const s = readFileSync("docs/research/chophim/sections/" + f, "utf8");
  const t = (s.match(/<title>([^<]*)<\/title>/) || [])[1];
  const h1 = (s.match(/<h1[^>]*>([\s\S]{0,150}?)<\/h1>/) || [])[1];
  const empty = /không tìm|Không có kết quả|empty/i.test(s);
  const phimLinks = (s.match(/href="\/phim\//g) || []).length;
  const xemLinks = (s.match(/href="\/xem\//g) || []).length;
  const pages = [...new Set((s.match(/href="\/[^"]*[?&]page=\d+/g) || []))];
  console.log(`${f}\n  title: ${t}\n  h1: ${JSON.stringify(h1 || "").slice(0, 120)}\n  empty-ish: ${empty} | /phim/ links: ${phimLinks} | /xem/ links: ${xemLinks}\n  pagination: ${pages.slice(0, 5).join(", ") || "none"}`);
}
