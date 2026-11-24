import { readFileSync } from "node:fs";
const s = readFileSync("docs/research/chophim/detail.html", "utf8");
const count = (k) => s.split(k).length - 1;
for (const k of ["Bác Sĩ X", "Xem phim", "schema.org", "Tập ", "Đánh giá", "Bình luận", "Diễn viên", "Đạo diễn", "Có thể bạn quan tâm", "episodes", "server1", "play", "phụ đề"]) console.log(k, count(k));
// where is title rendered
let i = 0;
let n = 0;
while ((i = s.indexOf("Bác Sĩ X", i)) >= 0 && n < 12) {
  console.log("---", i, JSON.stringify(s.slice(Math.max(0, i - 160), i + 160)));
  i += 6;
  n++;
}
