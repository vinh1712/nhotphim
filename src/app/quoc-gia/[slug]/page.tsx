import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { renderCategory } from "@/components/sites/chophim/category-route";
import taxonomiesJson from "@/data/taxonomies.json";

type Taxonomy = { type: string; slug: string; name: string };
const taxonomies = taxonomiesJson as unknown as Taxonomy[];
const countries = taxonomies.filter((t) => t.type === "country");

/** Tên quốc gia cho các link cũ không có trong taxonomy */
const EXTRA_NAMES: Record<string, string> = {
  anh: "Anh",
  phap: "Pháp",
  canada: "Canada",
  nga: "Nga",
  philippines: "Philippines",
  uc: "Úc",
  duc: "Đức",
  "tay-ban-nha": "Tây Ban Nha",
  y: "Ý",
  "tho-nhi-ky": "Thổ Nhĩ Kỳ",
  indonesia: "Indonesia",
  malaysia: "Malaysia",
  brazil: "Brazil",
  "ha-lan": "Hà Lan",
};

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  const slugs = new Set<string>(countries.map((c) => c.slug));
  for (const s of Object.keys(EXTRA_NAMES)) slugs.add(s);
  return [...slugs].map((slug) => ({ slug }));
}

function countryName(slug: string): string | null {
  return countries.find((c) => c.slug === slug)?.name ?? EXTRA_NAMES[slug] ?? null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const name = countryName(slug);
  if (!name) return {};
  return {
    title: `Phim ${name} | Chợ Phim`,
    description: `Xem phim ${name} online miễn phí Vietsub full HD tại Chợ Phim.`,
  };
}

export default async function QuocGiaPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const name = countryName(slug);
  if (!name) notFound();

  return renderCategory({
    title: `Phim ${name}`,
    basePath: `/quoc-gia/${slug}`,
    filter: (m) => m.countrySlug === slug,
    emptyText: `Chưa có phim ${name}.`,
  });
}
