"use client";

import { useEffect, useMemo, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import {
  LOCAL_COMMENTS_EVENT,
  readAllLocalComments,
} from "@/lib/local-comments";
import { detailHref, useLiveData, useLiveHome } from "@/lib/live-data";
import { frameAssetSrc } from "@/lib/avatar-data";
import { fillStyle, type CommentItem, type RankRow } from "./types";
import type { DetailComment, MovieDetail } from "./detail-types";
import { SliderArrows } from "./SliderArrows";
import {
  FlameCustom,
  IconFlame,
  IconHeart,
  IconFolder,
  IconInfinity,
  IconCircleArrowUp,
  IconCircleArrowDown,
  IconMessageSquare,
  TrendIcon,
} from "./icons";

/* ------------------------------------------------------------------ */
/* Icon giới tính / vĩnh viễn                                          */
/* ------------------------------------------------------------------ */
function GenderIcon({ gender }: { gender: string | null }) {
  if (gender === "female") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-venus h-[18px] w-[18px] text-[#ffd875]"
        aria-hidden="true"
      >
        <path d="M12 15v7" />
        <path d="M9 19h6" />
        <circle cx="12" cy="9" r="6" />
      </svg>
    );
  }
  if (gender === "male") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-mars w-5 h-5 text-[#ffd875]"
        aria-hidden="true"
      >
        <path d="M16 3h5v5" />
        <path d="m21 3-6.75 6.75" />
        <circle cx="10" cy="14" r="6" />
      </svg>
    );
  }
  return <IconInfinity className="h-[18px] w-[18px] text-white/35" />;
}

/* ------------------------------------------------------------------ */
/* Thẻ bình luận                                                       */
/* ------------------------------------------------------------------ */
function cleanContent(content: string, isSpoiler?: boolean): string {
  if (isSpoiler) return "Bình luận có chứa spoiler — bấm để xem chi tiết";
  return content.replace(/\[gif\][\s\S]*?\[\/gif\]/g, " ").trim() || "Đã gửi một GIF";
}

/** Bình luận gửi từ browser chưa có trong bản tĩnh; đưa về dạng thẻ "Bình Luận Mới". */
function localToHomeComment(
  slug: string,
  c: DetailComment,
  movie: MovieDetail
): CommentItem {
  const role = c.role || (c.admin ? "admin" : "user");
  return {
    id: c.id,
    movieSlug: slug,
    movieName: movie.title,
    posterUrl: movie.poster,
    backdropUrl: movie.backdrop || movie.poster,
    content: c.content,
    likes: c.likes,
    dislikes: c.dislikes,
    replies: 0,
    user: {
      displayName: c.name,
      avatarUrl: c.avatar || "",
      avatarFrame: c.frame,
      subscriptionTier: "free",
      role,
      gender: c.gender,
      selectedEmoji: c.emoji,
      showPremiumBadge: false,
    },
    createdAt: c.createdAt,
    parentId: null,
    isSpoiler: false,
  };
}

