/** Ảnh mặc định cho bình luận cũ bị mất avatar: lá cờ Việt Nam. */
export const VN_FLAG_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">' +
      '<rect width="96" height="96" fill="#DA251D"/>' +
      '<polygon points="48,12 57.4,37.1 84.1,38.3 63.2,55 70.3,80.8 48,66 25.7,80.8 32.8,55 11.9,38.3 38.6,37.1" fill="#FFFF00"/>' +
      "</svg>"
  );

/** Đổi ảnh lỗi sang cờ VN, chỉ đổi một lần để không gây vòng lặp onError. */
export function fallbackToVnFlag(event: { currentTarget: HTMLImageElement }) {
  const img = event.currentTarget;
  if (img.dataset.vnFallback === "1") return;
  img.dataset.vnFallback = "1";
  img.src = VN_FLAG_AVATAR;
}

/** Ảnh tĩnh có thể lỗi trước khi React hydrate, nên onError không bao giờ chạy.
 *  Ref callback kiểm tra lại ngay sau mount để vẫn đổi sang cờ VN. */
const watched = new WeakSet<HTMLImageElement>();

export function checkVnFallback(img: HTMLImageElement | null) {
  if (!img) return;
  const src = img.getAttribute("src") || "";
  if (img.dataset.vnFallbackCheckedFor === src) return;
  img.dataset.vnFallbackCheckedFor = src;
  const check = (force = false) => {
    if (!img.isConnected || img.dataset.vnFallback === "1") return;
    if ((force || img.complete) && img.naturalWidth === 0) {
      fallbackToVnFlag({ currentTarget: img });
    }
  };
  check();
  if (!watched.has(img)) {
    watched.add(img);
    img.addEventListener("error", () => check(true), { once: true });
  }
  // Ảnh 404 có thể lỗi trước khi React gắn onError; kiểm tra lại sau render.
  queueMicrotask(check);
  window.setTimeout(() => check(true), 1000);
}
