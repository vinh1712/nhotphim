import { withBasePath } from "@/lib/base-path";
import type { Metadata } from "next";
import { renderCategory } from "@/components/sites/chophim/category-route";

export const metadata: Metadata = {
  title: "Phim Lẻ | NhótPhim",
  description: "Xem phim lẻ, phim điện ảnh online miễn phí Vietsub full HD tại NhótPhim.",
};

export default function PhimLePage() {
  return renderCategory({
    title: "Phim Lẻ",
    basePath: withBasePath("/phim-le"),
    filter: (m) => m.type === "movie",
  });
}
