import type { Metadata } from "next";
import { Header } from "@/components/sites/chophim/Header";
import { Footer } from "@/components/sites/chophim/Footer";
import { StaticPage } from "@/components/sites/chophim/StaticPage";

export const metadata: Metadata = {
  title: "Điều Khoản Sử Dụng",
  description: "Điều khoản sử dụng website NhótPhim — quy tắc và trách nhiệm khi sử dụng dịch vụ.",
};

export default function DieuKhoanSuDungPage() {
  return (
    <>
      <Header />
      <StaticPage
        title="Điều Khoản Sử Dụng"
        intro="Khi truy cập và sử dụng NhótPhim, bạn đồng ý tuân thủ các điều khoản dưới đây. Vui lòng đọc kỹ trước khi sử dụng dịch vụ."
        sections={[
          {
            heading: "1. Phạm vi áp dụng",
            paragraphs: [
              "Điều khoản này áp dụng cho tất cả người dùng khi truy cập website NhótPhim và sử dụng mọi tính năng được cung cấp.",
            ],
          },
          {
            heading: "2. Quyền và nghĩa vụ của người dùng",
            list: [
              "Sử dụng website cho mục đích cá nhân, phi thương mại.",
              "Không thực hiện hành vi phá hoại, tấn công, spam hoặc can thiệp vào hoạt động của website.",
              "Không sao chép, phát tán lại nội dung mà không có sự cho phép của chủ sở hữu bản quyền.",
              "Tuân thủ pháp luật Việt Nam và các quy định về bản quyền khi xem phim.",
            ],
          },
          {
            heading: "3. Trách nhiệm nội dung",
            paragraphs: [
              "NhótPhim là trang tổng hợp liên kết, không lưu trữ file phim. Nội dung do các nguồn bên thứ ba cung cấp. Chúng tôi nỗ lực kiểm tra nhưng không chịu trách nhiệm về nội dung của các liên kết bên ngoài.",
            ],
          },
          {
            heading: "4. Giới hạn trách nhiệm",
            paragraphs: [
              "Website được cung cấp theo “nguyên trạng”. Chúng tôi không bảo đảm website không gián đoạn hoặc không có lỗi. Trong mọi trường hợp, NhótPhim không chịu trách nhiệm cho bất kỳ tổn thất nào phát sinh từ việc sử dụng website.",
            ],
          },
          {
            heading: "5. Thay đổi điều khoản",
            paragraphs: [
              "Chúng tôi có quyền cập nhật điều khoản này vào bất kỳ lúc nào. Việc tiếp tục sử dụng website sau khi thay đổi đồng nghĩa với việc bạn chấp nhận điều khoản mới.",
            ],
          },
        ]}
      />
      <Footer />
    </>
  );
}
