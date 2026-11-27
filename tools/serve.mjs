import { createServer } from "node:http";
import { readFile, stat, realpath } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const types = new Map(Object.entries({
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".webp": "image/webp", ".woff2": "font/woff2", ".ogg": "audio/ogg", ".mp3": "audio/mpeg",
}));

export function normalizeBasePath(base = "/") {
  if (typeof base !== "string" || !/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) {
    throw new Error("BASE_PATH must be / or a slash-terminated path such as /Shapeweaver/");
  }
  return base;
}

export function createStaticServer({ root = projectRoot, basePath = "/", workshop = false } = {}) {
  const base = normalizeBasePath(basePath);
  const rootPath = resolve(root);
  return createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    const reply = (status, message) => {
      res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(req.method === "HEAD" ? undefined : message);
    };
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD");
      return reply(405, "Method not allowed");
    }
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch { return reply(400, "Invalid path"); }
    if (pathname === base.slice(0, -1) && base !== "/") {
      res.writeHead(308, { Location: base }); return res.end();
    }
    if (!pathname.startsWith(base)) return reply(404, "Not found");
    const relative = pathname.slice(base.length) || "index.html";
    // Only source assets are served. Never expose .git, docs or arbitrary paths.
    if (relative.includes("\\") || relative.split("/").some(p => p.startsWith(".")) ||
      !(relative === "index.html" || relative.startsWith("src/") || relative.startsWith("assets/") || workshop && relative.startsWith("workshop/"))) {
      return reply(404, "Not found");
    }
    try {
      const file = resolve(rootPath, relative);
      const actualRoot = await realpath(rootPath);
      const actualFile = await realpath(file);
      if (!actualFile.startsWith(actualRoot + sep) || !(await stat(actualFile)).isFile()) return reply(404, "Not found");
      const type = types.get(extname(actualFile).toLowerCase());
      if (!type) return reply(404, "Not found");
      const bytes = await readFile(actualFile);
      res.writeHead(200, { "Content-Type": type, "Content-Length": bytes.length });
      res.end(req.method === "HEAD" ? undefined : bytes);
    } catch { reply(404, "Not found"); }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  const basePath = normalizeBasePath(process.env.BASE_PATH ?? "/");
  const root = process.argv.includes("--dist") ? resolve(projectRoot, "dist") : projectRoot;
  const server = createStaticServer({ root, basePath, workshop: !process.argv.includes("--dist") && process.argv.includes("--workshop") });
  server.listen(port, "127.0.0.1", () => console.log("Shapeweaver: http://127.0.0.1:" + port + basePath));
}
