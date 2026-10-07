import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { GameService } from "./services/game.mjs";
import { FileStore } from "./repositories/file-store.mjs";
const root = path.resolve("dist/client"),
  port = Number(process.env.PORT || 4174);
const service = new GameService(
  new FileStore(process.env.SESSION_DIR || ".data/sessions"),
  {
    key: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_REPORT_MODEL,
    publicUrl: process.env.PUBLIC_URL,
  },
);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
};
const server = http.createServer(async (req, res) => {
  try {
    const origin = `http://${req.headers.host}`,
      url = new URL(req.url, origin);
    if (url.pathname.startsWith("/api/")) {
      let sid = req.headers.cookie?.match(
        /(?:^|;\s*)rr_v2=([a-f0-9]{64})(?:;|$)/,
      )?.[1];
      if (!sid) {
        sid = randomBytes(32).toString("hex");
        res.setHeader(
          "Set-Cookie",
          `rr_v2=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
        );
      }
      let data = "";
      if (req.method === "POST")
        for await (const chunk of req) {
          data += chunk;
          if (data.length > 2048) {
            res.writeHead(413);
            res.end();
            return;
          }
        }
      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        ...(data ? { body: data } : {}),
      });
      const result = await service.handle(sid, request);
      res.writeHead(result.status, Object.fromEntries(result.headers));
      res.end(Buffer.from(await result.arrayBuffer()));
      return;
    }
    const pathname = decodeURIComponent(url.pathname),
      file = path.resolve(
        root,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
    if (
      !file.startsWith(root + path.sep) ||
      pathname.split("/").some((x) => x.startsWith("."))
    ) {
      res.writeHead(404);
      res.end();
      return;
    }
    const data = await fs.readFile(file),
      headers = {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
        "Accept-Ranges": "bytes",
      };
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if (range) {
      const start = Number(range[1]),
        end = range[2]
          ? Math.min(Number(range[2]), data.length - 1)
          : data.length - 1;
      if (start > end || start >= data.length) {
        res.writeHead(416, { "Content-Range": `bytes */${data.length}` });
        res.end();
        return;
      }
      res.writeHead(206, {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${data.length}`,
        "Content-Length": end - start + 1,
      });
      res.end(data.subarray(start, end + 1));
      return;
    }
    res.writeHead(200, { ...headers, "Content-Length": data.length });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.listen(port, "0.0.0.0", () =>
  console.log(`V2 server http://localhost:${port}`),
);
