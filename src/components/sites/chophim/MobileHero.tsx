"use client";

import { stripBasePath, withBasePath } from "@/lib/base-path";
// Hero bản điện thoại — dựng lại theo giao diện mobile của chophim.wtf (đo ở 390×844):
// section nền tối + backdrop blur, hàng pill Đề xuất/Phim Bộ/Phim Lẻ, coverflow poster,
// tiêu đề chữ, 2 nút, badges, mô tả, dots và vuốt ngang để đổi phim.
//
// Chuyển động khi vuốt lấy đúng như nhotphim (index.html, .mhero-strip/_bindMhSwipe):
// poster bám ngón tay theo quãng kéo (transform tắt transition lúc kéo), xoay 3D -28deg mỗi bậc,
// scale giảm liền mạch 0.25/bậc, mờ + tối + blur dần theo khoảng cách; thả tay đủ ngưỡng thì
// snap tiếp quãng đang kéo (0.55s cubic-bezier(.22,.9,.34,1)), chưa đủ thì nảy về.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveHome } from "@/lib/live-data";
import { IconPlay, IconInfo } from "./icons";

/** offset vòng tròn về (-n/2, n/2] */
function norm(v: number, n: number) {
  v = ((v % n) + n) % n;
  return v > n / 2 ? v - n : v;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const PILLS = [
  { key: "de-xuat", label: "Đề xuất", href: withBasePath("/") },
  { key: "phim-bo", label: "Phim Bộ", href: withBasePath("/phim-bo") },
  { key: "phim-le", label: "Phim Lẻ", href: withBasePath("/phim-le") },
];

export function MobileHero() {
  const router = useRouter();
  const home = useLiveHome();
  const slides = home.hero.slides;
  const n = slides.length;
  const [active, setActive] = useState(0);
  const [shift, setShift] = useState(0);
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const swipedAt = useRef(0);
  const touchingRef = useRef(false);

  // Autoplay đúng chophim.wtf: Swiper mobile dùng autoplay delay 7000,
  // disableOnInteraction:false, pauseOnMouseEnter:false — chỉ tạm dừng khi đang chạm/kéo.
  const [pageHidden, setPageHidden] = useState(false);
  useEffect(() => {
    const update = () => setPageHidden(document.visibilityState === "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (pageHidden || n <= 1) return;
    const t = setInterval(() => {
      if (touchingRef.current) return;
      setActive((a) => (a + 1) % n);
    }, 7000);
    return () => clearInterval(t);
  }, [n, pageHidden]);

  // vuốt ngang: poster bám theo ngón tay, thả tay mới đổi phim
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let x0 = 0;
    let y0 = 0;
    let dx = 0;
    let lock: "h" | "v" | null = null;
    let touching = false;

    const step = () => {
      const p = el.querySelector(".mhero-p") as HTMLElement | null;
      return (p?.offsetWidth || 200) * 0.88;
    };

    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        touching = false;
        touchingRef.current = false;
        lock = null;
        return;
      }
      touching = true;
      touchingRef.current = true;
      lock = null;
      dx = 0;
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    };

    const move = (e: TouchEvent) => {
      if (!touching) return;
      dx = e.touches[0].clientX - x0;
      const dy = e.touches[0].clientY - y0;
      if (lock === null) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        lock = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
        if (lock === "h") setDragging(true);
      }
      if (lock === "h") {
        if (e.cancelable) e.preventDefault();
        setShift(clamp(dx / step(), -1, 1));
      }
    };

    const end = (e: TouchEvent, cancelled: boolean) => {
      if (!touching) return;
      touching = false;
      touchingRef.current = false;
      const was = lock;
      lock = null;
      if (was !== "h") {
        setShift(0);
        return;
      }
      // đổi slide và trả transform về vị trí nghỉ trong CÙNG một nhịp render:
      // poster đang kéo tiếp tục trượt tới vị trí mới, chưa đủ ngưỡng thì nảy về
      const d = cancelled ? 0 : e.changedTouches[0].clientX - x0;
      const s = clamp(d / step(), -1, 1);
      setDragging(false);
      if (!cancelled && Math.abs(d) > 40 && Math.abs(s) >= 0.26) {
        swipedAt.current = Date.now();
        setActive((a) => (a + (s < 0 ? 1 : -1) + n) % n);
      }
      setShift(0);
    };

    const onEnd = (e: TouchEvent) => end(e, false);
    const onCancel = (e: TouchEvent) => end(e, true);

    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onCancel);
    };
  }, [n]);

  if (!n) return null;
  const m = slides[active];

  return (
    <section
      ref={rootRef}
      className="relative isolate -mt-16 min-h-[620px] w-full touch-pan-y overflow-hidden bg-[#0f111a] pb-5 pt-[92px] select-none md:hidden"
      onClickCapture={(e) => {
        if (Date.now() - swipedAt.current < 350) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {/* backdrop mờ của phim đang chọn */}
      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden
          className="h-full w-full scale-[1.08] object-cover object-center opacity-35 blur-[16px] saturate-75 transition-[background-image] duration-500"
          src={m.backdrop || m.poster || ""}
        />
      </div>

      {/* lớp gradient phủ */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(254,207,89,0.1), rgba(0,0,0,0) 34%), linear-gradient(rgba(15,17,26,0.35) 0%, rgba(15,17,26,0.72) 48%, rgb(15,17,26) 88%)",
        }}
      />

      {/* 3 pill thay thanh nav trên điện thoại */}
      <nav className="relative z-20 mx-auto mb-4 flex min-h-9 w-full max-w-[520px] items-center justify-start gap-2 px-4">
        {PILLS.map((p, i) => (
          <a
            key={p.key}
            href={p.href}
            aria-current={i === 0 ? "page" : undefined}
            className={`inline-flex min-h-9 items-center justify-center rounded-full border px-4 text-xs font-bold shadow-sm backdrop-blur ${
              i === 0
                ? "border-white bg-white text-[#171a26]"
                : "border-white/15 bg-white/10 text-white/80"
            }`}
          >
            {p.label}
          </a>
        ))}
      </nav>

      {/* coverflow poster */}
      <div className="relative z-10 mx-auto w-full max-w-[520px]">
        <div
          className="relative"
          style={{
            height: "calc(min(52vw, 230px) * 1.5)",
            perspective: "1100px",
          }}
        >
          {slides.map((s, i) => {
            const o = norm(i - active, n);
            // vị trí live = vị trí gốc + quãng đang kéo (bám ngón tay, không nhảy)
            const pos = o + shift;
            const ao = Math.min(Math.abs(pos), 3);
            const depth = ao > 2 ? "far" : ao < 0.5 ? "0" : ao < 1.5 ? "1" : "2";
            const isActive = depth === "0";
            return (
              <button
                key={s.slug}
                type="button"
                aria-label={`Chuyển đến ${s.title}`}
                aria-current={isActive}
                onClick={() => {
                  if (Date.now() - swipedAt.current < 350) return;
                  // hrefWatch trong home.json đã được withBasePathDeep thêm prefix;
                  // router.push lại tự thêm basePath → phải bỏ prefix trước khi push.
                  if (isActive) router.push(stripBasePath(s.hrefWatch));
                  else setActive(i);
                }}
                className="mhero-p absolute left-1/2 top-0 block w-[min(52vw,230px)] aspect-[2/3] overflow-hidden rounded-2xl border-2 bg-[#171a26] will-change-transform"
                style={{
                  // xoay 3D + scale liền mạch theo khoảng cách, đúng công thức poster của nhotphim
                  transform: `translateX(calc(-50% + ${pos * 88}%)) rotateY(${pos * -28}deg) scale(${1 - ao * 0.25})`,
                  transition: dragging
                    ? "opacity 0.25s, filter 0.25s, border-color 0.2s, box-shadow 0.25s"
                    : "transform 0.55s cubic-bezier(.22,.9,.34,1), opacity 0.45s, filter 0.45s, border-color 0.3s, box-shadow 0.45s",
                  opacity: depth === "far" ? 0 : depth === "0" ? 1 : depth === "1" ? 0.8 : 0.6,
                  filter:
                    depth === "1"
                      ? "brightness(0.55) saturate(0.85)"
                      : depth === "2"
                        ? "brightness(0.45) saturate(0.8) blur(1.5px)"
                        : undefined,
                  pointerEvents: depth === "far" ? "none" : undefined,
                  zIndex: Math.max(0, Math.round(10 - ao)),
                  borderColor: depth === "0" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
                  boxShadow:
                    depth === "0" ? "0 18px 44px rgba(0,0,0,0.65)" : "0 10px 30px rgba(0,0,0,0.55)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={s.title}
                  className="h-full w-full object-cover"
                  loading={i === active ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                  src={s.poster || s.backdrop}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* thông tin phim đang chọn */}
      <div className="relative z-10 mx-auto flex w-full max-w-[380px] flex-col items-center px-5 pt-5 text-center">
        <h1 className="line-clamp-2 w-full max-w-[340px] pb-0.5 pt-1 text-[clamp(1.375rem,6vw,1.5rem)] font-bold leading-[1.35] tracking-[-0.025em] text-white">
          {m.title}
        </h1>

        <p className="mt-1 line-clamp-1 max-w-[330px] text-[13px] font-medium text-white/55">{m.origin}</p>

        <div className="mt-4 grid w-full grid-cols-2 gap-3">
          <a
            href={m.hrefWatch}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FECF59] to-[#FFF1CC] text-[14px] font-bold text-[#171a26] transition-transform active:scale-[0.97]"
          >
            <IconPlay className="h-4 w-4" />
            Xem phim
          </a>
          <a
            href={m.hrefDetail}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-[14px] font-bold text-[#171a26] transition-transform active:scale-[0.97]"
          >
            <IconInfo className="h-4 w-4 text-[#171a26]" />
            Thông tin
          </a>
        </div>

        <div className="mt-4 flex max-w-full flex-wrap items-center justify-center gap-1.5 text-[11px]">
          {m.year ? (
            <span className="inline-flex h-[22px] items-center rounded-[5px] border border-white/30 px-2 font-medium text-white/85">
              {m.year}
            </span>
          ) : null}
          {m.quality ? (
            <span className="inline-flex min-h-[22px] max-w-[210px] items-center rounded-[5px] border border-white/30 px-2 py-0.5 font-medium text-white/85">
              {m.quality}
            </span>
          ) : null}
          {m.episode ? (
            <span className="inline-flex min-h-[22px] items-center rounded-[5px] border border-white/30 px-2 py-0.5 font-medium text-white/85">
              {m.episode}
            </span>
          ) : null}
        </div>

        <p className="mt-3 line-clamp-3 max-w-[350px] text-xs leading-[1.65] text-white/[0.68]">{m.content}</p>
      </div>

      {/* dots: thanh dài cho slide đang chọn */}
      <div className="relative z-10 mt-3 flex max-w-full items-center justify-center gap-1.5 overflow-hidden px-2">
        {slides.map((s, i) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Chuyển đến ${s.title}`}
            aria-current={i === active}
            className="flex h-5 w-2 items-center justify-center"
          >
            <span
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active ? "w-7 bg-[#FECF59]" : "w-2 bg-white/25"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
