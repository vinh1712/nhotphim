"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { notificationsData } from "@/data";

/** Bản static không có /api/notifications của chophim: danh sách được sync từ
 *  bảng ep_notifs của repo quản lí lúc build, trạng thái đã đọc lưu ở đây. */
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
    commitRead((notificationsData as unknown as Notice[]).map((item) => String(item.id)));
  }, [commitRead]);

  const items: NoticeItem[] = (notificationsData as unknown as Notice[]).map((item) => ({
    ...item,
    isRead: readIds.includes(String(item.id)),
  }));

  return {
    items,
    unreadCount: items.filter((item) => !item.isRead).length,
    markRead,
    markAllRead,
  };
}
