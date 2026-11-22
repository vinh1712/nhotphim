"use client";

// Kết quả tìm kiếm: đọc ?keyword= ở client để trang vẫn build tĩnh được.
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryPage } from "./CategoryPage";
import { searchMovies, type CardMovie } from "./movie-filter";

function Results({ movies }: { movies: CardMovie[] }) {
  const searchParams = useSearchParams();
  const keyword = searchParams?.get("keyword") ?? "";
  const results = searchMovies(movies, keyword);
  const title = keyword ? `Kết quả tìm kiếm: "${keyword}"` : "Tìm kiếm phim";

  return (
    <CategoryPage
      title={title}
      movies={results}
      basePath="/tim-kiem"
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
