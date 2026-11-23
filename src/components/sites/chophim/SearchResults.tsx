"use client";

import { withBasePath } from "@/lib/base-path";
// Kết quả tìm kiếm: đọc ?keyword= ở client để trang vẫn build tĩnh được.
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useLiveData } from "@/lib/live-data";
import { CategoryPage } from "./CategoryPage";
import { newestFirst, searchMovies, toCard, type CardMovie } from "./movie-filter";

function Results({ movies }: { movies: CardMovie[] }) {
  const searchParams = useSearchParams();
  const keyword = searchParams?.get("keyword") ?? "";
  const live = useLiveData();
  const liveCards = useMemo(() => newestFirst(Object.values(live.movies)).map(toCard), [live.movies]);
  const results = searchMovies(liveCards.length ? liveCards : movies, keyword);
  const title = keyword ? `Kết quả tìm kiếm: "${keyword}"` : "Tìm kiếm phim";

  return (
    <CategoryPage
      title={title}
      movies={results}
      source="prop"
      basePath={withBasePath("/tim-kiem")}
      emptyText={
        keyword
          ? `Không tìm thấy phim nào khớp với "${keyword}". Thử từ khóa khác nhé.`
          : "Nhập từ khóa vào ô tìm kiếm ở đầu trang để tìm phim."
      }
    />
  );
}

export function SearchResults({ movies }: { movies: CardMovie[] }) {
  return (
    <Suspense fallback={<main className="flex-1 pt-16" />}>
      <Results movies={movies} />
    </Suspense>
  );
}
