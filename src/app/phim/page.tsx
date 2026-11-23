"use client";

// Phim thêm sau khi web deploy không có route tĩnh /phim/<slug>. Link của phim
// mới tự đổi sang /phim/?slug=... nên vẫn mở được mà không cần build lại.
import { useEffect, useState } from "react";
import { LiveRoute } from "@/components/sites/chophim/LiveRoute";

export default function PhimByQueryPage() {
  const [slug, setSlug] = useState("");
  useEffect(() => {
    setSlug(new URLSearchParams(window.location.search).get("slug") || "");
  }, []);

  return (
    <LiveRoute
      mode="detail"
      slug={slug}
      initialMovie={null}
      initialComments={[]}
      initialSuggestions={[]}
      fallback
    />
  );
}
