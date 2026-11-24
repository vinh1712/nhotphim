import type { Section } from "./types";
import { PosterCard } from "./Cards";
import { SliderArrows } from "./SliderArrows";

/** Tiêu đề dạng "Phim Mới Cập Nhật" / "Phim Bộ Mới" / "Phim Việt sắp chiếu" (S:8, S:b, S:c) */
export function PosterRow({
  section,
  viewAll,
}: {
  section: Section;
  viewAll?: { label: string; href: string } | null;
}) {
  const id = "row-" + section.id.replace(/[^a-zA-Z0-9]/g, "");
  const link = viewAll ?? section.viewAll ?? null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className={section.headingClass ?? ""}>{section.heading}</h2>
        {link && (
          <a
            className="text-sm text-text-muted hover:text-accent transition-colors flex items-center gap-1"
            href={link.href}
          >
            {link.label}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        )}
      </div>
      <div className="relative group/slider">
        <SliderArrows id={id} pos="top-[40%]" z="z-50" group="slider" />
        <div id={id} className={section.sectionClass ?? ""}>
          {section.items.map((it, i) => (
            <div
              key={it.href + i}
              className="shrink-0 w-[115px] sm:w-[180px] snap-start md:snap-align-none scroll-ml-2"
            >
              <PosterCard item={it} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
