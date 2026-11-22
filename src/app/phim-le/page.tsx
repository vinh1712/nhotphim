import type { Metadata } from "next";
import { renderCategory } from "@/components/sites/chophim/category-route";

export const metadata: Metadata = {
  title: "Phim Lẻ | Chợ Phim",
  description: "Xem phim lẻ, phim điện ảnh online miễn phí Vietsub full HD tại Chợ Phim.",
};

export default async function PhimLePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return renderCategory({
    title: "Phim Lẻ",
    basePath: "/phim-le",
    filter: (m) => m.type === "movie",
    searchParams,
  });
}
