"use client";

import { useState, type CSSProperties } from "react";
import { withBasePath } from "@/lib/base-path";
import { frameAssetSrc } from "@/lib/avatar-data";

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
  frameScale,
  sizeClassName = "",
  className = "",
}: {
  name?: string;
  email?: string;
  avatarUrl?: string;
  frameUrl?: string;
  emoji?: string;
  size?: number;
  frameScale?: number;
  sizeClassName?: string;
  className?: string;
}) {
  const [failedAvatar, setFailedAvatar] = useState<string | undefined>();
  const [failedFrame, setFailedFrame] = useState<string | undefined>();

  const src = asset(avatarUrl);
  const frame = frameAssetSrc(frameUrl);
  const label = (name || email || "N").trim().charAt(0).toUpperCase() || "N";
  const showAvatar = Boolean(src) && failedAvatar !== src;
  const showFrame = Boolean(frame) && failedFrame !== frame;
  // Chophim bọc avatar bằng ring trắng 1px + đệm 2px; khung scale 1.25 tính
  // theo lớp bọc đó nên to hơn 4px so với avatar bên trong.
  const customSize = Boolean(sizeClassName);
  const style = {
    width: customSize ? undefined : size + 4,
    height: customSize ? undefined : size + 4,
    fontSize: Math.round(size * 0.4),
    ...(frameScale !== undefined ? { "--avatar-frame-scale": String(frameScale) } : {}),
  } as CSSProperties;

  const avatarContent = showAvatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      src={src}
      onError={() => {
        if (src) setFailedAvatar(src);
      }}
      className="absolute inset-0 h-full w-full object-cover"
    />
  ) : (
    <span className="font-bold leading-none">{emoji || label}</span>
  );

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${sizeClassName} ${className}`}
      style={style}
    >
      {customSize ? (
        // Ô bình luận giữ kích thước avatar riêng theo yêu cầu, chỉ đổi màu ring.
        <span className="relative inline-flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#FFD166] text-[#1c1c1c] ring-1 ring-white/15 transition-colors">
          {avatarContent}
        </span>
      ) : (
        <span className="relative inline-flex shrink-0 items-center justify-center rounded-full p-[2px] ring-1 ring-white/15 transition-colors group-hover:ring-white">
          <span
            className="relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#FFD166] text-[#1c1c1c]"
            style={{ width: size, height: size }}
          >
            {avatarContent}
          </span>
        </span>
      )}
      {showFrame ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          src={frame}
          onError={() => {
            if (frame) setFailedFrame(frame);
          }}
          className="avatar-frame pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
        />
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
    frameUrl: frameAssetSrc(avatarFrame || legacyFrameUrl),
    avatarFrame,
    role: pick("role"),
    subscriptionTier: pick("subscriptionTier", "subscription_tier", "tier"),
    selectedEmoji: pick("selectedEmoji", "selected_emoji"),
  };
}
