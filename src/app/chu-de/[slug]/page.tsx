import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/sites/chophim/Header";
import { Footer } from "@/components/sites/chophim/Footer";
import { MovieCard, Pagination } from "@/components/sites/chophim/CategoryPage";
import { allMovies } from "@/components/sites/chophim/category-route";
import {
  newestFirst,
  paginate,
  resolveGenreSlug,
} from "@/components/sites/chophim/movie-filter";
import type { MovieDetail } from "@/components/sites/chophim/detail-types";
import homeJson from "@/data/home.json";

type TopicFull = {
  slug: string;
  title: string;
  description: string;
  href: string;
  accentColor: string;
  surfaceColor: string;
  baseFilters: Record<string, string>;
  curatedSlugs?: string[];
};

const topics = (homeJson as unknown as { topicsFull: TopicFull[] }).topicsFull;

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return topics.map((t) => ({ slug: t.slug }));
}

function findTopic(slug: string): TopicFull | null {
  return topics.find((t) => t.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = findTopic(slug);
  if (!topic) return {};
  return {
    title: `${topic.title} | Chợ Phim`,
    description: topic.description,
  };
}

/** Lọc theo baseFilters của chủ đề */
function matchFilters(m: MovieDetail, f: Record<string, string>): boolean {
  if (f.country && m.countrySlug !== f.country) return false;
  if (f.type === "phim bộ" && m.type !== "series") return false;
  if (f.type === "phim lẻ" && m.type !== "movie") return false;
  if (f.genre && !(m.genreSlugs ?? []).includes(resolveGenreSlug(f.genre))) return false;
  if (f.listSlug === "phim-chieu-rap" && m.theater !== true) return false;
  if (f.listSlug === "tv-shows" && !(m.genreSlugs ?? []).includes("tv-shows")) return false;
  if (f.listSlug === "phim-long-tieng" && m.lang === "Vietsub") return false;
  if (f.listSlug === "hoat-hinh" && !(m.genreSlugs ?? []).includes("anime-hoat-hinh")) return false;
  return true;
}

export default async function ChuDeSlugPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const topic = findTopic(slug);
  if (!topic) notFound();

  // Ưu tiên danh sách curated (giữ thứ tự), bỏ slug không có trong DB
  let list: MovieDetail[];
  if (topic.curatedSlugs && topic.curatedSlugs.length > 0) {
    const bySlug = new Map(allMovies.map((m) => [m.slug, m]));
    list = topic.curatedSlugs
      .map((s) => bySlug.get(s))
      .filter((m): m is MovieDetail => Boolean(m));
    // curated không khớp DB nào → fallback bộ lọc cơ sở
    if (list.length === 0) {
      list = allMovies.filter((m) => matchFilters(m, topic.baseFilters));
    }
  } else if (Object.keys(topic.baseFilters).length === 0) {
    list = [...allMovies];
  } else {
    list = allMovies.filter((m) => matchFilters(m, topic.baseFilters));
  }

  const sorted = newestFirst(list);
  const sp = await searchParams;
  const { items, totalPages, page } = paginate(sorted, Number(sp?.page) || 1);

  return (
    <>
      <Header />
      <main className="flex-1 pt-16">
        {/* banner chủ đề */}
        <div className="relative overflow-hidden" style={{ backgroundColor: topic.accentColor }}>
          <div
            className="absolute -left-[6%] -top-[40%] h-[160%] w-[60%] rounded-[22px_50px_62px_22px] opacity-80"
            style={{ backgroundColor: topic.surfaceColor }}
          />
          <div className="absolute -bottom-[30%] -right-[8%] h-[90%] w-[40%] rounded-[54px_18px_18px_60px] bg-black/[0.07]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0)_58%)]" />
          <div className="relative max-w-[1400px] mx-auto px-4 py-7 sm:py-9">
            <h1 className="text-white text-xl sm:text-2xl lg:text-[28px] font-extrabold leading-tight max-w-3xl">
              {topic.title}
            </h1>
            <p className="text-white/85 text-[13px] sm:text-[14px] mt-2 max-w-3xl leading-relaxed">
              {topic.description}
            </p>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="mb-8 font-sans">
            <button className="flex items-center gap-2 text-[15px] font-semibold text-text-primary hover:text-white transition-colors mb-4">
              <svg className="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span>Bộ lọc</span>
            </button>
          </div>

          {items.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-text-muted text-[15px]">
                Chưa có phim trong chủ đề {topic.title}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-3 gap-y-6">
              {items.map((m) => (
                <MovieCard key={m.slug} m={m} />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} basePath={`/chu-de/${slug}`} />
        </div>
      </main>
      <Footer />
    </>
  );
}
