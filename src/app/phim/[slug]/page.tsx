import { withBasePath } from "@/lib/base-path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/sites/chophim/Header";
import { Footer } from "@/components/sites/chophim/Footer";
import { DetailPage } from "@/components/sites/chophim/DetailPage";
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
    title: `${parts.join(" ")} | NhótPhim`,
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

function jsonLd(movie: MovieDetail) {
  const descBits = [
    `Xem phim ${movie.title}`,
    movie.origin ? `(${movie.origin})` : null,
    movie.year ? `, ${movie.year}` : null,
    movie.quality ? `, ${movie.quality}` : null,
    movie.lang ? `, ${movie.lang}` : null,
    movie.description ? `. ${movie.description.slice(0, 160)}${movie.description.length > 160 ? "…" : ""}` : ".",
  ].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": movie.type === "movie" ? "Movie" : "TVSeries",
    "@id": withBasePath(`/phim/${movie.slug}#title`),
    url: withBasePath(`/phim/${movie.slug}`),
    name: movie.title,
    ...(movie.origin ? { alternateName: movie.origin } : {}),
    description: descBits.join(""),
    image: movie.poster,
    inLanguage: "vi",
    ...(movie.year ? { copyrightYear: movie.year } : {}),
    ...(movie.genres.length ? { genre: movie.genres } : {}),
    ...(movie.countries.length ? { countryOfOrigin: movie.countries.map((c) => ({ "@type": "Country", name: c })) } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": withBasePath(`/phim/${movie.slug}`) },
  };
}

export default async function MovieDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const movie = movies[slug];
  if (!movie) notFound();

  const movieComments = comments[slug] ?? [];
  const suggestions = pickSuggestions(movie);

  return (
    <>
      <Header />
      <main className="flex-1 pt-16">
        <div className="lg:-mt-16">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(movie)) }} />
          <DetailPage movie={movie} comments={movieComments} suggestions={suggestions} />
        </div>
      </main>
      <Footer />
    </>
  );
}
