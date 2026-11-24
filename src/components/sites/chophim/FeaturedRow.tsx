import type { Section } from "./types";
import { FeaturedCard } from "./Cards";
import { SliderArrows } from "./SliderArrows";
import { IconChevronRight } from "./icons";

/** Hàng card nổi bật có tiêu đề link (S:a kinh dị, S:d chiếu rạp) */
export function FeaturedRow({
  section,
  href,
}: {
  section: Section;
  href: string;
}) {
  const id = "row-" + section.id.replace(/[^a-zA-Z0-9]/g, "");
  return (
    <section>
      <div className="mb-12 relative w-full overflow-hidden group/section">
        <a className="inline-flex items-center gap-2 mb-6 group cursor-pointer" href={href}>
          <h2 className={section.headingClass ?? ""}>{section.heading}</h2>
          <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full border border-white/50 text-white/70 group-hover:text-white group-hover:border-white transition-all mt-0.5">
            <IconChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5 ml-0.5" />
          </div>
        </a>
        <SliderArrows id={id} pos="top-[50%]" z="z-20" group="section" />
        <div id={id} className={section.sectionClass ?? ""} style={{ scrollBehavior: "smooth" }}>
          {section.items.map((it, i) => (
            <FeaturedCard key={it.href + i} item={it} />
          ))}
        </div>
      </div>
    </section>
  );
}
