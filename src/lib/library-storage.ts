/** Các key localStorage của thư viện cá nhân. Tách riêng để auth có thể xóa
 *  cache khi đăng xuất mà không tạo circular import với user-library. */

export const LIBRARY_STORAGE_KEYS = {
  favorites: "chophim:favorites:v1",
  watchlist: "chophim:watchlist:v1",
  progress: "chophim:progress:v1",
} as const;

export type LibraryStorageKind = keyof typeof LIBRARY_STORAGE_KEYS;

export function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

export function writeArray<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota — bỏ qua, web vẫn dùng được */
  }
}

/** Tránh lộ danh sách của tài khoản trước cho người dùng kế tiếp. */
export function clearLocalLibrary(): void {
  if (typeof window === "undefined") return;
  for (const key of Object.values(LIBRARY_STORAGE_KEYS)) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* bỏ qua */
    }
  }
}
