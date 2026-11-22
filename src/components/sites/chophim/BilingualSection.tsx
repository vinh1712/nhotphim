import type { Section } from "./types";
import { PosterCard } from "./Cards";
import { SliderArrows } from "./SliderArrows";
import { IconChevronRight } from "./icons";

const DESC =
  "Những tựa phim có hỗ trợ song ngữ, dễ xem liền mạch và hợp để vừa giải trí vừa bắt nhịp thoại tự nhiên.";

/** Khung gradient + hàng poster (S:7 Phim Song Ngữ) */
export function BilingualSection({ section }: { section: Section }) {
  const id = "row-bilingual";
  return (
    <section>
      <div className="relative isolate -mx-1 overflow-hidden rounded-[24px] border border-white/[0.10] bg-[#10121B] px-4 py-5 shadow-[0_24px_70px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.08)] sm:-mx-2 sm:rounded-[30px] sm:px-6 sm:py-6 lg:px-7">
        <div className={section.sectionClass ?? ""} />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/[0.35] to-transparent" />
        <div className="pointer-events-none absolute -right-24 top-10 -z-10 h-28 w-[420px] rotate-[-18deg] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent blur-sm" />

        <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <h2 className={section.headingClass ?? ""}>
              Phim Song Ngữ
              <span className="block pb-1.5 leading-[1.18] bg-gradient-to-r from-[#FFD166] via-white to-[#67E8F9] bg-clip-text text-transparent">
                {section.heading}
              </span>
            </h2>
            <p className="mt-2 max-w-[760px] text-sm leading-6 text-white/[0.68] sm:text-[15px]">
              {DESC}
            </p>
          </div>
          <div className="flex lg:items-center">
            <a
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white px-5 text-sm font-bold text-[#10121B] shadow-[0_12px_28px_rgba(255,255,255,0.12)] transition-colors duration-200 hover:bg-[#FFD166] focus:outline-none focus:ring-2 focus:ring-[#FFD166]/70 focus:ring-offset-2 focus:ring-offset-[#10121B]"
              href="/phim-song-ngu"
            >
              Xem tất cả
              <IconChevronRight className="h-4 w-4" stroke={2.5} />
            </a>
          </div>
        </div>

        <div className="relative rounded-[20px] border border-white/[0.08] bg-black/[0.18] px-2 pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:rounded-[24px] sm:px-3 sm:pt-4">
          <div className="relative group/slider">
            <SliderArrows id={id} pos="top-[40%]" z="z-50" group="slider" />
            <div
              id={id}
              className="scroll-container flex gap-2 md:gap-3 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none scrollbar-hide"
            >
              {section.items.map((it, i) => (
                <div
                  key={it.href + i}
                  className="shrink-0 w-[126px] sm:w-[196px] lg:w-[204px] snap-start md:snap-align-none scroll-ml-2"
                >
                  <PosterCard item={it} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
