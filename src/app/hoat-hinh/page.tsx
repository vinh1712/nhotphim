import type { Metadata } from "next";
import { renderCategory } from "@/components/sites/chophim/category-route";

export const metadata: Metadata = {
  title: "Hoạt Hình | Chợ Phim",
  description: "Xem phim hoạt hình, anime online miễn phí Vietsub full HD tại Chợ Phim.",
};

export default async function HoatHinhPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return renderCategory({
    title: "Hoạt Hình",
    basePath: "/hoat-hinh",
    filter: (m) => (m.genreSlugs ?? []).includes("anime-hoat-hinh"),
    searchParams,
  });
}
