"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { getList, toggleList } from "@/lib/user-library";
import { useLiveHome } from "@/lib/live-data";
import { fillStyle, type HeroSlide as Slide } from "./types";
import { IconPlay, IconHeartSolid, IconInfo } from "./icons";

const DOT_STYLE = {
  backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.4) 0.4px, transparent 1px)",
  backgroundSize: "3px 3px",
};
const MOBILE_GRADIENT =
  "linear-gradient(to top, rgb(15,17,26) 5%, rgba(15,17,21,0.6) 30%, transparent 60%), radial-gradient(transparent 60%, rgba(15,17,26,0.7) 100%)";
const DESKTOP_GRADIENT =
  "linear-gradient(to right, rgba(15,17,26,0.6) 0%, rgba(15,17,26,0.1) 30%, transparent 60%), linear-gradient(to top, rgb(15,17,26) 0%, transparent 40%), radial-gradient(transparent 65%, rgba(15,17,26,0.8) 100%)";

/** Kích thước logo lấy đúng clamp() của chophim.wtf, lưu trong home.json theo từng slide. */
function logoBoxStyle(slide: Slide) {
  const box = slide.logoBox;
  if (!box) return { width: "clamp(228px, 27vw, 380px)", height: "clamp(97px, 12vw, 162px)" };
  return {
    width: `clamp(${box.Wmin}px, ${box.Wvw}vw, ${box.Wmax}px)`,
    height: `clamp(${box.Hmin}px, ${box.Hvw}vw, ${box.Hmax}px)`,
  };
}

