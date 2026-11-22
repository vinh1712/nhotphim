import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // Build ra HTML tĩnh trong `out/` để host tĩnh (GitHub Pages, Netlify, ...) đọc được.
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
