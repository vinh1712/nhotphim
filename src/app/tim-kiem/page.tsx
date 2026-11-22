import type { Metadata } from "next";
import { Header } from "@/components/sites/chophim/Header";
import { Footer } from "@/components/sites/chophim/Footer";
import { allMovies } from "@/components/sites/chophim/category-route";
import { toCard } from "@/components/sites/chophim/movie-filter";
import { SearchResults } from "@/components/sites/chophim/SearchResults";

export const metadata: Metadata = {
  title: "Tìm kiếm",
  description: "Tìm kiếm phim trên NhótPhim.",
};

// Chỉ truyền dữ liệu card tối thiểu xuống client (tìm kiếm chạy ở trình duyệt).
const cards = allMovies.map(toCard);

export default function TimKiemPage() {
  return (
    <>
      <Header />
      <SearchResults movies={cards} />
      <Footer />
    </>
  );
}
