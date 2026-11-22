import { withBasePath } from "@/lib/base-path";
import type { Metadata } from "next";
import { renderCategory } from "@/components/sites/chophim/category-route";

export const metadata: Metadata = {
  title: "Hoạt Hình | NhótPhim",
  description: "Xem phim hoạt hình, anime online miễn phí Vietsub full HD tại NhótPhim.",
};

export default function HoatHinhPage() {
  return renderCategory({
    title: "Hoạt Hình",
    basePath: withBasePath("/hoat-hinh"),
    filter: (m) => (m.genreSlugs ?? []).includes("anime-hoat-hinh"),
  });
}
