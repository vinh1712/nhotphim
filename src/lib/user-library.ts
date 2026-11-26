"use client";

import { useCallback, useEffect, useState } from "react";
import { getSession, useAuthSession } from "./auth";
import { pullRemoteLibrary, pushRemoteLibrary, type SyncKind } from "./account-sync";
import {
  LIBRARY_STORAGE_KEYS,
  readArray,
  writeArray,
  type LibraryStorageKind,
} from "./library-storage";

/** Dữ liệu cá nhân: localStorage là bản nhanh, Supabase user_data là bản đồng bộ.
 *  Chưa đăng nhập vẫn dùng được đầy đủ (chỉ không đồng bộ thiết bị). */
export type LibraryKind = "favorites" | "watchlist";

export type LibraryEntry = {
  slug: string;
  title: string;
  poster: string;
  origin?: string;
  addedAt: number;
};

export type ProgressEntry = {
  slug: string;
  title: string;
  poster: string;
  origin?: string;
  server: number;
  serverName?: string;
  episode: number;
  time: number;
  duration: number;
  updatedAt: number;
};

type NewLibraryEntry = Omit<LibraryEntry, "addedAt">;
type NewProgressEntry = Omit<ProgressEntry, "updatedAt">;

function read<T>(kind: LibraryStorageKind): T[] {
  return readArray<T>(LIBRARY_STORAGE_KEYS[kind]);
}

function write<T>(kind: LibraryStorageKind, value: T[]): void {
  writeArray(LIBRARY_STORAGE_KEYS[kind], value);
}

/** Mọi thay đổi local đều đẩy lên cloud (nếu đang đăng nhập). */
function push(kind: SyncKind, value: unknown[]): void {
  void getSession().then((session) => {
    if (session) void pushRemoteLibrary(session.user.id, kind, value);
  });
}

/** Có thay đổi local trong lúc chưa kịp kéo cloud về thì ưu tiên bản máy. */
const dirty: Record<SyncKind, boolean> = { favorites: false, watchlist: false, progress: false };

function validSlug(value: unknown): value is { slug: string } {
  return !!value && typeof value === "object" && typeof (value as { slug?: unknown }).slug === "string";
}

/** Gộp thay vì ghi đè: mất mạng lúc đăng nhập cũng không mất phim đã lưu. */
function merge(kind: SyncKind, local: unknown[], remote: unknown[]): unknown[] {
  type RowItem = { slug: string; [key: string]: unknown };
  const map = new Map<string, RowItem>();
  for (const row of [...remote, ...local]) {
    if (!validSlug(row)) continue;
    const item = row as RowItem;
    const prev = map.get(item.slug);
    if (!prev) {
      map.set(item.slug, item);
      continue;
    }
    const prevTime = Number(kind === "progress" ? prev.updatedAt ?? 0 : prev.addedAt ?? 0);
    const nextTime = Number(kind === "progress" ? item.updatedAt ?? 0 : item.addedAt ?? 0);
    if (nextTime >= prevTime) map.set(item.slug, item);
  }
  const field = kind === "progress" ? "updatedAt" : "addedAt";
  return [...map.values()].sort((a, b) => Number(b[field] ?? 0) - Number(a[field] ?? 0));
}

export function getList(kind: LibraryKind): LibraryEntry[] {
  return read<LibraryEntry>(kind).sort((a, b) => b.addedAt - a.addedAt);
}

export function isInList(kind: LibraryKind, slug: string): boolean {
  return getList(kind).some((item) => item.slug === slug);
}

/** Trả về trạng thái mới sau khi toggle. */
export function toggleList(kind: LibraryKind, entry: NewLibraryEntry): boolean {
  const current = getList(kind);
  const exists = current.some((item) => item.slug === entry.slug);
  const next = exists
    ? current.filter((item) => item.slug !== entry.slug)
    : [{ ...entry, addedAt: Date.now() }, ...current];
  write(kind, next);
  dirty[kind] = true;
  push(kind, next);
  window.dispatchEvent(new Event("nhotphim:library-change"));
  return !exists;
}

export function getProgress(slug?: string): ProgressEntry[] {
  const all = read<ProgressEntry>("progress").sort((a, b) => b.updatedAt - a.updatedAt);
  return slug ? all.filter((item) => item.slug === slug) : all;
}

