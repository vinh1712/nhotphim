import type { Section } from "./types";
import { Top10Card } from "./Cards";
import { SliderArrows } from "./SliderArrows";

/** Hàng Top 10 (S:9, S:e) */
export function Top10Row({ section }: { section: Section }) {
  const id = "row-" + section.id.replace(/[^a-zA-Z0-9]/g, "");
  return (
    <section>
      <div className="mb-12 relative w-full overflow-hidden group/section">
        <h2 className={section.headingClass ?? ""}>{section.heading}</h2>
        <SliderArrows id={id} pos="top-[50%]" z="z-20" group="section" />
        <div
          id={id}
          className={section.sectionClass ?? ""}
          style={{ scrollBehavior: "smooth" }}
        >
          {section.items.map((it, i) => (
            <Top10Card key={it.href + i} item={it} />
          ))}
        </div>
      </div>
    </section>
  );
}
