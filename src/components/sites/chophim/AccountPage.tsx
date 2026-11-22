"use client";

import { useEffect, useState } from "react";
import { signOut, updateProfile, useAuthSession } from "@/lib/auth";
import { withBasePath } from "@/lib/base-path";
import { ACCOUNT_TABS, getAccountTab, type AccountTab, type AccountTabInfo } from "@/lib/account-tabs";
import { useUserLibrary, type LibraryEntry, type ProgressEntry } from "@/lib/user-library";

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
  return (
    <svg {...svgProps} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function Avatar({ name, emoji }: { name: string; emoji?: string }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFD166]/15 text-lg font-bold text-[#FFD166] ring-1 ring-[#FFD166]/30">
      {emoji || name.trim().charAt(0).toUpperCase() || "N"}
    </span>
  );
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
      <a className="block" href={withBasePath(`/phim/${item.slug}`)}>
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
  busy: boolean;
  message: string;
  onSubmit: () => void;
}) {
  const emojis = ["🐻", "🔥", "🎮", "⚡", "🎀", "🦋", "💛", "🕊️"];
  return (
    <div className="max-w-[560px] rounded-2xl border border-white/5 bg-[#191b24] p-5 lg:p-7">
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={displayName || email} emoji={emoji} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{displayName || email.split("@")[0] || "Thành viên"}</p>
          <p className="truncate text-[12px] text-white/50">{email}</p>
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
  );
}

export function AccountPage({ tab }: { tab: AccountTab }) {
  const { user, loading } = useAuthSession();
  const { favorites, watchlist, progress, hydrated, toggle, remove } = useUserLibrary();
  const [signingOut, setSigningOut] = useState(false);
  const [tvCode, setTvCode] = useState("");
  const [tvMessage, setTvMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("");
  const [emoji, setEmoji] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [noticeFilter, setNoticeFilter] = useState("Tất cả");

  const info = getAccountTab(tab);
  const email = user?.email ?? "";
  const profileName = String(user?.user_metadata?.display_name ?? user?.user_metadata?.full_name ?? "");

  useEffect(() => {
    if (!user) return;
    setDisplayName(profileName);
    setGender(String(user.user_metadata?.gender ?? ""));
    setEmoji(String(user.user_metadata?.chat_emoji ?? ""));
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
    });
    setProfileMessage(result.message);
    setProfileBusy(false);
  };

  const nav = (
    <nav className="flex flex-row gap-2 overflow-x-auto pb-2 lg:flex-1 lg:min-h-0 lg:flex-col lg:gap-0 lg:overflow-y-auto lg:pb-1 lg:pr-1">
      {ACCOUNT_TABS.map((item: AccountTabInfo) => (
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
            return (
              <div key={item.slug} className="group relative">
                <a href={withBasePath(`/xem/${item.slug}#tap=${item.server}:${item.episode}`)}>
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-bg-card ring-1 ring-white/5">
                    {item.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={item.title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" src={item.poster} />
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                      <div className="h-full bg-[#FFD166]" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <p className="mt-2 truncate text-[12px] font-semibold text-text-primary group-hover:text-[#FFD166] sm:text-[13px]">{item.title}</p>
                  <p className="mt-0.5 truncate text-[10px] text-text-muted sm:text-[11px]">
                    {item.serverName ? `${item.serverName} • ` : ""}Tập {item.episode}
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
              <Avatar name={displayName || email} emoji={emoji} />
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
      return (
        <div>
          <div className="mb-6 flex flex-wrap gap-2">
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
                {filter} <span className="ml-1 text-white/40">0</span>
              </button>
            ))}
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#191b24]/80 px-6 py-20 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-text-muted">
              <Icon name="bell" className="h-7 w-7" />
            </span>
            <p className="text-base font-semibold text-white">Chưa có thông báo</p>
            <p className="mt-2 text-[13px] text-white/50">Các thông báo mới sẽ hiện ở đây</p>
          </div>
        </div>
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
          busy={profileBusy}
          message={profileMessage}
          onSubmit={doUpdateProfile}
        />
      );
    }

    return (
      <div className="max-w-[640px] rounded-2xl border border-white/5 bg-[#191b24] p-5 lg:p-8">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFD166]/15 text-[#FFD166]">
            <Icon name="crown" className="h-7 w-7" />
          </span>
          <div>
            <p className="text-[12px] uppercase tracking-wide text-white/40">Gói hiện tại</p>
            <p className="text-2xl font-bold text-white">Free</p>
          </div>
        </div>
        <p className="mt-6 text-[14px] leading-relaxed text-white/60">
          Tài khoản Nhót Phim miễn phí đã có đủ mọi đặc quyền để xem phim: không quảng cáo, không thẻ cào, không nạp coin.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {["Xem phim không giới hạn", "Lưu yêu thích & xem tiếp", "Đồng bộ trên thiết bị", "Không quảng cáo"].map((line) => (
            <div key={line} className="flex items-center gap-2 rounded-xl bg-black/20 px-4 py-3 text-[13px] text-white/70">
              <svg {...svgProps} className="h-4 w-4 text-[#FFD166]">
                <path d="m5 12 4 4L19 6" />
              </svg>
              {line}
            </div>
          ))}
        </div>
      </div>
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
                <Avatar name={displayName || email} emoji={emoji} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-white">{displayName || email.split("@")[0]}</p>
                  <p className="truncate text-[12px] text-white/45">{email}</p>
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
