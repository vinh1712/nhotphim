import type { Metadata } from "next";
import { Header } from "@/components/sites/chophim/Header";
import { Footer } from "@/components/sites/chophim/Footer";
import { CategoryPage } from "@/components/sites/chophim/CategoryPage";
import { allMovies } from "@/components/sites/chophim/category-route";
import { searchMovies } from "@/components/sites/chophim/movie-filter";

type SearchParams = { keyword?: string; page?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const { keyword = "" } = await searchParams;
  return {
    title: keyword ? `Tìm kiếm: ${keyword} | Chợ Phim` : "Tìm kiếm | Chợ Phim",
    description: "Tìm kiếm phim trên Chợ Phim.",
  };
}

export default async function TimKiemPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { keyword = "" } = await searchParams;
  const results = searchMovies(allMovies, keyword);
  const title = keyword ? `Kết quả tìm kiếm: "${keyword}"` : "Tìm kiếm phim";

  return (
    <>
      <Header />
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
      <Footer />
    </>
  );
}
