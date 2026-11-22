import { withBasePath } from "@/lib/base-path";
import type { Metadata } from "next";
import { renderCategory } from "@/components/sites/chophim/category-route";

export const metadata: Metadata = {
  title: "Phim Chiếu Rạp",
  description: "Xem phim chiếu rạp online miễn phí tại NhótPhim.",
};

export default function PhimChieuRapPage() {
  return renderCategory({
    title: "Phim Chiếu Rạp",
    basePath: withBasePath("/phim-chieu-rap"),
    filter: (m) => m.theater === true,
    emptyText: "Hiện chưa có phim chiếu rạp.",
  });
}
