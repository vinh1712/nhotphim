import type { Metadata } from "next";
import { EmptyListPage } from "@/components/sites/chophim/EmptyListPage";

export const metadata: Metadata = {
  title: "Diễn Viên | Chợ Phim",
  description: "Danh sách diễn viên tham gia các bộ phim tại Chợ Phim.",
};

export default function DienVienPage() {
  return (
    <EmptyListPage
      title="Diễn Viên"
      emptyText="Chức năng danh sách diễn viên đang được cập nhật."
      hint="Quay lại trang chủ để khám phá phim ngay."
    />
  );
}
