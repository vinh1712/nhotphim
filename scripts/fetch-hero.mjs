import { writeFileSync } from "node:fs";

const SB_URL = "https://tlbumpjugtltznzuwqwt.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYnVtcGp1Z3RsdHpuenV3cXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjc0NDksImV4cCI6MjA5Mzg0MzQ0OX0.EMgx5_nREnfjZaIaLwU9q_KknbnqdxA2fbic_G_Xfdc";
const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

// 1) hero selection → lưu local
const r = await fetch(`${SB_URL}/rest/v1/app_settings?key=eq.hero_movies&select=*`, {
  headers: H,
  signal: AbortSignal.timeout(30000),
});
console.log("app_settings/hero_movies:", r.status);
const rows = await r.json().catch(() => []);
const value = rows?.[0]?.value ?? [];
writeFileSync("docs/research/quanli/hero_movies.json", JSON.stringify(value, null, 1), "utf8");
console.log(`saved hero_movies.json: ${value.length} phim ->`, value.map((x) => x.id).join(","));

// 2) all keys trong app_settings
const r2 = await fetch(`${SB_URL}/rest/v1/app_settings?select=key`, { headers: H, signal: AbortSignal.timeout(30000) });
console.log("\nkeys:", r2.status, JSON.stringify(await r2.json().catch(() => [])));
