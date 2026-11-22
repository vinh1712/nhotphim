import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/sites/chophim/Header";
import { Footer } from "@/components/sites/chophim/Footer";
import { AccountPage } from "@/components/sites/chophim/AccountPage";
import { ACCOUNT_TAB_KEYS, getAccountTab, type AccountTab } from "@/lib/account-tabs";

export function generateStaticParams() {
  return ACCOUNT_TAB_KEYS.map((tab) => ({ tab }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tab: string }>;
}): Promise<Metadata> {
  const { tab } = await params;
  const info = getAccountTab(tab);
  return {
    title: info?.title ?? "Quản lý tài khoản",
    description: info?.subtitle ?? "Quản lý tài khoản Nhót Phim.",
  };
}

export default async function AccountTabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;
  if (!ACCOUNT_TAB_KEYS.includes(tab as AccountTab)) notFound();

  return (
    <>
      <Header />
      <AccountPage tab={tab as AccountTab} />
      <Footer />
    </>
  );
}
