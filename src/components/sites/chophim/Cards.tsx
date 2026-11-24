import type { MovieItem } from "./types";
import { fillStyle } from "./types";
import { BottomBadges, TopBadge } from "./Badges";

/** Card ảnh ngang (S:2, S:3, S:4) */
export function LandscapeCard({ item }: { item: MovieItem }) {
  return (
    <a className={item.itemClass} href={item.href}>
      <div className="relative aspect-video rounded-xl overflow-hidden bg-bg-secondary mb-3 shadow-lg">
        <img alt={item.alt} loading="lazy" decoding="async" className="object-cover transition-transform duration-500" style={fillStyle} src={item.img} />
        <TopBadge item={item} />
        <BottomBadges item={item} />
      </div>
      <h3 className="text-[13px] md:text-base font-bold text-white line-clamp-1 group-hover:text-yellow-400 transition-colors">{item.title}</h3>
      <p className="text-[11px] md:text-sm text-text-muted line-clamp-1 mt-0.5">{item.sub}</p>
    </a>
  );
}

/** Card poster (S:7, S:8, S:b, S:c) — có placeholder SVG + overlay */
export function PosterCard({ item }: { item: MovieItem }) {
  return (
    <div className="relative movie-card-wrapper">
      <a className="movie-card block group" href={item.href}>
        <div className="relative rounded-lg overflow-hidden bg-bg-card aspect-[2/3] ring-1 ring-white/5 shadow-md flex items-center justify-center">
          <svg className="absolute w-12 h-12 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <img alt={item.alt} loading="lazy" decoding="async" className="object-cover transition-transform duration-500 relative z-10" style={fillStyle} src={item.img} />
          <TopBadge item={item} />
          <BottomBadges item={item} poster />
          <div className="overlay absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
        <div className="text-center px-1 mt-2">
          <h3 className="text-[12px] sm:text-[13px] font-semibold text-text-primary truncate group-hover:text-yellow-400 transition-colors">{item.title}</h3>
          <p className="text-[10px] sm:text-[11px] text-text-muted mt-0.5 truncate">{item.sub}</p>
        </div>
      </a>
    </div>
  );
}

/** Card nổi bật (S:a, S:d) — không có placeholder/overlay */
export function FeaturedCard({ item }: { item: MovieItem }) {
  return (
    <a className={item.itemClass} href={item.href}>
      <div className={item.imgWrapClass}>
        <img alt={item.alt} loading="lazy" decoding="async" className="object-cover transition-transform duration-500" style={fillStyle} src={item.img} />
        <TopBadge item={item} />
        <BottomBadges item={item} poster />
      </div>
      <div className="text-center px-1">
        <h3 className="text-[13px] md:text-sm font-semibold text-text-primary line-clamp-1 group-hover:text-yellow-400 transition-colors">{item.title}</h3>
        <p className="text-[11px] md:text-xs text-text-muted mt-[3px] line-clamp-1 font-medium">{item.sub}</p>
      </div>
    </a>
  );
}

/** Card Top 10 (S:9, S:e) — khung nghiêng + số thứ tự */
export function Top10Card({ item }: { item: MovieItem }) {
  const quality = item.meta?.quality ?? "";
  const episode = item.meta?.episode ?? "";
  return (
    <a className={item.itemClass} draggable={false} style={{ contain: "layout paint style" }} href={item.href}>
      <div className="relative aspect-[2/3] rounded-b-2xl sm:rounded-b-[22px] overflow-hidden mb-3 pointer-events-none group">
        <div className="absolute left-0 top-0 w-full h-[115%] overflow-hidden rounded-t-2xl sm:rounded-t-[22px]" style={{ transform: "skewY(6deg)", transformOrigin: "top left" }}>
          <div className="absolute left-0 top-0 w-full aspect-[2/3] transition-all duration-300 ease-out p-0 group-hover:p-1" style={{ transform: "skewY(-6deg)", transformOrigin: "top left" }}>
            <div className="relative w-full h-full rounded-b-[18px] sm:rounded-b-[18px] rounded-t-[18px] sm:rounded-t-[18px] overflow-hidden">
              <img alt={item.alt} loading="lazy" decoding="async" className="object-cover" style={fillStyle} src={item.img} />
              <div className="absolute inset-0 bg-[#FFD778]/0 group-hover:bg-[#ffde8a]/25 transition-colors duration-300 ease-out pointer-events-none z-10" />
            </div>
          </div>
        </div>
        <div className="absolute left-0 top-0 w-full h-[115%] rounded-t-2xl sm:rounded-t-[22px] border-[4px] border-b-0 border-transparent group-hover:border-[#FCCB56] transition-colors duration-300 ease-out pointer-events-none z-30" style={{ transform: "skewY(6deg)", transformOrigin: "top left" }} />
        <div className="absolute inset-x-0 bottom-0 h-10 rounded-b-2xl sm:rounded-b-[22px] border-[4px] border-t-0 border-transparent group-hover:border-[#FCCB56] transition-colors duration-300 ease-out pointer-events-none z-30" />
        <BottomBadges item={item} poster />
      </div>
      <div className="flex gap-2.5 px-1 mt-1">
        <div
          className="text-4xl sm:text-[2.5rem] md:text-[3.5rem] lg:text-5xl font-black italic shrink-0 pr-1 md:pr-2"
          style={{
            backgroundImage: "linear-gradient(39deg, rgba(254,207,89,1), rgba(255,241,204,1))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
            lineHeight: "0.8",
            paddingTop: "4px",
          }}
        >
          {item.rank}
        </div>
        <div className="flex flex-col flex-1 min-w-0 justify-start pt-1">
          <h3 className="text-[13px] md:text-sm font-semibold text-text-primary line-clamp-1 group-hover:text-yellow-400 transition-colors">{item.title}</h3>
          <p className="text-[10px] md:text-[11px] text-text-muted mt-0.5 line-clamp-1">{item.sub}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[9px] font-medium text-text-secondary">{quality}</span>
            <span className="w-1 h-1 rounded-full bg-text-muted/50" />
            <span className="text-[10px] font-medium text-text-secondary">{episode}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
