import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LoadingOverlay } from "@/components/sites/chophim/LoadingOverlay";
import { LiveDataProvider } from "@/lib/live-data";
import { SKIP_OVERLAY_KEY } from "@/lib/overlay";

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
        {/* Overlay clone chophim hiện ở mọi lần tải lại trang thật (F5, mở tab
            lại, trình duyệt tự reload tab cũ). Chỉ bỏ qua khi trước đó người dùng
            bấm link nội bộ — static export nên lúc đó cũng là full reload. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var k=${JSON.stringify(
              SKIP_OVERLAY_KEY
            )},s=window.sessionStorage,m=Number(s.getItem(k)||0),n=performance.getEntriesByType('navigation')[0];if(m&&Date.now()-m<10000){document.documentElement.setAttribute('data-nhot-skip-overlay','1');try{s.removeItem(k)}catch(e){}}else if(n&&n.type==='back_forward'){document.documentElement.setAttribute('data-nhot-skip-overlay','1')}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col overflow-x-hidden pt-0 pt-[env(safe-area-inset-top)]">
        <LoadingOverlay />
        <LiveDataProvider>{children}</LiveDataProvider>
      </body>
    </html>
  );
}
