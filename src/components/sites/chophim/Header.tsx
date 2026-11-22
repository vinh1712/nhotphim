import { withBasePath } from "@/lib/base-path";
import { home } from "./types";

const LOGO_384 = withBasePath("/sites/chophim/0ec7eba077af57ab.png");
const LOGO_640 = withBasePath("/sites/chophim/56983f90e6a3c741.png");

const DROPDOWN_W = ["w-[480px]", "w-[400px]", "w-[200px]"];

export function Header() {
  const topLinks = home.header.nav.slice(0, 3);
  const dropdowns = home.header.dropdowns;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-transparent backdrop-blur-none">
      <div className="w-full px-2 lg:px-4 flex items-center justify-between h-[68px] lg:h-[76px] pt-1 lg:pt-2">
        {/* --- mobile: logo + hamburger --- */}
        <div className="flex items-center gap-2 lg:hidden w-full">
          <button className="p-2 -ml-2 text-text-secondary hover:text-text-primary" aria-label="Menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <a className="flex items-center shrink-0" href={withBasePath("/")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="ChoPhim" width={160} height={45} decoding="async" className="h-10 w-auto object-contain" src={LOGO_384} />
          </a>
        </div>

        {/* --- mobile: search --- */}
        <div className="flex items-center gap-3 lg:hidden shrink-0">
          <a className="p-2 text-text-secondary hover:text-text-primary" aria-label="Search" href={withBasePath("/tim-kiem")}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </a>
        </div>

        {/* --- desktop --- */}
        <div className="hidden lg:flex items-center w-full justify-between h-full">
          <div className="flex items-center h-full flex-1 min-w-0">
            <a className="flex items-center gap-2 shrink-0 pr-1 xl:pr-3" href={withBasePath("/")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="ChoPhim" loading="lazy" width={200} height={60} decoding="async" className="h-10 xl:h-14 w-auto object-contain" src={LOGO_640} />
            </a>
            <div className="ml-1 xl:ml-2 w-[240px] xl:w-[340px] 2xl:w-[400px] shrink-0 transition-all duration-300">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <form action={withBasePath("/tim-kiem")} method="get" className="w-full">
                  <input
                    placeholder="Tìm kiếm phim, diễn viên"
                    type="text"
                    name="keyword"
                    className="h-[42px] bg-white/10 text-[15px] text-text-primary placeholder:text-[#FFFFFF] focus:outline-none border transition-all w-full pl-10 pr-4 border-white/0 focus:border-white rounded-[8px]"
                  />
                </form>
              </div>
            </div>

            <nav className="flex items-center gap-0.5 xl:gap-1 ml-4 xl:ml-8">
              {topLinks.map((l) => (
                <a
                  key={l.href + l.label}
                  className="px-2 xl:px-2.5 py-2 text-[13px] text-[#FFFFFF] hover:text-white transition-colors rounded-lg hover:bg-bg-hover whitespace-nowrap"
                  href={l.href}
                >
                  {l.label}
                </a>
              ))}
              {dropdowns.map((d, i) => (
                <div key={d.label} className={`nav-item relative${i === 2 ? " group" : ""}`}>
                  <button className="px-2 xl:px-2.5 py-2 text-[13px] text-[#FFFFFF] hover:text-white transition-colors rounded-lg hover:bg-bg-hover whitespace-nowrap">
                    {d.label}
                  </button>
                  <div
                    className={`nav-dropdown absolute top-full left-0 mt-1 ${DROPDOWN_W[i] ?? "w-[480px]"} bg-bg-secondary border border-border rounded-xl p-4 shadow-2xl${
                      i === 2 ? " invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200" : ""
                    }`}
                  >
                    <div className={i === 2 ? "flex flex-col gap-1" : "grid grid-cols-3 gap-1"}>
                      {d.links.map((lk) => (
                        <a
                          key={lk.href + lk.label}
                          className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
                          href={lk.href}
                        >
                          {lk.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="ml-2 xl:ml-auto flex items-center gap-2 xl:gap-4 shrink-0">
            <a className="hidden xl:flex items-center gap-2.5 py-1 px-2 hover:opacity-80 transition-opacity cursor-pointer" href={withBasePath("/tai-ung-dung")}>
              <div className="relative w-8 h-8 flex items-center justify-center text-[#FFD166] shrink-0">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M10.9998 16.8992C11.1655 16.8992 11.2998 16.7649 11.2998 16.5992V11.5982C11.2998 9.28322 13.1838 7.39922 15.4998 7.39922H18.7998C18.9238 7.39922 19.0446 7.41106 19.1616 7.43327C19.3745 7.47368 19.5998 7.32682 19.5998 7.11012V6.69922C19.5998 6.67022 19.5968 6.64022 19.5918 6.61222C19.2488 4.66722 17.4468 3.19922 15.4008 3.19922H6.79982C4.42882 3.19922 2.49982 5.12822 2.49982 7.49922V12.5982C2.49982 14.9692 4.42882 16.8992 6.79982 16.8992H8.24282L7.86182 19.2492H5.85982C5.44582 19.2492 5.10982 19.5852 5.10982 19.9992C5.10982 20.4132 5.44582 20.7492 5.85982 20.7492H10.7598C11.1738 20.7492 11.5098 20.4132 11.5098 19.9992C11.5098 19.5852 11.1738 19.2492 10.7598 19.2492H9.38082L9.76182 16.8992H10.9998Z" fill="currentColor" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M17.1912 18.4564C16.7712 18.4564 16.4302 18.1154 16.4302 17.6954C16.4302 17.2754 16.7712 16.9344 17.1912 16.9344C17.6112 16.9344 17.9522 17.2754 17.9522 17.6954C17.9522 18.1154 17.6112 18.4564 17.1912 18.4564ZM18.8002 8.90039H15.5002C14.0362 8.90039 12.8002 10.1364 12.8002 11.5994V18.0994C12.8002 19.5884 14.0112 20.7994 15.5002 20.7994H18.8002C20.2892 20.7994 21.5002 19.5884 21.5002 18.0994V11.5994C21.5002 10.1364 20.2642 8.90039 18.8002 8.90039Z" fill="#ffffff" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="text-[11px] text-white/70 mb-0.5" style={{ lineHeight: "11px" }}>Tải ứng dụng</p>
                <p className="text-[14px] font-bold text-white leading-none">ChoPhim</p>
              </div>
            </a>
            <a
              className="flex justify-center items-center gap-1.5 h-9 xl:h-10 px-3 xl:px-4 bg-[#F2F4F7] hover:bg-white text-[#1c1c1c] rounded-full font-medium transition-colors text-[13px] xl:text-sm shadow-sm hover:shadow shrink-0"
              href={withBasePath("/dang-nhap")}
            >
              <svg className="w-4 h-4 xl:w-5 xl:h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <span>Thành viên</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
