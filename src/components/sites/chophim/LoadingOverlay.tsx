"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { withBasePath } from "@/lib/base-path";

// Clone đúng overlay của chophim: hiện 500ms → mờ dần 300ms → gỡ hẳn ở 1000ms.
// Chỉ thay logo/tagline; không dựng thêm màn hình load mới.
const LOGO = withBasePath("/brand/nhotphim-logo.png");
const BACKGROUND = withBasePath("/sites/chophim/13533e9315d23bb7.jpg");

export function LoadingOverlay() {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setFadingOut(true), 500);
    const hideTimer = window.setTimeout(() => setVisible(false), 1000);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`nhot-loading-overlay fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-300 ease-in-out ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 bg-bg-primary overflow-hidden">
        <div className="hidden md:block w-full h-full">
          <Image
            src={BACKGROUND}
            alt="Home Background"
            fill
            sizes="100vw"
            priority
            className="object-cover object-left-top origin-top-left scale-110"
          />
        </div>
      </div>
      <div className="relative z-10 flex flex-col items-center animate-[gentlePulse_2s_ease-in-out_infinite]">
        <div className="relative w-80 h-40 md:w-[520px] md:h-[200px] mb-2">
          <Image src={LOGO} alt="Nhót Phim" fill sizes="100vw" priority className="object-contain" />
        </div>
        <p className="hidden md:block text-white/30 font-medium text-lg md:text-3xl text-center max-w-lg md:max-w-xl drop-shadow-md px-4">
          Phim hay chín hết cả mùa
        </p>
      </div>
    </div>
  );
}
