import type { MovieItem } from "./types";
import { IconLanguages } from "./icons";

const BADGE_BG: Record<string, string> = {
  "PĐ": "bg-[#5E6070]/95",
  "TM": "bg-[#2CA35D]/95",
  "LT": "bg-[#1667CF]/95",
  "SN": "bg-[#8B5CF6]/95",
};

type Part = { label: string; value: string };

/** "PĐ. 12TM. 12" -> [{PĐ,12},{TM,12}] */
export function parseBadges(text: string): Part[] {
  const chunks = text.split(/(?=(?:PĐ|TM|LT|SN)\.)/);
  return chunks.map((c) => {
    const m = c.match(/^([A-ZĐ]+)\.\s*(.*)$/);
    return m ? { label: m[1], value: m[2] } : { label: "", value: c };
  });
}

const CONTAINER_LANDSCAPE_INNER =
  "flex z-10 flex-col md:flex-row md:flex-nowrap gap-1 md:gap-0 items-start md:items-end justify-start pl-1 sm:pl-2 md:pl-2.5 lg:pl-3";
const CONTAINER_POSTER_INNER =
  "flex z-10 w-full flex-col md:flex-row md:flex-nowrap gap-1 md:gap-0 items-start md:items-end justify-start pl-1 sm:pl-2 md:pl-0 md:justify-center";
const SPAN_LANDSCAPE =
  "text-[10px] px-1.5 md:px-2 py-[1px] md:py-0.5 rounded-full md:rounded-none md:first:rounded-tl-sm md:last:rounded-tr-sm backdrop-blur-sm shadow-sm whitespace-nowrap ";
const SPAN_POSTER =
  "text-[9px] md:text-[10.5px] px-1.5 md:px-2.5 py-[1px] md:py-[3px] rounded-full backdrop-blur-sm shadow-sm md:rounded-none whitespace-nowrap md:first:rounded-tl-md md:last:rounded-tr-md ";

/** Badge góc dưới (PĐ/TM/LT/SN hoặc "Sắp chiếu") */
export function BottomBadges({ item, poster = false }: { item: MovieItem; poster?: boolean }) {
  const b = item.badges.find((x) => x.pos === "bottom");
  if (!b) return null;

  if (b.text === "Sắp chiếu") {
    return (
      <div className={b.cls}>
        <div className="w-full flex justify-center">
          <span className="text-[9px] md:text-[11px] font-bold px-1.5 md:px-3 py-0.5 md:py-1 bg-white text-black rounded-sm md:rounded-none md:rounded-t-md shadow-md z-10 transition-transform">
            Sắp chiếu
          </span>
        </div>
      </div>
    );
  }

  const parts = parseBadges(b.text);
  const innerCls = poster ? CONTAINER_POSTER_INNER : CONTAINER_LANDSCAPE_INNER;
  const spanBase = poster ? SPAN_POSTER : SPAN_LANDSCAPE;

  return (
    <div className={b.cls}>
      <div className={innerCls}>
        {parts.map((p, i) => {
          const bg = BADGE_BG[p.label] ?? BADGE_BG["PĐ"];
          const textCls = p.label === "SN" ? "text-[#141414] font-bold " : "text-white ";
          return (
            <span key={i} className={spanBase + textCls + bg}>
              <span className="font-normal md:font-bold">{p.label}.</span>
              <span className="font-bold"> {p.value}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Badge "Song Ngữ" góc trên */
export function TopBadge({ item }: { item: MovieItem }) {
  const b = item.badges.find((x) => x.pos === "top");
  if (!b) return null;
  return (
    <div
      className={b.cls}
      style={{
        backgroundColor: "#8B5CF6",
        backgroundImage: "linear-gradient(220deg, #8B5CF6 0%, #c4b5fd 70%, #ffffff 100%)",
      }}
    >
      <IconLanguages className="lucide lucide-languages h-2.5 w-2.5 shrink-0 text-[#141414] md:h-3 md:w-3" />
      <span>{b.text}</span>
    </div>
  );
}
