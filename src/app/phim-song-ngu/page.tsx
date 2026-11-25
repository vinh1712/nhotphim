import { withBasePath } from "@/lib/base-path";
import type { Metadata } from "next";
import { renderCategory } from "@/components/sites/chophim/category-route";
import { hasVpSource } from "@/components/sites/chophim/movie-filter";

export const metadata: Metadata = {
  title: "Phim Song Ngữ",
  description: "Xem phim song ngữ, thuyết minh online miễn phí tại NhótPhim.",
};

export default function PhimSongNguPage() {
  return renderCategory({
    title: "Phim Song Ngữ",
    basePath: withBasePath("/phim-song-ngu"),
    filter: hasVpSource,
    emptyText: "Chưa có phim song ngữ.",
    liveFilter: "vp",
  });
}
