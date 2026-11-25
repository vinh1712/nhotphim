"use client";

import { stripBasePath, withBasePath } from "@/lib/base-path";
// Trang danh mục / tìm kiếm: tiêu đề + bộ lọc + lưới poster + phân trang.
// Số trang mặc định đọc từ ?page= để page vẫn build được thành HTML tĩnh (output: "export").
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { detailHref, useLiveData } from "@/lib/live-data";
import { BottomBadges } from "./Badges";
import { fillStyle, type MovieItem } from "./types";
import {
  EMPTY_FILTERS,
  FILTER_GROUPS,
  applyFilters,
  bottomBadgeText,
  filtersFromParams,
  hasVpSource,
  lockedFiltersFromPath,
  newestFirst,
  paginate,
  toCard,
  sortQueryValue,
  type CardMovie,
  type CategoryLiveFilter,
  type MovieFilters,
} from "./movie-filter";

const CARD_BOTTOM_CLS =
  "absolute inset-x-0 bottom-0 flex items-end pb-1.5 md:pb-0 pointer-events-none justify-center";

function toItem(m: CardMovie): MovieItem {
  return {
    href: detailHref(m.slug),
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
      <a className="movie-card block group" href={detailHref(m.slug)}>
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
  // `useSearchParams()` bắt Next phải CSR bailout: trên static export nó khiến
  // Suspense fallback ("Không tìm thấy phim nào.") dính mãi không hydrate.
  // Trang luôn truyền pageOverride nên chỉ cần đọc state ở đây.
  const requested = pageOverride ?? 1;
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

type PillOption = { value: string; label: string; disabled?: boolean; title?: string };

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
  disabled,
  disabledTitle,
  footer,
}: {
  label: ReactNode;
  options: readonly PillOption[];
  value?: string;
  values?: string[];
  onChange?: (value: string) => void;
  onToggle?: (value: string) => void;
  disabled?: (value: string) => boolean;
  disabledTitle?: string;
  footer?: ReactNode;
}) {
  const selected = (v: string) =>
    values ? (v === "" ? values.length === 0 : values.includes(v)) : value === v;

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4 pb-4 border-b border-dashed border-white/[0.12]">
      <span className="text-text-primary/90 font-medium md:w-32 shrink-0 md:pt-1 text-sm">{label}</span>
      <div className="flex flex-wrap gap-2 w-full">
        {options.map((option) => {
          const isDisabled = option.disabled ?? disabled?.(option.value) ?? false;
          return (
            <button
              key={option.value}
              type="button"
              disabled={isDisabled}
              title={option.title ?? (isDisabled ? disabledTitle : undefined)}
              onClick={() => (onToggle ? onToggle(option.value) : onChange?.(option.value))}
              className={`${PILL_BASE} ${selected(option.value) ? PILL_ACTIVE : PILL_IDLE} ${
                isDisabled ? "cursor-not-allowed opacity-60 hover:text-text-muted" : ""
              }`}
            >
              {option.label}
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
  lockedFilters,
  hideTitle = false,
  mainClassName = "flex-1 pt-16",
  banner,
  source = "live",
  liveFilter,
}: {
  title: string;
  movies: CardMovie[];
  basePath: string;
  emptyText?: string;
  lockedFilters?: Partial<MovieFilters>;
  hideTitle?: boolean;
  mainClassName?: string;
  banner?: ReactNode;
  /** "live" lấy danh sách mới nhất từ Supabase; "prop" dùng danh sách cha truyền xuống (tìm kiếm). */
  source?: "live" | "prop";
  /** Lọc thêm dữ liệu live bằng một giá trị serializable (vd: "vp"). */
  liveFilter?: CategoryLiveFilter;
}) {
  const live = useLiveData();
  const liveCards = useMemo(() => {
    const list = Object.values(live.movies);
    return newestFirst(liveFilter === "vp" ? list.filter(hasVpSource) : list).map(toCard);
  }, [live.movies, liveFilter]);
  // Dùng danh sách build sẵn đã lọc của route cho tới khi dữ liệu live sẵn sàng,
  // để HTML tĩnh và lần render đầu không lọt phim ngoài bộ lọc của trang.
  const pool = source === "live" && live.ready ? liveCards : movies;
  const pathname = usePathname() ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const locked = useMemo<Partial<MovieFilters>>(
    () => ({ ...lockedFiltersFromPath(stripBasePath(pathname)), ...lockedFilters }),
    [pathname, lockedFilters]
  );
  const [applied, setApplied] = useState<MovieFilters>({ ...EMPTY_FILTERS, ...locked });
  const [draft, setDraft] = useState<MovieFilters>({ ...EMPTY_FILTERS, ...locked });
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtered = useMemo(() => applyFilters(pool, applied), [pool, applied]);
  const hasFilter =
    !!applied.country || !!applied.type || applied.genres.length > 0 || !!applied.lang || !!applied.year;

  // Source dùng router.push + refresh; bản static đọc/đồng bộ query bằng history API.
  useEffect(() => {
    const sync = () => {
      const next = filtersFromParams(new URLSearchParams(window.location.search), locked);
      setApplied(next);
      setDraft(next);
      setPage(1);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
    };
  }, [locked]);

  const edit = <K extends keyof MovieFilters>(key: K, value: MovieFilters[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const toggleGenre = (genre: string) => {
    if (locked.genres?.length) return;
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
    // Giữ lại mọi param khác (đặc biệt là `keyword` của trang tìm kiếm).
    const params = new URLSearchParams(window.location.search);
    if (draft.country) params.set("country", draft.country);
    else params.delete("country");
    if (draft.type) params.set("type", draft.type);
    else params.delete("type");
    if (draft.genres.length) params.set("genre", draft.genres.join(","));
    else params.delete("genre");
    if (draft.lang) params.set("language", draft.lang);
    else params.delete("language");
    if (draft.year) params.set("year", draft.year);
    else params.delete("year");
    if (draft.sort !== "new") params.set("sort", sortQueryValue(draft.sort));
    else params.delete("sort");

    // Route cố định (phim-le, quoc-gia/..., chu-de/...) luôn được áp lại như source.
    if (locked.country) params.set("country", locked.country);
    if (locked.type) params.set("type", locked.type);
    if (locked.genres?.length) params.set("genre", locked.genres.join(","));
    params.delete("page");

    const query = params.toString();
    window.history.pushState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    const next = filtersFromParams(params, locked);
    setApplied(next);
    setDraft(next);
    setPage(1);
    setFilterOpen(false);
    setLoading(true);
    if (loadingTimer.current) clearTimeout(loadingTimer.current);
    loadingTimer.current = setTimeout(() => setLoading(false), 300);
  };

  const all = { value: "", label: "Tất cả" } as const;

  return (
    <main className={mainClassName}>
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A0A0F]/90 backdrop-blur-sm">
          <div className="animate-spin mb-5 h-12 w-12 rounded-full border-4 border-[#FFD166] border-t-transparent" />
          <p className="text-lg font-medium text-white">Đang tìm kiếm phim...</p>
        </div>
      )}

      {banner}

      <div className="mx-auto max-w-[1400px] px-4 py-8">
        {!hideTitle && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-text-primary sm:text-2xl">{title}</h2>
          </div>
        )}

        <div className="mb-8 font-sans">
          <button
            type="button"
            aria-expanded={filterOpen}
            aria-controls="category-filter-panel"
            onClick={() => {
              setDraft(applied);
              setFilterOpen((v) => !v);
            }}
            className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-text-primary transition-colors hover:text-white"
          >
            <svg
              className={`h-4 w-4 transition-transform duration-300 ${filterOpen ? "rotate-180 text-[#FFD166]" : ""}`}
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
              className="animate-fade-in overflow-hidden rounded-2xl border border-dashed border-white/[0.25] bg-white/[0.02] p-4 text-sm shadow-2xl backdrop-blur-xl md:p-6"
            >
              <div className="space-y-4 md:space-y-6">
                <PillRow
                  label="Quốc gia:"
                  options={[all, ...FILTER_GROUPS.countries]}
                  value={draft.country}
                  onChange={(v) => edit("country", v)}
                  disabled={() => !!locked.country}
                />
                <PillRow
                  label="Loại phim:"
                  options={[all, ...FILTER_GROUPS.types]}
                  value={draft.type}
                  onChange={(v) => edit("type", v)}
                  disabled={() => !!locked.type}
                />
                <PillRow
                  label={
                    <>
                      Thể loại:
                      {draft.genres.length > 0 && (
                        <span className="ml-1.5 inline-flex h-4 items-center justify-center rounded-full bg-[#FFD166] px-1.5 text-[10px] font-bold text-[#1c1c1c]">
                          {draft.genres.length}/5
                        </span>
                      )}
                    </>
                  }
                  options={[all, ...FILTER_GROUPS.genres]}
                  values={draft.genres}
                  onToggle={toggleGenre}
                  disabled={(v) =>
                    !!locked.genres?.length ||
                    (v !== "" && !draft.genres.includes(v) && draft.genres.length >= 5)
                  }
                  disabledTitle="Tối đa 5 thể loại"
                />
                <PillRow
                  label="Ngôn ngữ:"
                  options={[all, ...FILTER_GROUPS.langs]}
                  value={draft.lang}
                  onChange={(v) => edit("lang", v)}
                />
                <PillRow
                  label="Năm sản xuất:"
                  options={[
                    all,
                    ...FILTER_GROUPS.years.map((y) => ({ value: y, label: y })),
                  ]}
                  value={draft.year}
                  onChange={(v) => edit("year", v)}
                  footer={
                    <div className="relative flex-none">
                      <svg
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Nhập năm"
                        value={
                          draft.year &&
                          !FILTER_GROUPS.years.includes(draft.year as (typeof FILTER_GROUPS.years)[number])
                            ? draft.year
                            : ""
                        }
                        onChange={(e) => edit("year", e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className="w-full rounded-full border border-white/10 bg-white/5 py-1.5 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:bg-white/10 focus:outline-none md:w-32"
                      />
                    </div>
                  }
                />
                <PillRow
                  label="Sắp xếp:"
                  options={FILTER_GROUPS.sorts}
                  value={draft.sort}
                  onChange={(v) => edit("sort", v as MovieFilters["sort"])}
                />
              </div>

              <div className="mt-8 flex items-center gap-3 border-t border-dashed border-white/[0.12] pt-6 md:gap-4">
                <button
                  type="button"
                  onClick={apply}
                  className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#FFD166] bg-gradient-to-r from-[#FFD166] to-[#ffb347] px-6 py-2.5 font-bold text-[#1c1c1c] transition-all hover:opacity-90 active:scale-[0.98] md:flex-none"
                >
                  Lọc kết quả
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="flex-1 whitespace-nowrap rounded-full border border-white/10 bg-transparent px-6 py-2.5 font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white md:flex-none"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>

        <Suspense fallback={<div className="py-20 text-center text-[15px] text-text-muted">{emptyText}</div>}>
          <CategoryGrid
            movies={filtered}
            basePath={basePath}
            emptyText={hasFilter ? "Không có phim khớp bộ lọc." : emptyText}
            pageOverride={page}
            onPageChange={setPage}
          />
        </Suspense>
      </div>
    </main>
  );
}
