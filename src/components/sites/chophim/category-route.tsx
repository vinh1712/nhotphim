// Helper dùng chung cho các trang danh mục (Header + CategoryPage + Footer).
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CategoryPage } from "./CategoryPage";
import { newestFirst, paginate } from "./movie-filter";
import type { MovieDetail } from "./detail-types";
import moviesJson from "@/data/movies.json";

export const allMovies: MovieDetail[] = Object.values(moviesJson as unknown as Record<string, MovieDetail>);

export async function renderCategory(opts: {
  title: string;
  basePath: string;
  filter: (m: MovieDetail) => boolean;
  searchParams: Promise<{ page?: string }>;
  emptyText?: string;
}) {
  const sp = await opts.searchParams;
  const list = newestFirst(allMovies.filter(opts.filter));
  const { items, totalPages, page } = paginate(list, Number(sp?.page) || 1);
  return (
    <>
      <Header />
      <CategoryPage
        title={opts.title}
        movies={items}
        page={page}
        totalPages={totalPages}
        basePath={opts.basePath}
        emptyText={opts.emptyText}
      />
      <Footer />
    </>
  );
}
