"use client";

import { useCallback, useEffect, useState } from "react";

/** Dữ liệu cá nhân lưu tại trình duyệt (không cần backend). */
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

const KEYS: Record<LibraryKind | "progress", string> = {
  favorites: "chophim:favorites:v1",
  watchlist: "chophim:watchlist:v1",
  progress: "chophim:progress:v1",
};

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota — bỏ qua, web vẫn dùng được */
  }
}

export function getList(kind: LibraryKind): LibraryEntry[] {
  return read<LibraryEntry>(KEYS[kind]).sort((a, b) => b.addedAt - a.addedAt);
}

export function isInList(kind: LibraryKind, slug: string): boolean {
  return getList(kind).some((item) => item.slug === slug);
}

/** Trả về trạng thái mới sau khi toggle. */
export function toggleList(kind: LibraryKind, entry: NewLibraryEntry): boolean {
  const current = getList(kind);
  const exists = current.some((item) => item.slug === entry.slug);
  write(
    KEYS[kind],
    exists
      ? current.filter((item) => item.slug !== entry.slug)
      : [{ ...entry, addedAt: Date.now() }, ...current]
  );
  return !exists;
}

export function getProgress(slug?: string): ProgressEntry[] {
  const all = read<ProgressEntry>(KEYS.progress).sort((a, b) => b.updatedAt - a.updatedAt);
  return slug ? all.filter((item) => item.slug === slug) : all;
}

export function saveProgress(entry: NewProgressEntry): void {
  const current = read<ProgressEntry>(KEYS.progress);
  const next = current.filter((item) => item.slug !== entry.slug);
  write(KEYS.progress, [{ ...entry, updatedAt: Date.now() }, ...next].slice(0, 40));
}

export function removeProgress(slug: string): void {
  write(KEYS.progress, getProgress().filter((item) => item.slug !== slug));
}

/** Hook dùng trong client component; state rỗng lúc hydration rồi nạp từ storage. */
export function useUserLibrary() {
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
    const onStorage = () => reload();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
