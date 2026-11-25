"use client";

import { useEffect, useState } from "react";
import { signOut, updateProfile, useAuthSession } from "@/lib/auth";
import { withBasePath } from "@/lib/base-path";
import {
  LOCAL_COMMENTS_EVENT,
  readAllLocalComments,
  readHiddenCommentIds,
  readLocalComments,
  unhideComment,
  writeLocalComments,
} from "@/lib/local-comments";
import { detailHref, watchHref } from "@/lib/live-data";
import {
  isAdminRole,
  normalizeTier,
  redeemCode,
  TIER_INFO,
  VISIBLE_REDEEM_CODES,
  type SubscriptionTier,
} from "@/lib/subscription";
import { ACCOUNT_TABS, getAccountTab, type AccountTab, type AccountTabInfo } from "@/lib/account-tabs";
import { useUserLibrary, type LibraryEntry, type ProgressEntry } from "@/lib/user-library";
import { timeAgo, useNotifications } from "@/lib/notifications";
import {
  AVATAR_CATEGORIES,
  allFrameSrc,
  avatarSrc,
  frameAssetSrc,
  normalizeExternalImageUrl,
} from "@/lib/avatar-data";
import { UserAvatar, profileMeta } from "./UserAvatar";

const INVALIDATE = "Nhót Phim";

