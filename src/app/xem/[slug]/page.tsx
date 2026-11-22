import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/sites/chophim/Header";
import { Footer } from "@/components/sites/chophim/Footer";
import { WatchPage, type WatchSuggestion } from "@/components/sites/chophim/WatchPage";
import type { MovieDetail } from "@/components/sites/chophim/detail-types";
import { commentsData, moviesData } from "@/data";

const movies = moviesData as unknown as Record<string, MovieDetail>;
const comments = commentsData as unknown as Record<string, import("@/components/sites/chophim/detail-types").DetailComment[]>;

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return Object.keys(movies).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const movie = movies[slug];
  if (!movie) return {};
  const parts = [
    `Xem ${movie.title}`,
    movie.origin ? `(${movie.origin})` : null,
    movie.year ? `- ${movie.year}` : null,
  ].filter(Boolean);
  return {
    title: `${parts.join(" ")} | NhótPhim`,
    description: movie.description || `Xem phim ${movie.title} online miễn phí tại NhótPhim.`,
  };
}

/** Phim đề xuất cho cột bên phải trang xem */
function pickWatchSuggestions(movie: MovieDetail, limit = 10): WatchSuggestion[] {
  const pool = Object.values(movies).filter(
    (m) => m.slug !== movie.slug && m.genres.some((g) => movie.genres.includes(g))
  );
  const ordered = [...pool].sort(
    (a, b) =>
      (b.rating ?? -1) - (a.rating ?? -1) ||
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  );
  return ordered.slice(0, limit).map((m) => ({
    slug: m.slug,
    title: m.title,
    origin: m.origin,
    poster: m.poster,
    status: m.status,
  }));
}

export default async function WatchPageRoute({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const movie = movies[slug];
  if (!movie) notFound();

  const movieComments = comments[slug] ?? [];
  const suggestions = pickWatchSuggestions(movie);

  return (
    <>
      <Header />
      <main className="flex-1 pt-16">
        <WatchPage movie={movie} comments={movieComments} suggestions={suggestions} />
      </main>
      <Footer />
    </>
  );
}
