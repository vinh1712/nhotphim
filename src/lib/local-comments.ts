import type { DetailComment } from "@/components/sites/chophim/detail-types";

export const LOCAL_COMMENTS_EVENT = "nhotphim:local-comments-change";
export const LOCAL_COMMENTS_PREFIX = "nhotphim:local-comments:";
export const HIDDEN_COMMENTS_KEY = "nhotphim:hidden-comments:v1";
export const PINNED_COMMENTS_KEY = "nhotphim:pinned-comments:v1";

export const localCommentsKey = (slug: string) => `${LOCAL_COMMENTS_PREFIX}${slug}`;

/** Admin ghim bình luận — dùng chung cho comment local và comment tĩnh từ DB. */
export function readPinnedCommentIds(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PINNED_COMMENTS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function togglePinnedComment(id: string): string[] {
  const key = String(id);
  const ids = readPinnedCommentIds();
  const next = ids.includes(key) ? ids.filter((x) => x !== key) : [...ids, key];
  try {
    window.localStorage.setItem(PINNED_COMMENTS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(LOCAL_COMMENTS_EVENT));
  } catch {
    /* private mode — vẫn trả về trạng thái mới cho UI */
  }
  return next;
}

/** Admin ẩn bình luận (kể cả bình luận tĩnh từ DB) — chỉ trên thiết bị này. */
export function readHiddenCommentIds(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HIDDEN_COMMENTS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeHiddenCommentIds(ids: string[]): boolean {
  try {
    window.localStorage.setItem(HIDDEN_COMMENTS_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(LOCAL_COMMENTS_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function hideComment(id: string): boolean {
  const key = String(id);
  const ids = readHiddenCommentIds();
  if (ids.includes(key)) return true;
  return writeHiddenCommentIds([...ids, key]);
}

export function unhideComment(id: string): boolean {
  return writeHiddenCommentIds(readHiddenCommentIds().filter((x) => x !== String(id)));
}

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
