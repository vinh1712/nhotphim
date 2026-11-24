import type { Metadata } from "next";
import { renderCategory } from "@/components/sites/chophim/category-route";

export const metadata: Metadata = {
  title: "Phim Chiếu Rạp | Chợ Phim",
  description: "Xem phim chiếu rạp online miễn phí tại Chợ Phim.",
};

export default async function PhimChieuRapPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return renderCategory({
    title: "Phim Chiếu Rạp",
    basePath: "/phim-chieu-rap",
    filter: (m) => m.theater === true,
    searchParams,
    emptyText: "Hiện chưa có phim chiếu rạp.",
  });
}
