import type { Metadata } from "next";
import { Header } from "@/components/sites/chophim/Header";
import { Footer } from "@/components/sites/chophim/Footer";
import { StaticPage } from "@/components/sites/chophim/StaticPage";

export const metadata: Metadata = {
  title: "Chính Sách Bảo Mật",
  description: "Chính sách bảo mật của NhótPhim — cách chúng tôi thu thập và sử dụng thông tin.",
};

export default function ChinhSachBaoMatPage() {
  return (
    <>
      <Header />
      <StaticPage
        title="Chính Sách Bảo Mật"
        intro="NhótPhim tôn trọng quyền riêng tư của bạn. Tài liệu này giải thích chúng tôi thu thập, sử dụng và bảo vệ thông tin như thế nào khi bạn truy cập website."
        sections={[
          {
            heading: "1. Thông tin thu thập",
            list: [
              "Dữ liệu duyệt web: địa chỉ IP, loại trình duyệt, trang bạn truy cập — dùng để thống kê và cải thiện trải nghiệm.",
              "Thông tin tài khoản (nếu bạn đăng ký): tên hiển thị, email — chỉ dùng cho chức năng bình luận và danh sách phim.",
              "Cookie: lưu tùy chọn xem phim (server/tập đang xem) để bạn không phải chọn lại.",
            ],
          },
          {
            heading: "2. Cách chúng tôi sử dụng thông tin",
            paragraphs: [
              "Thông tin thu thập chỉ dùng cho mục đích vận hành website: đo lường lượt xem, khắc phục lỗi kỹ thuật và cá nhân hóa trải nghiệm. Chúng tôi không bán, không cho thuê thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào.",
            ],
          },
          {
            heading: "3. Cookie",
            paragraphs: [
              "NhótPhim sử dụng cookie cần thiết để ghi nhớ trạng thái phiên làm việc. Bạn có thể tắt cookie trong trình duyệt, tuy nhiên một số chức năng (nhớ tập đang xem, đăng nhập) có thể không hoạt động.",
            ],
          },
          {
            heading: "4. Liên hệ",
            paragraphs: [
              "Nếu có câu hỏi về chính sách bảo mật, vui lòng gửi qua trang Liên hệ. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.",
            ],
          },
        ]}
      />
      <Footer />
    </>
  );
}
