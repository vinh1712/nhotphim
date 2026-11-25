"use client";

type Props = {
  id: string;
  /** lớp vị trí, vd: "top-[40%]" hoặc "top-[30%] md:top-[35%]" */
  pos: string;
  z: string;
  group: "slider" | "section";
  /** Luôn hiện mũi tên (kể cả mobile / bản ngang), không cần hover. */
  mobileVisible?: boolean;
  /** Đặt mũi tên ngay mép ngoài để không che thẻ đầu/cuối (dùng cho Bình Luận Mới). */
  edge?: boolean;
  /** Nhãn cho trình đọc màn hình; mặc định dùng nhãn cuộn chung. */
  prevLabel?: string;
  nextLabel?: string;
};

/** Nút mũi tên trượt (mặc định hiện khi hover nhóm) — bấm để cuộn container có id tương ứng */
export function SliderArrows({
  id,
  pos,
  z,
  group,
  mobileVisible = false,
  edge = false,
  prevLabel = "Cuộn trái",
  nextLabel = "Cuộn phải",
}: Props) {
  const hover = group === "section" ? "group-hover/section:opacity-100" : "group-hover/slider:opacity-100";
  const leftEdge = edge ? "left-0 -translate-x-1/2" : "left-2";
  const rightEdge = edge ? "right-0 translate-x-1/2" : "right-2";
  // Theo feedback: 2 carousel Bình Luận Mới / Song Ngữ phải thấy <> ngay cả khi xem ngang trên điện thoại.
  const visibility = mobileVisible
    ? `flex opacity-100`
    : `opacity-0 ${hover} hidden md:flex`;

  const scroll = (dir: 1 | -1) => {
    const el = document.getElementById(id);
    if (!el) return;
    const distance = Math.max(280, Math.round(el.clientWidth * 0.8));
    const max = el.scrollWidth - el.clientWidth;
    // Giống swiper của trang gốc: bấm tiếp ở cuối quay về đầu, bấm lùi ở đầu quay về cuối.
    if (max <= 2) return;
    if (dir > 0 && el.scrollLeft >= max - 2) {
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (dir < 0 && el.scrollLeft <= 2) {
      el.scrollTo({ left: max, behavior: "smooth" });
      return;
    }
    el.scrollBy({ left: dir * distance, behavior: "smooth" });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label={prevLabel}
        className={`absolute ${leftEdge} ${pos} -translate-y-1/2 ${z} w-8 h-8 md:w-10 md:h-10 bg-white/90 text-bg-primary hover:scale-110 shadow-xl rounded-full items-center justify-center transition-all ${visibility}`}
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label={nextLabel}
        className={`absolute ${rightEdge} ${pos} -translate-y-1/2 ${z} w-8 h-8 md:w-10 md:h-10 bg-white/90 text-bg-primary hover:scale-110 shadow-xl rounded-full items-center justify-center transition-all ${visibility}`}
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </>
  );
}
