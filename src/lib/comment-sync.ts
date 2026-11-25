"use client";

import { useEffect } from "react";
import type { DetailComment } from "@/components/sites/chophim/detail-types";
import { getSession, supabaseRest, useAuthSession, type AuthUser } from "./auth";
import { LOCAL_COMMENTS_EVENT, readAllLocalComments, readLocalComments, writeLocalComments } from "./local-comments";

/** Bình luận người dùng tự gửi được đồng bộ qua user_data của chính tài khoản.
 *  Chưa đăng nhập vẫn dùng localStorage như cũ. */

const REMOTE_KEY = "nhotphim:comments";
const DELETED_KEY = "nhotphim:deleted-comments:v1";

type SyncedComment = { slug: string; comment: DetailComment };
type RemotePayload = { comments: SyncedComment[]; deletedIds: string[] };

/** Chỉ đẩy lên cloud sau khi kéo bản cloud về lần đầu, tránh ghi đè comment thiết bị khác. */
const pulledUsers = new Set<string>();
const pendingPush = new Set<string>();

function localPayload(): RemotePayload {
  return { comments: readAllLocalComments(), deletedIds: readDeletedCommentIds() };
}

export function readDeletedCommentIds(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DELETED_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeDeletedCommentIds(ids: string[]): void {
  try {
    window.localStorage.setItem(DELETED_KEY, JSON.stringify([...new Set(ids.map(String))].slice(-500)));
  } catch {
    /* private mode — vẫn xóa trên thiết bị này */
  }
}

/** Đánh dấu comment đã xóa để thiết bị khác không kéo lại bản cũ từ cloud. */
export function markCommentDeleted(id: string): void {
  const ids = readDeletedCommentIds();
  if (!ids.includes(String(id))) writeDeletedCommentIds([...ids, String(id)]);
}

export async function pullRemoteComments(userId: string): Promise<RemotePayload | null> {
  try {
    const res = await supabaseRest(
      `/rest/v1/user_data?select=key,value&user_id=eq.${encodeURIComponent(userId)}`
    );
    if (!res || !res.ok) return null;
    const rows = (await res.json()) as Array<{ key?: unknown; value?: unknown }>;
    const row = (rows || []).find((r) => r?.key === REMOTE_KEY);
    const value = row?.value;
    if (!value || typeof value !== "object") return { comments: [], deletedIds: [] };
    const obj = value as Partial<RemotePayload>;
    return {
      comments: Array.isArray(obj.comments) ? (obj.comments as SyncedComment[]) : [],
      deletedIds: Array.isArray(obj.deletedIds) ? obj.deletedIds.map(String) : [],
    };
  } catch {
    return null;
  }
}

export async function pushRemoteComments(userId: string, payload: RemotePayload): Promise<boolean> {
  try {
    const res = await supabaseRest("/rest/v1/user_data", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ user_id: userId, key: REMOTE_KEY, value: payload }),
    });
    return !!res && res.ok;
  } catch {
    return false;
  }
}

/** Gọi sau mỗi thay đổi local. Nếu chưa kéo cloud xong thì chỉ đánh dấu, để không ghi đè. */
export function pushLocalComments(userId?: string | null): void {
  void getSession().then((session) => {
    const id = userId || session?.user.id;
    if (!id) return;
    if (!pulledUsers.has(id)) {
      pendingPush.add(id);
      return;
    }
    void pushRemoteComments(id, localPayload());
  });
}

function metaValue(meta: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(meta, key) && typeof meta[key] === "string") {
      return meta[key] as string;
    }
  }
  return null;
}

/** Avatar/khung/tên của comment trùng userId luôn lấy theo profile hiện tại. */
function withCurrentProfile(c: DetailComment, user: AuthUser): DetailComment {
  if (!c.userId || c.userId !== user.id) return c;
  const meta = user.user_metadata || {};
  const next = { ...c };
  const avatar = metaValue(meta, ["avatar_url", "avatarUrl"]);
  if (avatar !== null) next.avatar = avatar;
  const frame = metaValue(meta, ["avatar_frame", "avatarFrame", "frameUrl"]);
  if (frame !== null) next.frame = frame || null;
  const name = metaValue(meta, ["display_name", "displayName", "full_name", "fullName", "name"]);
  if (name) next.name = name;
  const emoji = metaValue(meta, ["chat_emoji", "selectedEmoji", "emoji"]);
  if (emoji !== null) next.emoji = emoji || null;
  const gender = metaValue(meta, ["gender"]);
  if (gender !== null) next.gender = gender === "male" || gender === "female" ? gender : null;
  const role = metaValue(meta, ["role"]);
  if (role !== null) next.role = role || null;
  const tier = metaValue(meta, ["subscription_tier", "subscriptionTier"]);
  if (tier !== null) next.subscriptionTier = tier || null;
  return next;
}

