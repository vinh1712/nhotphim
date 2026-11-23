import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveRoute } from "@/components/sites/chophim/LiveRoute";
import type { MovieDetail, Suggestion } from "@/components/sites/chophim/detail-types";
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
  const parts = [movie.title, movie.origin ? `(${movie.origin})` : null, movie.year ? `- ${movie.year}` : null].filter(Boolean);
  return {
    title: `${parts.join(" ")}`,
    description: movie.description || `Xem phim ${movie.title} online miễn phí tại NhótPhim.`,
  };
}

/** Phim đề xuất: cùng thể loại, ưu tiên phim điểm cao / mới thêm */
function pickSuggestions(movie: MovieDetail, limit = 12): Suggestion[] {
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
    poster: m.poster,
    year: m.year,
    quality: m.quality,
  }));
}

export default async function MovieDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const movie = movies[slug];
  if (!movie) notFound();

  const movieComments = comments[slug] ?? [];
  const suggestions = pickSuggestions(movie);

  return (
    <LiveRoute
      mode="detail"
      slug={slug}
      initialMovie={movie}
      initialComments={movieComments}
      initialSuggestions={suggestions}
    />
  );
}
