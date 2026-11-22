import type { NextConfig } from "next";

const pagesBasePath = (process.env.PAGES_BASE_PATH ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // Build ra HTML tĩnh trong `out/` để host tĩnh (GitHub Pages, Netlify, ...) đọc được.
  output: "export",
  trailingSlash: true,
  // Khi deploy lên GitHub Pages, workflow truyền PAGES_BASE_PATH=/nhotphim.
  // next/link và asset của Next sẽ tự động dùng prefix này.
  ...(pagesBasePath ? { basePath: pagesBasePath } : {}),
};

export default nextConfig;
