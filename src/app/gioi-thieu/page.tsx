import type { Metadata } from "next";
import { Header } from "@/components/sites/chophim/Header";
import { Footer } from "@/components/sites/chophim/Footer";
import { StaticPage } from "@/components/sites/chophim/StaticPage";

export const metadata: Metadata = {
  title: "Giới Thiệu",
  description:
    "Giới thiệu Nhót Phim — Phim hay chín hết cả mùa: kho phim online miễn phí chất lượng HD, Vietsub và thuyết minh.",
};

export default function GioiThieuPage() {
  return (
    <>
      <Header />
      <StaticPage
        title="Giới Thiệu"
        intro="Nhót Phim là trang xem phim online miễn phí với phương châm “Phim hay chín hết cả mùa” — mọi thể loại phim đều quy tụ tại đây, từ phim lẻ, phim bộ, hoạt hình, TV Shows đến phim chiếu rạp."
        sections={[
          {
            heading: "Chúng tôi mang đến gì?",
            list: [
              "Kho phim phong phú: phim lẻ, phim bộ, anime/hoạt hình, TV Shows cập nhật liên tục.",
              "Chất lượng từ SD đến Full HD, Vietsub và thuyết minh.",
              "Nhiều server xem dự phòng, tự động chuyển tập, hỗ trợ trình phát HLS hiện đại.",
              "Giao diện tối giản, dễ sử dụng trên cả máy tính và điện thoại.",
            ],
          },
          {
            heading: "Tôn chỉ hoạt động",
            paragraphs: [
              "NhótPhim không lưu trữ, không tải lên bất kỳ nội dung phim nào. Toàn bộ nội dung được lấy từ các nguồn chia sẻ công khai trên Internet, chỉ phục vụ mục đích giải trí và tham khảo.",
              "Chúng tôi tôn trọng quyền sở hữu trí tuệ của các nhà sản xuất. Nếu bạn là chủ sở hữu bản quyền và muốn nội dung được gỡ bỏ, vui lòng liên hệ với chúng tôi qua trang Liên hệ.",
            ],
          },
          {
            heading: "Miễn phí 100%",
            paragraphs: [
              "Mọi nội dung trên NhótPhim đều miễn phí. Bạn không cần đăng ký, không cần nạp tiền — chỉ cần chọn phim và thưởng thức. Tài khoản thành viên (nếu có) chỉ dùng để bình luận, đánh giá và lưu danh sách yêu thích.",
            ],
          },
        ]}
      />
      <Footer />
    </>
  );
}
