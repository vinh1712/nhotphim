"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches || document.visibilityState === "hidden";
}

function getServerSnapshot(): boolean {
  return false;
}

/** Autoplay chỉ chạy khi người dùng không yêu cầu giảm chuyển động và tab đang mở. */
export function useMotionPaused(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
