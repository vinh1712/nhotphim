"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { home, fillStyle, type HeroSlide as Slide } from "./types";
import { IconPlay, IconHeartSolid, IconInfo } from "./icons";

const DOT_STYLE = { backgroundImage: "radial-gradient(rgba(0,0,0,0.4) 0.4px, transparent 1px)", backgroundSize: "3px 3px" };
const MOBILE_GRADIENT =
  "linear-gradient(to top, rgb(15,17,26) 5%, rgba(15,17,21,0.6) 30%, transparent 60%), radial-gradient(transparent 60%, rgba(15,17,26,0.7) 100%)";
const DESKTOP_GRADIENT =
  "linear-gradient(to right, rgba(15,17,26,0.6) 0%, rgba(15,17,26,0.1) 30%, transparent 60%), linear-gradient(to top, rgb(15,17,26) 0%, transparent 40%), radial-gradient(transparent 65%, rgba(15,17,26,0.8) 100%)";

/** Logo kiểu nhotphim: chỉ giới hạn max (không đóng khung cố định) -> logo luôn to nhất có thể */
const LOGO_CLASS =
  "hidden md:block w-auto h-auto object-contain object-left -ml-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] " +
  "max-w-[min(570px,90vw)] max-h-[clamp(96px,12vw,195px)]";

/** offset vòng tròn về (-n/2, n/2] */
function norm(v: number, n: number) {
  v = ((v % n) + n) % n;
  return v > n / 2 ? v - n : v;
}

