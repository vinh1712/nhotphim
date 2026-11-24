// Trang nội dung tĩnh (Giới thiệu, Liên hệ, Hỏi-Đáp, Chính sách, Điều khoản, Ứng dụng)
import type { ReactNode } from "react";

export type StaticSection = {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
};

export function StaticPage({
  title,
  intro,
  sections,
  children,
}: {
  title: string;
  intro?: string;
  sections?: StaticSection[];
  children?: ReactNode;
}) {
  return (
    <main className="flex-1 pt-16">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-text-primary flex items-center gap-2 text-xl sm:text-2xl">
            {title}
          </h2>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-8 max-w-4xl">
          {intro && (
            <p className="text-[15px] sm:text-base text-white/80 leading-relaxed mb-6">
              {intro}
            </p>
          )}

          {sections?.map((s, i) => (
            <div key={i} className="mt-6 first:mt-0">
              {s.heading && (
                <h3 className="text-[16px] sm:text-[17px] font-bold text-white mb-3">
                  {s.heading}
                </h3>
              )}
              {s.paragraphs?.map((p, j) => (
                <p key={j} className="text-[14px] sm:text-[15px] text-white/70 leading-relaxed mb-3">
                  {p}
                </p>
              ))}
              {s.list && (
                <ul className="mt-2 space-y-2">
                  {s.list.map((li, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2.5 text-[14px] sm:text-[15px] text-white/70 leading-relaxed"
                    >
                      <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFD166]" />
                      <span>{li}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {children}
        </div>
      </div>
    </main>
  );
}
