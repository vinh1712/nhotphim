// Gọi thử từng route trên dev server, báo lỗi compile/runtime.
import { readFileSync } from "node:fs";

const BASE = process.env.BASE || "http://localhost:3100";

await fetch(`${BASE}/`); // warm-up compile
const m = JSON.parse(readFileSync("src/data/movies.json", "utf8"));
const slug = Object.keys(m)[0];

const routes = [
  "/",
  "/phim-bo",
  "/phim-le",
  "/tv-shows",
  "/hoat-hinh",
  "/phim-sap-chieu",
  "/phim-chieu-rap",
  "/phim-song-ngu",
  "/the-loai/kinh-di",
  "/the-loai/hoat-hinh",
  "/the-loai/khoa-hoc",
  "/quoc-gia/han-quoc",
  "/quoc-gia/anh",
  "/tim-kiem?keyword=bac",
  "/tim-kiem",
  "/dang-nhap",
  "/chu-de",
  "/chu-de/k-drama-han-quoc",
  "/chu-de/phim-han-chua-lanh",
  "/chu-de/phim-chieu-rap",
  "/dien-vien",
  "/lich-chieu",
  "/gioi-thieu",
  "/lien-he",
  "/hoi-dap",
  "/chinh-sach-bao-mat",
  "/dieu-khoan-su-dung",
  "/tai-ung-dung",
  `/phim/${slug}`,
  `/xem/${slug}`,
  "/khong-ton-tai",
];

let bad = 0;
for (const r of routes) {
  try {
    const res = await fetch(BASE + r, { redirect: "manual" });
    const body = await res.text();
    const err =
      body.includes("Internal Server Error") ||
      body.includes("Application error") ||
      body.includes("__next_error__") ||
      res.status >= 500;
    const mark = res.status === 404 ? "404" : err ? "ERR" : "OK ";
    if (err) bad++;
    console.log(`${mark} ${res.status} ${r}${err ? "  <<< " + body.slice(0, 200).replace(/\s+/g, " ") : ""}`);
  } catch (e) {
    bad++;
    console.log(`ERR ${r} ${e.message}`);
  }
}
console.log(bad ? `\n${bad} route lỗi` : "\nTất cả route OK");
