// Trang danh mục / tìm kiếm: tiêu đề + nút Bộ lọc + lưới poster + phân trang.
import type { MovieDetail } from "./detail-types";
import { BottomBadges } from "./Badges";
import { fillStyle, type MovieItem } from "./types";
import { bottomBadgeText } from "./movie-filter";

const CARD_BOTTOM_CLS =
  "absolute inset-x-0 bottom-0 flex items-end pb-1.5 md:pb-0 pointer-events-none justify-center";

function toItem(m: MovieDetail): MovieItem {
  return {
    href: `/phim/${m.slug}`,
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

export function MovieCard({ m }: { m: MovieDetail }) {
  const item = toItem(m);
  return (
    <div className="relative movie-card-wrapper">
      <a className="movie-card block group" href={`/phim/${m.slug}`}>
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

export function Pagination({ page, totalPages, basePath }: { page: number; totalPages: number; basePath: string }) {
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
  return (
    <div className="flex items-center justify-center gap-3 md:gap-4 mt-12 mb-8">
      {prevDisabled ? (
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors bg-[#27293E] text-[#8A8D9F] opacity-70 cursor-not-allowed">
          {arrowLeft}
        </div>
      ) : (
        <a
          className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors bg-[#27293E] hover:bg-[#31344E] text-white shadow-lg"
          href={`${basePath}?page=${page - 1}`}
          aria-label="Trang trước"
        >
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
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors bg-[#27293E] text-[#8A8D9F] opacity-70 cursor-not-allowed">
          {arrowRight}
        </div>
      ) : (
        <a
          className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors bg-[#27293E] hover:bg-[#31344E] text-white shadow-lg"
          href={`${basePath}?page=${page + 1}`}
          aria-label="Trang sau"
        >
          {arrowRight}
        </a>
      )}
    </div>
  );
}

export function CategoryPage({
  title,
  movies,
  page = 1,
  totalPages = 1,
  basePath,
  emptyText = "Không tìm thấy phim nào.",
}: {
  title: string;
  movies: MovieDetail[];
  page?: number;
  totalPages?: number;
  basePath: string;
  emptyText?: string;
}) {
  return (
    <main className="flex-1 pt-16">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-text-primary flex items-center gap-2 text-xl sm:text-2xl">{title}</h2>
        </div>
        <div className="mb-8 font-sans">
          <button className="flex items-center gap-2 text-[15px] font-semibold text-text-primary hover:text-white transition-colors mb-4">
            <svg className="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span>Bộ lọc</span>
          </button>
        </div>

        {movies.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-text-muted text-[15px]">{emptyText}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-3 gap-y-6">
            {movies.map((m) => (
              <MovieCard key={m.slug} m={m} />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} basePath={basePath} />
      </div>
    </main>
  );
}
