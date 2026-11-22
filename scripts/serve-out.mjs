// Server tĩnh cho thư mục out/ — dùng để test bản build trên điện thoại (cùng Wi-Fi).
// Không cần package nào: chỉ dùng http/fs/path có sẵn của Node.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out");
const port = Number(process.env.PORT ?? 3101);
const host = process.env.HOST ?? "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const target = path.resolve(root, `.${clean}`);
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  const candidates = [target, `${target}.html`, path.join(target, "index.html")];
  for (const file of candidates) {
    try {
      if (fs.statSync(file).isFile()) return file;
    } catch {
      /* thử candidate tiếp theo */
    }
  }
  return null;
}

http
  .createServer((req, res) => {
    const file = resolveFile(req.url ?? "/") ?? path.join(root, "404", "index.html");
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, host, () => {
    console.log(`Static server: http://${host}:${port} (from ${root})`);
  });
