import { readFileSync, readdirSync } from "node:fs";
const s6 = readFileSync("docs/research/chophim/sections/S6.html", "utf8");
// genre pill classes
const pills = [...s6.matchAll(/<span class="(text-\[12px\][^"]*)">([^<]*)<\/span>/g)];
console.log("genre pills:");
for (const p of pills) console.log(" ", p[2], "=>", p[1]);
// avatar frame images used in S5
const s5 = readFileSync("docs/research/chophim/sections/S5.html", "utf8");
const frames = [...s5.matchAll(/src="(\/avt_frames\/[^"?]*)/g)].map(m => m[1]);
console.log("avatar frames:", [...new Set(frames)]);
// do we have them locally?
const files = new Set(readdirSync("public/sites/chophim"));
console.log("local assets:", files.size);
// check assets-map for avt_frames
const map = JSON.parse(readFileSync("docs/research/chophim/assets-map.json", "utf8"));
const frameKeys = Object.keys(map).filter(k => k.includes("avt_frames"));
console.log("avt_frames in map:", frameKeys.slice(0, 5), "->", frameKeys.map(k => map[k]).slice(0, 5));
// check avatar local
const av = Object.keys(map).filter(k => k.includes("/avatars/")).slice(0, 3);
console.log("avatars in map:", av.map(k => k + " -> " + map[k]));
