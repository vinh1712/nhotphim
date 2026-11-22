"use client";

import { withBasePath } from "@/lib/base-path";
// Trang danh mục / tìm kiếm: tiêu đề + bộ lọc + lưới poster + phân trang.
// Số trang mặc định đọc từ ?page= để page vẫn build được thành HTML tĩnh (output: "export").
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BottomBadges } from "./Badges";
import { fillStyle, type MovieItem } from "./types";
import {
  EMPTY_FILTERS,
  FILTER_GROUPS,
  applyFilters,
  bottomBadgeText,
  paginate,
  type CardMovie,
  type MovieFilters,
} from "./movie-filter";

const CARD_BOTTOM_CLS =
  "absolute inset-x-0 bottom-0 flex items-end pb-1.5 md:pb-0 pointer-events-none justify-center";

function toItem(m: CardMovie): MovieItem {
  return {
    href: withBasePath(`/phim/${m.slug}`),
    img: m.poster || m.backdrop,
    alt: m.title,
    title: m.title,
    sub: m.origin || "",
    badges: [{ pos: "bottom", text: bottomBadgeText(m), cls: CARD_BOTTOM_CLS }],
    variant: "portrait",
    rank: "",
    itemClass: "",
    imgWrapClass: "",
    slug: m.slug,
  };
}

