// Liệt kê bảng trong Supabase qua OpenAPI (swagger) của PostgREST
const SB_URL = "https://tlbumpjugtltznzuwqwt.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYnVtcGp1Z3RsdHpuenV3cXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjc0NDksImV4cCI6MjA5Mzg0MzQ0OX0.EMgx5_nREnfjZaIaLwU9q_KknbnqdxA2fbic_G_Xfdc";

const r = await fetch(`${SB_URL}/rest/v1/`, {
  headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  signal: AbortSignal.timeout(30000),
});
const j = await r.json();
const defs = j.definitions || j.components?.schemas || {};
console.log("tables:", Object.keys(defs).join(", "));
for (const [name, d] of Object.entries(defs)) {
  const props = Object.keys(d.properties || {});
  console.log(`\n${name} (${props.length}): ${props.join(", ")}`);
}