function CommentCard({ c }: { c: CommentItem }) {
  const premium = c.user.subscriptionTier === "premium";
  const admin = c.user.role === "admin";
  const commentId = c.parentId ? `${c.parentId}-reply-${c.id}` : c.id;
  const href = `${detailHref(c.movieSlug)}#comment-${commentId}`;

  return (
    <div className="shrink-0 !w-[260px] sm:!w-[280px] lg:!w-[290px] snap-start">
      <a
        className="group relative block h-[190px] w-full overflow-hidden rounded-lg bg-[#171821]/10 backdrop-blur-[6px] px-5 pt-5 pb-3 transition-colors duration-300"
        aria-label={`Bình luận của ${c.user.displayName} trong ${c.movieName}`}
        href={href}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          loading="lazy"
          decoding="async"
          className="object-cover opacity-25 blur-[4px] scale-110 transition-opacity duration-300 group-hover:opacity-35"
          style={fillStyle}
          src={c.backdropUrl}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#171821]/10 via-[#171821]/30 to-[#171821]/10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-[#0f111a] via-[#0f111a]/50 to-transparent pointer-events-none" />

        <div className="absolute right-5 top-5 h-[72px] w-[48px] overflow-hidden rounded-md bg-black/30 shadow-2xl ring-1 ring-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={c.movieName}
            loading="lazy"
            decoding="async"
            className="object-cover"
            style={fillStyle}
            src={c.posterUrl}
          />
        </div>

        <div className="relative z-10 flex h-full flex-col">
          <div className="pr-16">
            <div className="w-fit">
              <div className="relative shrink-0">
                <div
                  className={
                    premium
                      ? "avatar-ring-premium group-hover:ring-white"
                      : "ring-1 ring-white/15 rounded-full p-[2px] transition-colors group-hover:ring-white"
                  }
                >
                  {c.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      loading="lazy"
                      width={44}
                      height={44}
                      decoding="async"
                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover relative z-10"
                      src={c.user.avatarUrl}
                    />
                  ) : (
                    <span className="relative z-10 flex w-9 h-9 sm:w-11 sm:h-11 items-center justify-center rounded-full bg-[#FFD166] text-[15px] font-bold text-[#1c1c1c]">
                      {c.user.selectedEmoji || c.user.displayName.trim().charAt(0).toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                {c.user.avatarFrame && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="avatar-frame pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
                    src={frameAssetSrc(c.user.avatarFrame)}
                  />
                )}
              </div>
            </div>
            <div className="mt-3 flex min-w-0 items-center gap-1.5">
              {admin && (
                <span className="rounded-[4px] bg-[#ffd875] px-1.5 py-0.5 text-[9px] font-black leading-none text-[#171821]">
                  ADMIN
                </span>
              )}
              <span className="truncate text-[14px] font-bold text-white">{c.user.displayName}</span>
              <span className="shrink-0 scale-90 origin-left">
                <GenderIcon gender={c.user.gender} />
              </span>
            </div>
          </div>
          <p
            className="mt-1.5 line-clamp-2 min-h-[40px] text-[13px] font-normal leading-[1.6] text-white/60"
            style={{
              fontFamily:
                'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {cleanContent(c.content, c.isSpoiler)}
          </p>
          <div className="mt-auto flex items-center gap-4 text-[12px] font-semibold text-white/58">
            <span className="inline-flex items-center gap-1.5">
              <IconCircleArrowUp className="h-4 w-4 fill-white/70 text-[#171821]" />
              {c.likes}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconCircleArrowDown className="h-4 w-4 fill-white/70 text-[#171821]" />
              {c.dislikes}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconMessageSquare className="h-4 w-4 fill-white/70 text-white/70" />
              {c.replies}
            </span>
          </div>
        </div>
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cột bảng xếp hạng                                                   */
/* ------------------------------------------------------------------ */
const GENRE_CLS = [
  "bg-amber-500/90",
  "bg-emerald-500/90",
  "bg-orange-500/90",
  "bg-pink-500/90",
  "bg-slate-500/90",
];

function RankRowLink({ r, i, genres = false }: { r: RankRow; i: number; genres?: boolean }) {
  const href = genres ? withBasePath(`/the-loai/${r.slug}`) : detailHref(r.slug);
  return (
    <a
      className="flex items-center gap-2.5 px-1 h-[52px] rounded-lg hover:bg-white/[0.04] transition-colors group"
      href={href}
    >
      <span className="text-[13px] font-bold text-text-muted w-4 text-center shrink-0">{i + 1}.</span>
      <TrendIcon dir={r.trendDirection} />
      {genres ? (
        <span
          className={`text-[12px] font-semibold px-4 py-1.5 rounded-full text-white shadow-sm ${
            GENRE_CLS[i % GENRE_CLS.length]
          }`}
        >
          {r.name}
        </span>
      ) : (
        <>
          <div className="relative w-7 h-10 rounded-sm overflow-hidden shrink-0 bg-bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={r.name}
              loading="lazy"
              decoding="async"
              className="object-cover"
              style={fillStyle}
              src={r.poster_url}
            />
          </div>
          <span className="text-[13px] sm:text-[14px] text-white/85 group-hover:text-white transition-colors line-clamp-1 flex-1">
            {r.name}
          </span>
        </>
      )}
    </a>
  );
}

function RankColumn({
  title,
  icon,
  rows,
  padCls,
  genres = false,
  onViewMore,
}: {
  title: string;
  icon: React.ReactNode;
  rows: RankRow[];
  padCls: string;
  genres?: boolean;
  onViewMore: () => void;
}) {
  return (
    <div className="w-[85vw] sm:w-[350px] lg:w-auto shrink-0 snap-start">
      <div className={`px-5 py-6 sm:px-7 flex flex-col h-full ${padCls}`}>
        <div className="flex items-center gap-2.5 mb-3.5">
          {icon}
          <h3 className="text-[14px] sm:text-[15px] font-bold text-white tracking-wide uppercase">
            {title}
          </h3>
        </div>
        <div className="flex flex-col gap-0.5 flex-1">
          {rows.slice(0, 5).map((r, i) => (
            <RankRowLink key={r.slug + i} r={r} i={i} genres={genres} />
          ))}
        </div>
        <button
          type="button"
          onClick={onViewMore}
          className="mt-3 text-[12px] text-text-muted hover:text-white transition-colors inline-flex items-center gap-1 w-max"
        >
          Xem thêm
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal "Xem thêm" — giống chophim.wtf: bấm nền hoặc nút X để đóng   */
/* ------------------------------------------------------------------ */
type RankKind = "hot" | "fav" | "genre";

const RANK_TITLES: Record<RankKind, string> = {
  hot: "Sôi Nổi Nhất",
  fav: "Yêu Thích Nhất",
  genre: "Thể Loại Hot",
};

function RankModal({ kind, onClose }: { kind: RankKind; onClose: () => void }) {
  const { rankings } = useLiveHome();
  const rows = kind === "hot" ? rankings.hot : kind === "fav" ? rankings.favorite : rankings.genres;
  const icon =
    kind === "hot" ? (
      <IconFlame className="w-[18px] h-[18px] text-[#ffd875] fill-[#ffd875]" />
    ) : kind === "fav" ? (
      <IconHeart className="w-[18px] h-[18px] text-[#ffd875] fill-[#ffd875]" />
    ) : (
      <IconFolder className="w-[18px] h-[18px] text-[#ffd875] fill-[#ffd875]" />
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={RANK_TITLES[kind]}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            {icon}
            <h3 className="text-[15px] font-bold text-white tracking-wide uppercase">
              {RANK_TITLES[kind]}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-text-muted transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="p-2 sm:p-4 overflow-y-auto flex flex-col gap-1">
          {rows.map((r, i) => (
            <RankRowLink key={r.slug + i} r={r} i={i} genres={kind === "genre"} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hộp Bình Luận Mới + Bảng Xếp Hạng (S:5 + S:6)                      */
/* ------------------------------------------------------------------ */
export function SocialBox() {
  const home = useLiveHome();
  const { movies } = useLiveData();
  const [localCards, setLocalCards] = useState<CommentItem[]>([]);
  const [modal, setModal] = useState<RankKind | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      const cards = readAllLocalComments()
        .map(({ slug, comment }) => {
          const movie = movies[slug];
          return movie ? localToHomeComment(slug, comment, movie) : null;
        })
        .filter((card): card is CommentItem => card !== null)
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
      if (alive) setLocalCards(cards);
    };
    load();
    const reload = () => load();
    window.addEventListener(LOCAL_COMMENTS_EVENT, reload);
    window.addEventListener("storage", reload);
    window.addEventListener("focus", reload);
    document.addEventListener("visibilitychange", reload);
    return () => {
      alive = false;
      window.removeEventListener(LOCAL_COMMENTS_EVENT, reload);
      window.removeEventListener("storage", reload);
      window.removeEventListener("focus", reload);
      document.removeEventListener("visibilitychange", reload);
    };
  }, [movies]);

  const comments = useMemo(
    () =>
      [...localCards, ...home.comments].sort((a, b) =>
        String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
      ),
    [home.comments, localCards]
  );

  return (
    <section className="rounded-2xl border border-white/[0.09] bg-transparent flex flex-col">
      {/* --- Bình luận mới --- */}
      <div className="relative px-5 py-6 sm:px-7 lg:px-10">
        <div className="mb-4 flex items-center gap-2.5">
          <FlameCustom className="h-[22px] w-[22px] fill-[#ffd875] text-[#ffd875]" />
          <h2 className="text-[14px] sm:text-[15px] font-bold uppercase tracking-wide text-white">
            Bình Luận Mới
          </h2>
        </div>
        <div className="relative group/section">
          <SliderArrows
            id="row-comments"
            pos="top-1/2"
            z="z-10"
            group="section"
            mobileVisible
            prevLabel="Bình luận trước"
            nextLabel="Bình luận tiếp theo"
          />
          <div
            id="row-comments"
            className="-mx-1 px-1 pb-1 overflow-x-auto scrollbar-hide snap-x"
          >
            <div className="flex gap-4 w-max">
              {comments.map((c) => (
                <CommentCard key={c.id} c={c} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- Bảng xếp hạng --- */}
      <div className="border-t border-white/[0.06]">
        <div className="flex overflow-x-auto snap-x snap-mandatory lg:grid lg:grid-cols-3 divide-x divide-white/[0.06] bg-transparent scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <RankColumn
            title="Sôi Nổi Nhất"
            icon={<IconFlame className="w-[22px] h-[22px] text-[#ffd875] fill-[#ffd875]" />}
            rows={home.rankings.hot}
            padCls="lg:pl-10"
            onViewMore={() => setModal("hot")}
          />
          <RankColumn
            title="Yêu Thích Nhất"
            icon={<IconHeart className="w-[22px] h-[22px] text-[#ffd875] fill-[#ffd875]" />}
            rows={home.rankings.favorite}
            padCls="lg:px-8"
            onViewMore={() => setModal("fav")}
          />
          <RankColumn
            title="Thể Loại Hot"
            icon={<IconFolder className="w-[22px] h-[22px] text-[#ffd875] fill-[#ffd875]" />}
            rows={home.rankings.genres}
            padCls="lg:pr-10"
            genres
            onViewMore={() => setModal("genre")}
          />
        </div>
      </div>
      {modal ? <RankModal kind={modal} onClose={() => setModal(null)} /> : null}
    </section>
  );
}
