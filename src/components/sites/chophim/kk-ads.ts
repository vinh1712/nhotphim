// Cắt sạch đoạn quảng cáo KK ngay trong playlist M3U8.
// Theo đúng dấu hiệu chophim.wtf: cặp #EXT-X-DISCONTINUITY bao quanh một khối
// có #EXT-X-KEY:METHOD=NONE và các segment /vN/... chính là đoạn quảng cáo.

const DISC = "#EXT-X-DISCONTINUITY";
const NONE_KEY = /^#EXT-X-KEY:(?:[^,]*,)*METHOD=NONE(?:,|$)/i;
const V_SEGMENT = /^\/v\d+\//i;

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

/** Trả về nội dung playlist đã bỏ hẳn các dòng quảng cáo, hoặc null nếu không có QC. */
export function stripKkAds(text: string): string | null {
  if (!text.includes("#EXTINF") || !text.includes(DISC)) return null;
  const lines = text.split(/\r?\n/);
  const blocks = adBlocks(lines);
  if (!blocks.length) return null;
  const remove = new Set<number>();
  for (const b of blocks) for (let i = b.start; i < b.end; i++) remove.add(i);
  return lines.filter((_, i) => !remove.has(i)).join("\n");
}

function toAbsoluteUrls(text: string, base: string): string {
  const rewriteUri = (match: string, uri: string) => {
    try {
      return match.replace(uri, new URL(uri, base).toString());
    } catch {
      return match;
    }
  };
  return text
    .split(/\r?\n/)
    .map((line) => {
      const t = line.trim();
      if (!t) return line;
      if (t.startsWith("#")) return line.replace(/URI="([^"]+)"/g, rewriteUri);
      try {
        return new URL(t, base).toString();
      } catch {
        return line;
      }
    })
    .join("\n");
}

/**
 * Dành cho Safari phát HLS gốc (không đi qua hls.js): tải playlist, cắt QC,
 * đổi URL tương đối thành tuyệt đối rồi trả về blob URL để video phát bản sạch.
 */
export async function buildAdFreePlaylistUrl(
  url: string,
  signal?: AbortSignal
): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store", signal });
    if (!res.ok) return null;
    let text = await res.text();
    let base = url;

    if (!text.includes("#EXTINF")) {
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
      if (!variant) return null;
      const variantRes = await fetch(variant, { cache: "no-store", signal });
      if (!variantRes.ok) return null;
      text = await variantRes.text();
      base = variant;
    }

    const clean = stripKkAds(text);
    if (!clean) return null;
    return URL.createObjectURL(new Blob([toAbsoluteUrls(clean, base)], {
      type: "application/vnd.apple.mpegurl",
    }));
  } catch {
    return null;
  }
}
