import { withBasePath } from "@/lib/base-path";
const LOGO = withBasePath("/brand/nhotphim-logo.png");
const VN_FLAG = withBasePath("/sites/chophim/46d51573b642dc37.svg");

/* Chỉ giữ kênh chính thức của Nhót Phim — bỏ các nút href="#" của chophim. */
const SOCIALS: { href: string; label: string; icon: string; size: number }[] = [
  { href: "https://t.me/nhot2008", label: "Telegram", icon: withBasePath("/sites/chophim/659a62f126eec1fb.svg"), size: 18 },
];

const MENU = [
  { label: "Hỏi-Đáp", href: withBasePath("/hoi-dap") },
  { label: "Chính sách bảo mật", href: withBasePath("/chinh-sach-bao-mat") },
  { label: "Điều khoản sử dụng", href: withBasePath("/dieu-khoan-su-dung") },
  { label: "Giới thiệu", href: withBasePath("/gioi-thieu") },
  { label: "Liên hệ", href: withBasePath("/lien-he") },
];

const DESC =
  "NhótPhim - Trang xem phim online chất lượng cao miễn phí Vietsub, thuyết minh, lồng tiếng full HD. Kho phim mới khổng lồ, phim chiếu rạp, phim bộ, phim lẻ từ nhiều quốc gia như Việt Nam, Hàn Quốc, Trung Quốc, Thái Lan, Nhật Bản, Âu Mỹ… đa dạng thể loại. Khám phá nền tảng phim trực tuyến hay nhất 2026 với chất lượng 4K!";

export function Footer() {
  return (
    <footer className="bg-[#0a0a0f] border-t border-white/5 mt-16 pb-12">
      <div className="max-w-[1400px] mx-auto px-4 pt-10">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-[#8c171e] text-white px-4 py-2 rounded-full text-sm font-medium shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="VN Flag"
              loading="lazy"
              width={18}
              height={18}
              decoding="async"
              className="rounded-[2px] object-cover"
              src={VN_FLAG}
            />
            Một tình yêu cho Việt Nam <span>❤️</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center pt-2 pb-6 gap-8 md:gap-8">
          <a className="inline-block shrink-0 mx-auto md:mx-0" href={withBasePath("/")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="NhótPhim"
              loading="lazy"
              width={260}
              height={80}
              decoding="async"
              className="h-[72px] md:h-[80px] w-auto object-contain"
              src={LOGO}
            />
          </a>
          <div className="hidden md:block w-px h-10 bg-white/10" />
          <div className="flex flex-nowrap items-center justify-center md:justify-start gap-2.5 sm:gap-3 overflow-x-auto overflow-y-hidden w-full md:w-auto pb-2 md:pb-0 scrollbar-hide shrink-0">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="w-10 h-10 rounded-full bg-[#12121a] flex items-center justify-center text-white/80"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={s.label}
                  loading="lazy"
                  width={s.size}
                  height={s.size}
                  decoding="async"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                  src={s.icon}
                />
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-8 mb-6">
          {MENU.map((m) => (
            <a
              key={m.label}
              className="text-[15px] font-medium text-white/90 hover:text-yellow-400 transition-colors"
              href={m.href}
            >
              {m.label}
            </a>
          ))}
        </div>

        <div className="mt-4 max-w-5xl">
          <p className="text-[14px] leading-[1.8] text-white/60 max-w-[85ch]">{DESC}</p>
        </div>

        <div className="mt-6 pt-2">
          <p className="text-[14px] text-white/80">
            © 2026 NhótPhim
            <span className="mx-2 text-white/30">•</span>
            <span>
              <a
                href="https://t.me/nhot2008"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FFD166] hover:text-yellow-300 transition-colors"
              >
                @nhot2008
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
