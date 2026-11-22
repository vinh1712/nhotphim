import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LoadingOverlay } from "@/components/sites/chophim/LoadingOverlay";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Nhót Phim - Phim hay chín hết cả mùa",
    template: "%s | Nhót Phim - Phim hay chín hết cả mùa",
  },
  applicationName: "Nhót Phim",
  appleWebApp: {
    title: "Nhót Phim",
    capable: true,
    statusBarStyle: "black-translucent",
  },
  description:
    "Nhót Phim - Phim hay chín hết cả mùa. Trang xem phim online chất lượng cao miễn phí Vietsub, thuyết minh, lồng tiếng full HD.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* Overlay clone chophim chỉ hiện khi F5/mở lại trang. Chuyển trang nội bộ
            của bản static export là full reload, nên đánh dấu trước khi paint để ẩn. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var n=performance.getEntriesByType('navigation')[0],r=document.referrer;if(n&&(n.type==='back_forward'||(n.type==='navigate'&&r&&new URL(r).origin===location.origin)))document.documentElement.setAttribute('data-nhot-skip-overlay','1')}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col overflow-x-hidden pt-0 pt-[env(safe-area-inset-top)]">
        <LoadingOverlay />
        {children}
      </body>
    </html>
  );
}
