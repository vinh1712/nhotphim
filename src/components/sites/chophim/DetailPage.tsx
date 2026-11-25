"use client";

import { withBasePath } from "@/lib/base-path";
import { frameAssetSrc } from "@/lib/avatar-data";
import { checkVnFallback, fallbackToVnFlag } from "@/lib/avatar-fallback";
import { useAuthSession } from "@/lib/auth";
import { markCommentDeleted, pushLocalComments } from "@/lib/comment-sync";
import { isAdminRole, normalizeTier } from "@/lib/subscription";
import {
  LOCAL_COMMENTS_EVENT,
  hideComment,
  localCommentsKey,
  readHiddenCommentIds,
  readLocalComments,
  readPinnedCommentIds,
  togglePinnedComment,
  unhideComment,
  writeLocalComments,
} from "@/lib/local-comments";
import { detailHref, useMovieDuration, watchHref } from "@/lib/live-data";
import { PartSelector } from "./PartSelector";
import { isInList, toggleList } from "@/lib/user-library";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fillStyle } from "./types";
import { UserAvatar, profileMeta } from "./UserAvatar";
import {
  IconLanguages,
  IconLogIn,
  IconPlay,
  IconInfinity,
} from "./icons";
import type { DetailComment, MovieDetail, Suggestion } from "./detail-types";
import { enc, sortComments } from "./detail-types";

const TABS = ["Tập phim", "Gallery", "Diễn viên", "Đề xuất"] as const;

/* ── icon cần thêm (path lấy từ lucide như trang gốc) ─────────────────── */

function IconServer({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  );
}

function IconCaptions({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="18" height="14" x="3" y="5" rx="2" ry="2" />
      <path d="M7 15h4M15 15h2M7 11h2M13 11h4" />
    </svg>
  );
}

function IconMic({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 19v3" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <rect x="9" y="2" width="6" height="13" rx="3" />
    </svg>
  );
}

