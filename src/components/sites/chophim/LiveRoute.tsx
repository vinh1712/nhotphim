"use client";

/**
 * Trang chi tiết / xem dùng chung cho route tĩnh và route fallback (?slug=).
 * HTML build sẵn được render ngay; khi Supabase trả về thì tự thay bằng bản mới
 * nhất (kể cả phim admin vừa thêm sau khi đã deploy).
 */
import { useEffect, useMemo, useState } from "react";
import { detailHref, liveSuggestions, useLiveData } from "@/lib/live-data";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { DetailPage } from "./DetailPage";
import { WatchPage, type WatchSuggestion } from "./WatchPage";
import type { DetailComment, MovieDetail, Suggestion } from "./detail-types";

type Props = {
  mode: "detail" | "watch";
  slug: string;
  initialMovie: MovieDetail | null;
  initialComments: DetailComment[];
  initialSuggestions: Suggestion[] | WatchSuggestion[];
  /** Route ?slug= không có sẵn dữ liệu tĩnh — phải đợi lớp dữ liệu sống. */
  fallback?: boolean;
};

function jsonLd(movie: MovieDetail) {
  const href = detailHref(movie.slug);
  return {
    "@context": "https://schema.org",
    "@type": movie.type === "movie" ? "Movie" : "TVSeries",
    "@id": `${href}#title`,
    url: href,
    name: movie.title,
    ...(movie.origin ? { alternateName: movie.origin } : {}),
    description: movie.description || `Xem phim ${movie.title} online miễn phí tại NhótPhim.`,
    image: movie.poster,
    inLanguage: "vi",
    ...(movie.year ? { copyrightYear: movie.year } : {}),
    ...(movie.genres.length ? { genre: movie.genres } : {}),
    ...(movie.countries.length
      ? { countryOfOrigin: movie.countries.map((c) => ({ "@type": "Country", name: c })) }
      : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": href },
  };
}

function pickWatchSuggestions(
  movies: Record<string, MovieDetail>,
  movie: MovieDetail,
  limit = 10
): WatchSuggestion[] {
  return Object.values(movies)
    .filter((m) => m.slug !== movie.slug && m.genres.some((g) => movie.genres.includes(g)))
    .sort(
      (a, b) =>
        (b.rating ?? -1) - (a.rating ?? -1) ||
        String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    )
    .slice(0, limit)
    .map((m) => ({ slug: m.slug, title: m.title, origin: m.origin, poster: m.poster, status: m.status }));
}

function Message({ text }: { text: string }) {
  return (
    <>
      <Header />
      <main className="flex min-h-[60vh] flex-1 items-center justify-center pt-16">
        <p className="px-6 text-center text-sm text-white/60">{text}</p>
      </main>
      <Footer />
    </>
  );
}

export function LiveRoute({
  mode,
  slug,
  initialMovie,
  initialComments,
  initialSuggestions,
  fallback = false,
}: Props) {
  const live = useLiveData();
  const liveMovie = slug ? live.movies[slug] || null : null;
  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [detailTried, setDetailTried] = useState(false);
  const detailId = liveMovie?.id;
  const hasLiveServers = !!liveMovie?.servers?.length;

  // Danh sách chỉ lấy cột gọn. Phim đã có trong bản tĩnh đã được gắn lại servers;
  // phim mới (không có initialMovie) mới cần tải đúng 1 dòng có episodes.
  useEffect(() => {
    setDetail(null);
    setDetailTried(false);
    if (!detailId || hasLiveServers || initialMovie) return;
    let cancelled = false;
    void live
      .loadDetail(detailId)
      .then((rec) => { if (!cancelled) setDetail(rec); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setDetailTried(true); });
    return () => { cancelled = true; };
  }, [detailId, hasLiveServers, initialMovie, live.loadDetail]);

  const movie = (detail?.servers?.length ? detail : liveMovie) || initialMovie;
  const comments = liveMovie
    ? live.comments[slug]?.length
      ? live.comments[slug]
      : initialComments
    : initialComments;

  const suggestions = useMemo(() => {
    if (!movie || !liveMovie) return initialSuggestions;
    return mode === "detail"
      ? liveSuggestions(live.movies, movie, 12)
      : pickWatchSuggestions(live.movies, movie, 10);
  }, [initialSuggestions, live.movies, liveMovie, mode, movie]);

  if (!movie) {
    if (fallback && !live.ready) return <Message text="Đang tải phim..." />;
    return <Message text="Không tìm thấy phim. Vui lòng quay lại trang chủ." />;
  }
  // Phim mới đang chờ dòng chi tiết — đừng render trang xem với danh sách rỗng.
  if (!initialMovie && liveMovie && !hasLiveServers && !detail?.servers?.length && !detailTried) {
    return <Message text="Đang tải phim..." />;
  }

  if (mode === "detail") {
    return (
      <>
        <Header />
        <main className="flex-1 pt-16">
          <div className="lg:-mt-16">
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(movie)) }}
            />
            <DetailPage
              movie={movie}
              comments={comments}
              suggestions={suggestions as Suggestion[]}
            />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 pt-16">
        <WatchPage
          movie={movie}
          comments={comments}
          suggestions={suggestions as WatchSuggestion[]}
        />
      </main>
      <Footer />
    </>
  );
}
