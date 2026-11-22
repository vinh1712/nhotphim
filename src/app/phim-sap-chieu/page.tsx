import { withBasePath } from "@/lib/base-path";
import type { Metadata } from "next";
import { renderCategory } from "@/components/sites/chophim/category-route";

export const metadata: Metadata = {
  title: "Phim Sắp Chiếu | NhótPhim",
  description: "Danh sách phim sắp chiếu tại NhótPhim.",
};

export default function PhimSapChieuPage() {
  return renderCategory({
    title: "Phim Sắp Chiếu",
    basePath: withBasePath("/phim-sap-chieu"),
    filter: (m) => m.epstatus === "Sắp chiếu",
    emptyText: "Hiện chưa có phim sắp chiếu.",
  });
}
