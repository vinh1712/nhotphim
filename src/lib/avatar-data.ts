import { withBasePath } from "./base-path";

/** Bộ ảnh/khung chụp từ chophim.fit. Khung là APNG có chuyển động như bản gốc. */
export const AVATAR_CATEGORIES: { key: string; label: string; count: number }[] = [
  { key: "hoat-hinh", label: "Hoạt hình", count: 39 },
  { key: "meme", label: "Meme", count: 8 },
  { key: "trung-quoc", label: "Trung Quốc", count: 16 },
  { key: "han-quoc", label: "Hàn Quốc", count: 15 },
  { key: "au-my", label: "Âu Mỹ", count: 15 },
  { key: "viet-nam", label: "Việt Nam", count: 16 },
];

export const AVATAR_FRAME_COUNT = 45;

export function avatarSrc(category: string, index: number): string {
  return withBasePath(`/avatars/${category}/${String(index).padStart(2, "0")}.webp`);
}

export function frameSrc(index: number): string {
  return withBasePath(`/avt_frames/frame_${index}.png`);
}

/** Chophim lưu khung dưới dạng `frame_N.png`; bản repo cũ từng lưu `.webp`. */
export function normalizeFrameSrc(src?: string): string | undefined {
  if (!src) return undefined;
  const value = src.trim();
  if (!value || /^(?:https?:\/\/|data:|blob:)/i.test(value)) return value || undefined;
  return value.replace(/^(.*\/)?(frame_\d+)\.webp$/i, "$1$2.png");
}

/** Đưa cả tên file lẫn đường dẫn cũ về APNG có hiệu ứng, giữ nguyên link ngoài. */
export function frameAssetSrc(src?: string): string | undefined {
  const value = normalizeFrameSrc(src);
  if (!value) return undefined;
  if (/^(?:https?:\/\/|data:|blob:)/i.test(value)) return value;
  return withBasePath(value.startsWith("/") ? value : `/avt_frames/${value}`);
}

export function allAvatarSrc(): string[] {
  return AVATAR_CATEGORIES.flatMap((cat) =>
    Array.from({ length: cat.count }, (_, i) => avatarSrc(cat.key, i + 1))
  );
}

export function allFrameSrc(): string[] {
  return Array.from({ length: AVATAR_FRAME_COUNT }, (_, i) => frameSrc(i + 1));
}

/** Chỉ nhận link ảnh tuyệt đối để lưu vào user_metadata; chặn javascript:, data:... */
export function normalizeExternalImageUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    /* không phải link hợp lệ */
  }
  return "";
}
