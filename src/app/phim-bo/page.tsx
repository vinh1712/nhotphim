import { withBasePath } from "@/lib/base-path";
import type { Metadata } from "next";
import { renderCategory } from "@/components/sites/chophim/category-route";

export const metadata: Metadata = {
  title: "Phim Bộ | Chợ Phim",
  description: "Xem phim bộ online miễn phí Vietsub, thuyết minh full HD tại Chợ Phim.",
};

export default function PhimBoPage() {
  return renderCategory({
    title: "Phim Bộ",
    basePath: withBasePath("/phim-bo"),
    filter: (m) => m.type === "series",
  });
}
