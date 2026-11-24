import { home } from "./types";
import { IconChevronRight } from "./icons";

const GRID_CLS =
  "-mx-4 flex gap-2 overflow-x-auto px-4 scroll-pl-4 pb-2 sm:-mx-6 sm:px-6 sm:scroll-pl-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0 lg:scroll-pl-0 lg:pb-0 after:w-[1px] after:shrink-0 lg:after:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

export function Topics() {
  return (
    <section>
      <div className="w-full">
        <h2 className="mb-4 text-[22px] font-bold leading-tight text-white sm:text-[26px] lg:text-[30px]">
          Bạn đang quan tâm gì?
        </h2>
        <div className={GRID_CLS}>
          {home.topics.map((t) => (
            <a key={t.href} className={t.cardClass} href={t.href}>
              <div className={t.deco[0]} />
              <div className={t.deco[1]} />
              <div className={t.deco[2]} />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/[0.04]" />
              <div className="relative flex h-full flex-col items-start justify-center p-3 text-left sm:justify-end sm:p-5">
                <h3 className="min-w-0 max-w-full break-words text-[14px] font-extrabold leading-[1.25] sm:max-w-[12.5rem] sm:text-[21px] lg:max-w-full lg:text-[20px]">
                  {t.title}
                </h3>
                <span className="mt-1 hidden items-center gap-0.5 text-[10px] font-bold text-white/90 sm:mt-3 sm:inline-flex sm:gap-1.5 sm:text-[14px]">
                  {t.href === "/chu-de" ? "Khám phá" : "Xem chủ đề"}
                  <IconChevronRight
                    className="h-2.5 w-2.5 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-4 sm:w-4"
                    stroke={3}
                  />
                </span>
              </div>
            </a>
          ))}
        </div>
        <a className={home.moreTopics.class} href={home.moreTopics.href}>
          <h3 className="min-w-0 max-w-full break-words text-[14px] font-extrabold leading-[1.25] sm:max-w-[12.5rem] sm:text-[21px] lg:max-w-full lg:text-[20px]">
            {home.moreTopics.label}
          </h3>
        </a>
      </div>
    </section>
  );
}
