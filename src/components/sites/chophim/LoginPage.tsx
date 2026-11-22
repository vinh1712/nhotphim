"use client";

import { withBasePath } from "@/lib/base-path";
import { useState } from "react";

type Mode = "login" | "register";

/** Trang đăng nhập / đăng ký — giao diện前端, chưa kết nối backend. */
export function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [nick, setNick] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !pass.trim()) {
      setMsg("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    setMsg(
      mode === "login"
        ? "Đăng nhập thành công! (bản demo giao diện — chưa kết nối tài khoản thật)"
        : "Đăng ký thành công! (bản demo giao diện — chưa kết nối tài khoản thật)"
    );
  };

  const inputCls =
    "w-full h-[46px] bg-white/10 border border-white/20 focus:border-[#FFD166] rounded-lg px-4 text-[15px] text-white placeholder:text-white/40 focus:outline-none transition-colors";

  return (
    <main className="flex-1 pt-16">
      <div className="max-w-[1400px] mx-auto px-4 py-10 sm:py-16 flex justify-center">
        <div className="w-full max-w-[440px]">
          {/* thẻ đăng nhập */}
          <div className="rounded-2xl border border-white/10 bg-[#14161f]/90 shadow-[0_24px_70px_rgba(0,0,0,0.45)] overflow-hidden">
            {/* đầu thẻ */}
            <div className="px-6 sm:px-8 pt-8 pb-6 text-center border-b border-white/5">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
                style={{ background: "linear-gradient(39deg, rgb(254, 207, 89), rgb(255, 241, 204))" }}
              >
                <svg className="w-7 h-7 text-[#14161f]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">{mode === "login" ? "Đăng nhập tài khoản" : "Tạo tài khoản mới"}</h1>
              <p className="text-[13px] text-text-muted mt-1">Tham gia NhótPhim — Phim hay, xem mọi lúc</p>
            </div>

            {/* tabs */}
            <div className="flex border-b border-white/5">
              {(["login", "register"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setMsg(null);
                  }}
                  className={`flex-1 py-3.5 text-[14px] font-semibold transition-colors relative ${
                    mode === m ? "text-[#FFD166]" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {m === "login" ? "Đăng nhập" : "Đăng ký"}
                  {mode === m && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#FFD166] rounded-t-md" />}
                </button>
              ))}
            </div>

            {/* form */}
            <form onSubmit={submit} className="px-6 sm:px-8 py-6 flex flex-col gap-4">
              {mode === "register" && (
                <label className="block">
                  <span className="block text-[13px] font-medium text-white/70 mb-1.5">Tên hiển thị</span>
                  <input className={inputCls} placeholder="Nhập tên hiển thị" value={nick} onChange={(e) => setNick(e.target.value)} />
                </label>
              )}
              <label className="block">
                <span className="block text-[13px] font-medium text-white/70 mb-1.5">Email</span>
                <input className={inputCls} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="block">
                <span className="block text-[13px] font-medium text-white/70 mb-1.5">Mật khẩu</span>
                <input className={inputCls} type="password" placeholder="••••••••" value={pass} onChange={(e) => setPass(e.target.value)} />
              </label>

              {mode === "login" && (
                <div className="flex items-center justify-between text-[13px]">
                  <label className="flex items-center gap-2 text-white/60 cursor-pointer">
                    <input type="checkbox" className="accent-[#FFD166] w-4 h-4" defaultChecked />
                    Ghi nhớ tôi
                  </label>
                  <button type="button" className="text-[#FFD166] hover:text-[#ffe09a] transition-colors">
                    Quên mật khẩu?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="h-[46px] mt-1 rounded-full font-bold text-[15px] text-[#14161f] transition-all hover:scale-[1.02] shadow-lg shadow-[rgba(254,207,89,0.25)]"
                style={{ background: "linear-gradient(39deg, rgb(254, 207, 89), rgb(255, 241, 204))" }}
              >
                {mode === "login" ? "Đăng nhập" : "Đăng ký"}
              </button>

              {msg && (
                <p className="text-[13px] text-center text-[#7CE7A8] bg-[#7CE7A8]/10 border border-[#7CE7A8]/20 rounded-lg px-3 py-2">{msg}</p>
              )}
            </form>

            {/* phân cách + mạng xã hội */}
            <div className="px-6 sm:px-8 pb-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[12px] text-white/40">hoặc</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="h-[42px] flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 text-[13px] font-medium transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.52 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 8.72s-1.55-2-4.9-2c-4.03 0-7.3 3.27-7.3 7.3s3.27 7.3 7.3 7.3c4.25 0 6.75-2.9 7.05-6.9h-4.75z" />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="h-[42px] flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 text-[13px] font-medium transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99C18.34 21.13 22 16.99 22 12z" />
                  </svg>
                  Facebook
                </button>
              </div>
              <p className="text-[12px] text-white/35 text-center mt-5 leading-relaxed">
                Đây là giao diện demo (frontend) — dữ liệu tài khoản chưa được kết nối máy chủ.
              </p>
            </div>
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
