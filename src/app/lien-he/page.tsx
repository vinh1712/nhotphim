import type { Metadata } from "next";
import { Header } from "@/components/sites/chophim/Header";
import { Footer } from "@/components/sites/chophim/Footer";
import { StaticPage } from "@/components/sites/chophim/StaticPage";

export const metadata: Metadata = {
  title: "Liên Hệ | NhótPhim",
  description: "Liên hệ với NhótPhim để góp ý, báo lỗi hoặc yêu cầu gỡ bỏ nội dung.",
};

export default function LienHePage() {
  return (
    <>
      <Header />
      <StaticPage
        title="Liên Hệ"
        intro="Chúng tôi luôn lắng nghe mọi góp ý, phản ánh và đề xuất của bạn về NhótPhim. Nếu gặp vấn đề khi xem phim hoặc muốn hợp tác, hãy liên hệ qua các kênh dưới đây."
        sections={[
          {
            heading: "Các kênh liên hệ",
            list: [
              "Nhóm Telegram: https://t.me/nhot2008 — thảo luận, báo lỗi phim với admin.",
              "Email hỗ trợ: support@nhotphim.example — phản ánh lỗi kỹ thuật, yêu cầu gỡ nội dung.",
              "Bình luận trực tiếp: đăng bình luận ngay tại trang chi tiết phim để báo lỗi tập/server.",
            ],
          },
          {
            heading: "Yêu cầu gỡ bỏ nội dung (DMCA)",
            paragraphs: [
              "Nếu bạn là chủ sở hữu bản quyền và cho rằng nội dung hiển thị trên NhótPhim vi phạm quyền của mình, vui lòng gửi yêu cầu gỡ bỏ kèm thông tin: tên tác phẩm, liên kết tới trang phim và bằng chứng sở hữu bản quyền. Chúng tôi sẽ xử lý trong vòng 48 giờ làm việc.",
            ],
          },
          {
            heading: "Góp ý & báo lỗi",
            paragraphs: [
              "Khi báo lỗi, bạn nên cung cấp: tên phim, server đang xem, tập phim và mô tả lỗi (mất tiếng, giật lag, không phát được...). Những thông tin này giúp chúng tôi khắc phục nhanh hơn.",
            ],
          },
        ]}
      />
      <Footer />
    </>
  );
}
