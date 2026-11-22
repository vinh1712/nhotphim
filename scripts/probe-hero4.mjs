import { readFileSync } from "node:fs";
const s = readFileSync("C:/Users/FPT/Downloads/quanli-v3.html", "utf8");

// Liệt kê TẤT cả vị trí "hero" trong JS (sau 136000 là vùng script) để tìm hàm dựng hero công khai
const positions = [];
let i = 0;
while ((i = s.indexOf("hero", i)) >= 0) { positions.push(i); i += 4; }
console.log("total 'hero':", positions.length);

// nhóm theo vùng 5000 bytes
const groups = new Map();
for (const p of positions) {
  const g = Math.floor(p / 5000) * 5000;
  groups.set(g, (groups.get(g) || 0) + 1);
}
console.log([...groups.entries()].map(([g, n]) => `@${g}: ${n}`).join("\n"));

// các tên hàm/id duy nhất chứa hero
const names = new Set();
for (const m of s.matchAll(/[A-Za-z_$][A-Za-z0-9_$-]*[Hh]ero[A-Za-z0-9_$-]*/g)) names.add(m[0]);
console.log("\nnames:", [...names].join(", "));
