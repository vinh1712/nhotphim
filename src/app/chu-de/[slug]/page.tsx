import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { Header } from "@/components/sites/chophim/Header";
import { Footer } from "@/components/sites/chophim/Footer";
import { CategoryPage } from "@/components/sites/chophim/CategoryPage";
import { allMovies } from "@/components/sites/chophim/category-route";
import {
  newestFirst,
  sourceGenreSlug,
  toCard,
  resolveGenreSlug,
  type MovieFilters,
} from "@/components/sites/chophim/movie-filter";
import type { MovieDetail } from "@/components/sites/chophim/detail-types";
import { homeData } from "@/data";

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

const topics = (homeData as unknown as { topicsFull: TopicFull[] }).topicsFull;

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
    title: `${topic.title} | NhótPhim`,
    description: topic.description,
  };
}

/** Bộ lọc cố định của chủ đề — truyền vào CategoryPage giống prop lockedFilters của source. */
const TOPIC_LOCKED: Record<string, Partial<MovieFilters>> = Object.fromEntries(
  topics.map((t) => [
    t.slug,
    {
      ...(t.baseFilters.country ? { country: t.baseFilters.country } : {}),
      ...(t.baseFilters.type ? { type: t.baseFilters.type } : {}),
      ...(t.baseFilters.genre ? { genres: [sourceGenreSlug(t.baseFilters.genre)] } : {}),
    },
  ])
);

/** Lọc theo baseFilters của chủ đề (kể cả listSlug không có trong panel lọc). */
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

export default async function ChuDeSlugPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const topic = findTopic(slug);
  if (!topic) notFound();

  // Ưu tiên danh sách curated (giữ thứ tự), bỏ slug không có trong DB.
  let list: MovieDetail[];
  if (topic.curatedSlugs && topic.curatedSlugs.length > 0) {
    const bySlug = new Map(allMovies.map((m) => [m.slug, m]));
    list = topic.curatedSlugs
      .map((s) => bySlug.get(s))
      .filter((m): m is MovieDetail => Boolean(m));
    if (list.length === 0) {
      list = allMovies.filter((m) => matchFilters(m, topic.baseFilters));
    }
  } else if (Object.keys(topic.baseFilters).length === 0) {
    list = [...allMovies];
  } else {
    list = allMovies.filter((m) => matchFilters(m, topic.baseFilters));
  }

  const cards = newestFirst(list).map(toCard);

  const banner = (
    <div className="relative overflow-hidden" style={{ backgroundColor: topic.accentColor }}>
      <div
        className="absolute -left-[6%] -top-[40%] h-[160%] w-[60%] rounded-[22px_50px_62px_22px] opacity-80"
        style={{ backgroundColor: topic.surfaceColor }}
      />
      <div className="absolute -bottom-[30%] -right-[8%] h-[90%] w-[40%] rounded-[54px_18px_18px_60px] bg-black/[0.07]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0)_58%)]" />
      <div className="relative mx-auto max-w-[1400px] px-4 py-7 sm:py-9">
        <h1 className="max-w-3xl text-xl font-extrabold leading-tight text-white sm:text-2xl lg:text-[28px]">
          {topic.title}
        </h1>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-white/85 sm:text-[14px]">
          {topic.description}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <Header />
      <CategoryPage
        title={topic.title}
        movies={cards}
        basePath={withBasePath(`/chu-de/${slug}`)}
        emptyText={`Chưa có phim trong chủ đề ${topic.title}.`}
        lockedFilters={TOPIC_LOCKED[slug] ?? {}}
        hideTitle
        mainClassName="flex-1"
        banner={banner}
      />
      <Footer />
    </>
  );
}
