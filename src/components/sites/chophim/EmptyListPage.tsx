// Trang danh sách rỗng với trạng thái "chưa có dữ liệu" + gợi ý liên quan
import { Header } from "./Header";
import { Footer } from "./Footer";

export function EmptyListPage({
  title,
  emptyText,
  hint,
}: {
  title: string;
  emptyText: string;
  hint?: string;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 pt-16">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-text-primary flex items-center gap-2 text-xl sm:text-2xl">
              {title}
            </h2>
          </div>
          <div className="mb-8 font-sans">
            <button className="flex items-center gap-2 text-[15px] font-semibold text-text-primary hover:text-white transition-colors mb-4">
              <svg className="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span>Bộ lọc</span>
            </button>
          </div>

          <div className="py-20 text-center">
            <svg
              className="w-14 h-14 mx-auto mb-4 text-white/15"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2h7M9 9h6M9 13h4m4 8l-2 2 4 4 2-2-4-4z"
              />
            </svg>
            <p className="text-text-muted text-[15px]">{emptyText}</p>
            {hint && (
              <p className="text-white/40 text-[13px] mt-2">
                {hint}
              </p>
            )}
            <div className="flex items-center justify-center gap-3 mt-6">
              <a
                href="/"
                className="px-5 py-2.5 rounded-full bg-[#FFD166] text-[#14161f] text-[14px] font-bold hover:bg-[#ffe09a] transition-colors"
              >
                Về trang chủ
              </a>
              <a
                href="/tim-kiem"
                className="px-5 py-2.5 rounded-full bg-white/10 text-white text-[14px] font-medium hover:bg-white/20 transition-colors"
              >
                Tìm kiếm phim
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
