"use client";

import { withBasePath } from "@/lib/base-path";
import { getList, toggleList } from "@/lib/user-library";
import { useEffect, useState } from "react";
import { useMotionPaused } from "@/lib/use-motion-paused";
import { home, fillStyle } from "./types";
import { IconPlay, IconHeartSolid, IconInfo, IconChevronRight } from "./icons";

type ASlide = (typeof home.anime.slides)[number];

const stripTags = (html: string) => html.replace(/<[^>]*>/g, "").trim();

/* ------------------------------------------------------------------ */
/* Slide bản desktop                                                   */
/* ------------------------------------------------------------------ */
function DeskSlide({
  s,
  active,
  favorite,
  onFavorite,
}: {
  s: ASlide;
  active: boolean;
  favorite: boolean;
  onFavorite: (s: ASlide) => void;
}) {
  const desc = stripTags(s.content);
  return (
    <div
      className={`swiper-slide ${active ? "opacity-100 z-10" : "opacity-0 z-0"}`}
      style={{ transitionDuration: "700ms" }}
    >
      <div className={`w-full relative ${active ? "" : "pointer-events-none"}`}>
        <div className="relative w-full aspect-video lg:aspect-[2.5/1] bg-[#12121a]">
          <div className="absolute inset-0 w-[30%] bg-[#171a26] pointer-events-none" />
          <div className="absolute inset-0 left-[30%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={s.title}
              decoding="async"
              className="object-cover object-top"
              style={fillStyle}
              src={s.backdrop}
            />
          </div>
          <div className="absolute inset-0 pointer-events-none opacity-30 anime-dot-overlay" />
          <div className="absolute inset-0 pointer-events-none anime-left-gradient" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] via-transparent to-transparent pointer-events-none" />

          <div className="absolute inset-0 z-20 flex flex-col justify-center p-10 lg:p-12 pointer-events-none w-[40%] lg:w-[35%]">
            <div className="w-full max-w-xl flex flex-col pointer-events-auto">
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-1.5 leading-tight drop-shadow-lg truncate w-full">
                {s.title}
              </h3>
              <p className="text-[#FECF59] text-sm mb-3 font-medium drop-shadow-md truncate w-full">
                {s.origin}
              </p>

              <div className="flex items-center flex-wrap gap-1.5 mb-3 h-[30px] overflow-hidden shrink-0">
                {s.imdb != null && (
                  <div className="flex items-center text-[11px] font-bold rounded overflow-hidden border border-solid border-[rgba(245,197,24,0.5)]">
                    <span className="bg-[#F5C518] text-black px-1.5 py-0.5">IMDb</span>
                    <span className="bg-[rgba(245,197,24,0.1)] text-white px-1.5 py-0.5">
                      {s.imdb.toFixed(1)}
                    </span>
                  </div>
                )}
                {s.tmdb != null && s.tmdb > 0 && (
                  <div className="flex items-center text-[11px] font-bold rounded overflow-hidden border border-solid border-[rgba(1,180,228,0.5)]">
                    <span className="bg-[#01B4E4] text-white px-1.5 py-0.5">TMDb</span>
                    <span className="bg-[rgba(1,180,228,0.1)] text-white px-1.5 py-0.5">
                      {s.tmdb.toFixed(1)}
                    </span>
                  </div>
                )}
                <span className="px-2 py-[4.5px] rounded-md border border-white bg-black/40 backdrop-blur-sm shadow-sm text-[11px] text-white/90">
                  {s.year}
                </span>
                <span className="px-2 py-[4.5px] rounded-md border border-white bg-black/40 backdrop-blur-sm shadow-sm text-[11px] text-white/90">
                  {s.episode}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mb-5 h-[26px] overflow-hidden shrink-0 whitespace-nowrap">
                {s.genres.map((g) => (
                  <span
                    key={g}
                    className="text-[11px] text-white/50 bg-white/10 px-2 py-[3px] rounded-md backdrop-blur-sm shrink-0"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <div className="mb-6 lg:mb-8 w-full max-w-lg shrink-0">
                <p className="text-xs lg:text-sm text-white/80 font-normal leading-relaxed line-clamp-3 h-[54px] lg:h-[63px] overflow-hidden">
                  {desc}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <a
                  className="anime-play-btn w-16 h-16 text-[#0f1115] rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-[0_0_15px_rgba(254,207,89,0.5)] shrink-0"
                  title="Xem Ngay"
                  href={withBasePath(`/xem/${s.slug}`)}
                >
                  <IconPlay className="relative w-12 h-12 text-[#0f1115]" />
                </a>
                <div className="flex bg-white/5 border border-white/20 rounded-full backdrop-blur-md h-14 items-center overflow-hidden shrink-0">
                  <button
                    type="button"
                    className="group/btn w-20 h-full flex items-center justify-center transition-all text-white active:scale-75"
                    title={favorite ? "Bỏ yêu thích" : "Yêu thích"}
                    aria-pressed={favorite}
                    onClick={() => onFavorite(s)}
                  >
                    <IconHeartSolid
                      className={`w-6 h-6 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] group-hover/btn:scale-110 ${
                        favorite
                          ? "scale-110 text-[#FECF59] drop-shadow-[0_0_12px_rgba(254,207,89,0.6)]"
                          : "scale-100 text-white"
                      }`}
                    />
                  </button>
                  <div className="w-[1px] h-3/5 bg-white/20" />
                  <a
                    className="group/link w-20 h-full flex items-center justify-center transition-colors text-white"
                    title="Chi tiết phim"
                    href={s.href}
                  >
                    <IconInfo className="w-7 h-7 text-[#0f1115] fill-white group-hover/link:fill-[#FECF59] [&>circle]:stroke-white group-hover/link:[&>circle]:stroke-[#FECF59] transition-all" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Slide bản mobile                                                    */
/* ------------------------------------------------------------------ */
function MobSlide({ s, active }: { s: ASlide; active: boolean }) {
  const desc = stripTags(s.content);
  return (
    <div
      className={`swiper-slide ${active ? "opacity-100 z-10" : "opacity-0 z-0"}`}
      style={{ transitionDuration: "700ms" }}
    >
      <div className="w-full relative">
        <div className="bg-[#171a26] flex flex-col w-full relative">
          <div className="relative w-full aspect-[16/10] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={s.title}
              decoding="async"
              className="object-cover object-top"
              style={fillStyle}
              src={s.backdrop}
            />
            <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-20 anime-mobile-gradient" />
          </div>
          <div className="px-5 pb-5 -mt-14 relative z-20 w-full">
            <div className="w-full flex flex-col pb-2">
              <div className="mb-2">
                <h3 className="text-base font-bold text-white mb-1 leading-tight truncate">
                  {s.title}
                </h3>
                <p className="text-[#FECF59] text-[11px] mb-2.5 font-medium truncate">{s.origin}</p>
                <div className="flex items-center flex-wrap gap-1.5 mb-2 text-[10px] text-white/90 max-h-[26px] overflow-hidden">
                  {s.tmdb != null && s.tmdb > 0 && (
                    <div className="flex items-center text-[10px] font-bold rounded overflow-hidden border border-solid border-[rgba(1,180,228,0.5)]">
                      <span className="bg-[#01B4E4] text-white px-1 py-0.5">TMDb</span>
                      <span className="bg-[rgba(1,180,228,0.1)] text-white px-1 py-0.5">
                        {s.tmdb.toFixed(1)}
                      </span>
                    </div>
                  )}
                  <span className="px-2 py-[3px] rounded-md border border-white bg-black/30 shrink-0">
                    {s.year}
                  </span>
                  <span className="px-2 py-[3px] rounded-md border border-white bg-black/30 shrink-0">
                    {s.episode}
                  </span>
                </div>
                <div className="flex items-center flex-wrap gap-1.5 mb-2 max-h-[24px] overflow-hidden">
                  {s.genres.map((g) => (
                    <span
                      key={g}
                      className="text-[10px] text-white/50 bg-white/10 px-2 py-[3px] rounded-md shrink-0"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[13px] text-white/70 leading-relaxed line-clamp-3 overflow-hidden">
                {desc}
              </p>
            </div>
          </div>
          <a
            className="absolute inset-0 z-50 pointer-events-none"
            title="Chi tiết phim"
            href={s.href}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section Thế giới Anime                                              */
/* ------------------------------------------------------------------ */
export function AnimeSection() {
  const slides = home.anime.slides;
  const [active, setActive] = useState(0);
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);

  useEffect(() => {
    const load = () => setFavoriteSlugs(getList("favorites").map((item) => item.slug));
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const toggleFavorite = (s: ASlide) => {
    const next = toggleList("favorites", {
      slug: s.slug,
      title: s.title,
      poster: s.poster || s.backdrop,
      origin: s.origin,
    });
    setFavoriteSlugs((prev) => (next ? [...prev, s.slug] : prev.filter((x) => x !== s.slug)));
  };

  const motionPaused = useMotionPaused();
  useEffect(() => {
    if (motionPaused || slides.length <= 1) return;
    const t = setInterval(() => setActive((a) => (a + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length, motionPaused]);

  return (
    <section>
      <div className="w-full mt-6 mb-12">
        <a className="inline-flex items-center gap-2 mb-6 group cursor-pointer" href={withBasePath("/hoat-hinh")}>
          <h2 className="text-2xl md:text-3xl font-bold text-white group-hover:text-accent transition-colors">
            Thế giới Anime
          </h2>
          <span className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center group-hover:border-accent transition-colors">
            <IconChevronRight className="w-4 h-4 text-white group-hover:text-accent transition-colors" />
          </span>
        </a>

        <div className="relative w-full">
          {/* desktop */}
          <div className="hidden md:block w-full rounded-[20px] md:rounded-[24px] overflow-hidden anime-banner-wrap-desktop">
            <div className="swiper swiper-fade w-full">
              <div className="swiper-wrapper relative w-full" style={{ cursor: "grab" }}>
                {slides.map((s, i) => (
                  <div
                    key={s.slug}
                    className="swiper-slide absolute inset-0 w-full h-full transition-opacity"
                    style={{
                      opacity: i === active ? 1 : 0,
                      zIndex: i === active ? 10 : 0,
                      pointerEvents: i === active ? "auto" : "none",
                    }}
                  >
                    <DeskSlide
                      s={s}
                      active={i === active}
                      favorite={favoriteSlugs.includes(s.slug)}
                      onFavorite={toggleFavorite}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* mobile */}
          <div className="md:hidden w-full rounded-[20px] overflow-hidden anime-banner-wrap-mobile">
            <div className="swiper w-full">
              <div className="swiper-wrapper relative w-full">
                {slides.map((s, i) => (
                  <div
                    key={s.slug}
                    className="swiper-slide absolute inset-0 w-full h-full transition-opacity"
                    style={{
                      opacity: i === active ? 1 : 0,
                      zIndex: i === active ? 10 : 0,
                      pointerEvents: i === active ? "auto" : "none",
                    }}
                  >
                    <MobSlide s={s} active={i === active} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* dải thumbnail chọn phim */}
          <div className="flex relative z-30 -mt-8 lg:-mt-10 px-10 justify-center overflow-x-auto scrollbar-hide snap-x items-end anime-mask-fade py-2">
            <div className="flex gap-1.5 md:gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.slug}
                  onClick={() => setActive(i)}
                  aria-label={`Go to anime ${s.title}`}
                  className={`relative shrink-0 w-[46px] h-[69px] lg:w-[62px] lg:h-[93px] rounded-lg overflow-hidden snap-center cursor-pointer transition-all duration-300 ${
                    i === active
                      ? "ring-2 ring-white shadow-[0_0_12px_rgba(255,255,255,0.3)] scale-100"
                      : "scale-95 opacity-80 hover:opacity-100 hover:scale-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={s.title}
                    loading="lazy"
                    decoding="async"
                    className="object-cover"
                    style={fillStyle}
                    src={s.poster}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