export function saveProgress(entry: NewProgressEntry): void {
  const current = read<ProgressEntry>("progress");
  const prev = current.find((item) => item.slug === entry.slug);
  // Mốc mới luôn có updatedAt lớn hơn mốc cũ, kể cả khi ghi trong cùng 1 ms.
  const now = Math.max(Date.now(), Number(prev?.updatedAt || 0) + 1);
  const next = [
    { ...entry, updatedAt: now },
    ...current.filter((item) => item.slug !== entry.slug),
  ].slice(0, 40);
  write("progress", next);
  dirty.progress = true;
  push("progress", next);
  window.dispatchEvent(new Event("nhotphim:library-change"));
}

export function removeProgress(slug: string): void {
  const next = getProgress().filter((item) => item.slug !== slug);
  write("progress", next);
  dirty.progress = true;
  push("progress", next);
  window.dispatchEvent(new Event("nhotphim:library-change"));
}

function applyRemoteLibrary(remote: Partial<Record<SyncKind, unknown[]>> | null): boolean {
  if (!remote) return false;
  (["favorites", "watchlist", "progress"] as SyncKind[]).forEach((kind) => {
    const local = read(kind);
    const rows = remote[kind];
    if (!rows || rows.length === 0) {
      if (local.length > 0) push(kind, local);
      dirty[kind] = false;
      return;
    }
    const merged = merge(kind, local, rows);
    if (JSON.stringify(merged) !== JSON.stringify(local)) {
      write(kind, merged);
      // Đẩy bản đã gộp lên để thiết bị khác thấy cả phim lưu trước khi đăng nhập.
      if (!dirty[kind]) push(kind, merged);
    }
    dirty[kind] = false;
  });
  window.dispatchEvent(new Event("nhotphim:library-change"));
  return true;
}

export type LibrarySyncStatus = {
  syncing: boolean;
  lastSyncedAt: number | null;
  syncNow: () => Promise<void>;
};

/** Gọi từ Header để mọi trang đều đồng bộ, kể cả vào thẳng /xem/... */
export function useLibrarySync(): LibrarySyncStatus {
  const { user } = useAuthSession();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setSyncing(false);
      setLastSyncedAt(null);
      return;
    }
    let alive = true;
    setSyncing(true);
    void pullRemoteLibrary(userId).then((remote) => {
      if (!alive) return;
      if (applyRemoteLibrary(remote)) setLastSyncedAt(Date.now());
      setSyncing(false);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  const syncNow = useCallback(async () => {
    if (!userId) return;
    setSyncing(true);
    try {
      if (applyRemoteLibrary(await pullRemoteLibrary(userId))) setLastSyncedAt(Date.now());
    } finally {
      setSyncing(false);
    }
  }, [userId]);

  return { syncing, lastSyncedAt, syncNow };
}

/** Hook dùng trong client component; state rỗng lúc hydration rồi nạp từ storage. */
export function useUserLibrary() {
  useLibrarySync();
  const [favorites, setFavorites] = useState<LibraryEntry[]>([]);
  const [watchlist, setWatchlist] = useState<LibraryEntry[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(() => {
    setFavorites(getList("favorites"));
    setWatchlist(getList("watchlist"));
    setProgress(getProgress());
  }, []);

  useEffect(() => {
    reload();
    setHydrated(true);
    const onChange = () => reload();
    window.addEventListener("storage", onChange);
    window.addEventListener("nhotphim:library-change", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("nhotphim:library-change", onChange);
    };
  }, [reload]);

  const toggle = useCallback(
    (kind: LibraryKind, entry: NewLibraryEntry) => {
      const next = toggleList(kind, entry);
      reload();
      return next;
    },
    [reload]
  );

  const save = useCallback(
    (entry: NewProgressEntry) => {
      saveProgress(entry);
      reload();
    },
    [reload]
  );

  const remove = useCallback(
    (slug: string) => {
      removeProgress(slug);
      reload();
    },
    [reload]
  );

  return {
    favorites,
    watchlist,
    progress,
    hydrated,
    toggle,
    save,
    remove,
    isFavorite: (slug: string) => favorites.some((item) => item.slug === slug),
    inWatchlist: (slug: string) => watchlist.some((item) => item.slug === slug),
  };
}
