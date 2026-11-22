"use client";

import { useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { timeAgo, useNotifications, type NoticeItem } from "@/lib/notifications";

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function CheckCheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m18 6-6 6-3-3" />
      <path d="m22 10-6 6-2-2" />
    </svg>
  );
}

function ClapperIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11.08V8l-6-3-1.5 3-6-3L5.5 5 4 8l6 3v2.08" />
      <path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

/** Nút chuông + panel thông báo clone từ chophim.wtf.
 *  Dữ liệu là ep_notifs từ repo quản lí, sync vào src/data/notifications.json
 *  trước mỗi lần build; trạng thái đã đọc lưu trên thiết bị. */
export function NotificationBell({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { items, unreadCount, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    setOpen(false);
  }, [loggedIn]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!loggedIn) return null;

  const openNotice = (item: NoticeItem) => {
    markRead(item.id);
    setOpen(false);
    window.location.href = withBasePath(item.link || "/users/thong-bao");
  };

  const goAll = () => {
    setOpen(false);
    window.location.href = withBasePath("/users/thong-bao");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Thông báo"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/30 transition-all hover:border-white/50 hover:bg-white/10"
      >
        <BellIcon className="h-5 w-5 text-white/90" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-[20px] min-w-[20px] animate-[bellPulse_2s_ease-in-out_infinite] items-center justify-center rounded-full bg-[#ff4757] px-1 text-[11px] font-bold leading-none text-white shadow-md">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-1.5rem),340px)] overflow-hidden rounded-xl border border-white/[0.08] bg-[#111119] shadow-[0_14px_44px_rgba(0,0,0,0.5)] sm:w-[390px]">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <BellIcon className="h-4 w-4 shrink-0 text-[#FFD166]" />
              <h3 className="text-[14px] font-bold text-white">Thông báo</h3>
              {unreadCount > 0 ? (
                <span className="shrink-0 rounded-full bg-[#FFD166]/10 px-1.5 py-0.5 text-[11px] font-medium text-[#FFD166]">
                  {unreadCount} mới
                </span>
              ) : null}
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] text-white/45 transition-colors hover:bg-white/[0.04] hover:text-[#FFD166]"
              >
                <CheckCheckIcon className="h-3.5 w-3.5" />
                Đọc tất cả
              </button>
            ) : null}
          </div>

          <div className="custom-scrollbar max-h-[360px] overflow-y-auto sm:max-h-[380px]">
            {items.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <BellIcon className="mb-3 h-10 w-10 text-white/[0.06]" />
                <p className="text-[13px] text-white/30">Chưa có thông báo nào</p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openNotice(item)}
                  className={`group flex w-full items-start gap-3 border-b border-white/[0.04] px-4 py-3 text-left transition-colors last:border-0 ${
                    item.isRead ? "hover:bg-white/[0.03]" : "bg-white/[0.025] hover:bg-white/[0.055]"
                  }`}
                >
                  {item.poster && /^(https?:|\/|data:)/.test(item.poster) ? (
                    <span className="mt-0.5 h-[58px] w-[40px] shrink-0 overflow-hidden rounded-lg bg-white/[0.04] ring-1 ring-white/[0.08]">
                      <img src={item.poster} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </span>
                  ) : (
                    <span
                      className={`mt-0.5 shrink-0 rounded-xl p-2 ${
                        item.isRead ? "bg-white/[0.04]" : "bg-white/[0.06]"
                      }`}
                    >
                      <ClapperIcon className="h-4 w-4 text-[#64f7a1]" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="mb-1 flex items-start justify-between gap-2">
                      <span
                        className={`min-w-0 truncate text-[13px] font-semibold ${
                          item.isRead ? "text-white/50" : "text-white"
                        }`}
                      >
                        {item.movieName || item.title}
                      </span>
                      {!item.isRead ? (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#ff4757]" />
                      ) : null}
                    </span>
                    <span
                      className={`line-clamp-2 block text-[12px] leading-relaxed ${
                        item.isRead ? "text-white/30" : "text-white/55"
                      }`}
                    >
                      {item.message}
                    </span>
                    <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/30">
                      <span>Tập mới</span>
                      <span>·</span>
                      <span>{timeAgo(item.createdAt)}</span>
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-white/[0.06] px-4 py-2.5">
            <button
              type="button"
              onClick={goAll}
              className="w-full rounded-lg py-2 text-center text-[13px] font-semibold text-[#FFD166] transition-colors hover:bg-[#FFD166]/10 hover:text-[#ffe399]"
            >
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
