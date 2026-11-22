import { writeFileSync } from "node:fs";

const SB_URL = "https://tlbumpjugtltznzuwqwt.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYnVtcGp1Z3RsdHpuenV3cXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjc0NDksImV4cCI6MjA5Mzg0MzQ0OX0.EMgx5_nREnfjZaIaLwU9q_KknbnqdxA2fbic_G_Xfdc";

async function pull(table) {
  const all = [];
  for (let off = 0; ; off += 1000) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?select=*`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Range: `${off}-${off + 999}`, "Range-Unit": "rows" },
      signal: AbortSignal.timeout(30000),
    });
    if (r.status !== 200 && r.status !== 206) {
      console.log(`${table}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
      break;
    }
    const rows = await r.json();
    all.push(...rows);
    if (rows.length < 1000) break;
  }
  console.log(`${table}: ${all.length} rows`);
  return all;
}

for (const t of ["comments", "taxonomies", "ep_notifs"]) {
  const rows = await pull(t);
  if (rows.length) {
    console.log(`  columns: ${Object.keys(rows[0]).join(", ")}`);
    console.log(`  sample: ${JSON.stringify(rows[0]).slice(0, 400)}`);
    writeFileSync(`docs/research/quanli/${t}.json`, JSON.stringify(rows, null, 1), "utf8");
  }
}
