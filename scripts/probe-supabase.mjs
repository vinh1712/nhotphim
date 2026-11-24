const SB_URL = "https://tlbumpjugtltznzuwqwt.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYnVtcGp1Z3RsdHpuenV3cXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjc0NDksImV4cCI6MjA5Mzg0MzQ0OX0.EMgx5_nREnfjZaIaLwU9q_KknbnqdxA2fbic_G_Xfdc";

const r = await fetch(`${SB_URL}/rest/v1/`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
const spec = await r.json();
const defs = spec.definitions || spec.paths || {};
console.log("status", r.status);
console.log("tables:", Object.keys(defs).join(", "));
for (const [k, v] of Object.entries(defs)) {
  const props = v.properties ? Object.keys(v.properties).slice(0, 25).join(",") : "";
  console.log(" -", k, "::", props);
}
