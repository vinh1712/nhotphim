import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NhótPhim - Phim hay, xem mọi lúc",
  description:
    "NhótPhim - Trang xem phim online chất lượng cao miễn phí Vietsub, thuyết minh, lồng tiếng full HD.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}
