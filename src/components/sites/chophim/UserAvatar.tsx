import { withBasePath } from "@/lib/base-path";

function asset(src?: string): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  return withBasePath(src);
}

/** Khung có thể lưu dưới dạng tên file (chophim) hoặc đường dẫn đầy đủ (repo quản lí). */
function frameAsset(src?: string): string | undefined {
  if (!src) return undefined;
  if (/^(?:https?:\/\/|data:|blob:)/i.test(src) || src.startsWith("/")) return withBasePath(src);
  return withBasePath(`/avt_frames/${src}`);
}

/** Avatar dùng chung: header, mobile menu, trang tài khoản.
 *  Ảnh và khung được lưu trong user_metadata của Supabase Auth. */
export function UserAvatar({
  name,
  email,
  avatarUrl,
  frameUrl,
  emoji,
  size = 44,
  className = "",
}: {
  name?: string;
  email?: string;
  avatarUrl?: string;
  frameUrl?: string;
  emoji?: string;
  size?: number;
  className?: string;
}) {
  const src = asset(avatarUrl);
  const frame = frameAsset(frameUrl);
  const label = (name || email || "N").trim().charAt(0).toUpperCase() || "N";
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFD166]/15 text-[#FFD166] ring-1 ring-[#FFD166]/30 ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" src={src} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="font-bold leading-none">{emoji || label}</span>
      )}
      {frame ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" src={frame} className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain" />
      ) : null}
    </span>
  );
}

export function profileMeta(
  user: {
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  } | null
) {
  const meta = user?.user_metadata ?? {};
  const app = user?.app_metadata ?? {};
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "");
  // Chophim đọc user từ AuthProvider (camelCase); repo quản lí lưu user_metadata
  // (snake_case). Nhận cả hai để comment/avatar hiển thị giống bản gốc.
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = str(meta[key]) || str(app[key]);
      if (value) return value;
    }
    return "";
  };

  const avatarFrame = pick("avatarFrame", "avatar_frame");
  const legacyFrameUrl = pick("frameUrl", "frame_url");
  const emoji = pick("selectedEmoji", "selected_emoji", "chat_emoji");

  return {
    displayName: pick("displayName", "display_name", "full_name", "name"),
    gender: pick("gender"),
    emoji,
    avatarUrl: pick("avatarUrl", "avatar_url"),
    frameUrl: frameAsset(avatarFrame || legacyFrameUrl),
    avatarFrame,
    role: pick("role"),
    subscriptionTier: pick("subscriptionTier", "subscription_tier", "tier"),
    selectedEmoji: pick("selectedEmoji", "selected_emoji"),
  };
}
