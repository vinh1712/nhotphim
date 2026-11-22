import type { Metadata } from "next";
import { renderCategory } from "@/components/sites/chophim/category-route";

export const metadata: Metadata = {
  title: "Phim Song Ngữ | Chợ Phim",
  description: "Xem phim song ngữ, thuyết minh online miễn phí tại Chợ Phim.",
};

export default function PhimSongNguPage() {
  return renderCategory({
    title: "Phim Song Ngữ",
    basePath: "/phim-song-ngu",
    filter: (m) => m.lang !== "Vietsub",
    emptyText: "Chưa có phim song ngữ.",
  });
}
