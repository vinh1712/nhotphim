/**
 * GitHub Pages phục vụ repo ở https://<user>.github.io/<repo>/,
 * nên mọi đường dẫn nội bộ cần được thêm prefix `/<repo>`.
 *
 * Giá trị này được inject lúc build qua biến NEXT_PUBLIC_BASE_PATH
 * (xem .github/workflows/deploy.yml). Khi chạy local hoặc host ở root,
 * biến không có nghĩa là không đổi gì cả.
 */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? process.env.PAGES_BASE_PATH ?? "").replace(/\/$/, "");

/** Thêm basePath vào một đường dẫn nội bộ bắt đầu bằng `/`. */
export function withBasePath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || !basePath) return path;
  if (path === basePath || path.startsWith(`${basePath}/`)) return path;
  return `${basePath}${path}`;
}

/**
 * Áp dụng withBasePath cho mọi chuỗi trong object/array.
 * Dùng cho dữ liệu JSON vì ở đó có nhiều href/src dạng `/sites/...`, `/phim/...`.
 */
export function withBasePathDeep<T>(value: T): T {
  if (typeof value === "string") return withBasePath(value) as T;
  if (Array.isArray(value)) return value.map((item) => withBasePathDeep(item)) as T;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, withBasePathDeep(item)])
    ) as T;
  }
  return value;
}
