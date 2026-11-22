// Bộ lọc / tìm kiếm / phân trang dùng chung cho các trang danh mục.
import type { MovieDetail } from "./detail-types";

export const PAGE_SIZE = 16;

/** Dữ liệu tối thiểu để vẽ 1 card poster (giữ payload tĩnh nhỏ) */
export type CardMovie = Pick<
  MovieDetail,
  | "slug"
  | "title"
  | "origin"
  | "poster"
  | "backdrop"
  | "status"
  | "type"
  | "current"
  | "total"
  | "year"
  | "genres"
  | "countries"
  | "genreSlugs"
  | "countrySlug"
  | "rating"
  | "createdAt"
  | "lang"
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
    year: m.year,
    genres: m.genres,
    countries: m.countries,
    genreSlugs: m.genreSlugs,
    countrySlug: m.countrySlug,
    rating: m.rating,
    createdAt: m.createdAt,
    lang: m.lang,
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

/* ── Bộ lọc dùng chung cho trang danh mục / tìm kiếm ───────────────────── */
/* Danh sách lấy nguyên từ trang chophim.wtf để khớp giao diện + hành vi. */

export type MovieFilters = {
  country: string;
  type: string;
  /** chophim.wtf cho chọn tối đa 5 thể loại */
  genres: string[];
  lang: string;
  year: string;
  sort: "new" | "updated";
};

export const EMPTY_FILTERS: MovieFilters = {
  country: "",
  type: "",
  genres: [],
  lang: "",
  year: "",
  sort: "new",
};

export const FILTER_GROUPS = {
  countries: [
    "Trung Quốc", "Hàn Quốc", "Nhật Bản", "Thái Lan", "Âu Mỹ", "Đài Loan", "Hồng Kông", "Ấn Độ",
    "Anh", "Pháp", "Canada", "Việt Nam", "Nga", "Philippines", "Úc", "Đức", "Tây Ban Nha", "Ý",
    "Thổ Nhĩ Kỳ", "Indonesia", "Malaysia", "Brazil", "Hà Lan",
  ],
  types: ["Phim lẻ", "Phim bộ"],
  genres: [
    "Hành Động", "Tình Cảm", "Hài Hước", "Cổ Trang", "Tâm Lý", "Hình Sự", "Chiến Tranh", "Thể Thao",
    "Võ Thuật", "Viễn Tưởng", "Phiêu Lưu", "Khoa Học", "Tài Liệu", "Kinh Dị", "Chính Kịch", "Bí Ẩn",
    "Hoạt Hình", "Gia Đình", "Âm Nhạc", "Học Đường", "Lãng Mạn",
  ],
  langs: ["Phụ đề", "Thuyết minh", "Lồng tiếng"],
  years: ["2026", "2025", "2024", "2023", "2022", "2021", "2020"],
  sorts: [
    { value: "new", label: "Mới nhất" },
    { value: "updated", label: "Mới cập nhật" },
  ],
} as const;

/** slug → tên hiển thị; genres/genreSlugs và countries/countrySlug là các cặp song song trong movies.json */
function nameMaps(movies: CardMovie[]) {
  const genres = new Map<string, string>();
  const countries = new Map<string, string>();
  for (const m of movies) {
    (m.genreSlugs ?? []).forEach((slug, i) => {
      const name = m.genres?.[i];
      if (slug && name) genres.set(slug, name);
    });
    if (m.countrySlug && m.countries?.[0]) countries.set(m.countrySlug, m.countries[0]);
  }
  return { genres, countries };
}

function matchesLang(lang: string, filter: string): boolean {
  const value = String(lang ?? "");
  if (filter === "Phụ đề") return /Vietsub|Phụ đề/i.test(value);
  if (filter === "Thuyết minh") return /Thuyết minh/i.test(value);
  if (filter === "Lồng tiếng") return /Lồng tiếng/i.test(value);
  return true;
}

export function applyFilters<T extends CardMovie>(movies: T[], f: MovieFilters): T[] {
  const names = nameMaps(movies);
  const result = movies.filter((m) => {
    if (f.country) {
      const byName = (m.countries ?? []).includes(f.country);
      const bySlug = names.countries.get(m.countrySlug ?? "") === f.country;
      if (!byName && !bySlug) return false;
    }
    if (f.type) {
      const label = m.type === "movie" ? "Phim lẻ" : "Phim bộ";
      if (label !== f.type) return false;
    }
    if (f.genres.length > 0) {
      const matchesGenre = f.genres.some((genre) => {
        const byName = (m.genres ?? []).includes(genre);
        const bySlug = (m.genreSlugs ?? []).some((slug) => names.genres.get(slug) === genre);
        return byName || bySlug;
      });
      if (!matchesGenre) return false;
    }
    if (f.lang && !matchesLang(m.lang, f.lang)) return false;
    if (f.year && String(m.year ?? "") !== f.year) return false;
    return true;
  });

  if (f.sort === "updated") {
    result.sort(
      (a, b) =>
        Number(b.current ?? 0) - Number(a.current ?? 0) ||
        String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))
    );
  } else {
    result.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  }
  return result;
}
