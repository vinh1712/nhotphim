"use client";

/** Cấu hình Supabase dùng chung cho auth và dữ liệu phim.
 *  Đây là SUPABASE_ANON_KEY (public) lấy từ repo quản lí vinh1712/nhotphim-quanli. */
export const SB_URL = "https://tlbumpjugtltznzuwqwt.supabase.co";
export const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYnVtcGp1Z3RsdHpuenV3cXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjc0NDksImV4cCI6MjA5Mzg0MzQ0OX0.EMgx5_nREnfjZaIaLwU9q_KknbnqdxA2fbic_G_Xfdc";

export function sbHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

/** Fetch REST có timeout — không bao giờ để lỗi mạng làm trắng trang. */
export async function sbFetch(path: string, init: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer =
    controller && typeof window !== "undefined"
      ? window.setTimeout(() => controller.abort(), timeoutMs)
      : null;
  try {
    return await fetch(`${SB_URL}${path}`, {
      ...init,
      signal: controller?.signal,
      headers: { ...sbHeaders(), ...(init.headers || {}) },
    });
  } finally {
    if (timer !== null && typeof window !== "undefined") window.clearTimeout(timer);
  }
}

/** Đọc bảng với danh sách cột rõ ràng — KHÔNG dùng select=* (mỗi lần tải
 *  toàn bảng movies cũng ~3,4 MB, chủ yếu là episodes/extra không cần ở danh sách). */
export async function sbTable<T = Record<string, unknown>>(
  table: string,
  select = "*",
  filters: Record<string, string> = {}
): Promise<T[]> {
  const PAGE = 1000;
  const params = new URLSearchParams({ select, ...filters });
  const all: T[] = [];
  for (let off = 0; off < 50 * PAGE; off += PAGE) {
    const res = await sbFetch(
      `/rest/v1/${table}?${params}`,
      { headers: { Range: `${off}-${off + PAGE - 1}`, "Range-Unit": "rows" } },
      20000
    );
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
    const rows = (await res.json()) as T[];
    if (!Array.isArray(rows)) throw new Error(`${table}: dữ liệu không đúng`);
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  return all;
}
