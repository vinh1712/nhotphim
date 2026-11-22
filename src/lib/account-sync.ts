"use client";

import { supabaseRest } from "./auth";

/** Đồng bộ thư viện cá nhân qua Supabase `user_data` (user_id, key, value).
 *  Mỗi key lưu một mảng JSON; upsert theo (user_id, key) nên ghi lại không tạo
 *  bản trùng. Khi chưa đăng nhập mọi thứ vẫn dùng localStorage như cũ. */

export type SyncKind = "favorites" | "watchlist" | "progress";

const REMOTE_KEY: Record<SyncKind, string> = {
  favorites: "nhotphim:favorites",
  watchlist: "nhotphim:watchlist",
  progress: "nhotphim:progress",
};

type Row = { key: string; value: unknown };

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/** Đọc toàn bộ 3 key của một user. Trả null khi chưa đăng nhập / lỗi mạng. */
export async function pullRemoteLibrary(userId: string): Promise<Partial<Record<SyncKind, unknown[]>> | null> {
  const path = `/rest/v1/user_data?select=key,value&user_id=eq.${encodeURIComponent(userId)}`;
  try {
    const res = await supabaseRest(path);
    if (!res || !res.ok) return null;
    const rows = (await res.json()) as Row[];
    const result: Partial<Record<SyncKind, unknown[]>> = {};
    for (const row of rows || []) {
      const kind = (Object.keys(REMOTE_KEY) as SyncKind[]).find((k) => REMOTE_KEY[k] === row.key);
      if (kind && isArray(row.value)) result[kind] = row.value;
    }
    return result;
  } catch {
    return null;
  }
}

/** Ghi đè một key. Fire-and-forget: lỗi mạng không ảnh hưởng trải nghiệm xem phim. */
export async function pushRemoteLibrary(userId: string, kind: SyncKind, value: unknown[]): Promise<boolean> {
  try {
    const res = await supabaseRest("/rest/v1/user_data", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ user_id: userId, key: REMOTE_KEY[kind], value }),
    });
    return !!res && res.ok;
  } catch {
    return false;
  }
}
