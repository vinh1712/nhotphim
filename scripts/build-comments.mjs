import { readFileSync, writeFileSync } from "node:fs";

const movies = JSON.parse(readFileSync("src/data/movies.json", "utf8"));
const raw = JSON.parse(readFileSync("docs/research/quanli/comments.json", "utf8"));

// id -> slug from the movie database
const slugById = {};
for (const [slug, m] of Object.entries(movies)) slugById[m.id] = slug;

const FALLBACK_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88"><rect width="88" height="88" fill="#2a2d3a"/><circle cx="44" cy="34" r="16" fill="#5b6072"/><ellipse cx="44" cy="76" rx="26" ry="18" fill="#5b6072"/></svg>'
  );

const fmtTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const bySlug = {};
const skipped = [];

for (const c of raw) {
  const slug = slugById[c.movie_id];
  if (!slug) {
    skipped.push(`${c.movie_id} "${c.movie_title}" (không có trong movies.json)`);
    continue;
  }
  const rec = {
    id: String(c.id),
    pinned: false,
    admin: !!c.is_admin,
    name: c.author_name || "Ẩn danh",
    gender: null,
    time: fmtTime(c.created_at),
    content: c.parent_id && c.reply_to_name ? `@${c.reply_to_name} ${c.content}` : c.content,
    likes: c.likes ?? 0,
    dislikes: c.dislikes ?? 0,
    avatar: c.author_avatar || FALLBACK_AVATAR,
    frame: null,
    emoji: null,
    // extra (used by trang chủ SocialBox)
    movieTitle: movies[slug].title,
    createdAt: c.created_at,
    parentId: c.parent_id ?? null,
  };
  (bySlug[slug] ||= []).push(rec);
}

// replies ngay sau comment cha, cũ trước mới sau
for (const list of Object.values(bySlug)) {
  list.sort((a, b) => {
    const at = a.createdAt || "";
    const bt = b.createdAt || "";
    return at < bt ? -1 : at > bt ? 1 : 0;
  });
}

writeFileSync("src/data/comments.json", JSON.stringify(bySlug), "utf8");
const total = Object.values(bySlug).reduce((n, l) => n + l.length, 0);
console.log(`comments.json: ${total} comments / ${Object.keys(bySlug).length} movies`);
if (skipped.length) console.log("skipped (movie not in DB):\n  " + skipped.join("\n  "));
console.log("bytes:", readFileSync("src/data/comments.json").length);