const svgProps = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function Icon({ name, className = "" }: { name: AccountTabInfo["icon"]; className?: string }) {
  if (name === "crown")
    return (
      <svg {...svgProps} className={className}>
        <path d="M2 7.5 6.5 11 12 4l5.5 7L22 7.5 20 18H4L2 7.5Z" />
        <path d="M4 21h16" />
      </svg>
    );
  if (name === "heart")
    return (
      <svg {...svgProps} className={className}>
        <path d="M20.8 5.6a5.4 5.4 0 0 0-7.6 0L12 6.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 22l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
      </svg>
    );
  if (name === "list")
    return (
      <svg {...svgProps} className={className}>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    );
  if (name === "history")
    return (
      <svg {...svgProps} className={className}>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </svg>
    );
  if (name === "tv")
    return (
      <svg {...svgProps} className={className}>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="m17 2-5 5-5-5" />
      </svg>
    );
  if (name === "bell")
    return (
      <svg {...svgProps} className={className}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </svg>
    );
  if (name === "shield")
    return (
      <svg {...svgProps} className={className}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  return (
    <svg {...svgProps} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function Avatar({
  name,
  emoji,
  avatarUrl,
  frameUrl,
  size = 44,
}: {
  name: string;
  emoji?: string;
  avatarUrl?: string;
  frameUrl?: string;
  size?: number;
}) {
  return <UserAvatar name={name} emoji={emoji} avatarUrl={avatarUrl} frameUrl={frameUrl} size={size} />;
}

/** Định dạng thời gian giống chophim: 1h 12m / 2h 52m. */
function fmtWatchTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0m";
  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  return hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`;
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#191b24]/80 px-6 py-20 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-text-muted">
        <Icon name="list" className="h-7 w-7" />
      </span>
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-[13px] text-white/50">{hint}</p>
      <a
        href={withBasePath("/")}
        className="mt-6 rounded-full bg-[#FFD166] px-5 py-2.5 text-[13px] font-bold text-[#171a26] transition-opacity hover:opacity-85"
      >
        Khám phá phim
      </a>
    </div>
  );
}

function PosterTile({
  item,
  meta,
  onRemove,
  removeLabel,
}: {
  item: LibraryEntry | ProgressEntry;
  meta?: string;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className="group relative">
      <a className="block" href={detailHref(item.slug)}>
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-bg-card ring-1 ring-white/5">
          <svg className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
          </svg>
          {item.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={item.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              src={item.poster}
            />
          ) : null}
        </div>
        <p className="mt-2 truncate text-[12px] font-semibold text-text-primary group-hover:text-[#FFD166] sm:text-[13px]">{item.title}</p>
        <p className="mt-0.5 truncate text-[10px] text-text-muted sm:text-[11px]">{meta || item.origin || "Nhót Phim"}</p>
      </a>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        title={removeLabel}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white/80 opacity-0 backdrop-blur-sm transition-opacity hover:bg-[#e50914] hover:text-white group-hover:opacity-100 focus:opacity-100"
      >
        <svg {...svgProps} className="h-4 w-4">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function ProfilePanel({
  displayName,
  setDisplayName,
  gender,
  setGender,
  emoji,
  setEmoji,
  email,
  avatarUrl,
  frameUrl,
  onPickAvatar,
  onPickFrame,
  busy,
  message,
  onSubmit,
}: {
  displayName: string;
  setDisplayName: (value: string) => void;
  gender: string;
  setGender: (value: string) => void;
  emoji: string;
  setEmoji: (value: string) => void;
  email: string;
  avatarUrl: string;
  frameUrl: string;
  onPickAvatar: (src: string) => void;
  onPickFrame: (src: string) => void;
  busy: boolean;
  message: string;
  onSubmit: () => void;
}) {
  const emojis = ["🐻", "🔥", "🎮", "⚡", "🎀", "🦋", "💛", "🕊️"];
  const [picker, setPicker] = useState<"avatar" | "frame" | null>(null);
  const [category, setCategory] = useState(AVATAR_CATEGORIES[0].key);
  const [customAvatar, setCustomAvatar] = useState("");
  const [customAvatarError, setCustomAvatarError] = useState("");

  useEffect(() => {
    setCustomAvatar(/^https?:\/\//i.test(avatarUrl) ? avatarUrl : "");
    setCustomAvatarError("");
  }, [avatarUrl]);

  const applyCustomAvatar = () => {
    const url = normalizeExternalImageUrl(customAvatar);
    if (!url) {
      setCustomAvatarError("Nhập link ảnh http:// hoặc https:// hợp lệ.");
      return;
    }
    setCustomAvatarError("");
    onPickAvatar(url);
    setPicker(null);
  };

  const modal = picker ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => setPicker(null)}>
      <div
        className="flex max-h-[86vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl bg-[#191b24]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-white">
              {picker === "avatar" ? "Chọn ảnh đại diện" : "Chọn khung avatar"}
            </p>
            {picker === "frame" ? <p className="mt-1 text-[12px] text-white/50">Tất cả khung đều miễn phí</p> : null}
          </div>
          <button
            type="button"
            onClick={() => setPicker(null)}
            aria-label="Đóng"
            className="shrink-0 text-white/60 hover:text-white"
          >
            <svg {...svgProps} className="h-5 w-5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        {picker === "avatar" ? (
          <>
            <div className="shrink-0 border-b border-white/5 px-5 py-3">
              <label className="block">
                <span className="mb-2 block text-[12px] text-white/50">Ảnh từ link</span>
                <div className="flex gap-2">
                  <input
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    value={customAvatar}
                    onChange={(event) => {
                      setCustomAvatar(event.target.value);
                      setCustomAvatarError("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applyCustomAvatar();
                      }
                    }}
                    placeholder="https://example.com/avatar.png"
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-[#FFD166]/60"
                  />
                  <button
                    type="button"
                    onClick={applyCustomAvatar}
                    className="shrink-0 rounded-lg bg-[#FFD166] px-4 py-2 text-[12px] font-bold text-[#171a26] transition-opacity hover:opacity-85"
                  >
                    Dùng ảnh
                  </button>
                </div>
                {customAvatarError ? <span className="mt-2 block text-[12px] text-[#FF6B6B]">{customAvatarError}</span> : null}
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {AVATAR_CATEGORIES.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCategory(item.key)}
                    className={`rounded-full px-3 py-1.5 text-[12px] ${
                      category === item.key ? "bg-[#FFD166] font-semibold text-[#171a26]" : "bg-white/5 text-white/60"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {Array.from(
                  { length: AVATAR_CATEGORIES.find((c) => c.key === category)?.count ?? 0 },
                  (_, i) => avatarSrc(category, i + 1)
                ).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => {
                      onPickAvatar(src);
                      setPicker(null);
                    }}
                    className={`aspect-square overflow-hidden rounded-full ring-2 transition-all ${
                      src === avatarUrl ? "ring-[#FFD166]" : "ring-transparent hover:ring-white/30"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" src={src} loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <button
              type="button"
              onClick={() => {
                onPickFrame("");
                setPicker(null);
              }}
              className="mb-4 w-full rounded-xl border border-white/10 px-4 py-2.5 text-[13px] font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              Không dùng khung
            </button>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {allFrameSrc().map((src, i) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`Khung ${i + 1}`}
                  onClick={() => {
                    onPickFrame(src);
                    setPicker(null);
                  }}
                  className={`aspect-square overflow-hidden rounded-xl ring-2 transition-all ${
                    src === frameUrl ? "ring-[#FFD166]" : "ring-transparent hover:ring-white/30"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" src={src} loading="lazy" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      {modal}
      <div className="max-w-[560px] rounded-2xl border border-white/5 bg-[#191b24] p-5 lg:p-7">
        <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar name={displayName || email} emoji={emoji} avatarUrl={avatarUrl} frameUrl={frameUrl} size={64} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">{displayName || email.split("@")[0] || "Thành viên"}</p>
            <p className="truncate text-[12px] text-white/50">{email}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPicker("avatar")}
                className="rounded-full border border-white/15 px-3 py-1.5 text-[12px] text-white/70 hover:border-[#FFD166] hover:text-[#FFD166]"
              >
                Ảnh có sẵn
              </button>
              <button
                type="button"
                onClick={() => setPicker("frame")}
                className="rounded-full border border-white/15 px-3 py-1.5 text-[12px] text-white/70 hover:border-[#FFD166] hover:text-[#FFD166]"
              >
                Chọn khung avatar
              </button>
            </div>
          </div>
        </div>

        <label className="mb-4 block">
          <span className="mb-2 block text-[13px] text-white/70">Email</span>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full rounded-lg border border-white/5 bg-black/25 px-4 py-3 text-[14px] text-white/60 outline-none"
          />
        </label>

        <label className="mb-5 block">
          <span className="mb-2 block text-[13px] text-white/70">Tên hiển thị</span>
          <input
            type="text"
            value={displayName}
            maxLength={30}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Tên bạn muốn hiển thị"
            className="w-full rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-[14px] text-white outline-none placeholder:text-white/25 focus:border-[#FFD166]/60"
          />
        </label>

        <div className="mb-5">
          <span className="mb-2 block text-[13px] text-white/70">Giới tính</span>
          <div className="flex flex-wrap gap-2">
            {[
              ["nam", "Nam"],
              ["nu", "Nữ"],
              ["khong-xac-dinh", "Không xác định"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setGender(value)}
                className={`rounded-full border px-4 py-2 text-[13px] transition-colors ${
                  gender === value
                    ? "border-[#FFD166] bg-[#FFD166] font-semibold text-[#171a26]"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/25"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <span className="mb-2 block text-[13px] text-white/70">Emoji cạnh tên</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEmoji("")}
              className={`rounded-lg border px-3 py-2 text-[13px] ${!emoji ? "border-[#FFD166] text-[#FFD166]" : "border-white/10 text-white/60"}`}
            >
              Chưa chọn
            </button>
            {emojis.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setEmoji(item)}
                aria-label={`Chọn emoji ${item}`}
                className={`h-10 w-10 rounded-lg border text-lg ${emoji === item ? "border-[#FFD166] bg-[#FFD166]/10" : "border-white/10 bg-white/5"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {message ? <p className="mb-4 text-[13px] text-[#FFD166]">{message}</p> : null}

        <button
          type="button"
          onClick={onSubmit}
          disabled={busy}
          className="rounded-full bg-[#FFD166] px-7 py-2.5 text-[14px] font-bold text-[#171a26] transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {busy ? "Đang lưu..." : "Cập nhật"}
        </button>
      </div>
    </>
  );
}

function TierBadges({
  tier,
  admin,
  compact = false,
}: {
  tier: SubscriptionTier;
  admin: boolean;
  compact?: boolean;
}) {
  const cls = compact
    ? "rounded-[4px] px-1.5 py-[1px] text-[9px] font-black tracking-wider"
    : "rounded-full px-3 py-1 text-[11px] font-black tracking-wide";
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {admin ? <span className={`${cls} bg-[#ffd875] text-[#171821]`}>ADMIN</span> : null}
      {tier === "super-vip" ? (
        <span className={`${cls} bg-gradient-to-r from-[#ff6b6b] to-[#ffd166] text-[#171821]`}>SUPER VIP</span>
      ) : tier === "vip" ? (
        <span className={`${cls} bg-[#ffd166] text-[#171821]`}>VIP</span>
      ) : null}
    </span>
  );
}

function SubscriptionPanel({
  tier,
  admin,
  busy,
  message,
  input,
  onInput,
  onRedeem,
}: {
  tier: SubscriptionTier;
  admin: boolean;
  busy: boolean;
  message: string;
  input: string;
  onInput: (value: string) => void;
  onRedeem: (code?: string) => void;
}) {
  const tiers: SubscriptionTier[] = ["free", "vip", "super-vip"];
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/5 bg-[#191b24] p-5 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFD166]/15 text-[#FFD166]">
              <Icon name="crown" className="h-7 w-7" />
            </span>
            <div>
              <p className="text-[12px] uppercase tracking-wide text-white/40">Gói hiện tại</p>
              <p className="text-2xl font-bold text-white">{TIER_INFO[tier].label}</p>
              <div className="mt-1">
                <TierBadges tier={tier} admin={admin} />
              </div>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[12px] text-white/55">
            {tier === "free" ? "Chưa kích hoạt mã" : "Đã kích hoạt"}
          </span>
        </div>
        <p className="mt-6 text-[14px] leading-relaxed text-white/60">{TIER_INFO[tier].note}</p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#191b24] p-5 lg:p-8">
        <h2 className="text-[17px] font-bold text-white">Nhập mã kích hoạt</h2>
        <p className="mt-1 text-[13px] text-white/50">Mã áp dụng cho tài khoản đang đăng nhập.</p>
        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            onRedeem();
          }}
        >
          <input
            value={input}
            onChange={(event) => onInput(event.target.value.toUpperCase())}
            placeholder="Nhập mã (VD: VIP2026)"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-[14px] uppercase tracking-wide text-white outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-white/25 focus:border-[#FFD166]/60"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="shrink-0 rounded-full bg-[#FFD166] px-7 py-3 text-[13px] font-bold text-[#171a26] transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Đang kích hoạt..." : "Kích hoạt"}
          </button>
        </form>
        {message ? <p className="mt-3 text-[13px] text-[#FFD166]">{message}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          {VISIBLE_REDEEM_CODES.map((code) => (
            <button
              key={code.code}
              type="button"
              disabled={busy}
              onClick={() => onRedeem(code.code)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] text-white/65 transition-colors hover:border-[#FFD166]/50 hover:text-[#FFD166] disabled:opacity-40"
            >
              Dùng mã {code.code} → {TIER_INFO[code.tier].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((item) => {
          const active = item === tier;
          return (
            <div
              key={item}
              className={`rounded-2xl border p-5 ${
                active ? "border-[#FFD166]/50 bg-[#FFD166]/[0.06]" : "border-white/5 bg-[#191b24]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[17px] font-bold text-white">{TIER_INFO[item].label}</p>
                <TierBadges tier={item} admin={item === "super-vip"} compact />
              </div>
              <ul className="mt-4 space-y-2">
                {TIER_INFO[item].perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-[12px] leading-relaxed text-white/60">
                    <svg {...svgProps} className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FFD166]">
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminPanel({
  tier,
  favorites,
  watchlist,
  progress,
  unread,
}: {
  tier: SubscriptionTier;
  favorites: number;
  watchlist: number;
  progress: number;
  unread: number;
}) {
  const [rows, setRows] = useState<ReturnType<typeof readAllLocalComments>>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sync = () => {
      setRows(readAllLocalComments());
      setHidden(readHiddenCommentIds());
    };
    sync();
    window.addEventListener(LOCAL_COMMENTS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LOCAL_COMMENTS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const commitLocal = (slug: string, list: ReturnType<typeof readLocalComments>) => {
    if (!writeLocalComments(slug, list)) {
      setMessage("Không lưu được trên thiết bị này.");
      return;
    }
    window.dispatchEvent(new Event(LOCAL_COMMENTS_EVENT));
    setRows(readAllLocalComments());
    setMessage("Đã cập nhật bình luận.");
  };

  const togglePin = (slug: string, id: string) => {
    const list = readLocalComments(slug);
    const target = list.find((item) => item.id === id);
    if (!target) return;
    commitLocal(
      slug,
      list.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item))
    );
  };

  const removeLocal = (slug: string, id: string) => {
    commitLocal(
      slug,
      readLocalComments(slug).filter((item) => item.id !== id)
    );
  };

  const restore = (id: string) => {
    if (!unhideComment(id)) {
      setMessage("Không khôi phục được bình luận.");
      return;
    }
    setHidden(readHiddenCommentIds());
    setMessage("Đã khôi phục bình luận.");
  };

  const privileges = [
    "Ghim / bỏ ghim bình luận",
    "Xóa bình luận trên mọi phim",
    "Ẩn cả bình luận tĩnh từ DB",
    "Huy hiệu ADMIN + SUPER VIP",
    "Vành avatar phát sáng",
    "Mở tab quản trị riêng",
  ];
  const stats = [
    { label: "Bình luận local", value: rows.length },
    { label: "Đã ẩn", value: hidden.length },
    { label: "Yêu thích", value: favorites },
    { label: "Danh sách", value: watchlist },
    { label: "Xem tiếp", value: progress },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#ffd875]/20 bg-gradient-to-br from-[#FFD166]/[0.12] to-transparent p-5 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFD166]/15 text-[#FFD166]">
            <Icon name="shield" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[12px] uppercase tracking-wide text-white/45">Quyền quản trị</p>
            <h2 className="text-xl font-bold text-white">Super VIP · Admin</h2>
          </div>
          <div className="ml-auto">
            <TierBadges tier={tier} admin />
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-white/55">
          Các thao tác quản trị dưới đây áp dụng trên thiết bị này, đồng bộ ngay với trang phim và trang chủ.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/5 bg-[#191b24] p-4">
            <p className="text-[11px] text-white/40">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#191b24] p-5 lg:p-8">
        <h3 className="text-[16px] font-bold text-white">Quyền năng của Admin</h3>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {privileges.map((perk) => (
            <div key={perk} className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2.5 text-[12px] text-white/65">
              <svg {...svgProps} className="h-3.5 w-3.5 shrink-0 text-[#FFD166]">
                <path d="m5 12 4 4L19 6" />
              </svg>
              {perk}
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href={withBasePath("/users/tai-khoan")} className="rounded-full border border-white/10 px-4 py-2 text-[12px] text-white/65 hover:text-[#FFD166]">
            Hồ sơ & avatar
          </a>
          <a href={withBasePath("/users/thong-bao")} className="rounded-full border border-white/10 px-4 py-2 text-[12px] text-white/65 hover:text-[#FFD166]">
            Thông báo {unread > 0 ? `(${unread})` : ""}
          </a>
          <a href={withBasePath("/phim")} className="rounded-full border border-white/10 px-4 py-2 text-[12px] text-white/65 hover:text-[#FFD166]">
            Danh sách phim
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#191b24] p-5 lg:p-8">
        <h3 className="text-[16px] font-bold text-white">Duyệt bình luận</h3>
        <p className="mt-1 text-[12px] text-white/45">Bình luận đã gửi từ trình duyệt này.</p>
        {message ? <p className="mt-3 text-[12px] text-[#FFD166]">{message}</p> : null}
        {rows.length === 0 ? (
          <p className="mt-5 rounded-xl bg-black/20 p-4 text-[13px] text-white/45">Chưa có bình luận local để duyệt.</p>
        ) : (
          <div className="mt-5 space-y-2">
            {rows.slice(0, 30).map(({ slug, comment }) => (
              <div key={`${slug}-${comment.id}`} className="rounded-xl border border-white/5 bg-black/20 p-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/40">
                  <a href={detailHref(slug)} className="font-semibold text-white/70 hover:text-[#FFD166]">
                    {comment.name}
                  </a>
                  <span>· {comment.time}</span>
                  {comment.pinned ? <span className="rounded bg-[#FFD166]/15 px-1.5 py-0.5 text-[#FFD166]">Đã ghim</span> : null}
                </div>
                <p className="mt-2 line-clamp-2 text-[13px] text-white/70">{comment.content}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => togglePin(slug, comment.id)}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-white/60 hover:text-[#FFD166]"
                  >
                    {comment.pinned ? "Bỏ ghim" : "Ghim"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLocal(slug, comment.id)}
                    className="rounded-full border border-[#ff6b6b]/25 px-3 py-1.5 text-[11px] text-[#ff8f8f] hover:bg-[#ff6b6b]/10"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {hidden.length > 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#191b24] p-5 lg:p-8">
          <h3 className="text-[16px] font-bold text-white">Bình luận đã ẩn</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {hidden.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => restore(id)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-white/60 hover:text-[#FFD166]"
              >
                Khôi phục #{id}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AccountPage({ tab }: { tab: AccountTab }) {
  const { user, loading, reload: reloadSession } = useAuthSession();
  const { favorites, watchlist, progress, hydrated, toggle, remove } = useUserLibrary();
  const [signingOut, setSigningOut] = useState(false);
  const [tvCode, setTvCode] = useState("");
  const [tvMessage, setTvMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("");
  const [emoji, setEmoji] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [frameUrl, setFrameUrl] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [redeemInput, setRedeemInput] = useState("");
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState("");
  const [noticeFilter, setNoticeFilter] = useState("Tất cả");
  const notices = useNotifications();

  const info = getAccountTab(tab);
  const meta = user ? profileMeta(user) : null;
  const tier = normalizeTier(meta?.subscriptionTier);
  const admin = isAdminRole(meta?.role, meta?.subscriptionTier);
  const email = user?.email ?? "";
  const profileName = String(user?.user_metadata?.display_name ?? user?.user_metadata?.full_name ?? "");

  useEffect(() => {
    if (!user) return;
    setDisplayName(profileName);
    setGender(String(user.user_metadata?.gender ?? ""));
    setEmoji(String(user.user_metadata?.chat_emoji ?? ""));
    setAvatarUrl(String(user.user_metadata?.avatar_url ?? ""));
    setFrameUrl(frameAssetSrc(String(user.user_metadata?.avatar_frame ?? "")) ?? "");
  }, [user, profileName]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[560px] flex-col items-center justify-center px-4 py-16 text-center">
        <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFD166]/10 text-[#FFD166]">
          <Icon name="user" className="h-8 w-8" />
        </span>
        <h1 className="text-xl font-bold text-white">Quản lý tài khoản</h1>
        <p className="mt-2 text-[14px] text-white/50">Vui lòng đăng nhập để xem và chỉnh sửa thông tin cá nhân.</p>
        <a
          href={withBasePath("/dang-nhap")}
          className="mt-7 rounded-full bg-[#FFD166] px-7 py-3 text-[14px] font-bold text-[#171a26] transition-opacity hover:opacity-85"
        >
          Đăng nhập
        </a>
      </div>
    );
  }

  const doSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  };

  const doUpdateProfile = async () => {
    setProfileBusy(true);
    setProfileMessage("");
    const result = await updateProfile({
      display_name: displayName.trim(),
      full_name: displayName.trim(),
      gender,
      chat_emoji: emoji,
      avatar_url: avatarUrl,
      avatar_frame: frameUrl,
    });
    setProfileMessage(result.message);
    setProfileBusy(false);
  };

  const doRedeemCode = async (rawCode?: string) => {
    const result = redeemCode(rawCode ?? redeemInput, tier);
    setRedeemMessage(result.message);
    if (!result.ok || !result.patch) return;
    setRedeemBusy(true);
    const updated = await updateProfile(result.patch);
    if (updated.ok) {
      setRedeemInput("");
      reloadSession();
    } else {
      setRedeemMessage(updated.message);
    }
    setRedeemBusy(false);
  };

  // Chọn ảnh/khung lưu ngay như chophim, không cần bấm "Cập nhật".
  const pickAvatar = async (src: string) => {
    setAvatarUrl(src);
    setProfileBusy(true);
    const result = await updateProfile({ avatar_url: src });
    setProfileMessage(result.ok ? "Đã cập nhật ảnh đại diện!" : result.message);
    setProfileBusy(false);
    reloadSession();
  };

  const pickFrame = async (src: string) => {
    setFrameUrl(src);
    setProfileBusy(true);
    const result = await updateProfile({ avatar_frame: src });
    setProfileMessage(result.ok ? (src ? "Đã cập nhật khung avatar!" : "Đã bỏ khung avatar!") : result.message);
    setProfileBusy(false);
    reloadSession();
  };

  const nav = (
    <nav className="flex flex-row gap-2 overflow-x-auto pb-2 lg:flex-1 lg:min-h-0 lg:flex-col lg:gap-0 lg:overflow-y-auto lg:pb-1 lg:pr-1">
      {ACCOUNT_TABS.filter((item) => item.key !== "admin" || admin).map((item: AccountTabInfo) => (
        <a
          key={item.key}
          href={withBasePath(`/users/${item.key}`)}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] transition-colors lg:w-full lg:rounded-none lg:px-2 lg:py-4 lg:opacity-70 lg:hover:opacity-100 ${
            item.key === tab
              ? "bg-white/5 text-[#FFD166] opacity-100 lg:opacity-100"
              : "bg-white/5 text-white/70 hover:text-[#FFD166] lg:bg-transparent"
          }`}
        >
          <span className="flex w-5 shrink-0 justify-center">
            <Icon name={item.icon} className="h-[18px] w-[18px]" />
          </span>
          {item.label}
        </a>
      ))}
    </nav>
  );

  const renderContent = () => {
    if (tab === "yeu-thich") {
      return favorites.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {favorites.map((item) => (
            <PosterTile
              key={item.slug}
              item={item}
              onRemove={() => toggle("favorites", item)}
              removeLabel="Bỏ khỏi yêu thích"
            />
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa có phim yêu thích" hint="Bấm tim trên trang phim để lưu vào đây." />
      );
    }

    if (tab === "danh-sach") {
      return watchlist.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {watchlist.map((item) => (
            <PosterTile
              key={item.slug}
              item={item}
              onRemove={() => toggle("watchlist", item)}
              removeLabel="Bỏ khỏi danh sách"
            />
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa có danh sách nào" hint="Lưu phim vào danh sách để xem sau nhé." />
      );
    }

    if (tab === "xem-tiep") {
      return progress.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {progress.map((item) => {
            const percent = item.duration > 0 ? Math.min(100, Math.round((item.time / item.duration) * 100)) : 0;
            // Gửi cả tổng thời lượng để iOS 15.5 native HLS vẫn tua đúng mốc
            // dù video chưa trả duration thật lúc mới mở.
            const hash = `#tap=tap-${item.episode + 1}&sv=${encodeURIComponent(item.serverName || "")}&server_id=${item.server}&t=${Math.floor(item.time)}&d=${Math.floor(item.duration)}`;
            return (
              <div key={item.slug} className="group relative">
                <a href={watchHref(item.slug, hash)}>
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-bg-card ring-1 ring-white/5">
                    {item.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={item.title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" src={item.poster} />
                    ) : null}
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Xem lại
                    </span>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                      <div className="h-full bg-[#FFD166]" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <p className="mt-2 truncate text-[12px] font-semibold text-text-primary group-hover:text-[#FFD166] sm:text-[13px]">{item.title}</p>
                  <p className="mt-0.5 truncate text-[10px] text-text-muted sm:text-[11px]">
                    Tập {item.episode + 1} • {fmtWatchTime(item.time)} / {fmtWatchTime(item.duration)}
                  </p>
                </a>
                <button
                  type="button"
                  onClick={() => remove(item.slug)}
                  aria-label="Xóa khỏi danh sách"
                  title="Xóa khỏi danh sách"
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white/80 opacity-0 transition-opacity hover:bg-[#e50914] group-hover:opacity-100 focus:opacity-100"
                >
                  <svg {...svgProps} className="h-4 w-4">
                    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Chưa có phim đang xem" hint="Những tập bạn xem dở sẽ xuất hiện ở đây." />
      );
    }

    if (tab === "dang-nhap-tv") {
      return (
        <div className="max-w-[560px] rounded-2xl border border-white/5 bg-[#191b24] p-5 lg:p-7">
          <p className="text-[13px] leading-relaxed text-white/60">Mã và liên kết sẽ tự hết hạn sau 5 phút.</p>
          <label className="mt-7 block">
            <span className="mb-2 block text-[13px] font-medium text-white/80">Nhập mã đang hiện trên TV</span>
            <input
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={tvCode}
              onChange={(event) => {
                setTvCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                setTvMessage("");
              }}
              placeholder="000000"
              className="w-full rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white outline-none placeholder:text-white/20 focus:border-[#FFD166]/60"
            />
            <span className="mt-2 block text-[12px] text-white/40">Mã gồm 6 số và chỉ dùng được một lần.</span>
          </label>
          <div className="mt-7 rounded-xl border border-white/5 bg-black/20 p-4">
            <p className="mb-2 text-[12px] uppercase tracking-wide text-white/40">Tài khoản sẽ đăng nhập</p>
            <div className="flex items-center gap-3">
              <Avatar name={displayName || email} emoji={emoji} avatarUrl={avatarUrl} frameUrl={frameUrl} />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-white">{displayName || email.split("@")[0]}</p>
                <p className="truncate text-[12px] text-white/50">{email}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTvMessage("Tính năng Đăng nhập TV chưa khả dụng trên Nhót Phim.")}
            disabled={tvCode.length !== 6}
            className="mt-6 w-full rounded-full bg-[#FFD166] px-5 py-3 text-[14px] font-bold text-[#171a26] transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Đăng nhập TV này
          </button>
          {tvMessage ? <p className="mt-4 text-[13px] text-[#FFD166]">{tvMessage}</p> : null}
          <div className="mt-8 rounded-xl border border-white/5 bg-black/20 p-4 text-[12px] leading-relaxed text-white/50">
            <p className="mb-2 font-semibold text-white/70">Lưu ý bảo mật</p>
            <p>• Không gửi mã hoặc ảnh QR cho người khác.</p>
            <p className="mt-1">• TV nhận một phiên đăng nhập riêng sau khi bạn xác nhận.</p>
          </div>
        </div>
      );
    }

    if (tab === "thong-bao") {
      const filters = ["Tất cả", "Chưa đọc", "Tập mới", "Hệ thống"];
      const countOf = (filter: string) => {
        if (filter === "Chưa đọc") return notices.unreadCount;
        if (filter === "Tập mới") return notices.items.filter((n) => n.type === "new_episode").length;
        if (filter === "Hệ thống") return notices.items.filter((n) => n.type === "admin").length;
        return notices.items.length;
      };
      const list = notices.items.filter((n) => {
        if (noticeFilter === "Chưa đọc") return !n.isRead;
        if (noticeFilter === "Tập mới") return n.type === "new_episode";
        if (noticeFilter === "Hệ thống") return n.type === "admin";
        return true;
      });
      return (
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setNoticeFilter(filter)}
                className={`rounded-full border px-4 py-2 text-[13px] ${
                  noticeFilter === filter
                    ? "border-[#FFD166] bg-[#FFD166]/10 text-[#FFD166]"
                    : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                {filter} <span className="ml-1 text-white/40">{countOf(filter)}</span>
              </button>
            ))}
            {notices.unreadCount > 0 ? (
              <button
                type="button"
                onClick={notices.markAllRead}
                className="ml-auto rounded-full px-3 py-2 text-[13px] text-[#FFD166]/80 hover:bg-[#FFD166]/10 hover:text-[#FFD166]"
              >
                Đọc tất cả
              </button>
            ) : null}
          </div>
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#191b24]/80 px-6 py-20 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-text-muted">
                <Icon name="bell" className="h-7 w-7" />
              </span>
              <p className="text-base font-semibold text-white">Chưa có thông báo</p>
              <p className="mt-2 text-[13px] text-white/50">Các thông báo mới sẽ hiện ở đây</p>
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    notices.markRead(item.id);
                    if (item.link) window.location.href = withBasePath(item.link);
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                    item.isRead
                      ? "border-white/5 bg-[#191b24]/80 hover:bg-[#20232e]"
                      : "border-white/10 bg-white/[0.025] hover:bg-white/[0.055]"
                  }`}
                >
                  {item.poster && /^(https?:|\/|data:)/.test(item.poster) ? (
                    <span className="h-[74px] w-[52px] shrink-0 overflow-hidden rounded-lg bg-white/5">
                      <img src={item.poster} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </span>
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#64f7a1]">
                      <Icon name="tv" className="h-5 w-5" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className={`truncate text-[14px] font-semibold ${item.isRead ? "text-white/60" : "text-white"}`}>
                        {item.movieName || item.title}
                      </span>
                      {!item.isRead ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#ff4757]" /> : null}
                    </span>
                    <span className="mt-1 block text-[13px] text-white/55">{item.message}</span>
                    <span className="mt-1.5 block text-[11px] text-white/30">
                      Tập mới · {timeAgo(item.createdAt)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (tab === "admin") {
      if (!admin) {
        return (
          <div className="mx-auto flex max-w-[560px] flex-col items-center rounded-2xl border border-white/5 bg-[#191b24] px-6 py-20 text-center">
            <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFD166]/10 text-[#FFD166]">
              <Icon name="shield" className="h-8 w-8" />
            </span>
            <h2 className="text-lg font-bold text-white">Chưa có quyền quản trị</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-white/50">
              Kích hoạt mã SVIP2026 hoặc ADMIN2026 trong Gói đăng ký để mở tab Admin.
            </p>
            <a
              href={withBasePath("/users/goi-dang-ky")}
              className="mt-6 rounded-full bg-[#FFD166] px-6 py-2.5 text-[13px] font-bold text-[#171a26]"
            >
              Đến Gói đăng ký
            </a>
          </div>
        );
      }
      return (
        <AdminPanel
          tier={tier}
          favorites={favorites.length}
          watchlist={watchlist.length}
          progress={progress.length}
          unread={notices.unreadCount}
        />
      );
    }

    if (tab === "tai-khoan") {
      return (
        <ProfilePanel
          displayName={displayName}
          setDisplayName={setDisplayName}
          gender={gender}
          setGender={setGender}
          emoji={emoji}
          setEmoji={setEmoji}
          email={email}
          avatarUrl={avatarUrl}
          frameUrl={frameUrl}
          onPickAvatar={(src) => void pickAvatar(src)}
          onPickFrame={(src) => void pickFrame(src)}
          busy={profileBusy}
          message={profileMessage}
          onSubmit={doUpdateProfile}
        />
      );
    }

    return (
      <SubscriptionPanel
        tier={tier}
        admin={admin}
        busy={redeemBusy}
        message={redeemMessage}
        input={redeemInput}
        onInput={(value) => {
          setRedeemInput(value);
          setRedeemMessage("");
        }}
        onRedeem={(code) => void doRedeemCode(code)}
      />
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 lg:px-6 lg:py-12">
      <div className="flex w-full flex-col gap-8 lg:flex-row lg:gap-16">
        <aside className="w-full shrink-0 lg:w-[320px] xl:w-[350px]">
          <div className="flex flex-col rounded-2xl bg-[#191b24] p-4 shadow-xl lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] lg:max-h-[calc(100vh-120px)] lg:min-h-[600px] lg:p-6 lg:px-6 lg:py-8">
            <div className="flex min-h-0 flex-col lg:flex-1 lg:overflow-hidden">
              <h2 className="mb-4 shrink-0 px-1 text-[17px] font-bold text-white lg:mb-6 lg:px-2 lg:text-[19px]">
                Quản lý tài khoản
              </h2>
              {nav}
            </div>
            <div className="mt-6 hidden border-t border-white/5 pt-5 lg:block">
              <div className="mb-4 flex items-center gap-3 px-1">
                <Avatar name={displayName || email} emoji={emoji} avatarUrl={avatarUrl} frameUrl={frameUrl} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-white">{displayName || email.split("@")[0]}</p>
                  <p className="truncate text-[12px] text-white/45">{email}</p>
                  {tier !== "free" || admin ? (
                    <span className="mt-1 block">
                      <TierBadges tier={tier} admin={admin} compact />
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={doSignOut}
                disabled={signingOut}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-[13px] text-white/60 transition-colors hover:bg-white/5 hover:text-[#ff6b6b] disabled:opacity-50"
              >
                <svg {...svgProps} className="h-[18px] w-[18px]">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                {signingOut ? "Đang thoát..." : "Thoát"}
              </button>
            </div>
            <button
              type="button"
              onClick={doSignOut}
              disabled={signingOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-[13px] text-white/60 lg:hidden"
            >
              Thoát tài khoản
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pt-2 lg:pt-6">
          <h1 className="mb-1 text-[20px] font-bold text-white lg:mb-2 lg:text-[22px]">{info?.title ?? INVALIDATE}</h1>
          <p className="mb-6 text-[13px] leading-relaxed text-white/50 lg:mb-10">{info?.subtitle}</p>
          {hydrated || !(tab === "yeu-thich" || tab === "danh-sach" || tab === "xem-tiep")
            ? renderContent()
            : null}
        </main>
      </div>
    </div>
  );
}
