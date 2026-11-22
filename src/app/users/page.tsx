import type { Metadata } from "next";
import { Header } from "@/components/sites/chophim/Header";
import { Footer } from "@/components/sites/chophim/Footer";
import { AccountPage } from "@/components/sites/chophim/AccountPage";

export const metadata: Metadata = {
  title: "Quản lý tài khoản",
  description: "Quản lý thông tin cá nhân, phim yêu thích và tiến trình xem trên Nhót Phim.",
};

export default function UsersPage() {
  return (
    <>
      <Header />
      <AccountPage tab="yeu-thich" />
      <Footer />
    </>
  );
}
