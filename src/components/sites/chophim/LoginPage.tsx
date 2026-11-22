"use client";

import { withBasePath } from "@/lib/base-path";
import { recoverPassword, signIn, signOut, signUp, useAuthSession } from "@/lib/auth";
import { useState } from "react";

type Mode = "login" | "register" | "recover";

/** Cổng đăng nhập thật, dùng Supabase Auth của trang quản lí Nhót Phim. */
export function LoginPage() {
  const { session, user, loading } = useAuthSession();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [nick, setNick] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const displayName =
    (typeof user?.user_metadata?.display_name === "string" && user.user_metadata.display_name) ||
    (typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    user?.email?.split("@")[0] ||
    "Thành viên";

  const switchMode = (next: Mode) => {
    setMode(next);
    setMsg(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!email.trim()) {
      setMsg({ text: "Vui lòng nhập email.", ok: false });
      return;
    }
    if (mode !== "recover" && !pass) {
      setMsg({ text: "Vui lòng nhập mật khẩu.", ok: false });
      return;
    }
    if (mode === "register" && !nick.trim()) {
      setMsg({ text: "Vui lòng nhập tên hiển thị.", ok: false });
      return;
    }

    setBusy(true);
    try {
      if (mode === "login") {
        const res = await signIn(email, pass, remember);
        setMsg({ text: res.message, ok: res.ok });
      } else if (mode === "register") {
        const res = await signUp(email, pass, nick, remember);
        setMsg({ text: res.message, ok: res.ok });
        if (res.ok && res.session) switchMode("login");
      } else {
        const res = await recoverPassword(email);
        setMsg({ text: res.message, ok: res.ok });
      }
    } finally {
      setBusy(false);
    }
  };

  const doSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      setMsg({ text: "Đã đăng xuất.", ok: true });
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full h-[46px] bg-white/10 border border-white/20 focus:border-[#FFD166] rounded-lg px-4 text-[16px] text-white placeholder:text-white/40 focus:outline-none transition-colors";

  return (
    <main className="flex-1 pt-16">
      <div className="max-w-[1400px] mx-auto px-4 py-10 sm:py-16 flex justify-center">
        <div className="w-full max-w-[440px]">
          <div className="rounded-2xl border border-white/10 bg-[#14161f]/90 shadow-[0_24px_70px_rgba(0,0,0,0.45)] overflow-hidden">
            <div className="px-6 sm:px-8 pt-8 pb-6 text-center border-b border-white/5">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
                style={{ background: "linear-gradient(39deg, rgb(254, 207, 89), rgb(255, 241, 204))" }}
              >
                <svg className="w-7 h-7 text-[#14161f]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">
                {session ? "Tài khoản của bạn" : mode === "login" ? "Đăng nhập tài khoản" : mode === "register" ? "Tạo tài khoản mới" : "Đặt lại mật khẩu"}
              </h1>
              <p className="text-[13px] text-text-muted mt-1">
                {session ? `Xin chào, ${displayName}` : "Tham gia Nhót Phim — Phim hay chín hết cả mùa"}
              </p>
            </div>

            {!session && mode !== "recover" && (
              <div className="flex border-b border-white/5">
                {(["login", "register"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={`flex-1 py-3.5 text-[14px] font-semibold transition-colors relative ${
                      mode === m ? "text-[#FFD166]" : "text-white/50 hover:text-white/80"
                    }`}
                  >
                    {m === "login" ? "Đăng nhập" : "Đăng ký"}
                    {mode === m && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#FFD166] rounded-t-md" />}
                  </button>
                ))}
              </div>
            )}

            {session ? (
              <div className="px-6 sm:px-8 py-7 flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#FFD166] text-[#14161f] font-bold flex items-center justify-center uppercase shrink-0">
                    {displayName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{displayName}</p>
                    <p className="text-[13px] text-white/50 truncate">{session.user.email ?? "Tài khoản Nhót Phim"}</p>
                  </div>
                </div>
                <a
                  href={withBasePath("/")}
                  className="h-[46px] rounded-full font-bold text-[15px] text-[#14161f] flex items-center justify-center"
                  style={{ background: "linear-gradient(39deg, rgb(254, 207, 89), rgb(255, 241, 204))" }}
                >
                  Về trang xem phim
                </a>
                <button
                  type="button"
                  onClick={() => void doSignOut()}
                  disabled={busy}
                  className="h-[44px] rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 font-semibold text-[14px] transition-colors disabled:opacity-60"
                >
                  {busy ? "Đang xử lý..." : "Đăng xuất"}
                </button>
                {msg && (
                  <p className={`text-[13px] text-center rounded-lg px-3 py-2 ${msg.ok ? "text-[#7CE7A8] bg-[#7CE7A8]/10 border border-[#7CE7A8]/20" : "text-[#ff9a9a] bg-[#ff9a9a]/10 border border-[#ff9a9a]/20"}`}>
                    {msg.text}
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={submit} className="px-6 sm:px-8 py-6 flex flex-col gap-4">
                {mode === "register" && (
                  <label className="block">
                    <span className="block text-[13px] font-medium text-white/70 mb-1.5">Tên hiển thị</span>
                    <input className={inputCls} placeholder="Nhập tên hiển thị" value={nick} onChange={(e) => setNick(e.target.value)} autoComplete="nickname" />
                  </label>
                )}
                <label className="block">
                  <span className="block text-[13px] font-medium text-white/70 mb-1.5">Email</span>
                  <input className={inputCls} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </label>
                {mode !== "recover" && (
                  <label className="block">
                    <span className="block text-[13px] font-medium text-white/70 mb-1.5">Mật khẩu</span>
                    <input className={inputCls} type="password" placeholder="••••••••" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
                  </label>
                )}

                {mode === "login" && (
                  <div className="flex items-center justify-between text-[13px]">
                    <label className="flex items-center gap-2 text-white/60 cursor-pointer">
                      <input type="checkbox" className="accent-[#FFD166] w-4 h-4" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                      Ghi nhớ tôi
                    </label>
                    <button type="button" onClick={() => switchMode("recover")} className="text-[#FFD166] hover:text-[#ffe09a] transition-colors">
                      Quên mật khẩu?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || loading}
                  className="h-[46px] mt-1 rounded-full font-bold text-[15px] text-[#14161f] transition-all hover:scale-[1.02] shadow-lg shadow-[rgba(254,207,89,0.25)] disabled:opacity-60 disabled:hover:scale-100"
                  style={{ background: "linear-gradient(39deg, rgb(254, 207, 89), rgb(255, 241, 204))" }}
                >
                  {busy ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : mode === "register" ? "Đăng ký" : "Gửi liên kết đặt lại"}
                </button>

                {mode === "recover" && (
                  <button type="button" onClick={() => switchMode("login")} className="text-[13px] text-white/50 hover:text-white transition-colors">
                    ← Quay lại đăng nhập
                  </button>
                )}

                {msg && (
                  <p className={`text-[13px] text-center rounded-lg px-3 py-2 ${msg.ok ? "text-[#7CE7A8] bg-[#7CE7A8]/10 border border-[#7CE7A8]/20" : "text-[#ff9a9a] bg-[#ff9a9a]/10 border border-[#ff9a9a]/20"}`}>
                    {msg.text}
                  </p>
                )}
              </form>
            )}
          </div>

          <p className="text-center text-[13px] text-text-muted mt-5">
            Bằng việc tiếp tục, bạn đồng ý với{" "}
            <a href={withBasePath("/dieu-khoan-su-dung")} className="text-[#FFD166] hover:underline">
              Điều khoản sử dụng
            </a>{" "}
            và{" "}
            <a href={withBasePath("/chinh-sach-bao-mat")} className="text-[#FFD166] hover:underline">
              Chính sách bảo mật
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
