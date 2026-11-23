"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { notificationsData } from "@/data";
import { getList } from "./user-library";

/** Bản static không có /api/notifications của chophim: danh sách được sync từ
 *  bảng ep_notifs của repo quản lí lúc build, trạng thái đã đọc lưu ở đây.
 *  Chỉ hiện tập mới của phim có trong danh sách yêu thích của người dùng. */
export type Notice = {
  id: string;
  type: string;
  title: string;
  movieName: string;
  ep: string;
  message: string;
  poster: string;
  link: string | null;
  createdAt: string;
};

export type NoticeItem = Notice & { isRead: boolean };

const READ_KEY = "nhotphim:notifications:read:v1";
const READ_EVENT = "nhotphim:notifications-change";

function loadRead(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(READ_KEY) || "[]");
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

function saveRead(ids: string[]) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(ids));
  } catch {
    /* private mode — vẫn giữ trong state */
  }
}

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slugFromLink = (link: string | null): string => {
  const match = /^\/xem\/([^#?]+)/.exec(link || "");
  return match ? decodeURIComponent(match[1]) : "";
};

type FavoriteKeys = { slugs: string[]; names: string[] };

function loadFavoriteKeys(): FavoriteKeys {
  const favorites = getList("favorites");
  return {
    slugs: favorites.map((item) => item.slug),
    names: favorites.flatMap((item) =>
      [item.title, item.origin || ""].filter(Boolean).map(normalize)
    ),
  };
}

export function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

/** Header có 2 chuông (mobile/desktop) + tab thông báo: dùng chung storage và
 *  sự kiện nội bộ để badge ở mọi nơi đổi cùng lúc. */
export function useNotifications() {
  const [readIds, setReadIds] = useState<string[]>([]);
  const [favoriteKeys, setFavoriteKeys] = useState<FavoriteKeys>({ slugs: [], names: [] });
  const readIdsRef = useRef<string[]>([]);

  const applyRead = useCallback((next: string[]) => {
    readIdsRef.current = next;
    setReadIds(next);
  }, []);

  const commitRead = useCallback(
    (next: string[]) => {
      saveRead(next);
      applyRead(next);
      if (typeof window !== "undefined") window.dispatchEvent(new Event(READ_EVENT));
    },
    [applyRead]
  );

  useEffect(() => {
    applyRead(loadRead());
    const sync = () => applyRead(loadRead());
    const onStorage = (event: StorageEvent) => {
      if (event.key === READ_KEY) sync();
    };
    window.addEventListener(READ_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(READ_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [applyRead]);

  useEffect(() => {
    const syncFavorites = () => setFavoriteKeys(loadFavoriteKeys());
    syncFavorites();
    window.addEventListener("nhotphim:library-change", syncFavorites);
    window.addEventListener("storage", syncFavorites);
    return () => {
      window.removeEventListener("nhotphim:library-change", syncFavorites);
      window.removeEventListener("storage", syncFavorites);
    };
  }, []);

  const favoriteSlugs = useMemo(() => new Set(favoriteKeys.slugs), [favoriteKeys.slugs]);
  const favoriteNames = useMemo(() => new Set(favoriteKeys.names), [favoriteKeys.names]);

  const items = useMemo<NoticeItem[]>(() => {
    const all = notificationsData as unknown as Notice[];
    return all
      .filter((notice) => {
        const slug = slugFromLink(notice.link);
        if (slug && favoriteSlugs.has(slug)) return true;
        return (
          favoriteNames.has(normalize(notice.movieName)) ||
          favoriteNames.has(normalize(notice.title))
        );
      })
      .map((notice) => ({ ...notice, isRead: readIds.includes(String(notice.id)) }));
  }, [favoriteNames, favoriteSlugs, readIds]);

  const markRead = useCallback(
    (id: string) => {
      const key = String(id);
      const prev = readIdsRef.current;
      if (prev.includes(key)) return;
      commitRead([...prev, key]);
    },
    [commitRead]
  );

  const markAllRead = useCallback(() => {
    commitRead(items.map((item) => String(item.id)));
  }, [commitRead, items]);

  return {
    items,
    unreadCount: items.filter((item) => !item.isRead).length,
    markRead,
    markAllRead,
  };
}
