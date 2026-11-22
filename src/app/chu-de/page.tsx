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
  title: "Chủ đề phim",
  description:
    "Khám phá các chủ đề phim tuyển chọn tại NhótPhim: K-Drama Hàn Quốc, Cổ Trang Trung Quốc, Anime Mới, Tình Cảm Lãng Mạn và nhiều chủ đề hấp dẫn khác.",
};

export default function ChuDePage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-16">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <h1 className="mb-6 text-[24px] font-bold text-white sm:text-[28px] lg:text-[32px]">
            Các chủ đề
          </h1>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4">
            {topics.map((t) => (
              <a
                key={t.slug}
                href={t.href}
                className="group relative h-[78px] overflow-hidden rounded-[12px_24px_12px_24px] text-white shadow-lg transition-transform duration-300 hover:-translate-y-0.5 sm:h-[126px] sm:rounded-[18px_42px_18px_42px] lg:h-[138px]"
                style={{ backgroundColor: t.accentColor }}
              >
                <div
                  className="absolute -left-[6%] -top-[18%] h-[108%] w-[88%] rounded-[22px_50px_62px_22px] opacity-80 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:translate-y-0.5"
                  style={{ backgroundColor: t.surfaceColor }}
                />
                <div className="absolute -bottom-[14%] -right-[10%] h-[72%] w-[48%] rounded-[54px_18px_18px_60px] bg-black/[0.07] transition-transform duration-500 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0)_58%)]" />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/[0.04]" />

                <div className="relative flex h-full flex-col justify-center p-3 text-left sm:justify-end sm:p-5">
                  <h3 className="min-w-0 max-w-full break-words text-[14px] font-extrabold leading-[1.25] sm:max-w-[12.5rem] sm:text-[21px] lg:max-w-full lg:text-[20px]">
                    {t.title}
                  </h3>
                  <span className="mt-3 hidden items-center gap-1.5 text-[14px] font-bold text-white/90 sm:inline-flex">
                    Xem toàn bộ
                    <IconChevronRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
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
