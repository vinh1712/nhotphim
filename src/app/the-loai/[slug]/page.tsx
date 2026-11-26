import { withBasePath } from "@/lib/base-path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { renderCategory } from "@/components/sites/chophim/category-route";
import { resolveGenreSlug } from "@/components/sites/chophim/movie-filter";
import { taxonomiesData } from "@/data";

type Taxonomy = { type: string; slug: string; name: string };
const taxonomies = taxonomiesData as unknown as Taxonomy[];
const categories = taxonomies.filter((t) => t.type === "category");

/** Slug thể loại cũ (vẫn giữ đường dẫn hoạt động) → taxonomy chuẩn hiện tại */
const ALIASES: Record<string, string> = {
  "khoa-hoc-vt": "khoa-hoc",
  "anime-hoat-hinh": "hoat-hinh",
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
    title: `${cat.name}`,
    description: `Xem phim ${cat.name} online miễn phí Vietsub full HD tại NhótPhim.`,
  };
}

export default async function TheLoaiPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const cat = findCategory(slug);
  if (!cat) notFound();
  const resolved = resolveGenreSlug(slug);

  return renderCategory({
    title: cat.name,
    basePath: withBasePath(`/the-loai/${slug}`),
    filter: (m) => (m.genreSlugs ?? []).includes(resolved),
    emptyText: `Chưa có phim thể loại ${cat.name}.`,
  });
}
