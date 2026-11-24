import { readFileSync } from "node:fs";
const home = JSON.parse(readFileSync("src/data/home.json", "utf8"));
console.log("rankings.genres[0]:", JSON.stringify(home.rankings.genres[0], null, 1));
console.log("genres count:", home.rankings.genres.length);
const dirs = new Set();
for (const k of ["hot", "favorite"]) for (const r of home.rankings[k]) dirs.add(String(r.trendDirection));
console.log("trendDirections:", [...dirs]);
console.log("genre trendDirections:", [...new Set(home.rankings.genres.map(g => String(g.trendDirection)))]);
// comment users: premium?
const s5 = readFileSync("docs/research/chophim/sections/S5.html", "utf8");
console.log("avatar-ring-premium count in S5:", (s5.match(/avatar-ring-premium/g) || []).length);
console.log("premiumRingGlow:", (s5.match(/premiumRingGlow/g) || []).length);
console.log("comments with avatarFrame:", home.comments.filter(c => c.user.avatarFrame).length);
console.log("tiers:", [...new Set(home.comments.map(c => c.user.subscriptionTier))]);
// comment card count in swiper
console.log("comment slides:", (s5.match(/swiper-slide !w-/g) || []).length);
// flame svg for rankings columns is lucide-flame; S5 heading svg custom
// hero tmdb formatting check in SSR
const html = readFileSync("docs/research/chophim/home.html", "utf8");
const m = html.match(/>TMDb<\/span><span[^>]*>([^<]*)</g);
console.log("TMDb values in SSR:", m && [...new Set(m)].slice(0, 20));