function HeroSlide({ slide, active }: { slide: Slide; active: boolean }) {
  return (
    <div
      className={`swiper-slide absolute inset-0 w-full h-full transition-opacity duration-700 ${active ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
      aria-hidden={!active}
    >
      <div className="w-full h-full relative">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={slide.title} className="object-cover object-top" style={fillStyle} src={slide.backdrop} draggable={false} />
          <div className="absolute inset-0 pointer-events-none opacity-30 hidden md:block" style={DOT_STYLE} />
          <div className="absolute inset-0 pointer-events-none md:hidden" style={{ background: MOBILE_GRADIENT }} />
          <div className="absolute inset-0 pointer-events-none hidden md:block" style={{ background: DESKTOP_GRADIENT }} />
        </div>

        <div className="absolute inset-0 z-20 flex items-end pb-0 md:pb-[6vw] lg:pb-[5vw] xl:pb-32 pointer-events-none">
          <div className="max-w-[1400px] w-full mx-auto px-4 md:px-8 pointer-events-auto">
            <div className="max-w-xl mx-auto md:mx-0 md:max-w-[50vw] lg:max-w-2xl flex flex-col items-center md:items-start text-center md:text-left relative top-0 md:top-0">
              <div className="mb-1 md:mb-4 lg:mb-6">
                <h2 className="md:hidden text-lg font-bold text-white drop-shadow-md">{slide.title}</h2>
                {slide.logo && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img alt={slide.title} className={LOGO_CLASS} loading="lazy" src={slide.logo} draggable={false} />
                )}
              </div>

              <p className="text-[#FECF59] text-xs md:text-xs lg:text-sm mb-2 md:mb-3 lg:mb-4 font-medium drop-shadow">
                {slide.origin} ({slide.year})
              </p>

              <div className="flex justify-center md:justify-start items-center flex-wrap gap-2 mb-3 md:mb-4 text-[10px] md:text-xs text-white/90">
                {slide.imdb != null && (
                  <div className="flex items-center text-[11px] font-bold rounded overflow-hidden border border-solid border-[rgba(245,197,24,0.5)]">
                    <span className="bg-[#F5C518] text-black px-1.5 py-0.5">IMDb</span>
                    <span className="bg-[rgba(245,197,24,0.1)] text-white px-1.5 py-0.5">{slide.imdb.toFixed(1)}</span>
                  </div>
                )}
                {slide.tmdb != null && slide.tmdb > 0 && (
                  <div className="flex items-center text-[11px] font-bold rounded overflow-hidden border border-solid border-[rgba(1,180,228,0.5)]">
                    <span className="bg-[#01B4E4] text-white px-1.5 py-0.5">TMDb</span>
                    <span className="bg-[rgba(1,180,228,0.1)] text-white px-1.5 py-0.5">{slide.tmdb.toFixed(1)}</span>
                  </div>
                )}
                <span className="px-2 py-[3px] rounded border border-white bg-black/40">{slide.year}</span>
                <span className="px-2 py-[3px] rounded border border-white bg-black/40">{slide.episode}</span>
              </div>

              <div className="hidden md:flex justify-center md:justify-start items-center flex-wrap gap-2 mb-4">
                {slide.genres.slice(0, 3).map((g) => (
                  <span key={g} className="text-[10px] md:text-xs text-white/80 bg-white/10 px-2 py-[3px] rounded-md">
                    {g}
                  </span>
                ))}
              </div>

              <div className="hidden md:block mb-4 lg:mb-8 max-w-sm lg:max-w-lg">
                <p className="text-xs lg:text-sm text-white font-light leading-relaxed line-clamp-2 lg:line-clamp-3">{slide.content}</p>
              </div>

              <div className="hidden md:flex justify-center md:justify-start items-center gap-4">
                <a
                  className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 text-[#0f1115] rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_15px_rgba(254,207,89,0.5)] shrink-0"
                  title="Xem Ngay"
                  href={slide.hrefWatch}
                  style={{ background: "linear-gradient(39deg, rgb(254, 207, 89), rgb(255, 241, 204))" }}
                >
                  <IconPlay className="relative w-10 h-10 md:w-12 md:h-12 text-[#0f1115]" />
                </a>
                <div className="flex bg-white/5 border border-white/20 rounded-full backdrop-blur-md h-10 md:h-12 lg:h-14 items-center overflow-hidden">
                  <button className="group/btn w-16 md:w-20 h-full flex items-center justify-center transition-all text-white active:scale-75" title="Yêu thích">
                    <IconHeartSolid className="w-5 h-5 md:w-6 md:h-6 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] group-hover/btn:scale-110 text-white md:scale-100 scale-90" />
                  </button>
                  <div className="w-[1px] h-3/5 bg-white/20" />
                  <a className="group/link w-16 md:w-20 h-full flex items-center justify-center transition-colors text-white" title="Chi tiết phim" href={slide.hrefDetail}>
                    <IconInfo className="w-6 h-6 md:w-7 md:h-7 text-[#0f1115] fill-white group-hover/link:fill-[#FECF59] [&>circle]:stroke-white group-hover/link:[&>circle]:stroke-[#FECF59] transition-all" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <a className="absolute inset-0 z-50 md:hidden pointer-events-auto" title="Chi tiết phim" href={slide.hrefDetail} />
      </div>
    </div>
  );
}

/** Dải thumb desktop kiểu nhotphim: "cửa sổ" cắt ngang 436x56, thumb đang chọn cố định slot thứ 3,
 *  cả dải translate trượt qua cửa sổ, thumb càng xa càng mờ, thumb chui vòng thì nhảy tức thì. */
function ThumbWindow({ slides, thumbs, active, onSelect }: { slides: Slide[]; thumbs: string[]; active: number; onSelect: (i: number) => void }) {
  const n = slides.length;
  const prevO = useRef<Map<number, number>>(new Map());
  const prevActive = useRef<number | null>(null);
  const exp = prevActive.current === null ? 0 : norm(prevActive.current - active, n);

  useLayoutEffect(() => {
    const m = new Map<number, number>();
    for (let i = 0; i < n; i++) m.set(i, norm(i - active, n));
    prevO.current = m;
    prevActive.current = active;
  }, [active, n]);

  return (
    <div className="hero-thumbs absolute right-6 bottom-[34px] w-[436px] h-[56px] overflow-hidden z-30 hidden md:block">
      {slides.map((s, i) => {
        const o = norm(i - active, n);
        const prev = prevO.current.get(i);
        const wrapped = prev !== undefined && o - prev !== exp;
        const d = Math.min(Math.abs(o), 4);
        const isActive = o === 0;
        const opacity = d === 0 ? 1 : d === 1 ? 0.8 : d === 2 ? 0.55 : d === 3 ? 0.28 : 0;
        const filter = d === 0 ? "none" : d === 1 ? "brightness(0.8)" : d === 2 ? "brightness(0.6)" : d === 3 ? "brightness(0.45)" : "none";
        return (
          <button
            key={s.slug}
            onClick={() => onSelect(i)}
            aria-label={`Chuyển tới ${s.title}`}
            aria-current={isActive}
            className={`hero-thumb absolute left-[184px] top-[9px] w-[68px] h-[38px] box-border rounded-md overflow-hidden cursor-pointer border-2 bg-[#171a26] will-change-transform ${
              isActive ? "border-[#FECF59] z-[2] shadow-[0_6px_18px_rgba(0,0,0,0.55)]" : "border-transparent"
            } ${d === 1 || d === 2 ? "hover:!opacity-100 hover:!brightness-100" : ""} ${d === 4 ? "pointer-events-none" : ""}`}
            style={{
              transform: `translate3d(${o * 80}px, 0, 0) scale(${isActive ? 1.12 : 1})`,
              transition: wrapped
                ? "opacity 0.4s, filter 0.4s, border-color 0.3s"
                : "transform 0.55s cubic-bezier(.22,.9,.34,1), opacity 0.4s, filter 0.4s, border-color 0.3s",
              opacity,
              filter,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={s.title} className="w-full h-full object-cover" loading="lazy" decoding="async" src={thumbs[i]} draggable={false} />
          </button>
        );
      })}
    </div>
  );
}

/** Poster coverflow mobile kiểu nhotphim "kiểu chophim": poster dọc, xoay theo khoảng cách, đang chọn ở giữa. */
function PosterStrip({ slides, active, onSelect }: { slides: Slide[]; active: number; onSelect: (i: number) => void }) {
  const n = slides.length;
  const prevO = useRef<Map<number, number>>(new Map());
  const prevActive = useRef<number | null>(null);
  const exp = prevActive.current === null ? 0 : norm(prevActive.current - active, n);

  useLayoutEffect(() => {
    const m = new Map<number, number>();
    for (let i = 0; i < n; i++) m.set(i, norm(i - active, n));
    prevO.current = m;
    prevActive.current = active;
  }, [active, n]);

  return (
    <div className="mhero-strip relative z-10 mx-auto w-full max-w-[520px] overflow-hidden bg-[#0f1115]">
      <div className="relative h-[calc(min(54vw,210px)*1.5+28px)]" style={{ perspective: "1100px" }}>
        {slides.map((s, i) => {
          const o = norm(i - active, n);
          const prev = prevO.current.get(i);
          const wrapped = prev !== undefined && o - prev !== exp;
          const ao = Math.min(Math.abs(o), 3);
          const isActive = o === 0;
          const dist = ao > 2 ? "far" : ao < 0.5 ? "0" : ao < 1.5 ? "1" : "2";
          return (
            <button
              key={s.slug}
              onClick={() => onSelect(i)}
              aria-label={`Chọn phim ${s.title}`}
              aria-current={isActive}
              className={`mhero-poster absolute left-1/2 top-[14px] w-[min(54vw,210px)] aspect-[2/3] rounded-2xl border-2 overflow-hidden bg-[#171a26] will-change-transform ${
                isActive ? "border-white shadow-[0_18px_44px_rgba(0,0,0,0.65)]" : "border-transparent"
              } ${dist === "1" ? "opacity-80 brightness-[0.55] saturate-[0.85]" : ""} ${dist === "2" ? "opacity-60 brightness-[0.45] saturate-80 blur-[1.5px]" : ""} ${
                dist === "far" ? "opacity-0 pointer-events-none" : ""
              }`}
              style={{
                transform: `translateX(calc(-50% + ${o} * 88%)) rotateY(calc(${o} * -28deg)) scale(${1 - ao * 0.25})`,
                transition: wrapped
                  ? "opacity 0.45s, filter 0.45s, border-color 0.3s, box-shadow 0.45s"
                  : "transform 0.55s cubic-bezier(.22,.9,.34,1), opacity 0.45s, filter 0.45s, border-color 0.3s, box-shadow 0.45s",
                zIndex: Math.max(0, Math.round(10 - ao)),
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={s.title} className="w-full h-full object-cover" loading="lazy" decoding="async" src={s.poster || s.backdrop} draggable={false} />
              <span className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/[0.06]" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Hero() {
  const slides = home.hero.slides;
  const thumbs = home.hero.thumbs;
  const n = slides.length;
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x0: number; y0: number; dx: number; id: number; moved: boolean } | null>(null);
  const swipedAt = useRef(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);

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

  // Vuốt ngang trên hero mobile (toàn bộ khối, kể cả poster): khoá hướng như nhotphim,
  // ngang -> đổi phim + chặn click, dọc -> để trang cuộn bình thường.
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
      const t = e.target as HTMLElement | null;
      if (t?.closest(".hero-thumbs")) {
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
      if (lock === "h" && e.cancelable) e.preventDefault(); // vuốt ngang không làm trang trôi dọc
    };
    const end = (e: TouchEvent) => {
      if (!touching) return;
      touching = false;
      const was = lock;
      lock = null;
      if (was !== "h") return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) >= 40) {
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
  }, [n]);

  // Sau một lần vuốt đổi phim, chặn click tiếp theo (không để vuốt vô tình bấm vào link).
  const onClickCapture = (e: React.MouseEvent) => {
    if (Date.now() - swipedAt.current < 350) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (t.closest("button, a, input, textarea, select, .hero-thumbs, .mhero-strip")) return;
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
      className={`relative w-full group lg:-mt-16 md:cursor-grab md:active:cursor-grabbing ${dragging ? "select-none" : ""}`}
      style={{ touchAction: "pan-y" }}
    >
      {/* khối ảnh chính */}
      <div className="relative w-full aspect-[390/240] md:aspect-video lg:aspect-[21/10] bg-[#0f1115] overflow-hidden">
        <div className="swiper swiper-fade absolute inset-0 w-full h-full z-10">
          <div className="swiper-wrapper relative w-full h-full" style={{ transitionDuration: "0ms" }}>
            {slides.map((s, i) => (
              <HeroSlide key={s.slug} slide={s} active={i === active} />
            ))}
          </div>
        </div>

        {/* desktop: dải thumb trượt trong cửa sổ */}
        <ThumbWindow slides={slides} thumbs={thumbs} active={active} onSelect={setActive} />
      </div>

      {/* mobile: poster coverflow bên dưới ảnh, vuốt ngang để đổi phim */}
      <div className="md:hidden relative bg-[#0f1115] pb-4 select-none">
        <PosterStrip slides={slides} active={active} onSelect={setActive} />
      </div>
    </div>
  );
}
