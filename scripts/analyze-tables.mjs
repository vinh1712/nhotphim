import { readFileSync } from "node:fs";

const tax = JSON.parse(readFileSync("docs/research/quanli/taxonomies.json", "utf8"));
const com = JSON.parse(readFileSync("docs/research/quanli/comments.json", "utf8"));
const movies = JSON.parse(readFileSync("docs/research/quanli/movies.json", "utf8"));
const notif = JSON.parse(readFileSync("docs/research/quanli/ep_notifs.json", "utf8"));

console.log("=== taxonomies by type ===");
const byType = {};
for (const t of tax) (byType[t.type] ||= []).push(t);
for (const [k, v] of Object.entries(byType)) {
  console.log(`${k} (${v.length}):`, v.map((x) => `${x.name}=${x.slug}`).join(", "));
}

console.log("\n=== comments ===");
const byMovie = {};
for (const c of com) (byMovie[c.movie_title] ||= []).push(c);
for (const [k, v] of Object.entries(byMovie)) console.log(` ${k}: ${v.length} (admin:${v.some((x) => x.is_admin)})`);
console.log("parents:", com.filter((c) => c.parent_id).length, "| with avatar:", com.filter((c) => c.author_avatar).length);

console.log("\n=== movie_id -> slug mapping ===");
const byId = Object.fromEntries(movies.map((m) => [m.id, m]));
for (const c of com) {
  const m = byId[c.movie_id];
  console.log(` movie_id=${c.movie_id} "${c.movie_title}" -> ${m ? m.title + " / " + (m.ophim_slug || m.title) : "NOT FOUND"}`);
}

console.log("\n=== ep_notifs ===");
console.log(" sample:", JSON.stringify(notif.slice(0, 3)));
const inDb = notif.filter((n) => movies.some((m) => m.title === n.title));
console.log(" titles matching movies.json:", inDb.length, "/", notif.length);
console.log(" unique titles:", new Set(notif.map((n) => n.title)).size);
