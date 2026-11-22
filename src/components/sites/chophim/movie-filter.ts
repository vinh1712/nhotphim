// Bộ lọc / tìm kiếm / phân trang dùng chung cho các trang danh mục.
import type { MovieDetail } from "./detail-types";

export const PAGE_SIZE = 16;

/** Dữ liệu tối thiểu để vẽ 1 card poster (giữ payload tĩnh nhỏ) */
export type CardMovie = Pick<
  MovieDetail,
  "slug" | "title" | "origin" | "poster" | "backdrop" | "status" | "type" | "current" | "total"
>;

export function toCard(m: MovieDetail): CardMovie {
  return {
    slug: m.slug,
    title: m.title,
    origin: m.origin,
    poster: m.poster,
    backdrop: m.backdrop,
    status: m.status,
    type: m.type,
    current: m.current,
    total: m.total,
  };
}

/** Bỏ dấu tiếng Việt + thường hóa (để tìm kiếm "bac si" khớp "bác sĩ") */
export function stripVn(s: string): string {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d");
}

/** Sắp xếp mới nhất trước (createdAt giảm dần) */
export function newestFirst(list: MovieDetail[]): MovieDetail[] {
  return [...list].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

/** Tìm kiếm theo tên (không dấu) — khớp trên title + origin */
export function searchMovies<T extends { title: string; origin: string }>(all: T[], keyword: string): T[] {
  const q = stripVn(keyword).trim();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return all.filter((m) => {
    const hay = stripVn(`${m.title} ${m.origin}`);
    return terms.every((t) => hay.includes(t));
  });
}

/** Lấy 1 trang từ danh sách — trả về { items, totalPages, page } */
export function paginate<T>(list: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const p = Math.min(Math.max(1, page), totalPages);
  return { items: list.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE), totalPages, page: p, total: list.length };
}

/** Văn bản badge góc dưới (PĐ. 12TM. 12 / PĐ. Full / Sắp chiếu) */
export function bottomBadgeText(m: CardMovie): string {
  if (m.status === "Sắp chiếu") return "Sắp chiếu";
  if (m.type === "movie") return "PĐ. Full";
  if (m.current && m.total) return `PĐ. ${m.current}TM. ${m.total}`;
  if (m.current) return `PĐ. ${m.current}`;
  return "PĐ. Full";
}

/** Alias slug thể loại cũ (trang chủ) -> slug taxonomy hiện tại */
export const GENRE_ALIAS: Record<string, string> = {
  "khoa-hoc": "khoa-hoc-vt",
  "hoat-hinh": "anime-hoat-hinh",
  "lang-man": "tinh-cam",
};

export const resolveGenreSlug = (slug: string) => GENRE_ALIAS[slug] ?? slug;