function HeroSlide({
  slide,
  active,
  favorite,
  onFavorite,
}: {
  slide: Slide;
  active: boolean;
  favorite: boolean;
  onFavorite: (slide: Slide) => void;
}) {
  const tabIndex = active ? 0 : -1;
  const watchHref = withBasePath(slide.hrefWatch);
  const detailHref = withBasePath(slide.hrefDetail);

  return (
    <div
      className={`swiper-slide absolute inset-0 h-full w-full transition-opacity duration-300 ${
        active ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
      }`}
      aria-hidden={!active}
    >
      <div className="relative h-full w-full">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={slide.title}
            className="object-cover object-top"
            style={fillStyle}
            src={slide.backdrop}
            draggable={false}
          />
          <div className="pointer-events-none absolute inset-0 hidden opacity-30 md:block" style={DOT_STYLE} />
          <div className="pointer-events-none absolute inset-0 md:hidden" style={{ background: MOBILE_GRADIENT }} />
          <div className="pointer-events-none absolute inset-0 hidden md:block" style={{ background: DESKTOP_GRADIENT }} />
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 flex items-end pb-0 md:pb-[6vw] lg:pb-[5vw] xl:pb-32">
          <div
            className={`mx-auto w-full max-w-[1400px] px-4 md:px-8 ${
              active ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            <div className="relative top-0 mx-auto flex max-w-xl flex-col items-center text-center md:mx-0 md:max-w-[50vw] md:items-start md:text-left lg:max-w-2xl">
              <div className="mb-1 md:mb-4 lg:mb-6">
                <h2 className="text-lg font-bold text-white drop-shadow-md md:hidden">{slide.title}</h2>
                {slide.logo ? (
                  // Source bọc logo trong 1 div có clamp(width,height), còn img là w-full h-full object-contain.
                  // Giữ đúng cấu trúc đó để logo không bị co giãn lệch giữa các slide.
                  <div className="hidden md:block" style={logoBoxStyle(slide)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={slide.title}
                      className="h-full w-full object-contain object-left-bottom drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                      src={slide.logo}
                      loading={active ? "eager" : "lazy"}
                      draggable={false}
                    />
                  </div>
                ) : (
                  <h2 className="mb-1 text-lg font-bold text-white drop-shadow-md md:mb-3 md:text-2xl lg:mb-4 lg:text-4xl">
                    {slide.title}
                  </h2>
                )}
              </div>

              <p className="mb-2 text-xs font-medium text-[#FECF59] drop-shadow md:mb-3 lg:mb-4 lg:text-sm">
                {slide.origin}
              </p>

              <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-[10px] text-white/90 md:mb-4 md:justify-start md:text-xs">
                {slide.imdb != null && slide.imdb > 0 ? (
                  <div className="flex items-center text-[11px] font-bold rounded overflow-hidden border border-solid border-[rgba(245,197,24,0.5)]">
                    <span className="bg-[#F5C518] px-1.5 py-0.5 text-black">IMDb</span>
                    <span className="bg-[rgba(245,197,24,0.1)] px-1.5 py-0.5 text-white">{slide.imdb.toFixed(1)}</span>
                  </div>
                ) : null}
                {slide.tmdb > 0 ? (
                  <div className="flex items-center text-[11px] font-bold rounded overflow-hidden border border-solid border-[rgba(1,180,228,0.5)]">
                    <span className="bg-[#01B4E4] px-1.5 py-0.5 text-white">TMDb</span>
                    <span className="bg-[rgba(1,180,228,0.1)] px-1.5 py-0.5 text-white">{slide.tmdb.toFixed(1)}</span>
                  </div>
                ) : null}
                {slide.quality ? (
                  <span className="rounded border border-white bg-black/40 px-2 py-[3px]">{slide.quality}</span>
                ) : null}
                {slide.year > 0 ? (
                  <span className="rounded border border-white bg-black/40 px-2 py-[3px]">{slide.year}</span>
                ) : null}
                {slide.episode ? (
                  <span className="rounded border border-white bg-black/40 px-2 py-[3px]">{slide.episode}</span>
                ) : null}
              </div>

              <div className="mb-4 hidden flex-wrap items-center justify-center gap-2 md:flex md:justify-start">
                {slide.genres.slice(0, 3).map((g) => (
                  <span key={g} className="rounded-md bg-white/10 px-2 py-[3px] text-[10px] text-white/80 md:text-xs">
                    {g}
                  </span>
                ))}
              </div>

              {/* Source đặt line-clamp ngay trên <p>: nếu đặt trên div có md:block,
                  display:block ghi đè -webkit-box và nội dung không bị cắt ở ngưỡng md. */}
              <div className="mb-4 hidden max-w-sm md:block lg:mb-8 lg:max-w-lg">
                <p className="text-xs font-light leading-relaxed text-white line-clamp-2 lg:line-clamp-3">
                  {slide.content}
                </p>
              </div>

              <div className="hidden items-center justify-center gap-4 md:flex md:justify-start">
                <a
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[#0f1115] transition-transform hover:scale-105 md:h-14 md:w-14 lg:h-16 lg:w-16"
                  title="Xem Ngay"
                  href={watchHref}
                  tabIndex={tabIndex}
                  style={{ background: "linear-gradient(39deg, rgb(254, 207, 89), rgb(255, 241, 204))" }}
                >
                  <IconPlay className="relative h-10 w-10 text-[#0f1115] md:h-12 md:w-12" />
                </a>
                <div className="flex h-10 items-center overflow-hidden rounded-full border border-white/20 bg-white/5 backdrop-blur-md md:h-12 lg:h-14">
                  <button
                    type="button"
                    className="group/btn flex h-full w-16 items-center justify-center text-white transition-all active:scale-75 md:w-20"
                    title={favorite ? "Bỏ yêu thích" : "Yêu thích"}
                    aria-pressed={favorite}
                    tabIndex={tabIndex}
                    onClick={() => onFavorite(slide)}
                  >
                    <IconHeartSolid
                      className={`h-5 w-5 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] group-hover/btn:scale-110 md:h-6 md:w-6 ${
                        favorite
                          ? "scale-110 text-[#FECF59] drop-shadow-[0_0_12px_rgba(254,207,89,0.6)]"
                          : "scale-90 text-white md:scale-100"
                      }`}
                    />
                  </button>
                  <div className="h-3/5 w-[1px] bg-white/20" />
                  <a
                    className="group/link flex h-full w-16 items-center justify-center text-white transition-colors md:w-20"
                    title="Chi tiết phim"
                    href={detailHref}
                    tabIndex={tabIndex}
                  >
                    <IconInfo className="h-6 w-6 fill-white text-[#0f1115] transition-all group-hover/link:fill-[#FECF59] [&>circle]:stroke-white group-hover/link:[&>circle]:stroke-[#FECF59] md:h-7 md:w-7" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <a
          className={`absolute inset-0 z-50 md:hidden ${active ? "pointer-events-auto" : "pointer-events-none"}`}
          title="Chi tiết phim"
          href={detailHref}
          tabIndex={tabIndex}
        />
      </div>
    </div>
  );
}

/** Dải thumb desktop đúng source: flex + overflow-x-auto, thumb đang chọn được scrollTo căn giữa. */
function ThumbRow({
  slides,
  thumbs,
  active,
  onSelect,
}: {
  slides: Slide[];
  thumbs: string[];
  active: number;
  onSelect: (i: number) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    const item = row?.children[active] as HTMLElement | undefined;
    if (!row || !item) return;
    row.scrollTo({
      left: item.offsetLeft - row.offsetWidth / 2 + item.offsetWidth / 2,
      behavior: "smooth",
    });
  }, [active]);

  return (
    <div
      ref={rowRef}
      className="hero-thumbs absolute -bottom-16 left-1/2 z-30 flex max-w-[calc(100%-2rem)] -translate-x-1/2 snap-x gap-2 overflow-x-auto px-2 pb-2 scroll-smooth pointer-events-auto md:bottom-8 md:left-auto md:max-w-md md:right-8 md:translate-x-0 md:pb-0 lg:max-w-lg [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {slides.map((s, i) => {
        const isActive = i === active;
        return (
          <button
            key={s.slug}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={isActive}
            style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)" }}
            className={`relative aspect-square w-[14vw] max-w-[40px] shrink-0 snap-center transform-gpu overflow-hidden rounded-full border-2 bg-[#171a26] transition-all duration-300 sm:w-[10vw] md:aspect-video md:w-[7vw] md:max-w-[75px] md:rounded-lg lg:w-[6vw] lg:max-w-[85px] xl:w-[5vw] ${
              isActive
                ? "scale-100 border-white/90 opacity-100 shadow-md"
                : "scale-95 border-transparent opacity-80 hover:scale-100 hover:opacity-100"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={s.title}
              className="h-full w-full rounded-full object-cover md:rounded-lg"
              src={thumbs[i] || s.backdrop}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </button>
        );
      })}
    </div>
  );
}

