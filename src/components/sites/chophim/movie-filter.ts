// Bộ lọc / tìm kiếm / phân trang dùng chung cho các trang danh mục.
import { taxonomiesData } from "@/data";
import type { MovieDetail } from "./detail-types";

export const PAGE_SIZE = 16;

/** Badge góc trên dùng chung cho phim có nguồn Song Ngữ (server VP). */
export const SONG_NGU_BADGE_CLS =
  "pointer-events-none absolute right-1.5 top-1.5 z-40 flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[9px] font-bold text-[#141414] shadow-sm md:right-2 md:top-2 md:text-[10px]";

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
  | "director"
> & {
  /** Badge đi theo phim, không phụ thuộc vào trang/section đang hiển thị. */
  topBadge?: string;
};

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
    director: m.director,
    topBadge: hasVpSource(m) ? "Song Ngữ" : undefined,
  };
}

/** Bộ lọc dữ liệu live được phép truyền qua ranh giới Server/Client. */
export type CategoryLiveFilter = "vp";

/** Phim có nguồn Server VP (SV3 / VodPhim trong trang quản lý). */
export function hasVpSource(m: Pick<MovieDetail, "servers">): boolean {
  return (m.servers || []).some(
    (server) => /\(VP\)|VodPhim/i.test(server.name) && (server.episodes || []).some((ep) => !!ep.url)
  );
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

/** Alias slug thể loại cũ (đường dẫn cũ) -> slug taxonomy chuẩn hiện tại.
 *  Từ khi đồng bộ danh mục với web, "khoa-hoc" / "hoat-hinh" / "lang-man" là slug thật. */
export const GENRE_ALIAS: Record<string, string> = {
  "khoa-hoc-vt": "khoa-hoc",
  "anime-hoat-hinh": "hoat-hinh",
};

export const resolveGenreSlug = (slug: string) => GENRE_ALIAS[slug] ?? slug;

/* ── Ánh xạ slug/tên query params như chophim.wtf ──────────────────────── */
type Taxonomy = { type: string; name: string; slug: string };
const taxonomies = taxonomiesData as unknown as Taxonomy[];

function taxonomyName(type: string, slug: string): string {
  return taxonomies.find((t) => t.type === type && t.slug === slug)?.name ?? slug;
}

function taxonomySlug(type: string, name: string): string {
  const found = taxonomies.find((t) => t.type === type && t.name === name)?.slug;
  if (found) return found;
  return stripVn(name).replace(/\s+/g, "-");
}

export const countryNameFromSlug = (slug: string) => taxonomyName("country", slug);
export const countrySlugFromName = (name: string) => taxonomySlug("country", name);
export const genreNameFromSlug = (slug: string) => taxonomyName("category", resolveGenreSlug(slug));
export const genreSlugFromName = (name: string) => taxonomySlug("category", name);

/** Slug dùng trong DB đang lệch với slug source ở 2 thể loại (xem GENRE_ALIAS). */
export function sourceGenreSlug(slug: string): string {
  if (slug === "khoa-hoc-vt") return "khoa-hoc";
  if (slug === "anime-hoat-hinh") return "hoat-hinh";
  return slug;
}

export const LANGUAGE_OPTIONS = [
  { label: "Tất cả", value: "" },
  { label: "Phụ đề", value: "PD" },
  { label: "Thuyết minh", value: "TM" },
  { label: "Lồng tiếng", value: "LT" },
] as const;

export function languageLabel(value: string): string {
  return LANGUAGE_OPTIONS.find((o) => o.value === value)?.label ?? "Tất cả";
}

export function languageValue(label: string): string {
  return LANGUAGE_OPTIONS.find((o) => o.label === label)?.value ?? "";
}

export type SortFilter = "new" | "updated";
export const sortQueryValue = (sort: SortFilter) => (sort === "updated" ? "mới cập nhật" : "mới nhất");
export const sortFromQuery = (value: string | null): SortFilter =>
  value === "updated" || stripVn(value ?? "").includes("cap nhat") ? "updated" : "new";

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

/** Bộ lọc cố định của route (giống prop `lockedFilters` trong source). */
export function lockedFiltersFromPath(pathname: string): Partial<MovieFilters> {
  const p = pathname.replace(/\/$/, "") || "/";
  if (p.startsWith("/quoc-gia/")) return { country: p.split("/").pop() ?? "" };
  if (p === "/phim-le") return { type: "phim lẻ" };
  if (p === "/phim-bo" || p === "/tv-shows") return { type: "phim bộ" };
  if (p.startsWith("/the-loai/")) return { genres: [p.split("/").pop() ?? ""] };
  if (p === "/hoat-hinh") return { genres: ["hoat-hinh"] };
  return {};
}

/** Đọc query params theo đúng tên/source: country, type, genre, language, year, sort. */
export function filtersFromParams(params: URLSearchParams, locked: Partial<MovieFilters> = {}): MovieFilters {
  const genres = locked.genres?.length
    ? locked.genres
    : (params.get("genre") ?? "").split(",").filter(Boolean).slice(0, 5);
  return {
    country: locked.country || params.get("country") || "",
    type: locked.type || params.get("type") || "",
    genres,
    lang: params.get("language") || "",
    year: params.get("year") || "",
    sort: sortFromQuery(params.get("sort")),
  };
}

/** Copy nguyên COUNTRIES/GENRES từ source-044bbf185c899afc.js để khớp pill + query. */
export const FILTER_GROUPS = {
  countries: [
    { value: "trung-quoc", label: "Trung Quốc" },
    { value: "han-quoc", label: "Hàn Quốc" },
    { value: "nhat-ban", label: "Nhật Bản" },
    { value: "thai-lan", label: "Thái Lan" },
    { value: "au-my", label: "Âu Mỹ" },
    { value: "dai-loan", label: "Đài Loan" },
    { value: "hong-kong", label: "Hồng Kông" },
    { value: "an-do", label: "Ấn Độ" },
    { value: "anh", label: "Anh" },
    { value: "phap", label: "Pháp" },
    { value: "canada", label: "Canada" },
    { value: "viet-nam", label: "Việt Nam" },
    { value: "nga", label: "Nga" },
    { value: "philippines", label: "Philippines" },
    { value: "uc", label: "Úc" },
    { value: "duc", label: "Đức" },
    { value: "tay-ban-nha", label: "Tây Ban Nha" },
    { value: "y", label: "Ý" },
    { value: "tho-nhi-ky", label: "Thổ Nhĩ Kỳ" },
    { value: "indonesia", label: "Indonesia" },
    { value: "malaysia", label: "Malaysia" },
    { value: "brazil", label: "Brazil" },
    { value: "ha-lan", label: "Hà Lan" },
  ],
  types: [
    { value: "phim lẻ", label: "Phim lẻ" },
    { value: "phim bộ", label: "Phim bộ" },
  ],
  genres: [
    { value: "hanh-dong", label: "Hành Động" },
    { value: "tinh-cam", label: "Tình Cảm" },
    { value: "hai-huoc", label: "Hài Hước" },
    { value: "co-trang", label: "Cổ Trang" },
    { value: "tam-ly", label: "Tâm Lý" },
    { value: "hinh-su", label: "Hình Sự" },
    { value: "chien-tranh", label: "Chiến Tranh" },
    { value: "the-thao", label: "Thể Thao" },
    { value: "vo-thuat", label: "Võ Thuật" },
    { value: "vien-tuong", label: "Viễn Tưởng" },
    { value: "phieu-luu", label: "Phiêu Lưu" },
    { value: "khoa-hoc", label: "Khoa Học" },
    { value: "tai-lieu", label: "Tài Liệu" },
    { value: "kinh-di", label: "Kinh Dị" },
    { value: "chinh-kich", label: "Chính Kịch" },
    { value: "bi-an", label: "Bí Ẩn" },
    { value: "hoat-hinh", label: "Hoạt Hình" },
    { value: "gia-dinh", label: "Gia Đình" },
    { value: "am-nhac", label: "Âm Nhạc" },
    { value: "hoc-duong", label: "Học Đường" },
    { value: "lang-man", label: "Lãng Mạn" },
  ],
  langs: [
    { value: "PD", label: "Phụ đề" },
    { value: "TM", label: "Thuyết minh" },
    { value: "LT", label: "Lồng tiếng" },
  ],
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
  const countryLabel = f.country ? countryNameFromSlug(f.country) : "";
  const genreFilters = f.genres.map((genre) => ({
    raw: genre,
    slug: resolveGenreSlug(genre),
    label: genreNameFromSlug(genre),
  }));
  const langFilter =
    f.lang && LANGUAGE_OPTIONS.some((o) => o.value === f.lang) ? languageLabel(f.lang) : f.lang;

  const result = movies.filter((m) => {
    if (f.country) {
      const byName =
        (m.countries ?? []).includes(countryLabel) || (m.countries ?? []).includes(f.country);
      const bySlug =
        m.countrySlug === f.country || names.countries.get(m.countrySlug ?? "") === countryLabel;
      if (!byName && !bySlug) return false;
    }
    if (f.type) {
      const label = m.type === "movie" ? "Phim lẻ" : "Phim bộ";
      const normalized = f.type === "movie" ? "Phim lẻ" : f.type === "series" ? "Phim bộ" : f.type;
      // Query source dùng "phim lẻ"/"phim bộ" (thường + không dấu), label DB viết hoa.
      if (stripVn(label) !== stripVn(normalized)) return false;
    }
    if (genreFilters.length > 0) {
      const matchesGenre = genreFilters.some(({ raw, slug, label }) =>
        (m.genreSlugs ?? []).includes(slug) ||
        (m.genreSlugs ?? []).includes(raw) ||
        (m.genres ?? []).includes(label) ||
        (m.genres ?? []).includes(raw) ||
        (m.genreSlugs ?? []).some((s) => names.genres.get(s) === label) ||
        (m.genreSlugs ?? []).some((s) => names.genres.get(s) === raw)
      );
      if (!matchesGenre) return false;
    }
    if (f.lang && !matchesLang(m.lang, langFilter)) return false;
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
