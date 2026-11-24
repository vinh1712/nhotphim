import { readFile, writeFile } from "node:fs/promises";
const p = new URL("../src/data/home.json", import.meta.url);
const home = JSON.parse(await readFile(p, "utf8"));

// các box đã chụp trực tiếp từ live site
const captured = {
  "thap-van-cuong-hoa-nhap-mong-lai": [380, 162],
  "loi-noi-doi-hoan-hao": [420, 50],
  "hoang-hau-tai-hon": [380, 160],
  "viec-ma-luong-quai": [350, 188],
  "hom-nay-troi-do-mua-bong-may": [430, 172],
};

for (const s of home.hero.slides) {
  let Wmax;
  if (captured[s.slug]) {
    Wmax = captured[s.slug][0];
  } else {
    // ước lượng: ~20.3% chiều rộng tự nhiên, clamp 350..430
    Wmax = Math.min(430, Math.max(350, Math.round(s.logoW * 0.203)));
  }
  const A = s.logoW / s.logoH;
  const Hmax = captured[s.slug] ? captured[s.slug][1] : Math.round(Wmax / A);
  const Wmin = Math.round(0.6 * Wmax);
  const Wvw = Math.round(Wmax / 14);
  const Hmin = Math.round(0.6 * Hmax);
  const Hvw = Math.round(Hmax / 14);
  s.logoBox = { Wmin, Wvw, Wmax, Hmin, Hvw, Hmax };
  console.log(s.slug, `clamp(${Wmin}px,${Wvw}vw,${Wmax}px) x clamp(${Hmin}px,${Hvw}vw,${Hmax}px)`, captured[s.slug] ? "[captured]" : "[estimated]");
}
await writeFile(p, JSON.stringify(home, null, 2), "utf8");
console.log("saved");
