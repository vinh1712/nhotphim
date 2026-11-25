/** Cấp tài khoản và mã kích hoạt lưu trong user_metadata.
 *  Đây là lớp giao diện local/static: mã đổi được quyền hiển thị huy hiệu,
 *  màu tên, vành avatar, tab Admin + các thao tác duyệt bình luận. */

export type SubscriptionTier = "free" | "vip" | "super-vip";

export function normalizeTier(value?: string | null): SubscriptionTier {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-");
  if (key === "vip" || key === "premium" || key === "svip") return "vip";
  if (key === "super-vip" || key === "supervip" || key === "siu-vip") return "super-vip";
  return "free";
}

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  vip: 1,
  "super-vip": 2,
};

export function tierRank(tier: SubscriptionTier): number {
  return TIER_RANK[tier];
}

export function isAdminRole(role?: string | null, tier?: string | null): boolean {
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase();
  return normalizedRole === "admin" || normalizeTier(tier) === "super-vip";
}

export const TIER_INFO: Record<
  SubscriptionTier,
  { label: string; badge: string; note: string; perks: string[] }
> = {
  free: {
    label: "Free",
    badge: "FREE",
    note: "Xem phim miễn phí, không quảng cáo, không cá độ.",
    perks: ["Xem phim không giới hạn", "Lưu yêu thích & xem tiếp", "Đồng bộ trên thiết bị", "Không quảng cáo"],
  },
  vip: {
    label: "VIP",
    badge: "VIP",
    note: "Ảnh và tên nổi bật hơn trong bình luận.",
    perks: ["Mọi quyền Free", "Huy hiệu VIP + tên gradient", "Vành avatar phát sáng", "Ưu tiên hiển thị bình luận"],
  },
  "super-vip": {
    label: "Super VIP",
    badge: "SUPER VIP",
    note: "Quản trị viên Nhót Phim — có tab Admin riêng.",
    perks: [
      "Mọi quyền VIP",
      "Huy hiệu ADMIN + SUPER VIP",
      "Mở tab quản trị",
      "Ghim / xóa bình luận",
      "Xóa bình luận của mọi người",
    ],
  },
};

type CodeReward = {
  tier: Exclude<SubscriptionTier, "free">;
  role: "user" | "admin";
  code: string;
};

const CODE_MAP: Record<string, CodeReward> = {
  VIP2026: { tier: "vip", role: "user", code: "VIP2026" },
  VIP: { tier: "vip", role: "user", code: "VIP2026" },
  NHOTVIP: { tier: "vip", role: "user", code: "VIP2026" },
  CHOPHIMVIP: { tier: "vip", role: "user", code: "VIP2026" },
  SVIP2026: { tier: "super-vip", role: "admin", code: "SVIP2026" },
  SVIP: { tier: "super-vip", role: "admin", code: "SVIP2026" },
  SIUVIP: { tier: "super-vip", role: "admin", code: "SVIP2026" },
  SUPERVIP: { tier: "super-vip", role: "admin", code: "SVIP2026" },
  ADMIN2026: { tier: "super-vip", role: "admin", code: "ADMIN2026" },
  ADMIN: { tier: "super-vip", role: "admin", code: "ADMIN2026" },
};

/** Chỉ liệt kê các mã chính để hiển thị ở trang Gói đăng ký. */
export const VISIBLE_REDEEM_CODES: CodeReward[] = [
  CODE_MAP.VIP2026,
  CODE_MAP.SVIP2026,
  CODE_MAP.ADMIN2026,
];

function normalizeCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[\s\-_.]+/g, "");
}

export function redeemCode(
  raw: string,
  currentTier: SubscriptionTier
): { ok: boolean; message: string; patch?: Record<string, string> } {
  const code = normalizeCode(raw);
  if (!code) return { ok: false, message: "Vui lòng nhập mã kích hoạt." };
  const reward = CODE_MAP[code];
  if (!reward) return { ok: false, message: "Mã không hợp lệ hoặc đã hết hạn." };
  if (tierRank(reward.tier) <= tierRank(currentTier)) {
    return { ok: false, message: `Tài khoản đang ở cấp ${TIER_INFO[currentTier].label} trở lên.` };
  }
  return {
    ok: true,
    message: `Đã kích hoạt ${TIER_INFO[reward.tier].label} bằng mã ${reward.code}.`,
    patch: {
      subscription_tier: reward.tier,
      tier: reward.tier,
      role: reward.role,
      vip_code: reward.code,
    },
  };
}
