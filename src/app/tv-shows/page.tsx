import type { Metadata } from "next";
import { renderCategory } from "@/components/sites/chophim/category-route";

export const metadata: Metadata = {
  title: "TV Shows | Chợ Phim",
  description: "Xem TV Shows online miễn phí Vietsub full HD tại Chợ Phim.",
};

export default async function TvShowsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return renderCategory({
    title: "TV Shows",
    basePath: "/tv-shows",
    filter: (m) => (m.genreSlugs ?? []).includes("tv-shows"),
    searchParams,
    emptyText: "Chưa có TV Shows nào.",
  });
}
