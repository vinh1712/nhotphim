"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { detailHref } from "@/lib/live-data";
import { searchMovies, stripVn, type CardMovie } from "./movie-filter";
import { MobileMenu, type MobileMenuGroup, type MobileMenuLink } from "./MobileMenu";
import { NotificationBell } from "./NotificationBell";

/**
 * Ô tìm kiếm của chophim.wtf: gõ -> debounce 500ms -> gợi ý phim + "Có phải bạn muốn tìm"
 * + "Xem toàn bộ phim". Ở bản tĩnh không có API nên dữ liệu được lọc từ danh sách phim có sẵn.
 */
export function SearchAutocomplete({
  movies,
  fullWidth = false,
  autoFocus = false,
  onSelect,
}: {
  movies: CardMovie[];
  fullWidth?: boolean;
  autoFocus?: boolean;
  onSelect?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardMovie[]>([]);
  const [fuzzy, setFuzzy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const runSearch = (value: string) => {
    const q = value.trim();
    const id = ++requestRef.current;
    if (!q) {
      setResults([]);
      setFuzzy(false);
      setLoading(false);
      setOpen(false);
      return;
    }
    setLoading(true);
    const found = searchMovies(movies, q).slice(0, 5);
    const needle = stripVn(q);
    const exact = found.some((m) => stripVn(`${m.title} ${m.origin}`).includes(needle));
    if (id !== requestRef.current) return;
    setResults(found);
    setFuzzy(found.length > 0 && !exact);
    setLoading(false);
    setOpen(found.length > 0);
  };

  const onChange = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim()) {
      runSearch("");
      return;
    }
    timerRef.current = setTimeout(() => runSearch(value), 500);
  };

  const closeAll = () => {
    setOpen(false);
    setQuery("");
    setResults([]);
    onSelect?.();
  };

  const goSearchPage = () => {
    const q = query.trim();
    if (!q) return;
    closeAll();
    router.push(withBasePath(`/tim-kiem?keyword=${encodeURIComponent(q)}`));
  };

  const hasMovies = results.length > 0;

  return (
    <div ref={rootRef} className={`relative ${fullWidth ? "w-full" : ""}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goSearchPage();
        }}
        className={fullWidth ? "w-full" : ""}
      >
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm phim, diễn viên"
            value={query}
            autoFocus={autoFocus}
            onFocus={() => results.length > 0 && setOpen(true)}
            onChange={(e) => onChange(e.target.value)}
            className={`h-[42px] bg-white/10 text-[15px] text-text-primary placeholder:text-[#FFFFFF] focus:outline-none border transition-all ${
              fullWidth
                ? "w-full px-4 border-white/20 focus:border-white rounded-md"
                : "w-full pl-10 pr-4 border-white/0 focus:border-white rounded-[8px]"
            }`}
          />
          {!fullWidth && (
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-white/25 border-t-white/70 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </form>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-secondary border border-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-[480px] overflow-y-auto">
          {hasMovies && (
            <div>
              <div className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                {fuzzy ? "Có phải bạn muốn tìm" : "Phim"}
              </div>
              {results.map((m) => (
                <a
                  key={m.slug}
                  href={detailHref(m.slug)}
                  onClick={closeAll}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-bg-hover transition-colors"
                >
                  <div className="relative w-10 h-14 shrink-0 rounded overflow-hidden bg-bg-card flex items-center justify-center">
                    <svg className="absolute w-5 h-5 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                      />
                    </svg>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={m.title}
                      className="object-cover relative z-10"
                      style={{ position: "absolute", height: "100%", width: "100%", inset: 0, color: "transparent" }}
                      src={m.poster || m.backdrop}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = "0";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <p className="text-sm font-medium text-white truncate" title={m.title}>{m.title}</p>
                    <p className="text-xs text-white/50 truncate" title={m.origin}>{m.origin}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-white/40 mt-0.5">
                      {m.year != null && m.year > 0 && <span>{m.year}</span>}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {query.trim() && (
            <button
              type="button"
              onClick={goSearchPage}
              className="block w-full text-center text-[15px] text-white hover:bg-white/5 py-3.5 border-t border-white/5 transition-colors"
            >
              Xem toàn bộ phim
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Hàng header mobile: khi bấm Search thì ẩn logo/menu và hiện ô tìm kiếm full-width như source. */
export function MobileHeaderBar({
  movies,
  logoSrc,
  nav,
  groups,
  accountHref,
  appHref,
  accountName,
  accountEmail,
  accountAvatar,
  accountFrame,
  accountEmoji,
  loggedIn,
  authLoading,
  onLogout,
}: {
  movies: CardMovie[];
  logoSrc: string;
  nav: MobileMenuLink[];
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
}) {
  const [searching, setSearching] = useState(false);

  if (searching) {
    return (
      <div className="flex items-center w-full gap-3 lg:hidden">
        <div className="flex-1 w-full min-w-0">
          <SearchAutocomplete movies={movies} fullWidth autoFocus onSelect={() => setSearching(false)} />
        </div>
        <button
          type="button"
          onClick={() => setSearching(false)}
          className="p-1 text-[#ff6b6b] hover:text-[#ff8787] shrink-0"
          aria-label="Close"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 lg:hidden w-full">
        <MobileMenu
          primary={nav}
          groups={groups}
          accountHref={accountHref}
          appHref={appHref}
          accountName={accountName}
          accountEmail={accountEmail}
          accountAvatar={accountAvatar}
          accountFrame={accountFrame}
          accountEmoji={accountEmoji}
          loggedIn={loggedIn}
          authLoading={authLoading}
          onLogout={onLogout}
          showWatchTogether
        />
        <a className="flex items-center shrink-0" href={withBasePath("/")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="NhótPhim" width={160} height={45} decoding="async" className="h-10 w-auto object-contain" src={logoSrc} />
        </a>
      </div>
      <div className="flex items-center gap-3 lg:hidden shrink-0">
        <NotificationBell loggedIn={!!loggedIn} />
        <button
          type="button"
          onClick={() => setSearching(true)}
          className="p-2 text-text-secondary hover:text-text-primary"
          aria-label="Search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </>
  );
}
