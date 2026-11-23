"use client";

// Xem phim thêm sau khi deploy: /xem/?slug=<slug>#tap=tap-N
import { useEffect, useState } from "react";
import { LiveRoute } from "@/components/sites/chophim/LiveRoute";

export default function XemByQueryPage() {
  const [slug, setSlug] = useState("");
  useEffect(() => {
    setSlug(new URLSearchParams(window.location.search).get("slug") || "");
  }, []);

  return (
    <LiveRoute
      mode="watch"
      slug={slug}
      initialMovie={null}
      initialComments={[]}
      initialSuggestions={[]}
      fallback
    />
  );
}
