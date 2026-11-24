"use client";

import { useCallback, useEffect, useState } from "react";
import { clearLocalLibrary } from "./library-storage";
import { SB_KEY, SB_URL } from "./supabase";

const SESSION_KEY = "nhotphim:auth:v1";
const AUTH_EVENT = "nhotphim:auth-change";

export type AuthUser = {
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AuthUser;
};

export type AuthResult = {
  ok: boolean;
  message: string;
  session?: AuthSession | null;
};

type Stored = { session: AuthSession; remember: boolean };
type TokenData = {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
  user?: unknown;
  msg?: unknown;
  message?: unknown;
  error?: unknown;
  error_code?: unknown;
};

/* ── storage an toàn cho iOS private mode ───────────────────────────────── */

function store(remember: boolean): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return remember ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function readStored(): Stored | null {
  if (typeof window === "undefined") return null;
  for (const remember of [true, false]) {
    try {
      const raw = store(remember)?.getItem(SESSION_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Partial<AuthSession>;
      if (parsed && typeof parsed.access_token === "string" && parsed.user) {
        return { session: parsed as AuthSession, remember };
      }
    } catch {
      /* bỏ qua session hỏng */
    }
  }
  return null;
}

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_EVENT));
}

function writeStored(session: AuthSession, remember: boolean) {
  try {
    store(remember)?.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* private mode / quota — vẫn giữ session trong state hiện tại */
  }
  notify();
}

function clearStored() {
  for (const remember of [true, false]) {
    try {
      store(remember)?.removeItem(SESSION_KEY);
    } catch {
      /* bỏ qua */
    }
  }
  notify();
}

