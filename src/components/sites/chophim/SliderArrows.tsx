"use client";

type Props = {
  id: string;
  /** lớp vị trí, vd: "top-[40%]" hoặc "top-[30%] md:top-[35%]" */
  pos: string;
  z: string;
  group: "slider" | "section";
  /** Luôn hiện mũi tên (kể cả mobile / bản ngang), không cần hover. */
  mobileVisible?: boolean;
};

/** Nút mũi tên trượt (mặc định hiện khi hover nhóm) — bấm để cuộn container có id tương ứng */
export function SliderArrows({ id, pos, z, group, mobileVisible = false }: Props) {
  const hover = group === "section" ? "group-hover/section:opacity-100" : "group-hover/slider:opacity-100";
  // Theo feedback: 2 carousel Bình Luận Mới / Song Ngữ phải thấy <> ngay cả khi xem ngang trên điện thoại.
  const visibility = mobileVisible
    ? `flex opacity-100`
    : `opacity-0 ${hover} hidden md:flex`;

  const scroll = (dir: 1 | -1) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(280, Math.round(el.clientWidth * 0.8)), behavior: "smooth" });
  };

  return (
    <>
      <button
        onClick={() => scroll(-1)}
        aria-label="Cuộn trái"
        className={`absolute left-2 ${pos} -translate-y-1/2 ${z} w-8 h-8 md:w-10 md:h-10 bg-white/90 text-bg-primary hover:scale-110 shadow-xl rounded-full items-center justify-center transition-all ${visibility}`}
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => scroll(1)}
        aria-label="Cuộn phải"
        className={`absolute right-2 ${pos} -translate-y-1/2 ${z} w-8 h-8 md:w-10 md:h-10 bg-white/90 text-bg-primary hover:scale-110 shadow-xl rounded-full items-center justify-center transition-all ${visibility}`}
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </>
  );
}