export function Hero() {
  const home = useLiveHome();
  const slides = home.hero.slides;
  const thumbs = home.hero.thumbs;
  const n = slides.length;
  const [active, setActive] = useState(0);
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [hovered, setHovered] = useState(false);
  const [autoStopped, setAutoStopped] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x0: number; y0: number; dx: number; id: number; moved: boolean } | null>(null);
  const swipedAt = useRef(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const load = () => setFavoriteSlugs(getList("favorites").map((item) => item.slug));
    load();
    window.addEventListener("storage", load);
    window.addEventListener("nhotphim:library-change", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("nhotphim:library-change", load);
    };
  }, []);

  useEffect(() => {
    const update = () => setPageHidden(document.visibilityState === "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  // Swiper desktop: autoplay 5s, disableOnInteraction:true, pauseOnMouseEnter:true.
  useEffect(() => {
    if (pageHidden || hovered || autoStopped || n <= 1) return;
    const timer = setInterval(() => setActive((a) => (a + 1) % n), 5000);
    return () => clearInterval(timer);
  }, [n, pageHidden, hovered, autoStopped]);

  const markInteracted = useCallback(() => setAutoStopped(true), []);

  const toggleFavorite = useCallback((slide: Slide) => {
    const next = toggleList("favorites", {
      slug: slide.slug,
      title: slide.title,
      poster: slide.poster || slide.backdrop,
      origin: slide.origin,
    });
    setFavoriteSlugs((prev) => (next ? [...prev, slide.slug] : prev.filter((s) => s !== slide.slug)));
  }, []);

  const selectThumb = useCallback(
    (i: number) => {
      markInteracted();
      setActive(i);
    },
    [markInteracted]
  );

  // Kéo chuột trên hero (desktop) chỉ để đổi phim: content đứng yên, thả ra mới chuyển.
  useEffect(() => {
    const hero = rootRef.current;
    if (!hero) return;
    const reset = () => {
      dragRef.current = null;
      setDragging(false);
    };
    const up = () => {
      const d = dragRef.current;
      if (!d) return reset();
      const moved = d.moved;
      const dx = d.dx;
      reset();
      if (moved && Math.abs(dx) >= 60) setActive((a) => (a + (dx < 0 ? 1 : -1) + n) % n);
    };
    hero.addEventListener("pointerup", up);
    hero.addEventListener("pointercancel", reset);
    window.addEventListener("pointerup", up);
    window.addEventListener("blur", reset);
    return () => {
      hero.removeEventListener("pointerup", up);
      hero.removeEventListener("pointercancel", reset);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("blur", reset);
    };
  }, [n]);

  // Vuốt ngang trên hero (khi chưa tới md): khoá hướng, ngang đổi phim, dọc để trang cuộn.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let x0 = 0;
    let y0 = 0;
    let lock: "h" | "v" | null = null;
    let touching = false;

    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        lock = null;
        touching = false;
        return;
      }
      if ((e.target as HTMLElement | null)?.closest(".hero-thumbs")) {
        lock = null;
        touching = false;
        return;
      }
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
      lock = null;
      touching = true;
    };
    const move = (e: TouchEvent) => {
      if (!touching || lock === "v") return;
      const dx = e.touches[0].clientX - x0;
      const dy = e.touches[0].clientY - y0;
      if (lock === null) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        lock = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
      }
      if (lock === "h" && e.cancelable) e.preventDefault();
    };
    const end = (e: TouchEvent) => {
      if (!touching) return;
      touching = false;
      const was = lock;
      lock = null;
      if (was !== "h") return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) >= 40) {
        markInteracted();
        swipedAt.current = Date.now();
        setActive((a) => (a + (dx < 0 ? 1 : -1) + n) % n);
      }
    };

    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end, { passive: true });
    el.addEventListener("touchcancel", end, { passive: true });
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, [n, markInteracted]);

  const onClickCapture = (e: React.MouseEvent) => {
    if (Date.now() - swipedAt.current < 350) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    markInteracted();
    const t = e.target as HTMLElement;
    if (t.closest("button, a, input, textarea, select, .hero-thumbs")) return;
    dragRef.current = { x0: e.clientX, y0: e.clientY, dx: 0, id: e.pointerId, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.moved) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      d.moved = true;
      setDragging(true);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(d.id);
      } catch {
        /* noop */
      }
    }
    d.dx = dx;
  };

  const cancelDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <div
      ref={rootRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerCancel={cancelDrag}
      onClickCapture={onClickCapture}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={`relative hidden w-full group md:-mt-16 md:block md:cursor-grab md:active:cursor-grabbing ${
        dragging ? "select-none" : ""
      }`}
      style={{ touchAction: "pan-y" }}
    >
      <div className="relative aspect-[390/240] w-full overflow-hidden bg-[#0f1115] md:aspect-video lg:aspect-[21/10]">
        <div className="swiper swiper-fade absolute inset-0 z-10 h-full w-full">
          <div className="swiper-wrapper relative h-full w-full" style={{ transitionDuration: "0ms" }}>
            {slides.map((s, i) => (
              <HeroSlide
                key={s.slug}
                slide={s}
                active={i === active}
                favorite={favoriteSlugs.includes(s.slug)}
                onFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>

        <ThumbRow slides={slides} thumbs={thumbs} active={active} onSelect={selectThumb} />
      </div>
    </div>
  );
}
