// Nhận diện/cắt quảng cáo KK từ playlist M3U8 theo đúng dấu hiệu của chophim.wtf:
// cặp #EXT-X-DISCONTINUITY bao quanh khối có #EXT-X-KEY:METHOD=NONE và segment /vN/...

export type AdRange = { start: number; end: number };

const DISC = "#EXT-X-DISCONTINUITY";
const NONE_KEY = /^#EXT-X-KEY:(?:[^,]*,)*METHOD=NONE(?:,|$)/i;
const V_SEGMENT = /^\/v\d+\//i;
const EXTINF = /^#EXTINF:([\d.]+)/i;

const isSegment = (line: string) => {
  const t = line.trim();
  return !!t && !t.startsWith("#");
};

function adBlocks(lines: string[]): Array<{ start: number; end: number }> {
  const blocks: Array<{ start: number; end: number }> = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== DISC) continue;
    let end = -1;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === DISC) {
        end = j;
        break;
      }
    }
    if (end < 0) continue;
    let hasNoneKey = false;
    let hasVSegment = false;
    for (let k = i + 1; k < end; k++) {
      const t = lines[k].trim();
      if (NONE_KEY.test(t)) hasNoneKey = true;
      else if (isSegment(t) && V_SEGMENT.test(t)) hasVSegment = true;
    }
    if (hasNoneKey && hasVSegment) blocks.push({ start: i, end });
  }
  return blocks;
}

/** Trả về playlist đã bỏ hẳn dòng quảng cáo, hoặc null nếu không có QC. */
export function stripKkAds(text: string): string | null {
  if (!text.includes("#EXTINF") || !text.includes(DISC)) return null;
  const lines = text.split(/\r?\n/);
  const blocks = adBlocks(lines);
  if (!blocks.length) return null;
  const remove = new Set<number>();
  for (const b of blocks) for (let i = b.start; i < b.end; i++) remove.add(i);
  return lines.filter((_, i) => !remove.has(i)).join("\n");
}

/** Tính khoảng thời gian quảng cáo tính từ đầu video (dùng cho Safari/native HLS). */
export function detectKkAdRanges(text: string): AdRange[] {
  if (!text.includes("#EXTINF") || !text.includes(DISC)) return [];
  const lines = text.split(/\r?\n/);
  const blocks = adBlocks(lines);
  if (!blocks.length) return [];

  const marked = new Set<number>();
  for (const b of blocks) for (let i = b.start; i <= b.end; i++) marked.add(i);

  const found: AdRange[] = [];
  let time = 0;
  let duration = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(EXTINF);
    if (match) {
      duration = Number(match[1]);
      continue;
    }
    if (isSegment(line)) {
      if (marked.has(i) && duration > 0) found.push({ start: time, end: time + duration });
      time += duration;
      duration = 0;
    }
  }

  const sorted = found.filter((r) => r.end > r.start).sort((a, b) => a.start - b.start);
  const merged: AdRange[] = [];
  for (const r of sorted) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end + 0.05) last.end = Math.max(last.end, r.end);
    else merged.push({ ...r });
  }
  return merged;
}

/** Đọc master rồi variant để lấy khoảng QC. */
export async function loadKkAdRanges(url: string, signal?: AbortSignal): Promise<AdRange[]> {
  try {
    const res = await fetch(url, { cache: "no-store", signal });
    if (!res.ok) return [];
    const text = await res.text();
    const direct = detectKkAdRanges(text);
    if (direct.length) return direct;

    const lines = text.split(/\r?\n/);
    let variant: string | null = null;
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].trim().startsWith("#EXT-X-STREAM-INF")) continue;
      for (let j = i + 1; j < lines.length; j++) {
        const t = lines[j].trim();
        if (t && !t.startsWith("#")) {
          variant = new URL(t, url).toString();
          break;
        }
      }
      if (variant) break;
    }
    if (!variant) return [];
    const variantRes = await fetch(variant, { cache: "no-store", signal });
    if (!variantRes.ok) return [];
    return detectKkAdRanges(await variantRes.text());
  } catch {
    return [];
  }
}