/* ── helpers ────────────────────────────────────────────────────────────── */

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer =
    controller && typeof window !== "undefined"
      ? window.setTimeout(() => controller.abort(), 12000)
      : null;
  try {
    return await fetch(`${SB_URL}${path}`, {
      ...init,
      signal: controller?.signal,
      headers: {
        apikey: SB_KEY,
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
  } finally {
    if (timer !== null && typeof window !== "undefined") window.clearTimeout(timer);
  }
}

function toUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  if (typeof u.id !== "string") return null;
  const meta = u.user_metadata && typeof u.user_metadata === "object" ? u.user_metadata : {};
  const appMeta = u.app_metadata && typeof u.app_metadata === "object" ? u.app_metadata : {};
  return {
    id: u.id,
    email: typeof u.email === "string" ? u.email : null,
    user_metadata: meta as Record<string, unknown>,
    app_metadata: appMeta as Record<string, unknown>,
  };
}

function toSession(data: TokenData, remember: boolean): AuthSession | null {
  const user = toUser(data.user);
  if (!user || typeof data.access_token !== "string") return null;
  const seconds = Number(data.expires_in);
  const lifetime = Number.isFinite(seconds) && seconds > 0 ? seconds : 3600;
  return {
    access_token: data.access_token,
    refresh_token: typeof data.refresh_token === "string" ? data.refresh_token : "",
    expires_at: Date.now() + lifetime * 1000 - 60_000,
    user,
  };
}

function errorText(data: TokenData, fallback: string): string {
  const code = String(data.error_code ?? "");
  const msg = String(data.msg ?? data.message ?? data.error ?? "");
  if (code === "invalid_credentials" || /invalid login credentials/i.test(msg))
    return "Email hoặc mật khẩu không đúng.";
  if (/email not confirmed/i.test(msg)) return "Vui lòng xác nhận email trước khi đăng nhập.";
  if (/already registered|user already exists/i.test(msg)) return "Email này đã được đăng ký.";
  if (/rate limit|too many requests/i.test(msg)) return "Thử lại sau ít phút nhé.";
  if (/password.*(weak|short|6)/i.test(msg)) return "Mật khẩu phải có ít nhất 6 ký tự.";
  if (/valid email|invalid format/i.test(msg)) return "Email không hợp lệ.";
  return msg || fallback;
}

async function parseData(res: Response): Promise<TokenData> {
  try {
    return (await res.json()) as TokenData;
  } catch {
    return {};
  }
}

/* ── API chính ──────────────────────────────────────────────────────────── */

export { SB_URL, SB_KEY };

/** Gọi Supabase REST (PostgREST) với token của phiên hiện tại.
 *  Dùng cho đồng bộ dữ liệu cá nhân qua bảng user_data. */
export async function supabaseRest(path: string, init: RequestInit = {}): Promise<Response | null> {
  // getSession() tự refresh access_token hết hạn — không gửi token cũ cho PostgREST.
  const session = await getSession();
  if (!session) return null;
  return authFetch(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${session.access_token}`,
    },
  });
}

let refreshing: Promise<AuthSession | null> | null = null;

/** Đọc session, tự refresh nếu hết hạn. */
export async function getSession(): Promise<AuthSession | null> {
  const stored = readStored();
  if (!stored) return null;
  if (stored.session.expires_at > Date.now() + 1000) return stored.session;
  if (refreshing) return refreshing;

  refreshing = (async () => {
    if (!stored.session.refresh_token) {
      clearStored();
      return null;
    }
    try {
      const res = await authFetch("/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        body: JSON.stringify({ refresh_token: stored.session.refresh_token }),
      });
      if (!res.ok) {
        clearStored();
        return null;
      }
      const session = toSession(await parseData(res), stored.remember);
      if (!session) clearStored();
      return session;
    } catch {
      return stored.session.expires_at > Date.now() ? stored.session : null;
    }
  })().finally(() => {
    refreshing = null;
  });

  return refreshing;
}

export async function signIn(email: string, password: string, remember = true): Promise<AuthResult> {
  try {
    const res = await authFetch("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = await parseData(res);
    if (!res.ok) return { ok: false, message: errorText(data, "Không thể đăng nhập.") };
    const session = toSession(data, remember);
    if (!session) return { ok: false, message: "Phiên đăng nhập không hợp lệ." };
    writeStored(session, remember);
    return { ok: true, message: "Đăng nhập thành công!", session };
  } catch {
    return { ok: false, message: "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại." };
  }
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  remember = true
): Promise<AuthResult> {
  try {
    const res = await authFetch("/auth/v1/signup", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim(),
        password,
        data: { display_name: displayName.trim(), full_name: displayName.trim() },
      }),
    });
    const data = await parseData(res);
    if (!res.ok && !data.user) return { ok: false, message: errorText(data, "Không thể đăng ký.") };
    const session = toSession(data, remember);
    if (session) writeStored(session, remember);
    return {
      ok: true,
      session,
      message: session
        ? "Đăng ký thành công! Chào mừng bạn đến Nhót Phim."
        : "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
    };
  } catch {
    return { ok: false, message: "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại." };
  }
}

export async function recoverPassword(email: string): Promise<AuthResult> {
  try {
    const res = await authFetch("/auth/v1/recover", {
      method: "POST",
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await parseData(res);
    if (!res.ok) return { ok: false, message: errorText(data, "Không thể gửi email đặt lại.") };
    return { ok: true, message: "Đã gửi liên kết đặt lại mật khẩu. Kiểm tra hộp thư nhé." };
  } catch {
    return { ok: false, message: "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại." };
  }
}

/** Cập nhật user_metadata trên Supabase (tên hiển thị, giới tính, emoji...). */
export async function updateProfile(
  patch: Record<string, string>
): Promise<AuthResult> {
  const stored = readStored();
  if (!stored) return { ok: false, message: "Vui lòng đăng nhập lại." };
  try {
    const res = await authFetch("/auth/v1/user", {
      method: "PUT",
      headers: { Authorization: `Bearer ${stored.session.access_token}` },
      body: JSON.stringify({ data: patch }),
    });
    const data = await parseData(res);
    if (!res.ok) return { ok: false, message: errorText(data, "Không thể cập nhật tài khoản.") };
    // Supabase PUT /auth/v1/user trả thẳng object user (không nằm trong `user`).
    const raw = (data as TokenData & { user_metadata?: unknown }).user_metadata ? data : data.user;
    const user = toUser(raw);
    if (!user) return { ok: false, message: "Không đọc được thông tin tài khoản." };
    writeStored({ ...stored.session, user }, stored.remember);
    return { ok: true, message: "Cập nhật tài khoản thành công!" };
  } catch {
    return { ok: false, message: "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại." };
  }
}

export async function signOut(): Promise<void> {
  const stored = readStored();
  if (stored) {
    try {
      await authFetch("/auth/v1/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${stored.session.access_token}` },
      });
    } catch {
      /* vẫn xóa session local */
    }
  }
  clearStored();
  clearLocalLibrary();
}

/** Hook dùng chung cho Header và trang đăng nhập. */
export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    let alive = true;
    void getSession().then((s) => {
      if (alive) setSession(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    // Đọc lại cả khi quay lại tab: sessionStorage (không ghi nhớ) không bắn
    // storage event sang tab khác, nên watch page có thể vẫn tưởng chưa đăng nhập.
    const sync = () =>
      void getSession().then((s) => {
        if (!alive) return;
        setSession(s);
        setLoading(false);
      });
    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      alive = false;
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return { session, user: session?.user ?? null, loading, reload };
}
