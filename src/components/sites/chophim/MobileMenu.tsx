"use client";

import { useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { UserAvatar } from "./UserAvatar";
import { AccountIcon, type AccountIconName } from "./AccountIcon";

export type MobileMenuLink = { label: string; href: string };
export type MobileMenuGroup = { label: string; links: MobileMenuLink[] };

/** Menu trong block tài khoản mobile, theo thứ tự của chophim.wtf. */
const ACCOUNT_LINKS: { label: string; href: string; icon: AccountIconName }[] = [
  { label: "Đồng bộ tài khoản", href: "/users/tai-khoan", icon: "sync" },
  { label: "Đăng nhập TV", href: "/users/dang-nhap-tv", icon: "tv" },
  { label: "Gói đăng ký", href: "/users/goi-dang-ky", icon: "crown" },
  { label: "Yêu thích", href: "/users/yeu-thich", icon: "heart" },
  { label: "Danh sách", href: "/users/danh-sach", icon: "list" },
  { label: "Xem tiếp", href: "/users/xem-tiep", icon: "history" },
  { label: "Thông báo", href: "/users/thong-bao", icon: "bell" },
  { label: "Tài khoản", href: "/users/tai-khoan", icon: "user" },
];

/** Dropdown mobile dựng theo đúng cấu trúc panel của chophim.wtf. */
export function MobileMenu({
  primary,
  groups,
  accountHref,
  appHref,
  accountName,
  accountEmail,
  accountAvatar,
  accountFrame,
  accountEmoji,
  loggedIn = false,
  authLoading = false,
  onLogout,
  showWatchTogether = false,
}: {
  primary: MobileMenuLink[];
  groups: MobileMenuGroup[];
  accountHref: string;
  appHref: string;
  accountName?: string;
  accountEmail?: string;
  accountAvatar?: string;
  accountFrame?: string;
  accountEmoji?: string;
  loggedIn?: boolean;
  authLoading?: boolean;
  onLogout?: () => void;
  showWatchTogether?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setActiveGroup(null);
        setAccountOpen(false);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveGroup(null);
        setAccountOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const renderGroup = (group: MobileMenuGroup, groupIndex: number) => {
    const label = group.label
      .replace(/\s*[▾▼]\s*$/, "")
      .replace("Thể Loại", "Thể loại")
      .replace("Quốc Gia", "Quốc gia");
    const expanded = activeGroup === group.label;
    const align = groupIndex === 0 ? "left-0" : "right-0";
    const isMore = groupIndex === groups.length - 1;

    return (
      <div key={group.label} className="flex flex-col relative">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setActiveGroup(expanded ? null : group.label)}
          className="font-semibold text-[13px] text-white hover:text-accent transition-colors flex items-center gap-1.5 justify-between pr-2 w-full"
        >
          {label}
          <svg
            className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expanded && (
          <div
            className={`absolute top-full ${align} mt-4 ${
              isMore ? "w-[132px] rounded-lg shadow-xl py-1" : "w-[300px] rounded-xl shadow-2xl py-2"
            } bg-[#0F111A] z-50 border border-white/5`}
          >
            <div className={isMore ? "grid grid-cols-1" : "grid grid-cols-3"}>
              {group.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    setOpen(false);
                    setActiveGroup(null);
                  }}
                  className={`text-[12px] font-semibold text-white/90 hover:text-white transition-colors whitespace-nowrap overflow-hidden text-ellipsis ${
                    isMore ? "py-2 px-2.5" : "py-2.5 px-3"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => {
          setOpen((v) => !v);
          setActiveGroup(null);
          setAccountOpen(false);
        }}
        className="p-2 -ml-2 text-[#ff6b6b] hover:text-[#ff8787]"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div
          id="mobile-nav-panel"
          className="fixed w-[calc(100%-2rem)] max-w-sm left-4 top-[76px] bg-[#3B4987] border border-white/10 rounded-2xl shadow-2xl pb-4 z-50"
        >
          <div className="px-4 py-5 relative">
            {authLoading ? (
              // Chưa hydrate xong auth: không lộ nút "Thành viên" của khách.
              <div aria-hidden="true" className="mb-4 h-[64px] w-full rounded-xl bg-white/5" />
            ) : loggedIn ? (
              // chophim: block tài khoản bấm để mở menu con có mũi tên, không điều hướng thẳng.
              <div className="relative mb-4 w-full">
                <button
                  type="button"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2 transition-colors hover:bg-white/10"
                >
                  <UserAvatar
                    name={accountName || "Thành viên"}
                    email={accountEmail}
                    avatarUrl={accountAvatar}
                    frameUrl={accountFrame}
                    emoji={accountEmoji}
                    size={40}
                  />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[14px] font-bold leading-tight text-white">
                      {accountName || "Thành viên"}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] leading-tight text-white/50">
                      {accountEmail}
                    </span>
                  </span>
                  <svg
                    className={`h-4 w-4 shrink-0 text-white/70 transition-transform ${accountOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m19 9-7 7-7-7" />
                  </svg>
                </button>
                {accountOpen ? (
                  <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full rounded-xl border border-white/10 bg-[#1e2545] py-2 shadow-2xl">
                    {ACCOUNT_LINKS.map((item) => (
                      <a
                        key={item.label}
                        href={withBasePath(item.href)}
                        onClick={() => {
                          setOpen(false);
                          setAccountOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-[#FFD166]"
                      >
                        <AccountIcon name={item.icon} />
                        {item.label}
                      </a>
                    ))}
                    <div className="mx-2 my-1 h-px bg-white/10" />
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        setAccountOpen(false);
                        onLogout?.();
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-white/5 hover:text-red-300"
                    >
                      <AccountIcon name="logout" />
                      Đăng xuất
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <a
                href={accountHref}
                onClick={() => setOpen(false)}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#F2F4F7] py-2 text-sm font-medium text-[#1c1c1c] hover:bg-white"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                Thành viên
              </a>
            )}

            <a
              href={appHref}
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 py-2.5 px-3 bg-white/5 border border-white/5 rounded-xl mb-6 hover:bg-white/10 transition-colors"
            >
              <svg className="w-10 h-10 text-[#FFD166] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="13" rx="2" strokeWidth="1.7" />
                <path strokeLinecap="round" strokeWidth="1.7" d="M8 21h8m-4-4v4" />
              </svg>
              <span className="text-left">
                <span className="block text-[11px] text-white/70 leading-tight">Tải ứng dụng</span>
                <span className="block text-white font-bold leading-tight text-[15px]">NhótPhim</span>
              </span>
            </a>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              {primary.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="font-semibold text-[13px] text-white hover:text-accent transition-colors"
                >
                  {link.label}
                </a>
              ))}

              {groups.slice(0, -1).map((group, groupIndex) => renderGroup(group, groupIndex))}

              {showWatchTogether && (
                <div className="font-semibold text-[13px] text-white flex items-center gap-2">
                  Xem Chung{" "}
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#FFD166] text-[#3B4168] rounded leading-none">
                    B.Trì
                  </span>
                </div>
              )}

              {groups.slice(-1).map((group) => renderGroup(group, groups.length - 1))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
