"use client";

/** Dropdown "Phần:" clone theo chophim.wtf, lấy theo cột series_group /
 *  part_number mà admin đã chia trong trang quản lí. Hiện cả trên trang phim
 *  và trang xem; phim mới thêm vẫn lấy được nhờ lớp dữ liệu sống. */
import { useEffect, useMemo, useRef, useState } from "react";
import { detailHref, useLiveData, watchHref } from "@/lib/live-data";
import type { MovieDetail } from "./detail-types";

function IconLayers({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
      <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
      <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function partLabel(m: MovieDetail): string {
  if (m.partNumber != null) return `Phần ${m.partNumber}`;
  const found = /Phần\s*(\d+)/i.exec(m.title || "");
  return found ? `Phần ${found[1]}` : m.title;
}

export function PartSelector({
  movie,
  mode,
  withDivider = false,
}: {
  movie: MovieDetail;
  mode: "detail" | "watch";
  withDivider?: boolean;
}) {
  const live = useLiveData();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const group = (movie.seriesGroup || "").trim();

  const parts = useMemo(() => {
    if (!group) return [];
    return Object.values(live.movies)
      .filter((m) => (m.seriesGroup || "").trim() === group)
      .sort(
        (a, b) =>
          (a.partNumber ?? 999) - (b.partNumber ?? 999) ||
          String(a.title || "").localeCompare(String(b.title || ""))
      );
  }, [group, live.movies]);

  useEffect(() => setOpen(false), [movie.slug]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (parts.length < 2) return null;

  return (
    <>
    <div ref={root} className="relative flex min-w-0 items-center gap-1.5 sm:gap-2">
      <div className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-white/50 sm:mr-1 sm:gap-1.5 sm:text-[13px]">
        <IconLayers className="w-4 h-4" />
        Phần:
      </div>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title={movie.title}
        onClick={() => setOpen((v) => !v)}
        className="flex min-w-0 flex-1 sm:flex-none sm:w-auto items-center justify-center sm:justify-start gap-1.5 text-[13px] transition-colors rounded-md px-3 py-2 sm:px-3.5 border border-white/30 text-white bg-white/5 font-medium hover:bg-white/10 disabled:cursor-wait disabled:text-white/60"
      >
        <span className="truncate">{partLabel(movie)}</span>
        <IconChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-64 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-[#1a1c2e]/95 backdrop-blur-xl shadow-2xl shadow-black/40 p-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
          {parts.map((p) => {
            const active = p.slug === movie.slug;
            const cls =
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors " +
              (active ? "bg-white/[0.08] cursor-default" : "hover:bg-white/5");
            const inner = (
              <>
                <div className="flex min-w-0 flex-1 flex-col text-left">
                  <span className={`text-[13px] font-semibold ${active ? "text-[#FECF59]" : "text-white/90"}`}>
                    {partLabel(p)}
                  </span>
                  <span className="truncate text-[11px] text-white/45">{p.title}</span>
                </div>
                {active && <IconCheck className="h-4 w-4 shrink-0 text-[#FECF59]" />}
              </>
            );
            return active ? (
              <div key={p.slug} className={cls} aria-current="true">
                {inner}
              </div>
            ) : (
              <a
                key={p.slug}
                className={cls}
                href={mode === "detail" ? detailHref(p.slug) : watchHref(p.slug)}
                onClick={() => setOpen(false)}
              >
                {inner}
              </a>
            );
          })}
        </div>
      )}
    </div>
    {withDivider && <div className="mx-2 hidden h-7 w-px bg-white/15 sm:block" aria-hidden="true" />}
    </>
  );
}
