import type { Section } from "./types";
import { LandscapeCard } from "./Cards";
import { SliderArrows } from "./SliderArrows";

/** Hàng phim ảnh ngang với tiêu đề bên trái (S:2, S:3, S:4) */
export function MovieRow({ section }: { section: Section }) {
  const id = "row-" + section.id.replace(/[^a-zA-Z0-9]/g, "");
  return (
    <section>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start relative w-full group/section">
        <div className={section.sectionClass ?? ""}>
          <h2 className={section.headingClass ?? ""}>
            {section.headingParts?.map((p, i) => (
              <span key={i} className={i === 0 ? "inline-block pb-1 lg:pb-0" : "inline-block ml-1.5 lg:ml-0"}>
                {p}
              </span>
            ))}
          </h2>
          {section.viewAll && (
            <a
              className="text-xs md:text-sm font-medium text-text-muted hover:text-white transition-colors"
              href={section.viewAll.href}
            >
              {section.viewAll.label}
            </a>
          )}
        </div>
        <div className="relative w-full overflow-hidden">
          <SliderArrows id={id} pos="top-[30%] md:top-[35%]" z="z-20" group="section" />
          <div
            id={id}
            className="flex gap-2 md:gap-5 overflow-x-auto scrollbar-hide snap-x md:snap-none pb-4 pr-10"
          >
            {section.items.map((it) => (
              <LandscapeCard key={it.href + it.title} item={it} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
