import { writeFileSync } from "node:fs";

const SB_URL = "https://tlbumpjugtltznzuwqwt.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYnVtcGp1Z3RsdHpuenV3cXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjc0NDksImV4cCI6MjA5Mzg0MzQ0OX0.EMgx5_nREnfjZaIaLwU9q_KknbnqdxA2fbic_G_Xfdc";

async function req(path, headers = {}) {
  const r = await fetch(`${SB_URL}${path}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, ...headers },
  });
  const text = await r.text();
  return { status: r.status, text };
}

const probe = await req("/rest/v1/movies?select=*&limit=1");
console.log("status", probe.status);
if (probe.status !== 200) {
  console.log(probe.text.slice(0, 600));
  process.exit(1);
}
const one = JSON.parse(probe.text)[0];
console.log("columns:", Object.keys(one).join(", "));

const countR = await req("/rest/v1/movies?select=id&head=true");
console.log("count header:", countR.status, countR.text.slice(0, 200));

// full pull, paginated
const all = [];
const PAGE = 1000;
for (let off = 0; ; off += PAGE) {
  const r = await req(`/rest/v1/movies?select=*&order=created_at.desc`, {
    Range: `${off}-${off + PAGE - 1}`,
    "Range-Unit": "rows",
  });
  if (r.status !== 200 && r.status !== 206) {
    console.log("page error", r.status, r.text.slice(0, 300));
    break;
  }
  const rows = JSON.parse(r.text);
  all.push(...rows);
  console.log("fetched", all.length);
  if (rows.length < PAGE) break;
}

writeFileSync("docs/research/quanli/movies.json", JSON.stringify(all, null, 1), "utf8");
console.log("saved", all.length, "movies");
if (all[0]) console.log("sample:", JSON.stringify(all[0]).slice(0, 1200));
