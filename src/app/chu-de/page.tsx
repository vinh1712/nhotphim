import type { Metadata } from "next";
import { Header } from "@/components/sites/chophim/Header";
import { Footer } from "@/components/sites/chophim/Footer";
import { IconChevronRight } from "@/components/sites/chophim/icons";
import { homeData } from "@/data";

type TopicFull = {
  slug: string;
  title: string;
  description: string;
  href: string;
  accentColor: string;
  surfaceColor: string;
};

const topics = (homeData as unknown as { topicsFull: TopicFull[] }).topicsFull;

export const metadata: Metadata = {
  title: "Chủ đề | Chợ Phim",
  description:
    "Khám phá các chủ đề phim tuyển chọn tại Chợ Phim: K-Drama Hàn Quốc, Cổ Trang Trung Quốc, Anime Mới, Tình Cảm Lãng Mạn và nhiều chủ đề hấp dẫn khác.",
};

export default function ChuDePage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-16">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-text-primary flex items-center gap-2 text-xl sm:text-2xl">
              Chủ đề
            </h2>
          </div>
          <p className="text-text-muted text-[14px] sm:text-[15px] mb-8 max-w-3xl">
            Tuyển tập phim theo từng chủ đề — chọn một chủ đề để khám phá những bộ phim
            hay nhất phù hợp với sở thích của bạn.
          </p>

          <div className="grid grid-cols-1 min-[430px]:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {topics.map((t) => (
              <a
                key={t.slug}
                href={t.href}
                className="group relative h-[110px] sm:h-[138px] overflow-hidden rounded-[12px_24px_12px_24px] sm:rounded-[18px_42px_18px_42px] text-white shadow-lg transition-transform duration-300 hover:-translate-y-0.5"
                style={{ backgroundColor: t.accentColor }}
              >
                {/* lớp trang trí */}
                <div
                  className="absolute -left-[6%] -top-[18%] h-[108%] w-[88%] rounded-[12px_24px_36px_12px] opacity-80 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:translate-y-0.5 sm:rounded-[22px_50px_62px_22px]"
                  style={{ backgroundColor: t.surfaceColor }}
                />
                <div className="absolute -bottom-[14%] -right-[10%] h-[72%] w-[48%] rounded-[36px_12px_12px_42px] bg-black/[0.07] transition-transform duration-500 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 sm:rounded-[54px_18px_18px_60px]" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0)_58%)]" />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/[0.04]" />

                <div className="relative flex h-full flex-col items-start justify-end p-3 sm:p-5 text-left">
                  <h3 className="min-w-0 max-w-full break-words text-[14px] font-extrabold leading-[1.25] sm:text-[21px]">
                    {t.title}
                  </h3>
                  <p className="mt-1 hidden text-[12px] leading-snug text-white/85 line-clamp-2 sm:mt-1.5 sm:block">
                    {t.description}
                  </p>
                  <span className="mt-1.5 hidden items-center gap-0.5 text-[10px] font-bold text-white/90 sm:mt-2.5 sm:inline-flex sm:gap-1.5 sm:text-[13px]">
                    Xem chủ đề
                    <IconChevronRight
                      className="h-2.5 w-2.5 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-4 sm:w-4"
                      stroke={3}
                    />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