export function MovieCard({ m }: { m: CardMovie }) {
  const item = toItem(m);
  return (
    <div className="relative movie-card-wrapper">
      <a className="movie-card block group" href={withBasePath(`/phim/${m.slug}`)}>
        <div className="relative rounded-lg overflow-hidden bg-bg-card aspect-[2/3] ring-1 ring-white/5 shadow-md flex items-center justify-center">
          <svg className="absolute w-12 h-12 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
            />
          </svg>
          <img
            alt={m.title}
            loading="lazy"
            decoding="async"
            className="object-cover transition-transform duration-500 relative z-10"
            style={fillStyle}
            src={m.poster || m.backdrop}
          />
          <BottomBadges item={item} poster />
          <div className="overlay absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
        <div className="text-center px-1 mt-2">
          <h3 className="text-[12px] sm:text-[13px] font-semibold text-text-primary truncate group-hover:text-yellow-400 transition-colors">{m.title}</h3>
          <p className="text-[10px] sm:text-[11px] text-text-muted mt-0.5 truncate">{m.origin}</p>
        </div>
      </a>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  basePath,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  onPageChange?: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;
  const arrowLeft = (
    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
  const arrowRight = (
    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
  const arrowCls =
    "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors bg-[#27293E] text-white shadow-lg";

  return (
    <div className="flex items-center justify-center gap-3 md:gap-4 mt-12 mb-8">
      {prevDisabled ? (
        <div className={`${arrowCls} text-[#8A8D9F] opacity-70 cursor-not-allowed`}>{arrowLeft}</div>
      ) : onPageChange ? (
        <button type="button" className={`${arrowCls} hover:bg-[#31344E]`} onClick={() => onPageChange(page - 1)} aria-label="Trang trước">
          {arrowLeft}
        </button>
      ) : (
        <a className={`${arrowCls} hover:bg-[#31344E]`} href={`${basePath}?page=${page - 1}`} aria-label="Trang trước">
          {arrowLeft}
        </a>
      )}

      <div className="h-10 md:h-12 rounded-full bg-[#27293E] px-5 md:px-6 shadow-lg flex items-center gap-2 md:gap-3 text-white hover:bg-[#2A2D43] transition-colors">
        <span className="font-medium text-[14px] md:text-[15px]">Trang</span>
        <div className="h-7 md:h-8 min-w-[2.5rem] md:min-w-[3rem] px-2 md:px-3 rounded-md bg-transparent border border-white/20 flex items-center justify-center font-semibold text-[14px] md:text-[15px]">
          {page}
        </div>
        <span className="font-medium text-[14px] md:text-[15px] text-white/90">/ {totalPages}</span>
      </div>

      {nextDisabled ? (
        <div className={`${arrowCls} text-[#8A8D9F] opacity-70 cursor-not-allowed`}>{arrowRight}</div>
      ) : onPageChange ? (
        <button type="button" className={`${arrowCls} hover:bg-[#31344E]`} onClick={() => onPageChange(page + 1)} aria-label="Trang sau">
          {arrowRight}
        </button>
      ) : (
        <a className={`${arrowCls} hover:bg-[#31344E]`} href={`${basePath}?page=${page + 1}`} aria-label="Trang sau">
          {arrowRight}
        </a>
      )}
    </div>
  );
}

const GRID_CLS = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-3 gap-y-6";

/** Lưới poster + phân trang, tự đọc ?page= từ URL khi không truyền pageOverride */
export function CategoryGrid({
  movies,
  basePath,
  emptyText = "Không tìm thấy phim nào.",
  pageOverride,
  onPageChange,
}: {
  movies: CardMovie[];
  basePath: string;
  emptyText?: string;
  pageOverride?: number;
  onPageChange?: (page: number) => void;
}) {
  const searchParams = useSearchParams();
  const requested = pageOverride ?? (Number(searchParams?.get("page") ?? "") || 1);
  const { items, totalPages, page } = paginate(movies, requested);

  return (
    <>
      {items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-text-muted text-[15px]">{emptyText}</p>
        </div>
      ) : (
        <div className={GRID_CLS}>
          {items.map((m) => (
            <MovieCard key={m.slug} m={m} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} basePath={basePath} onPageChange={onPageChange} />
    </>
  );
}

type PillOption = string | { value: string; label: string };

const PILL_BASE =
  "px-3 py-1.5 md:py-1 rounded-md transition-all text-[13px] md:text-sm whitespace-nowrap shrink-0";
const PILL_ACTIVE = "border border-white/40 text-[#FFD166] bg-transparent";
const PILL_IDLE = "text-text-muted hover:text-[#FFD166] border border-transparent";

/** Hàng pill trong panel lọc — dựng theo đúng class của chophim.wtf */
function PillRow({
  label,
  options,
  value,
  values,
  onChange,
  onToggle,
  footer,
}: {
  label: string;
  options: readonly PillOption[];
  value?: string;
  values?: string[];
  onChange?: (value: string) => void;
  onToggle?: (value: string) => void;
  footer?: React.ReactNode;
}) {
  const selected = (v: string) =>
    values ? (v === "" ? values.length === 0 : values.includes(v)) : value === v;

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4 pb-4 border-b border-dashed border-white/[0.12]">
      <span className="text-text-primary/90 font-medium md:w-32 shrink-0 md:pt-1 text-sm">{label}</span>
      <div className="flex flex-wrap gap-2 w-full">
        {options.map((option) => {
          const v = typeof option === "string" ? option : option.value;
          const text = v === "" ? "Tất cả" : typeof option === "string" ? option : option.label;
          return (
            <button
              key={v}
              type="button"
              onClick={() => (onToggle ? onToggle(v) : onChange?.(v))}
              className={`${PILL_BASE} ${selected(v) ? PILL_ACTIVE : PILL_IDLE}`}
            >
              {text}
            </button>
          );
        })}
        {footer}
      </div>
    </div>
  );
}

export function CategoryPage({
  title,
  movies,
  basePath,
  emptyText = "Không tìm thấy phim nào.",
}: {
  title: string;
  movies: CardMovie[];
  basePath: string;
  emptyText?: string;
}) {
  const [applied, setApplied] = useState<MovieFilters>(EMPTY_FILTERS);
  const [draft, setDraft] = useState<MovieFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtered = useMemo(() => applyFilters(movies, applied), [movies, applied]);
  const hasFilter =
    !!applied.country || !!applied.type || applied.genres.length > 0 || !!applied.lang || !!applied.year;

  // Đọc bộ lọc từ URL ngay khi mount (source dùng router.push + refresh).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl: MovieFilters = {
      country: params.get("country") ?? "",
      type: params.get("type") ?? "",
      genres: (params.get("genre") ?? "").split(",").filter(Boolean).slice(0, 5),
      lang: params.get("lang") ?? "",
      year: params.get("year") ?? "",
      sort: params.get("sort") === "updated" ? "updated" : "new",
    };
    setApplied(fromUrl);
    setDraft(fromUrl);
    return () => {
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
    };
  }, []);

  const edit = <K extends keyof MovieFilters>(key: K, value: MovieFilters[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const toggleGenre = (genre: string) => {
    setDraft((prev) => {
      if (genre === "") return { ...prev, genres: [] };
      if (prev.genres.includes(genre)) {
        return { ...prev, genres: prev.genres.filter((g) => g !== genre) };
      }
      if (prev.genres.length >= 5) return prev;
      return { ...prev, genres: [...prev.genres, genre] };
    });
  };

  const apply = () => {
    const params = new URLSearchParams();
    if (draft.country) params.set("country", draft.country);
    if (draft.type) params.set("type", draft.type);
    if (draft.genres.length) params.set("genre", draft.genres.join(","));
    if (draft.lang) params.set("lang", draft.lang);
    if (draft.year) params.set("year", draft.year);
    if (draft.sort !== "new") params.set("sort", draft.sort);
    const query = params.toString();
    window.history.pushState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    setApplied(draft);
    setPage(1);
    setFilterOpen(false);
    setLoading(true);
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    loadingTimer.current = setTimeout(() => setLoading(false), 300);
  };

  return (
    <main className="flex-1 pt-16">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-text-primary flex items-center gap-2 text-xl sm:text-2xl">{title}</h2>
        </div>

        <div className="mb-8 font-sans">
          <button
            type="button"
            aria-expanded={filterOpen}
            aria-controls="category-filter-panel"
            onClick={() => {
              setDraft(applied);
              setFilterOpen((v) => !v);
            }}
            className="flex items-center gap-2 text-[15px] font-semibold text-text-primary hover:text-white transition-colors mb-4"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${filterOpen ? "rotate-180 text-[#FFD166]" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className={filterOpen ? "text-[#FFD166]" : ""}>Bộ lọc</span>
          </button>

          {filterOpen && (
            <div
              id="category-filter-panel"
              className="animate-fade-in bg-white/[0.02] backdrop-blur-xl border border-dashed border-white/15 rounded-2xl p-4 md:p-6"
            >
              <div className="space-y-5">
                <PillRow
                  label="Quốc gia"
                  options={["", ...FILTER_GROUPS.countries]}
                  value={draft.country}
                  onChange={(v) => edit("country", v)}
                />
                <PillRow
                  label="Loại phim"
                  options={["", ...FILTER_GROUPS.types]}
                  value={draft.type}
                  onChange={(v) => edit("type", v)}
                />
                <PillRow
                  label={`Thể loại: ${draft.genres.length}/5`}
                  options={["", ...FILTER_GROUPS.genres]}
                  values={draft.genres}
                  onToggle={toggleGenre}
                  footer={<span className="self-center text-[11px] text-text-muted">Tối đa 5 thể loại</span>}
                />
                <PillRow
                  label="Ngôn ngữ"
                  options={["", ...FILTER_GROUPS.langs]}
                  value={draft.lang}
                  onChange={(v) => edit("lang", v)}
                />
                <PillRow
                  label="Năm sản xuất"
                  options={["", ...FILTER_GROUPS.years]}
                  value={draft.year}
                  onChange={(v) => edit("year", v)}
                  footer={
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Nhập năm"
                      value={draft.year && !FILTER_GROUPS.years.includes(draft.year as (typeof FILTER_GROUPS.years)[number]) ? draft.year : ""}
                      onChange={(e) => edit("year", e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="h-8 w-24 rounded-md border border-white/15 bg-white/5 px-2 text-[13px] text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                    />
                  }
                />
                <PillRow
                  label="Sắp xếp"
                  options={FILTER_GROUPS.sorts}
                  value={draft.sort}
                  onChange={(v) => edit("sort", v as MovieFilters["sort"])}
                />
              </div>

              <div className="flex items-center gap-3 md:gap-4 mt-8 pt-6 border-t border-dashed border-white/[0.12]">
                <button
                  type="button"
                  onClick={apply}
                  className="bg-[#FFD166] bg-gradient-to-r from-[#FFD166] to-[#ffb347] text-[#1c1c1c] hover:opacity-90 font-bold py-2.5 px-6 rounded-full transition-all flex items-center justify-center gap-2 flex-1 md:flex-none active:scale-[0.98] whitespace-nowrap"
                >
                  Lọc kết quả
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="bg-transparent border border-white/10 hover:bg-white/5 text-white/50 hover:text-white font-medium py-2.5 px-6 rounded-full transition-colors flex-1 md:flex-none whitespace-nowrap"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-start justify-center pt-16 text-[15px] text-text-muted">
              Đang tìm kiếm phim...
            </div>
          )}
          <Suspense fallback={<div className="py-20 text-center text-text-muted text-[15px]">{emptyText}</div>}>
            <CategoryGrid
              movies={filtered}
              basePath={basePath}
              emptyText={hasFilter ? "Không có phim khớp bộ lọc." : emptyText}
              pageOverride={page}
              onPageChange={setPage}
            />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
