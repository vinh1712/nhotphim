import { readFile, writeFile } from "node:fs/promises";

function dims(buf) {
  // PNG
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  // WebP
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const four = buf.toString("ascii", 12, 16);
    if (four === "VP8 ") {
      return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    }
    if (four === "VP8L") {
      const b = buf.readUInt32LE(21);
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
    }
    if (four === "VP8X") {
      return { w: (buf.readUIntLE(24, 3)) + 1, h: (buf.readUIntLE(27, 3)) + 1 };
    }
  }
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

const home = JSON.parse(await readFile(new URL("../src/data/home.json", import.meta.url), "utf8"));
const pub = new URL("../public/", import.meta.url);
for (const s of home.hero.slides) {
  if (!s.logo) { console.log(s.slug, "NO LOGO"); continue; }
  try {
    const buf = await readFile(new URL(s.logo.replace(/^\//, ""), pub));
    const d = dims(buf);
    if (!d) { console.log(s.slug, "cannot parse", s.logo); continue; }
    s.logoW = d.w;
    s.logoH = d.h;
    const A = d.w / d.h;
    // width clamp per observed formula
    let Wmin, Wvw, Wmax, Hmin, Hvw, Hmax;
    if (A >= 420 / 172) {
      Wmin = 252; Wvw = 30; Wmax = 420;
      Hmin = Math.round(Wmin / A); Hvw = Math.round(Wvw / A); Hmax = Math.round(Wmax / A);
    } else {
      Wmax = Math.round(172 * A); Wmin = Math.round(0.6 * Wmax); Wvw = Math.round((30 * Wmax) / 420);
      Hmin = Math.round(Wmin / A); Hvw = Math.round(Wvw / A); Hmax = 172;
    }
    s.logoBox = { Wmin, Wvw, Wmax, Hmin, Hvw, Hmax };
    console.log(s.slug, d.w + "x" + d.h, "A=" + A.toFixed(2), "=>", `clamp(${Wmin}px,${Wvw}vw,${Wmax}px) x clamp(${Hmin}px,${Hvw}vw,${Hmax}px)`);
  } catch (e) {
    console.log(s.slug, "ERR", String(e).slice(0, 60));
  }
}
await writeFile(new URL("../src/data/home.json", import.meta.url), JSON.stringify(home, null, 2), "utf8");
console.log("home.json updated");
