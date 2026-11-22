import { withBasePath } from "@/lib/base-path";
import { IconLogIn, IconHistory, IconMonitor, IconHeart, IconListPlus } from "./icons";

const XEM_TIEP = withBasePath("/sites/chophim/d35ffca76367b37b.webp");

const FEATURES = [
  { icon: <IconHistory className="w-3.5 h-3.5 text-[#FFD166]" />, label: "Lưu tiến trình xem" },
  { icon: <IconMonitor className="w-3.5 h-3.5 text-[#FFD166]" />, label: "Đồng bộ đa thiết bị" },
  { icon: <IconHeart className="w-3.5 h-3.5 text-[#FFD166]" />, label: "Thêm phim yêu thích" },
  { icon: <IconListPlus className="w-3.5 h-3.5 text-[#FFD166]" />, label: "Tạo danh sách riêng" },
];

export function LoginBanner() {
  return (
    <section className="mb-6 mt-2">
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgb(42, 35, 24) 0%, rgb(46, 37, 21) 50%, rgb(48, 34, 16) 100%)",
        }}
      >
        <div className="flex min-h-[170px] flex-wrap items-stretch sm:pr-[clamp(120px,15vw,200px)] lg:flex-nowrap">
          <div className="z-10 flex w-full min-w-0 flex-col justify-center px-5 py-6 sm:w-auto sm:shrink-0 sm:px-8 sm:py-7">
            <h2 className="max-w-full text-[16px] font-bold leading-snug text-[#FFD166] sm:max-w-none sm:text-lg">
              Đăng nhập để lưu phim xem tiếp
            </h2>
            <p className="mt-1.5 max-w-full text-[13px] leading-relaxed text-white/50 sm:max-w-xs">
              Lưu phim đang xem, đồng bộ trên nhiều thiết bị, tạo danh sách riêng — hoàn toàn miễn
              phí.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex h-9 w-fit items-center gap-2 rounded-lg bg-[#FFD166] px-5 text-[13px] font-bold text-[#171717] hover:bg-[#FFE099] active:scale-[0.97] transition-all"
            >
              <IconLogIn className="h-4 w-4" />
              Đăng nhập
            </button>
          </div>

          <div className="order-3 hidden w-full items-center px-8 pb-6 sm:flex lg:order-none lg:w-auto lg:flex-1 lg:justify-center lg:px-4 lg:pb-0 z-10">
            <div className="grid grid-flow-col grid-rows-2 gap-x-6 gap-y-3.5 xl:gap-x-10">
              {FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-2.5 whitespace-nowrap">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#FFD166]/10">
                    {f.icon}
                  </div>
                  <span className="text-[13px] text-white/60 font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Xem tiếp phim"
          width={200}
          height={240}
          decoding="async"
          className="pointer-events-none absolute bottom-0 right-3 hidden h-full max-h-full w-auto object-contain object-bottom drop-shadow-[0_2px_16px_rgba(255,209,102,0.15)] sm:block lg:right-6"
          src={XEM_TIEP}
        />
      </div>
    </section>
  );
}
