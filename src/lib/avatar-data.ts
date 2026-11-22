import { withBasePath } from "./base-path";

/** Bộ ảnh/khung chụp từ chophim.wtf, tối ưu về webp để tải nhanh. */
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
  return withBasePath(`/avt_frames/frame_${index}.webp`);
}

export function allAvatarSrc(): string[] {
  return AVATAR_CATEGORIES.flatMap((cat) =>
    Array.from({ length: cat.count }, (_, i) => avatarSrc(cat.key, i + 1))
  );
}

export function allFrameSrc(): string[] {
  return Array.from({ length: AVATAR_FRAME_COUNT }, (_, i) => frameSrc(i + 1));
}
