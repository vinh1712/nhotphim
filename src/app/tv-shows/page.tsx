import { withBasePath } from "@/lib/base-path";
import type { Metadata } from "next";
import { renderCategory } from "@/components/sites/chophim/category-route";

export const metadata: Metadata = {
  title: "TV Shows | NhótPhim",
  description: "Xem TV Shows online miễn phí Vietsub full HD tại NhótPhim.",
};

export default function TvShowsPage() {
  return renderCategory({
    title: "TV Shows",
    basePath: withBasePath("/tv-shows"),
    filter: (m) => (m.genreSlugs ?? []).includes("tv-shows"),
    emptyText: "Chưa có TV Shows nào.",
  });
}
