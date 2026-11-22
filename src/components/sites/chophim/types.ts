import { homeData } from "@/data";

export type Badge = { pos: "top" | "bottom"; text: string; cls: string };

export type MovieItem = {
  href: string;
  img: string;
  alt: string;
  title: string;
  sub: string;
  badges: Badge[];
  variant: string;
  rank: string;
  itemClass: string;
  imgWrapClass: string;
  slug: string;
  meta?: {
    tmdb?: number | null;
    poster?: string;
    genres?: string[];
    countries?: string[];
    logo?: string | null;
    year?: number;
    quality?: string;
    episode?: string;
    imdb?: number;
  };
};

export type Section = {
  id: string;
  heading: string;
  headingParts?: string[];
  viewAll?: { label: string; href: string } | null;
  headingClass?: string;
  sectionClass?: string;
  items: MovieItem[];
  count?: number;
};

export type HeroSlide = {
  slug: string;
  title: string;
  origin: string;
  logo: string | null;
  backdrop: string;
  poster?: string;
  content: string;
  year: number;
  quality: string;
  episode: string;
  tmdb: number;
  imdb?: number;
  genres: string[];
  hrefWatch: string;
  hrefDetail: string;
  logoW?: number;
  logoH?: number;
  logoBox?: { Wmin: number; Wvw: number; Wmax: number; Hmin: number; Hvw: number; Hmax: number };
};

export type CommentItem = {
  id: string;
  movieSlug: string;
  movieName: string;
  posterUrl: string;
  backdropUrl: string;
  content: string;
  likes: number;
  dislikes: number;
  replies: number;
  user: {
    displayName: string;
    avatarUrl: string;
    avatarFrame: string | null;
    subscriptionTier: string;
    role: string;
    gender: string | null;
    selectedEmoji: string | null;
    showPremiumBadge: boolean;
  };
  parentId?: string | null;
  isSpoiler?: boolean;
};

export type RankRow = {
  slug: string;
  name: string;
  poster_url?: string;
  score?: number;
  trendDirection: string;
  count?: number;
};

type Raw = typeof homeData;

export type HomeData = {
  header: Raw["header"];
  hero: { pills: Raw["hero"]["pills"]; slides: HeroSlide[]; thumbs: string[] };
  topics: Raw["topics"];
  moreTopics: Raw["moreTopics"];
  sections: Section[];
  footer: Raw["footer"];
  anime: { slides: Array<{
    slug: string;
    title: string;
    origin: string;
    backdrop: string;
    poster: string;
    content: string;
    year: number;
    quality: string;
    episode: string;
    tmdb: number;
    imdb?: number;
    genres: string[];
    href: string;
  }> };
  comments: CommentItem[];
  rankings: { hot: RankRow[]; favorite: RankRow[]; genres: RankRow[] };
  topicsFull: Raw["topicsFull"];
};

export const home = homeData as unknown as HomeData;

/** style cho <img> phủ kín phần tử cha (giống data-nimg="fill" của Next) */
export const fillStyle: React.CSSProperties = {
  position: "absolute",
  height: "100%",
  width: "100%",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  color: "transparent",
};
