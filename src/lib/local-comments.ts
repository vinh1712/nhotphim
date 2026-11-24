import type { DetailComment } from "@/components/sites/chophim/detail-types";

export const LOCAL_COMMENTS_EVENT = "nhotphim:local-comments-change";
export const LOCAL_COMMENTS_PREFIX = "nhotphim:local-comments:";

export const localCommentsKey = (slug: string) => `${LOCAL_COMMENTS_PREFIX}${slug}`;

export function readLocalComments(slug: string): DetailComment[] {
  try {
    const raw = window.localStorage.getItem(localCommentsKey(slug));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as DetailComment[]) : [];
  } catch {
    return [];
  }
}

export function writeLocalComments(slug: string, list: DetailComment[]): boolean {
  try {
    window.localStorage.setItem(localCommentsKey(slug), JSON.stringify(list));
    return true;
  } catch {
    // Private mode / hết dung lượng: giữ nguyên danh sách đang có.
    return false;
  }
}

/** Mọi bình luận browser đã gửi, dùng để cập nhật "Bình Luận Mới" trên trang chủ. */
export function readAllLocalComments(): Array<{ slug: string; comment: DetailComment }> {
  const rows: Array<{ slug: string; comment: DetailComment }> = [];
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(LOCAL_COMMENTS_PREFIX)) continue;
      const slug = key.slice(LOCAL_COMMENTS_PREFIX.length);
      const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
      if (!Array.isArray(parsed)) continue;
      for (const comment of parsed as DetailComment[]) rows.push({ slug, comment });
    }
  } catch {
    /* storage không dùng được thì bỏ qua bình luận local */
  }
  return rows;
}
