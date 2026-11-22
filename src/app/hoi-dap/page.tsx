import type { Metadata } from "next";
import { Header } from "@/components/sites/chophim/Header";
import { Footer } from "@/components/sites/chophim/Footer";
import { StaticPage } from "@/components/sites/chophim/StaticPage";

export const metadata: Metadata = {
  title: "Hỏi-Đáp",
  description: "Các câu hỏi thường gặp về cách xem phim, lỗi phát sinh và sử dụng NhótPhim.",
};

const QA: { q: string; a: string }[] = [
  {
    q: "NhótPhim có mất phí không?",
    a: "Không. NhótPhim hoàn toàn miễn phí — bạn có thể xem toàn bộ phim mà không cần nạp tiền hay mua gói. Chỉ cần chọn phim và bấm Play.",
  },
  {
    q: "Làm sao xem phim chất lượng cao (HD, Full HD)?",
    a: "Phim trên NhótPhim mặc định được phát ở chất lượng tốt nhất mà nguồn cung cấp. Nếu phim có nhiều chất lượng, bạn có thể đổi trong nút Cài đặt trên thanh điều khiển của trình phát.",
  },
  {
    q: "Trình phát báo lỗi, không chạy thì làm sao?",
    a: "Hãy thử các cách sau: bấm F5 để tải lại trang; thử đổi Máy chủ bên dưới danh sách tập; thử trình duyệt khác (Chrome/Edge mới nhất); kiểm tra kết nối mạng. Nếu vẫn lỗi, báo qua bình luận hoặc nhóm Telegram.",
  },
  {
    q: "Tại sao phim bị giật lag?",
    a: "Giật lag thường do mạng của bạn hoặc máy chủ nguồn đang quá tải. Bạn nên thử chuyển sang Máy chủ Dự phòng, hoặc đổi giờ xem thấp điểm hơn.",
  },
  {
    q: "Làm sao chọn tập phim?",
    a: "Ở trang xem phim, kéo xuống mục Danh sách tập và bấm tập bạn muốn. Với phim nhiều server, chọn server trước rồi chọn tập tương ứng.",
  },
  {
    q: "Có thể xem trên điện thoại không?",
    a: "Có. NhótPhim hỗ trợ trình phát trên điện thoại Android, iOS và máy tính bảng, tối ưu cho cả màn hình nhỏ.",
  },
  {
    q: "Phim bị lỗi âm thanh, vietsub lỗi thì báo ở đâu?",
    a: "Báo ngay qua bình luận dưới trang xem phim (kèm tên tập) hoặc qua nhóm Telegram. Admin sẽ kiểm tra và sửa nguồn sớm.",
  },
];

export default function HoiDapPage() {
  return (
    <>
      <Header />
      <StaticPage title="Hỏi-Đáp" intro="Những câu hỏi thường gặp nhất khi xem phim tại NhótPhim.">
        <div className="mt-6 divide-y divide-white/10">
          {QA.map((item, i) => (
            <details key={i} className="group py-4" open={i === 0}>
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-[15px] sm:text-base font-semibold text-white list-none [&::-webkit-details-marker]:hidden">
                {item.q}
                <svg
                  className="w-4 h-4 shrink-0 text-[#FFD166] transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <p className="mt-2.5 text-[14px] sm:text-[15px] text-white/70 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </StaticPage>
      <Footer />
    </>
  );
}
