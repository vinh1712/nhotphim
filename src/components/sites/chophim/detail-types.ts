// Kiểu dữ liệu cho trang chi tiết /phim/[slug] — không import JSON
// để client component không bundle database vào browser.

export type Episode = { label: string; url: string | null };

export type MovieServer = { name: string; episodes: Episode[] };

export type MovieDetail = {
  slug: string;
  title: string;
  origin: string;
  poster: string;
  backdrop: string;
  logo: string | null;
  year: number | null;
  quality: string;
  lang: string;
  episodeLabel: string;
  status: string;
  current: number | null;
  total: number | null;
  type: "series" | "movie";
  genres: string[];
  countries: string[];
  rating: number | null;
  description: string;
  director: string | null;
  duration: string | null;
  trailer: string | null;
  source: string;
  /** Slug gốc trên phimapi.com để lấy thời lượng khi admin không nhập duration. */
  apiSlug?: string | null;
  /** Nhóm phim nhiều phần trong trang quản lí (cột series_group). */
  seriesGroup?: string | null;
  /** Thứ tự phần trong nhóm (cột part_number). */
  partNumber?: number | null;
  createdAt?: string;
  epstatus?: string | null;
  genreSlugs?: string[];
  countryCode?: string | null;
  countrySlug?: string | null;
  formatSlug?: string | null;
  movietypeSlug?: string;
  theater?: boolean;
  // Từ /api/skip-times của chophim.wtf — mỗi phim có độ dài intro khác nhau.
  introEnd?: number;
  outroStart?: number;
  servers: MovieServer[];
};

export type DetailComment = {
  id: string;
  pinned: boolean;
  admin: boolean;
  name: string;
  gender: "male" | "female" | null;
  time: string;
  content: string;
  likes: number;
  dislikes: number;
  avatar: string;
  frame: string | null;
  emoji: string | null;
  createdAt?: string;
  /** Bình luận gửi từ browser có userId để hiện nút xóa như chophim. */
  userId?: string;
  role?: string | null;
  subscriptionTier?: string | null;
};

/** Chophim luôn đưa bình luận được ghim lên đầu, sau đó mới đến Mới nhất / Nổi bật. */
export function sortComments(comments: DetailComment[], sort: "new" | "top"): DetailComment[] {
  return [...comments].sort((a, b) => {
    const pinned = Number(!!b.pinned) - Number(!!a.pinned);
    if (pinned !== 0) return pinned;
    if (sort === "top" && b.likes !== a.likes) return b.likes - a.likes;
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
}

export type Suggestion = {
  slug: string;
  title: string;
  poster: string;
  year: number | null;
  quality: string;
};

/** Encode giống query string của trang gốc (khoảng trắng thành +) */
export const enc = (s: string) => encodeURIComponent(s).replace(/%20/g, "+");
