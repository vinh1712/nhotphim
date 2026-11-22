"use client";

import { useEffect, useRef, useState } from "react";

export type MobileMenuLink = { label: string; href: string };
export type MobileMenuGroup = { label: string; links: MobileMenuLink[] };

/** Dropdown mobile dựng theo đúng cấu trúc panel của chophim.wtf. */
export function MobileMenu({
  primary,
  groups,
  accountHref,
  appHref,
  showWatchTogether = false,
}: {
  primary: MobileMenuLink[];
  groups: MobileMenuGroup[];
  accountHref: string;
  appHref: string;
  showWatchTogether?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setActiveGroup(null);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveGroup(null);
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
            <a
              href={accountHref}
              onClick={() => setOpen(false)}
              className="w-full flex justify-center items-center gap-2 py-2 bg-[#F2F4F7] hover:bg-white text-[#1c1c1c] rounded-full font-medium transition-colors mb-4 text-sm"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              Thành viên
            </a>

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
                <span className="block text-white font-bold leading-tight text-[15px]">ChoPhim</span>
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