/** Ghi đè metadata mới vào mọi comment local của tài khoản này. */
function rewriteProfile(user: AuthUser): boolean {
  const grouped = new Map<string, DetailComment[]>();
  for (const { slug, comment } of readAllLocalComments()) {
    const list = grouped.get(slug) || [];
    list.push(comment);
    grouped.set(slug, list);
  }
  let changed = false;
  for (const [slug, list] of grouped) {
    const next = list.map((c) => withCurrentProfile(c, user));
    if (JSON.stringify(next) !== JSON.stringify(list)) {
      writeLocalComments(slug, next);
      changed = true;
    }
  }
  return changed;
}

export function syncLocalCommentsWithProfile(user: AuthUser): boolean {
  const changed = rewriteProfile(user);
  if (changed) {
    window.dispatchEvent(new Event(LOCAL_COMMENTS_EVENT));
    pushLocalComments(user.id);
  }
  return changed;
}

function mergeComments(
  local: SyncedComment[],
  remote: SyncedComment[],
  deletedIds: string[]
): SyncedComment[] {
  const deleted = new Set(deletedIds.map(String));
  const map = new Map<string, SyncedComment>();
  // Remote trước, local sau: cùng id thì bản local (mới sửa trên máy này) thắng.
  for (const row of [...remote, ...local]) {
    if (!row || typeof row.slug !== "string" || !row.comment || typeof row.comment.id !== "string") continue;
    if (deleted.has(String(row.comment.id))) continue;
    const key = `${row.slug}::${row.comment.id}`;
    const prev = map.get(key);
    const time = String(row.comment.createdAt || "");
    if (!prev || time >= String(prev.comment.createdAt || "")) map.set(key, row);
  }
  return [...map.values()];
}

/** Gộp comment cloud vào localStorage rồi đẩy bản đã gộp lên lại. */
export function applyRemoteComments(remote: RemotePayload, user: AuthUser): boolean {
  const local = readAllLocalComments();
  const deleted = [...new Set([...readDeletedCommentIds(), ...remote.deletedIds])];
  // Lưu lại tombstone từ cloud, không để lần push sau xóa mất dấu vết đã xóa.
  if (deleted.length !== readDeletedCommentIds().length) writeDeletedCommentIds(deleted);
  const merged = mergeComments(local, remote.comments, deleted).map((row) => ({
    slug: row.slug,
    comment: withCurrentProfile(row.comment, user),
  }));
  const changed = JSON.stringify(merged) !== JSON.stringify(local);

  if (changed) {
    const grouped = new Map<string, DetailComment[]>();
    for (const { slug, comment } of merged) {
      const list = grouped.get(slug) || [];
      list.push(comment);
      grouped.set(slug, list);
    }
    // Xóa hẳn slug cũ trước khi ghi để comment đã xóa không còn sót lại.
    for (const { slug } of local) {
      if (!grouped.has(slug)) writeLocalComments(slug, []);
    }
    for (const [slug, list] of grouped) writeLocalComments(slug, list);
    window.dispatchEvent(new Event(LOCAL_COMMENTS_EVENT));
  }
  return changed;
}

/** Gọi trong Header: mọi trang đều đồng bộ bình luận cho tài khoản đang đăng nhập. */
export function useCommentSync(): void {
  const { user } = useAuthSession();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    void getSession().then((session) => {
      if (!alive || !session) return;
      void pullRemoteComments(userId).then((remote) => {
        if (!alive || !remote) return;
        const changed = applyRemoteComments(remote, session.user);
        const shouldPush =
          changed ||
          pendingPush.has(userId) ||
          (remote.comments.length === 0 && readAllLocalComments().length > 0);
        pulledUsers.add(userId);
        if (shouldPush) {
          pendingPush.delete(userId);
          void pushRemoteComments(userId, localPayload());
        }
      });
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  useEffect(() => {
    if (user) syncLocalCommentsWithProfile(user);
  }, [user]);
}
