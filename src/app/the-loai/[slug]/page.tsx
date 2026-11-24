import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { renderCategory } from "@/components/sites/chophim/category-route";
import { resolveGenreSlug } from "@/components/sites/chophim/movie-filter";
import taxonomiesJson from "@/data/taxonomies.json";

type Taxonomy = { type: string; slug: string; name: string };
const taxonomies = taxonomiesJson as unknown as Taxonomy[];
const categories = taxonomies.filter((t) => t.type === "category");

/** Slug thể loại cũ từ trang chủ → taxonomy hiện tại */
const ALIASES: Record<string, string> = {
  "khoa-hoc": "khoa-hoc-vt",
  "hoat-hinh": "anime-hoat-hinh",
  "lang-man": "tinh-cam",
};

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return [...categories.map((c) => ({ slug: c.slug })), ...Object.keys(ALIASES).map((slug) => ({ slug }))];
}

function findCategory(slug: string) {
  const resolved = resolveGenreSlug(slug);
  return categories.find((c) => c.slug === resolved) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = findCategory(slug);
  if (!cat) return {};
  return {
    title: `${cat.name} | Chợ Phim`,
    description: `Xem phim ${cat.name} online miễn phí Vietsub full HD tại Chợ Phim.`,
  };
}

export default async function TheLoaiPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const cat = findCategory(slug);
  if (!cat) notFound();
  const resolved = resolveGenreSlug(slug);

  return renderCategory({
    title: cat.name,
    basePath: `/the-loai/${slug}`,
    filter: (m) => (m.genreSlugs ?? []).includes(resolved),
    searchParams,
    emptyText: `Chưa có phim thể loại ${cat.name}.`,
  });
}
