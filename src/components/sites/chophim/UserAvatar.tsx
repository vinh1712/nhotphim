import { withBasePath } from "@/lib/base-path";

function asset(src?: string): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  return withBasePath(src);
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
  const frame = asset(frameUrl);
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

export function profileMeta(user: { user_metadata?: Record<string, unknown> } | null) {
  const meta = user?.user_metadata ?? {};
  return {
    displayName: String(meta.display_name ?? meta.full_name ?? ""),
    gender: String(meta.gender ?? ""),
    emoji: String(meta.chat_emoji ?? ""),
    avatarUrl: String(meta.avatar_url ?? ""),
    frameUrl: String(meta.avatar_frame ?? ""),
  };
}
