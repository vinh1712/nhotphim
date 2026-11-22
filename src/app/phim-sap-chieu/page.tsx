import type { Metadata } from "next";
import { renderCategory } from "@/components/sites/chophim/category-route";

export const metadata: Metadata = {
  title: "Phim Sắp Chiếu | Chợ Phim",
  description: "Danh sách phim sắp chiếu tại Chợ Phim.",
};

export default function PhimSapChieuPage() {
  return renderCategory({
    title: "Phim Sắp Chiếu",
    basePath: "/phim-sap-chieu",
    filter: (m) => m.epstatus === "Sắp chiếu",
    emptyText: "Hiện chưa có phim sắp chiếu.",
  });
}
