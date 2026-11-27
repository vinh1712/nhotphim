// Kiểu dữ liệu cho trang chi tiết /phim/[slug] — không import JSON
// để client component không bundle database vào browser.

export type Episode = { label: string; url: string | null };

export type MovieServer = { name: string; episodes: Episode[] };

/** Chỉ tập có URL mới là tập xem được. Admin giữ cả dòng trống để căn SV1/SV2/SV3,
 *  nên không được đếm `episodes.length` khi hiển thị số tập của từng server. */
export function playableEpisodes(server: MovieServer | null | undefined): Array<{ index: number; episode: Episode }> {
  return (server?.episodes ?? [])
    .map((episode, index) => ({ index, episode }))
    .filter(({ episode }) => !!episode.url);
}

export function playableCount(server: MovieServer | null | undefined): number {
  return playableEpisodes(server).length;
}

/** Chỉ số thật trong `episodes` — giữ nguyên để hash `#tap=` và tiến trình không đổi. */
export function nearestPlayableIndex(server: MovieServer | null | undefined, index: number): number {
  const episodes = server?.episodes ?? [];
  if (!episodes.length) return 0;
  if (episodes[index]?.url) return index;

  const from = Math.min(Math.max(index, 0), episodes.length - 1);
  for (let i = from; i >= 0; i--) if (episodes[i]?.url) return i;
  for (let i = from + 1; i < episodes.length; i++) if (episodes[i]?.url) return i;
  return 0;
}

export function nextPlayableIndex(server: MovieServer | null | undefined, index: number): number {
  const episodes = server?.episodes ?? [];
  for (let i = index + 1; i < episodes.length; i++) if (episodes[i]?.url) return i;
  return -1;
}

/** Số tập hiển thị cho server đang chọn: current không vượt quá số tập có link. */
export function serverEpisodeProgress(
  movie: MovieDetail,
  server: MovieServer | null | undefined
): { current: number; total: number } {
  const total = playableCount(server);
  if (!total) return { current: 0, total: 0 };
  const current = Math.min(Math.max(movie.current ?? total, 0), total);
  return { current, total };
}

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
  /** Ảnh tĩnh từng tập (TMDB still) lấy sẵn lúc sync: key = số tập. */
  episodeStills: Record<string, string> | null;
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
  /** id row trong bảng movies — dùng để tải đúng 1 dòng cho phim mới. */
  id?: number | string;
  imdbId?: string | null;
  views?: number;
  likes?: number;
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
  /** Reply nằm dưới bình luận gốc; id luôn là string kể cả dữ liệu DB trả số. */
  parentId?: string | null;
  replyToName?: string | null;
};

/** So thời gian thật, không so chuỗi: local dùng `...Z`, DB dùng `...+00:00`. */
export function commentTimestamp(c: { createdAt?: string }): number {
  const value = Date.parse(String(c.createdAt || ""));
  return Number.isFinite(value) ? value : 0;
}

/** Chophim luôn đưa bình luận được ghim lên đầu, sau đó mới đến Mới nhất / Nổi bật. */
export function sortComments(comments: DetailComment[], sort: "new" | "top"): DetailComment[] {
  return [...comments].sort((a, b) => {
    const pinned = Number(!!b.pinned) - Number(!!a.pinned);
    if (pinned !== 0) return pinned;
    if (sort === "top" && b.likes !== a.likes) return b.likes - a.likes;
    return commentTimestamp(b) - commentTimestamp(a);
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
