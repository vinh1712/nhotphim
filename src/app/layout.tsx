import type { Metadata, Viewport } from "next";
import "./globals.css";

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
      <body className="min-h-screen flex flex-col overflow-x-hidden pt-0 pt-[env(safe-area-inset-top)]">
        {children}
      </body>
    </html>
  );
}
