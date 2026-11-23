"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { useAuthSession } from "@/lib/auth";
import { watchHref as liveWatchHref } from "@/lib/live-data";
import { getProgress, removeProgress, type ProgressEntry } from "@/lib/user-library";

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;
}

/** Cùng dạng hash mà WatchPage và trang Xem tiếp đang dùng để phục hồi mốc xem. */
function watchHref(item: ProgressEntry): string {
  const hash = `#tap=tap-${item.episode + 1}&sv=${encodeURIComponent(item.serverName || "")}&server_id=${item.server}&t=${Math.floor(item.time)}`;
  return liveWatchHref(item.slug, hash);
}

/** Section "Xem Tiếp" trên homepage của chophim: chỉ hiện khi đã đăng nhập
 *  và có tiến trình xem. Dùng thẳng dữ liệu progress đã đồng bộ qua Supabase. */
export function ContinueWatching() {
  const { user, loading } = useAuthSession();
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, moved: false, startX: 0, left: 0 });

  const reload = useCallback(() => {
    setEntries(getProgress().filter((item) => item.time > 0));
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

  if (loading || !user || !hydrated || entries.length === 0) return null;

  const onRemove = (event: MouseEvent<HTMLButtonElement>, slug: string) => {
    event.preventDefault();
    event.stopPropagation();
    removeProgress(slug);
    reload();
  };

  const stopDrag = () => {
    drag.current.down = false;
    scroller.current?.classList.remove("cursor-grabbing");
  };

  const onMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const el = scroller.current;
    if (!drag.current.down || !el) return;
    event.preventDefault();
    const delta = event.pageX - el.offsetLeft - drag.current.startX;
    if (Math.abs(delta) > 5) drag.current.moved = true;
    el.scrollLeft = drag.current.left - delta;
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-text-primary">Xem Tiếp</h2>
      </div>

      <div className="group/slider relative">
        <button
          type="button"
          aria-label="Cuộn trái"
          onClick={() => scroller.current?.scrollBy({ left: -(0.8 * scroller.current.clientWidth), behavior: "smooth" })}
          className="absolute left-2 top-[40%] -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 bg-white/90 text-bg-primary hover:scale-110 shadow-xl rounded-full items-center justify-center transition-all opacity-0 group-hover/slider:opacity-100 hidden md:flex"
        >
          <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Cuộn phải"
          onClick={() => scroller.current?.scrollBy({ left: 0.8 * scroller.current.clientWidth, behavior: "smooth" })}
          className="absolute right-2 top-[40%] -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 bg-white/90 text-bg-primary hover:scale-110 shadow-xl rounded-full items-center justify-center transition-all opacity-0 group-hover/slider:opacity-100 hidden md:flex"
        >
          <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div
          ref={scroller}
          onMouseDown={(event) => {
            const el = scroller.current;
            if (!el) return;
            drag.current = {
              down: true,
              moved: false,
              startX: event.pageX - el.offsetLeft,
              left: el.scrollLeft,
            };
            el.classList.add("cursor-grabbing");
          }}
          onMouseLeave={stopDrag}
          onMouseUp={stopDrag}
          onMouseMove={onMouseMove}
          className="scroll-container flex cursor-grab select-none gap-2 overflow-x-auto pb-4 md:gap-3"
        >
          {entries.map((item) => {
            const percent = item.duration > 0 ? Math.min(100, (item.time / item.duration) * 100) : 0;
            return (
              <div key={item.slug} className="group relative w-[130px] shrink-0 bg-transparent sm:w-[185px]">
                <div className="relative">
                  <a
                    href={watchHref(item)}
                    draggable={false}
                    onClick={(event) => {
                      if (drag.current.moved) {
                        event.preventDefault();
                        event.stopPropagation();
                      }
                    }}
                    className="block"
                  >
                    <div className="relative mb-3 flex aspect-[2/3] items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-bg-card shadow-lg transition-colors group-hover:border-white/10">
                      <svg className="absolute h-10 w-10 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                        />
                      </svg>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.poster}
                        alt={item.title}
                        loading="lazy"
                        draggable={false}
                        sizes="(max-width: 640px) 130px, 185px"
                        onError={(event) => {
                          event.currentTarget.style.opacity = "0";
                        }}
                        className="pointer-events-none h-full w-full object-cover transition-opacity duration-300"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    </div>
                    <div className="mx-auto mb-3 h-[3px] w-[85%] overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-white/60" style={{ width: `${percent}%` }} />
                    </div>
                  </a>

                  <button
                    type="button"
                    title="Xóa khỏi danh sách"
                    aria-label="Xóa khỏi danh sách"
                    onClick={(event) => onRemove(event, item.slug)}
                    className="absolute right-2 top-2 z-20 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-white shadow-sm transition-opacity hover:bg-gray-100"
                  >
                    <svg className="h-3.5 w-3.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="flex flex-col">
                    <p className="mb-1.5 flex items-center justify-center gap-1 text-[11px] font-medium tracking-wide text-white/50 sm:text-[12px]">
                      <span>Tập {item.episode + 1}</span>
                      <span className="h-1 w-1 bg-white/30" />
                      <span>
                        {formatTime(item.time)} <span className="text-white/20">/</span> {formatTime(item.duration)}
                      </span>
                    </p>
                    <h3 className="line-clamp-1 px-1 text-center text-[13px] font-semibold text-white/90 transition-colors group-hover:text-white sm:text-[14px]">
                      <a href={watchHref(item)} className="hover:underline underline-offset-2">
                        {item.title}
                      </a>
                    </h3>
                    {item.origin ? (
                      <p className="mt-1 line-clamp-1 px-1 text-center text-[11px] font-medium tracking-wide text-white/40 sm:text-[12px]">
                        {item.origin}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
