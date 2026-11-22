import type { Metadata } from "next";
import { Header } from "@/components/sites/chophim/Header";
import { Footer } from "@/components/sites/chophim/Footer";
import { StaticPage } from "@/components/sites/chophim/StaticPage";

export const metadata: Metadata = {
  title: "Tải Ứng Dụng | NhótPhim",
  description: "Tải ứng dụng NhótPhim cho Android và iOS — xem phim mọi lúc mọi nơi.",
};

export default function TaiUngDungPage() {
  return (
    <>
      <Header />
      <StaticPage
        title="Tải Ứng Dụng"
        intro="Xem phim thoải mái hơn với ứng dụng NhótPhim — nhẹ, mượt, hỗ trợ thông báo phim mới và trải nghiệm tối ưu cho điện thoại."
        sections={[
          {
            heading: "Android",
            paragraphs: [
              "Tải file APK từ liên kết chính thức và cài đặt như bình thường. Ứng dụng hỗ trợ Android 6.0 trở lên, dung lượng gọn dưới 15MB.",
            ],
            list: [
              "Kho phim đầy đủ như trên website.",
              "Phát HLS mượt mà, nhớ server/tập đang xem.",
              "Thông báo khi phim yêu thích có tập mới.",
            ],
          },
          {
            heading: "iOS (iPhone / iPad)",
            paragraphs: [
              "Ứng dụng iOS đang chờ phát hành trên App Store. Trong lúc đó, bạn có thể thêm NhótPhim vào Màn hình chính: mở Safari → Chia sẻ → Thêm vào Màn hình chính để dùng như một app.",
            ],
          },
          {
            heading: "Lưu ý",
            list: [
              "Chỉ tải ứng dụng từ các liên kết trên trang này để tránh bản giả mạo.",
              "Ứng dụng hoàn toàn miễn phí — nếu gặp trang yêu cầu thanh toán, đó không phải của chúng tôi.",
              "Báo lỗi cài đặt qua nhóm Telegram để được hỗ trợ nhanh nhất.",
            ],
          },
        ]}
      />
      <Footer />
    </>
  );
}
