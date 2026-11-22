// Helper dùng chung cho các trang danh mục (Header + CategoryPage + Footer).
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CategoryPage } from "./CategoryPage";
import { newestFirst, toCard } from "./movie-filter";
import type { MovieDetail } from "./detail-types";
import { moviesData } from "@/data";

export const allMovies: MovieDetail[] = Object.values(moviesData as unknown as Record<string, MovieDetail>);

/** Danh sách đã sắp xếp mới nhất trước, thu gọn về dữ liệu card */
export function cardList(filter: (m: MovieDetail) => boolean) {
  return newestFirst(allMovies.filter(filter)).map(toCard);
}

export function renderCategory(opts: {
  title: string;
  basePath: string;
  filter: (m: MovieDetail) => boolean;
  emptyText?: string;
}) {
  return (
    <>
      <Header />
      <CategoryPage
        title={opts.title}
        movies={cardList(opts.filter)}
        basePath={opts.basePath}
        emptyText={opts.emptyText}
      />
      <Footer />
    </>
  );
}