function IconChevronDown({ className, stroke = 2 }: { className?: string; stroke?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconPlaySmall({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
    </svg>
  );
}

function IconThumbsUp({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
      <path d="M7 10v12" />
    </svg>
  );
}

function IconThumbsDown({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
      <path d="M17 14V2" />
    </svg>
  );
}

function IconTrash2({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconSend({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function IconMars({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M16 3h5v5" />
      <path d="m21 3-6.75 6.75" />
      <circle cx="10" cy="14" r="6" />
    </svg>
  );
}

function IconVenus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="9" r="6" />
      <path d="M12 15v7" />
      <path d="M9 19h6" />
    </svg>
  );
}

const SERVER_ICONS = [IconLanguages, IconCaptions, IconCaptions, IconMic, IconLanguages];

/* ── khối Info (dùng chung cho desktop + accordion mobile) ─────────────── */

function Badges({ movie, size }: { movie: MovieDetail; size: "md" | "sm" }) {
  return (
    <div
      className={
        size === "md"
          ? "flex flex-wrap items-center gap-2 text-white/90 hidden md:flex justify-center md:justify-start mb-4 text-[10px] md:text-xs"
          : "flex flex-wrap items-center gap-2 text-white/90 mb-4 text-left text-[11px]"
      }
    >
      {movie.quality && (
        <span className="px-2 py-[3px] rounded border border-white bg-black/20 backdrop-blur-sm font-medium">{movie.quality}</span>
      )}
      {movie.lang && (
        <span className="px-2 py-[3px] rounded border border-white bg-black/20 backdrop-blur-sm font-medium">{movie.lang}</span>
      )}
      {movie.episodeLabel && (
        <span className="px-2 py-[3px] rounded border border-white bg-black/20 backdrop-blur-sm font-medium">{movie.episodeLabel}</span>
      )}
      {movie.rating != null && (
        <div className="flex items-center text-[11px] font-bold rounded overflow-hidden border border-solid border-[rgba(1,180,228,0.5)]">
          <span className="bg-[#01B4E4] text-white px-1.5 py-0.5">TMDb</span>
          <span className="bg-[rgba(1,180,228,0.1)] text-white px-1.5 py-0.5">{movie.rating.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}

function infoRows(movie: MovieDetail, duration: string | null): [string, string][] {
  return (
    [
      ["Trạng thái:", movie.status],
      ["Loại:", movie.type === "movie" ? "Phim Lẻ" : "Phim Bộ"],
      ["Năm:", movie.year ? String(movie.year) : ""],
      ["Thời lượng:", duration || ""],
      ["Thể loại:", movie.genres.join(", ")],
      ["Quốc gia:", movie.countries.join(", ")],
      ["Đạo diễn:", movie.director || ""],
    ] as [string, string][]
  ).filter(([, v]) => v);
}

function InfoGrid({
  movie,
  size,
  duration,
}: {
  movie: MovieDetail;
  size: "md" | "sm";
  duration: string | null;
}) {
  return (
    <div
      className={
        size === "md"
          ? "grid grid-cols-1 sm:grid-cols-2 gap-2 hidden md:grid text-sm mb-5"
          : "grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px] mb-5 text-left"
      }
    >
      {infoRows(movie, duration).map(([k, v]) => (
        <div key={k} className="flex items-start gap-2">
          <span className="text-text-muted shrink-0 w-20">{k}</span>
          <span className="text-text-secondary">{v}</span>
        </div>
      ))}
    </div>
  );
}

/* ── nút hành động (desktop một nhóm, mobile một nhóm) ─────────────────── */

function ActionButtons({ mobile, movie }: { mobile: boolean; movie: MovieDetail }) {
  const [fav, setFav] = useState(false);
  const [added, setAdded] = useState(false);
  const entry = {
    slug: movie.slug,
    title: movie.title,
    poster: movie.poster || movie.backdrop,
    origin: movie.origin,
  };

  useEffect(() => {
    setFav(isInList("favorites", movie.slug));
    setAdded(isInList("watchlist", movie.slug));
  }, [movie.slug]);

  const goComment = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("comment-section")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };
  const cls = "group/fav flex flex-col items-center justify-center gap-1 transition-colors px-2 active:scale-[0.97] motion-reduce:transform-none";
  const addCls = "group/add flex flex-col items-center justify-center gap-1 transition-colors px-2 active:scale-[0.97] motion-reduce:transform-none";
  const commCls = "group/comm flex flex-col items-center justify-center gap-1 transition-colors px-2 active:scale-[0.97] motion-reduce:transform-none";
  const label = "text-[13px] font-medium transition-colors text-white/80 group-hover:text-white";

  return (
    <div className={mobile ? "flex md:hidden gap-5 justify-center pt-2" : "hidden md:flex items-center"}>
      <button className={cls} title="Yêu thích" aria-pressed={fav} onClick={() => setFav(toggleList("favorites", entry))}>
        <svg className={`w-6 h-6 transition-colors ${fav ? "text-[#FFD166]" : "text-white/90"}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className={label}>{fav ? "Đã yêu thích" : "Yêu thích"}</span>
      </button>
      <div className="relative">
        <button className={addCls} title="Thêm vào danh sách" aria-pressed={added} onClick={() => setAdded(toggleList("watchlist", entry))}>
          <svg className={`w-6 h-6 transition-colors ${added ? "text-[#FFD166]" : "text-white/90"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className={label}>{added ? "Đã thêm" : "Thêm vào"}</span>
        </button>
      </div>
      <button className={commCls} title="Bình luận" onClick={goComment}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle transition-all duration-300 w-6 h-6 text-white/90 group-hover/comm:text-white group-hover/comm:scale-110" aria-hidden="true">
          <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
        </svg>
        <span className="text-[13px] font-medium text-white/80 group-hover/comm:text-white transition-colors">Bình luận</span>
      </button>
    </div>
  );
}

/* ── comment ───────────────────────────────────────────────────────────── */

export function CommentItem({
  c,
  currentUserId = null,
  currentUserRole = null,
  currentUserTier = null,
  onDelete,
  onTogglePin,
  onHide,
}: {
  c: DetailComment;
  currentUserId?: string | null;
  currentUserRole?: string | null;
  currentUserTier?: string | null;
  onDelete?: (id: string) => boolean | Promise<boolean>;
  onTogglePin?: (id: string) => void;
  onHide?: (id: string) => void;
}) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const voteKey = `nhotphim:comment-vote:${c.id}`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(voteKey);
      if (saved === "up" || saved === "down") setVote(saved);
    } catch {
      // Private mode / storage disabled — chỉ bỏ qua trạng thái vote local.
    }
  }, [voteKey]);

  const castVote = (next: "up" | "down") => {
    const value = vote === next ? null : next;
    setVote(value);
    try {
      if (value) window.localStorage.setItem(voteKey, value);
      else window.localStorage.removeItem(voteKey);
    } catch {
      // Giữ vote trong state dù không ghi được localStorage.
    }
  };

  const likes = c.likes + (vote === "up" ? 1 : 0);
  const dislikes = c.dislikes + (vote === "down" ? 1 : 0);
  const commentTier = normalizeTier(c.subscriptionTier);
  const isSuperVip = commentTier === "super-vip";
  const isVip = commentTier === "vip";
  const isAdmin = isAdminRole(c.role, c.subscriptionTier) || !!c.admin || isSuperVip;
  const canDeleteByViewer = isAdminRole(currentUserRole, currentUserTier);
  // Giống chophim: hiện Xóa cho comment của mình hoặc khi đang là admin.
  const canDelete =
    !!onDelete && ((!!currentUserId && currentUserId === c.userId) || canDeleteByViewer);
  const canPin = canDeleteByViewer && !!onTogglePin;
  const canHide = canDeleteByViewer && !!onHide;
  const deleteOwn = async () => {
    setConfirmDelete(false);
    await onDelete?.(c.id);
  };
  return (
    <div
      id={`comment-${c.id}`}
      className={`relative py-3 sm:py-5 transition-all duration-1000 ${
        c.pinned ? "bg-[#FFD166]/[0.04] border border-[#FFD166]/15 rounded-xl px-3 sm:px-4 my-1.5" : ""
      }`}
    >
      <div className="relative z-[1] flex items-start gap-2.5 sm:gap-3">
        <div className="shrink-0 mt-0.5">
          <div className="relative shrink-0">
            <div className={c.pinned || isVip || isSuperVip ? "avatar-ring-premium " : "ring-1 ring-white/15 rounded-full p-[2px] transition-colors"}>
              {c.avatar ? (
                <img alt="" loading="lazy" width={44} height={44} decoding="async" className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover relative z-10" src={c.avatar} ref={checkVnFallback} onError={fallbackToVnFlag} />
              ) : (
                <span className="relative z-10 flex w-9 h-9 sm:w-11 sm:h-11 items-center justify-center rounded-full bg-[#FFD166] text-[15px] font-bold text-[#1c1c1c]">
                  {c.name.trim().charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </div>
            {c.frame && (
              <img alt="" loading="lazy" decoding="async" className="avatar-frame pointer-events-none absolute inset-0 z-10 h-full w-full object-contain" src={frameAssetSrc(c.frame)} />
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {c.pinned && (
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pin w-3.5 h-3.5 fill-[#FFD166] text-[#FFD166]" aria-hidden="true">
                <path d="M12 17v5" />
                <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
              </svg>
              <span className="text-[#FFD166]">Ghim bởi Admin</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            {isAdmin && (
              <span className="inline-flex items-center px-1.5 py-[1px] rounded bg-[#FFD166] text-[#0f111a] text-[9px] font-black tracking-wider shrink-0">ADMIN</span>
            )}
            {isSuperVip ? (
              <span className="inline-flex items-center px-1.5 py-[1px] rounded bg-gradient-to-r from-[#ff6b6b] to-[#ffd166] text-[#0f111a] text-[9px] font-black tracking-wider shrink-0">SUPER VIP</span>
            ) : isVip ? (
              <span className="inline-flex items-center px-1.5 py-[1px] rounded bg-[#FFD166] text-[#0f111a] text-[9px] font-black tracking-wider shrink-0">VIP</span>
            ) : null}
            <span
              className={isVip || isSuperVip ? "font-bold text-[12px] sm:text-[13px]" : "font-bold text-[12px] sm:text-[13px] text-white"}
              style={isVip || isSuperVip ? { background: "linear-gradient(rgb(255, 255, 255), rgb(255, 209, 102)) text", WebkitTextFillColor: "transparent" } : undefined}
            >
              {c.name}
            </span>
            {c.gender === "male" && (
              <span className="text-blue-400">
                <IconMars className="w-5 h-5" />
              </span>
            )}
            {c.gender === "female" && (
              <span className="text-pink-400">
                <IconVenus className="w-5 h-5" />
              </span>
            )}
            {!c.gender && (
              <span className="text-white/30">
                <IconInfinity className="w-4 h-4" />
              </span>
            )}
            <span className="text-[11px] sm:text-[12px] text-text-muted ml-3">{c.time}</span>
          </div>
          <div className="mt-1.5">
            <div className="relative text-[#AAAAAA] leading-[1.7] whitespace-pre-wrap break-words mb-2 sm:mb-2.5 text-[12px] sm:text-[13px] ">
              <div className=" transition-all duration-300 relative z-0">
                <span>{c.content}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Thích bình luận"
              aria-pressed={vote === "up"}
              onClick={() => castVote("up")}
              className={`flex items-center gap-1.5 rounded-full text-xs transition-colors hover:text-white ${vote === "up" ? "text-[#FFD166]" : "text-text-muted"}`}
            >
              <IconThumbsUp className="w-4 h-4" />
              {likes > 0 && <span className="font-semibold">{likes}</span>}
            </button>
            <button
              type="button"
              aria-label="Không thích bình luận"
              aria-pressed={vote === "down"}
              onClick={() => castVote("down")}
              className={`flex items-center gap-1 rounded-full text-xs transition-colors hover:text-white ${vote === "down" ? "text-[#FFD166]" : "text-text-muted"}`}
            >
              <IconThumbsDown className="w-4 h-4" />
              {dislikes > 0 && <span className="font-semibold">{dislikes}</span>}
            </button>
            {canPin && (
              <button
                type="button"
                onClick={() => onTogglePin?.(c.id)}
                aria-pressed={!!c.pinned}
                className={`flex items-center gap-1 text-xs transition-colors ml-2 ${
                  c.pinned ? "text-[#FFD166]" : "text-text-muted hover:text-[#FFD166]"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pin w-3.5 h-3.5" aria-hidden="true">
                  <path d="M12 17v5" />
                  <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                </svg>
                <span>{c.pinned ? "Bỏ ghim" : "Ghim"}</span>
              </button>
            )}
            {canHide && (
              <button
                type="button"
                onClick={() => onHide?.(c.id)}
                aria-label="Ẩn bình luận"
                className="flex items-center gap-1 text-xs text-text-muted hover:text-[#ffb86b] transition-colors ml-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off w-3.5 h-3.5" aria-hidden="true">
                  <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.7 2.6" />
                  <path d="M6.6 6.6A13.2 13.2 0 0 0 2 12s3 7 10 7a10.9 10.9 0 0 0 5.4-1.4" />
                  <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                  <path d="m2 2 20 20" />
                </svg>
                <span>Ẩn</span>
              </button>
            )}
            {canDelete &&
              (confirmDelete ? (
                <div className="flex items-center gap-2 ml-2 animate-fade-in">
                  <span className="text-[11px] text-red-400">Xác nhận xóa?</span>
                  <button type="button" onClick={() => void deleteOwn()} className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors">
                    Xóa
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="text-[11px] text-text-muted hover:text-white transition-colors">
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-red-400 transition-colors ml-2"
                >
                  <IconTrash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── bình luận dùng chung cho trang phim và trang xem ─────────────────── */

function useLocalComments(slug: string) {
  const [comments, setComments] = useState<DetailComment[]>([]);
  const ref = useRef<DetailComment[]>([]);

  useEffect(() => {
    let alive = true;
    const load = () => {
      const next = readLocalComments(slug);
      if (!alive) return;
      ref.current = next;
      setComments(next);
    };
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === localCommentsKey(slug)) load();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(LOCAL_COMMENTS_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LOCAL_COMMENTS_EVENT, load);
    };
  }, [slug]);

  const addComment = useCallback(
    (entry: DetailComment) => {
      const next = [entry, ...ref.current];
      if (!writeLocalComments(slug, next)) return false;
      ref.current = next;
      setComments(next);
      window.dispatchEvent(new Event(LOCAL_COMMENTS_EVENT));
      pushLocalComments();
      return true;
    },
    [slug]
  );

  const removeComment = useCallback(
    (id: string) => {
      const next = ref.current.filter((c) => c.id !== id);
      if (next.length === ref.current.length) return true;
      if (!writeLocalComments(slug, next)) return false;
      markCommentDeleted(id);
      ref.current = next;
      setComments(next);
      window.dispatchEvent(new Event(LOCAL_COMMENTS_EVENT));
      pushLocalComments();
      return true;
    },
    [slug]
  );

  return { comments, addComment, removeComment };
}

export function CommentsSection({
  slug,
  comments,
  className = "",
}: {
  slug: string;
  comments: DetailComment[];
  className?: string;
}) {
  const { user, loading: authLoading } = useAuthSession();
  const viewerMeta = useMemo(() => (user ? profileMeta(user) : null), [user]);
  const viewerName = viewerMeta
    ? viewerMeta.displayName || viewerMeta.emoji || user?.email?.split("@")[0] || "Bạn"
    : "";
  const { comments: localComments, addComment, removeComment } = useLocalComments(slug);
  const viewerIsAdmin = !!viewerMeta && isAdminRole(viewerMeta.role, viewerMeta.subscriptionTier);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<"new" | "top">("new");
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const sync = () => {
      setHiddenIds(readHiddenCommentIds());
      setPinnedIds(readPinnedCommentIds());
    };
    sync();
    window.addEventListener(LOCAL_COMMENTS_EVENT, sync);
    return () => window.removeEventListener(LOCAL_COMMENTS_EVENT, sync);
  }, []);

  const allComments = useMemo(
    () =>
      [...localComments, ...comments]
        .filter((c) => !hiddenIds.includes(String(c.id)))
        .map((c) => ({ ...c, pinned: c.pinned || pinnedIds.includes(String(c.id)) })),
    [localComments, comments, hiddenIds, pinnedIds]
  );
  const sorted = useMemo(() => sortComments(allComments, sort), [allComments, sort]);
  const visible = showMore ? sorted : sorted.slice(0, 5);
  const allShown = sorted.length <= 5;
  const restoreComment = useCallback((id: string) => {
    unhideComment(id);
    setHiddenIds(readHiddenCommentIds());
  }, []);

  const submit = useCallback(() => {
    const text = draft.trim();
    if (!text || !user || !viewerMeta) return;
    const now = new Date();
    const entry: DetailComment = {
      id: `local-${now.getTime()}`,
      pinned: false,
      admin: viewerMeta.role === "admin",
      name: viewerName,
      gender: viewerMeta.gender === "male" || viewerMeta.gender === "female" ? viewerMeta.gender : null,
      time: now.toLocaleDateString("vi-VN"),
      content: text,
      likes: 0,
      dislikes: 0,
      // Để trống khi chưa có ảnh: CommentItem sẽ hiện chữ cái đầu như chophim.
      avatar: viewerMeta.avatarUrl || "",
      frame: viewerMeta.frameUrl || null,
      emoji: viewerMeta.selectedEmoji || viewerMeta.emoji || null,
      createdAt: now.toISOString(),
      userId: user.id,
      role: viewerMeta.role || null,
      subscriptionTier: viewerMeta.subscriptionTier || null,
    };
    if (!addComment(entry)) {
      setError("Không thể gửi bình luận");
      return;
    }
    setError(null);
    setDraft("");
    setSort("new");
    setShowMore(true);
  }, [addComment, draft, user, viewerMeta, viewerName]);

  const deleteOwn = useCallback(
    (id: string) => {
      // Xóa bản local rồi ẩn luôn ID để admin có thể gỡ cả comment tĩnh từ DB.
      if (!removeComment(id) || !hideComment(id)) {
        setError("Không thể xóa bình luận");
        return false;
      }
      setError(null);
      return true;
    },
    [removeComment]
  );

  return (
    <div id="comment-section" className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle w-6 h-6 text-white fill-white" aria-hidden="true">
            <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
          </svg>
          <h2 className="text-xl font-bold text-white">
            Bình luận <span className="text-white/60">({allComments.length})</span>
          </h2>
        </div>
        <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5 text-[12px] font-medium">
          <button
            type="button"
            aria-pressed={sort === "new"}
            onClick={() => setSort("new")}
            className={`rounded-md px-2.5 py-1.5 transition-colors ${sort === "new" ? "bg-white/10 text-white" : "text-white/45 hover:text-white/80"}`}
          >
            Mới nhất
          </button>
          <button
            type="button"
            aria-pressed={sort === "top"}
            onClick={() => setSort("top")}
            className={`rounded-md px-2.5 py-1.5 transition-colors ${sort === "top" ? "bg-white/10 text-white" : "text-white/45 hover:text-white/80"}`}
          >
            Nổi bật
          </button>
        </div>
      </div>

      {authLoading ? null : user && viewerMeta ? (
        <div className="mb-8 p-3 sm:p-4 bg-[#191b24] border border-white/5 rounded-xl">
          <div className="flex items-center gap-2.5 px-1 mb-3">
            <UserAvatar
              name={viewerName}
              avatarUrl={viewerMeta.avatarUrl || undefined}
              frameUrl={viewerMeta.frameUrl || undefined}
              emoji={viewerMeta.selectedEmoji || viewerMeta.emoji || undefined}
              size={44}
              frameScale={1.35}
              sizeClassName="!h-9 !w-9 sm:!h-11 sm:!w-11"
            />
            <span className="text-[13px] font-semibold text-white">{viewerName}</span>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Viết bình luận"
            maxLength={1000}
            rows={5}
            className="w-full bg-[#0f111a] border-none rounded-lg px-4 py-3 pt-4 text-[14px] text-white placeholder:text-text-muted resize-none focus:outline-none focus:ring-1 transition-shadow focus:ring-white/10 block"
          />
          <div className="mt-3 flex items-center justify-end gap-3 px-1 pb-1 sm:px-2">
            <span className={`text-[11px] ${draft.length > 950 ? "text-red-400 font-bold" : "text-text-muted"}`}>
              {draft.length} / 1000
            </span>
            <button
              type="button"
              disabled={!draft.trim()}
              onClick={submit}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[#F5C518] hover:bg-white/5 disabled:opacity-40 transition-opacity"
            >
              <span className="font-bold text-[14px]">Gửi</span>
              <IconSend className="w-4 h-4 text-[#F5C518]" />
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mt-2 px-2">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-8 p-4 bg-[#1a1a24] border border-white/10 rounded-xl">
          <IconLogIn className="w-5 h-5 text-text-muted shrink-0" />
          <p className="text-sm text-text-muted">Đăng nhập để bình luận về phim này.</p>
        </div>
      )}

      {viewerIsAdmin && hiddenIds.length > 0 ? (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#191b24] px-4 py-3">
          <span className="text-[12px] font-semibold text-white/70">Đã ẩn {hiddenIds.length} bình luận</span>
          {hiddenIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => restoreComment(id)}
              className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/55 hover:border-[#FFD166]/40 hover:text-[#FFD166]"
            >
              Khôi phục #{id}
            </button>
          ))}
        </div>
      ) : null}

      {allComments.length > 0 ? (
        <div className="divide-y divide-white/5">
          {visible.map((c) => (
            <CommentItem
              key={c.id}
              c={c}
              currentUserId={user?.id ?? null}
              currentUserRole={viewerMeta?.role ?? null}
              currentUserTier={viewerMeta?.subscriptionTier ?? null}
              onDelete={viewerIsAdmin || c.userId ? deleteOwn : undefined}
              onTogglePin={viewerIsAdmin ? () => togglePinnedComment(c.id) : undefined}
              onHide={viewerIsAdmin ? (id) => hideComment(id) : undefined}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/45">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
      )}

      {!allShown && allComments.length > 0 && (
        <div className="flex justify-center gap-3 mt-4">
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-white/70 hover:text-white transition-all"
          >
            <IconChevronDown className="w-4 h-4" />
            Xem thêm bình luận
          </button>
        </div>
      )}
    </div>
  );
}

/* ── component chính ───────────────────────────────────────────────────── */

export function DetailPage({
  movie,
  comments,
  suggestions,
}: {
  movie: MovieDetail;
  comments: DetailComment[];
  suggestions: Suggestion[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Tập phim");
  const [sv, setSv] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [hideImg, setHideImg] = useState(false);
  const duration = useMovieDuration(movie);

  const serverIdx = Math.min(sv, Math.max(movie.servers.length - 1, 0));
  const server = movie.servers[serverIdx];
  const backdrop = movie.backdrop || movie.poster;

  const cur = movie.current ?? server?.episodes.length ?? 0;
  const total = movie.total ?? server?.episodes.length ?? 0;

  const goComment = () => document.getElementById("comment-section")?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      {/* ── Backdrop ── */}
      <div className="relative h-[210px] md:h-[600px] lg:h-[70vh] xl:max-h-[800px] overflow-hidden bg-bg-primary">
        <img alt={movie.title} decoding="async" className="object-cover object-center scale-105 opacity-70 md:opacity-80" style={fillStyle} src={backdrop} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            WebkitMaskImage: "radial-gradient(ellipse at center, transparent 65%, black 100%)",
            maskImage: "radial-gradient(ellipse at center, transparent 65%, black 100%)",
          }}
        >
          <img alt={movie.title} loading="lazy" decoding="async" className="object-cover object-center blur-sm md:blur-md scale-110 opacity-90" style={fillStyle} src={backdrop} />
        </div>
        <div
          className="absolute inset-0 pointer-events-none opacity-20 md:opacity-30"
          style={{ backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.8) 0.3px, transparent 1px)", backgroundSize: "2px 2px" }}
        />
        <div
          className="absolute bottom-0 inset-x-0 h-[80%] pointer-events-none md:hidden"
          style={{ background: "linear-gradient(to top, #0f111a 5%, rgba(10, 10, 15, 0.6) 30%, rgba(10, 10, 15, 0) 100%)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/40 to-transparent pointer-events-none hidden md:block" />
      </div>

      {/* ── Nội dung ── */}
      <div className="max-w-[1400px] mx-auto px-4 -mt-24 md:-mt-48 lg:-mt-64 relative z-10 mb-20">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
          {/* Cột poster + nội dung phim */}
          <div className="shrink-0 w-40 md:w-56 lg:w-64 max-w-[280px] mx-auto md:mx-0 flex flex-col gap-8">
            <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-bg-primary/50 ring-1 ring-white/10 bg-[#16161e] w-full aspect-[2/3] flex items-center justify-center">
              <svg className="absolute w-12 h-12 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              <img alt={movie.title} loading="lazy" decoding="async" className="w-full h-full object-cover relative z-10" style={fillStyle} src={movie.poster} />
            </div>
            <div className="hidden md:block">
              <div>
                <h3 className="text-[16px] font-semibold text-text-primary mb-3">Nội dung phim</h3>
                <div className="relative text-sm text-text-secondary leading-relaxed overflow-hidden ">
                  <div>{movie.description || "Đang cập nhật nội dung phim..."}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột thông tin */}
          <div className="flex-1 md:pt-12 min-w-0">
            <h1 className="text-[22px] md:text-3xl font-bold text-text-primary mb-1 text-center md:text-left leading-tight">{movie.title}</h1>
            {movie.origin && (
              <p className="text-[13px] md:text-sm text-text-secondary mb-4 text-center md:text-left">{movie.origin}</p>
            )}
            <Badges movie={movie} size="md" />
            <InfoGrid movie={movie} size="md" duration={duration} />

            <div className="flex flex-col md:flex-row justify-center md:justify-start items-center gap-3 mb-8 w-full">
              <a
                className="inline-flex justify-center items-center gap-2 md:gap-2.5 px-6 md:px-8 py-3.5 md:py-3 text-[#0f1115] text-[15px] md:text-base font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-[rgba(254,207,89,0.3)] w-[85%] max-w-[340px] md:max-w-none md:w-auto min-w-[140px]"
                href={watchHref(movie.slug)}
                style={{ background: "linear-gradient(39deg, rgb(254, 207, 89), rgb(255, 241, 204)) rgb(254, 207, 89)" }}
              >
                <IconPlay className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                Xem ngay
              </a>
              {movie.trailer && (
                <a
                  href={movie.trailer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline-flex justify-center items-center gap-2 px-6 md:px-7 py-3.5 md:py-3 bg-white/10 hover:bg-white/20 text-white text-[15px] font-medium rounded-full transition-colors w-[85%] max-w-[340px] md:max-w-none md:w-auto min-w-[120px]"
                >
                  Trailer
                </a>
              )}
              <div className="hidden md:block w-px h-8 bg-white/10 mx-1" />
              <ActionButtons mobile={false} movie={movie} />
            </div>

            <ActionButtons mobile movie={movie} />

            {/* Thông tin phim (mobile) */}
            <div className="md:hidden w-full mb-6 mt-2 flex flex-col items-center">
              <button
                className="flex items-center gap-2 text-[15px] font-bold mb-2 transition-colors"
                style={{ color: "rgb(229, 192, 123)" }}
                onClick={() => setInfoOpen((v) => !v)}
                aria-expanded={infoOpen}
              >
                Thông tin phim
                <svg className={`w-4 h-4 transition-transform duration-300 mt-0.5 ${infoOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`w-full text-left transition-all duration-300 overflow-hidden ${infoOpen ? "max-h-[1400px] opacity-100" : "max-h-0 opacity-0"}`}>
                <Badges movie={movie} size="sm" />
                <InfoGrid movie={movie} size="sm" duration={duration} />
                <div className="mb-4 text-left md:hidden">
                  <h3 className="text-[16px] font-semibold text-text-primary mb-3">Nội dung phim</h3>
                  <div className="text-sm text-text-secondary leading-relaxed">{movie.description || "Đang cập nhật nội dung phim..."}</div>
                </div>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="mt-2">
              <div className="mt-10">
                <div className="flex items-center gap-6 border-b border-white/10 overflow-x-auto scrollbar-hide">
                  {TABS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`pb-3 text-[13px] md:text-[15px] font-semibold transition-colors relative whitespace-nowrap ${
                        tab === t ? "text-[#F5C518]" : "text-text-secondary hover:text-white"
                      }`}
                    >
                      {t}
                      {tab === t && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#F5C518] rounded-t-md" />}
                    </button>
                  ))}
                </div>

                <div className="min-h-[200px]">
                  <div className="animate-fade-in" key={tab}>
                    {tab === "Tập phim" && (
                      <>
                        {/* Phần / Máy chủ — giữ đúng cụm điều khiển của chophim.wtf */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-6">
                          <PartSelector movie={movie} mode="detail" withDivider />
                          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-white/50 mr-1">
                            <IconServer className="w-4 h-4" />
                            Máy chủ:
                          </div>
                          {movie.servers.map((s, i) => {
                            const Icon = SERVER_ICONS[i % SERVER_ICONS.length];
                            const active = i === serverIdx;
                            return (
                              <button
                                key={s.name}
                                onClick={() => setSv(i)}
                                className={`group flex items-center gap-1.5 text-[13px] transition-colors rounded-md px-3.5 py-2 border ${
                                  active ? "border-white/30 text-white bg-white/5 font-medium" : "text-white/60 hover:text-white border-transparent bg-white/5"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                <span>{s.name}</span>
                                <span
                                  className={`flex items-center justify-center w-[20px] h-[20px] rounded-full font-bold text-[10px] ml-1 shrink-0 transition-colors ${
                                    active ? "bg-white text-black" : "bg-white/10 text-white/50 group-hover:text-white/80"
                                  }`}
                                >
                                  {s.episodes.length}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Danh sách tập */}
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <h3 className="text-sm font-bold text-white/80">
                            Danh sách tập <span className="text-white/60">( {cur} / <span className="text-[#FFD166]">{total}</span> )</span>
                          </h3>
                          <button
                            type="button"
                            aria-pressed={hideImg}
                            onClick={() => setHideImg((v) => !v)}
                            className="inline-flex items-center gap-1.5 px-1 py-0.5 text-xs font-normal text-white/65 transition-colors hover:text-white"
                          >
                            <span>Ẩn ảnh</span>
                            <span className={`relative h-6 w-10 rounded-full transition-colors ${hideImg ? "bg-[#FFD166]/70" : "bg-white/20"}`}>
                              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${hideImg ? "left-[18px]" : "left-0.5"}`} />
                            </span>
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-x-2.5 gap-y-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                          {server?.episodes.map((ep, i) => (
                            <a
                              key={`${server.name}-${i}`}
                              className="group flex items-center justify-center gap-1.5 rounded-lg border-2 border-transparent bg-[#191b24] px-2 py-2 text-[13px] text-white/90 shadow-sm transition-colors hover:border-[#FFD166] hover:text-[#FFD166]"
                              href={watchHref(movie.slug, `#tap=tap-${i + 1}&sv=${enc(server.name)}&channel=0&server_id=${serverIdx}`)}
                            >
                              <IconPlaySmall className="h-3 w-3 shrink-0 fill-white/80 group-hover:fill-[#FFD166]" />
                              {ep.label}
                            </a>
                          ))}
                        </div>
                      </>
                    )}

                    {tab === "Gallery" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {backdrop && (
                          <figure className="relative aspect-video rounded-xl overflow-hidden bg-bg-secondary ring-1 ring-white/5">
                            <img alt={`${movie.title} backdrop`} loading="lazy" decoding="async" className="object-cover" style={fillStyle} src={backdrop} />
                          </figure>
                        )}
                        {movie.poster && (
                          <figure className="relative aspect-[2/3] rounded-xl overflow-hidden bg-bg-card ring-1 ring-white/5 sm:max-w-[220px]">
                            <img alt={`${movie.title} poster`} loading="lazy" decoding="async" className="object-cover" style={fillStyle} src={movie.poster} />
                          </figure>
                        )}
                        {!backdrop && !movie.poster && <p className="text-sm text-text-muted">Chưa có ảnh cho phim này.</p>}
                      </div>
                    )}

                    {tab === "Diễn viên" && (
                      <div className="mt-6">
                        <p className="text-sm text-text-muted">Chưa có thông tin diễn viên cho phim này.</p>
                      </div>
                    )}

                    {tab === "Đề xuất" && (
                      <div className="mt-6">
                        {suggestions.length === 0 ? (
                          <p className="text-sm text-text-muted">Chưa có phim đề xuất.</p>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {suggestions.map((s) => (
                              <a key={s.slug} href={detailHref(s.slug)} className="group block">
                                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-bg-card ring-1 ring-white/5 flex items-center justify-center">
                                  <svg className="absolute w-10 h-10 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                  </svg>
                                  <img alt={s.title} loading="lazy" decoding="async" className="object-cover relative z-10 w-full h-full" src={s.poster} />
                                </div>
                                <h4 className="mt-1.5 text-[12px] font-semibold text-text-primary truncate group-hover:text-yellow-400 transition-colors">{s.title}</h4>
                                <p className="text-[10px] text-text-muted truncate">{[s.year, s.quality].filter(Boolean).join(" · ")}</p>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bình luận ── */}
        <CommentsSection slug={movie.slug} comments={comments} className="mt-10 border-t border-white/10 pt-8" />
      </div>
    </>
  );
}
