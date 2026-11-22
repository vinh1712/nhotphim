import type { Metadata } from "next";
import { EmptyListPage } from "@/components/sites/chophim/EmptyListPage";

export const metadata: Metadata = {
  title: "Lịch Chiếu | NhótPhim",
  description: "Lịch chiếu phim mới nhất tại NhótPhim.",
};

export default function LichChieuPage() {
  return (
    <EmptyListPage
      title="Lịch Chiếu"
      emptyText="Chưa có lịch chiếu phim nào được cập nhật."
      hint="Xem phim chiếu rạp tại Phim Chiếu Rạp hoặc khám phá phim mới ở trang chủ."
    />
  );
}
