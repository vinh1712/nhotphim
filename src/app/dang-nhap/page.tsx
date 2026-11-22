import type { Metadata } from "next";
import { Header } from "@/components/sites/chophim/Header";
import { Footer } from "@/components/sites/chophim/Footer";
import { LoginPage } from "@/components/sites/chophim/LoginPage";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập hoặc tạo tài khoản Nhót Phim — Phim hay chín hết cả mùa.",
};

export default function DangNhapPage() {
  return (
    <>
      <Header />
      <LoginPage />
      <Footer />
    </>
  );
}
