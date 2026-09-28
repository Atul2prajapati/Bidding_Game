// Hundred Dollar Draft server: serves the game files and runs multiplayer over WebSockets.
//   npm start            -> http://localhost:3000
//   PORT=8080 npm start  -> choose another port
//
// Environment variables (all optional):
//   PORT             port to listen on (hosting services like Render set this for you)
//   ALLOWED_ORIGINS  comma-separated websites allowed to connect for multiplayer, e.g.
//                    "https://hundred-dollar-draft.vercel.app,https://mygame.com". Empty = allow any.

import http from "node:http";
import os from "node:os";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { onConnection, roomCount } from "./rooms.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT) || 3000;

// URL prefix -> folder on disk. /shared is served so the browser can import the same engine.
const MOUNTS = [["/shared/", path.join(ROOT, "shared")], ["/", path.join(ROOT, "public")]];
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ok: true, rooms: roomCount() }));
  }
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";
  const [prefix, dir] = MOUNTS.find(([p]) => pathname.startsWith(p));
  const file = path.normalize(path.join(dir, pathname.slice(prefix.length)));
  if (!file.startsWith(dir)) { res.writeHead(403); return res.end("Forbidden"); }   // block ../ tricks
  try {
    const body = await readFile(file);
    const cache = pathname.startsWith("/images/") || pathname.startsWith("/icons/") ? "public, max-age=604800" : "no-cache";
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": cache });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  }
});

// Only let your own websites use this server for multiplayer (when ALLOWED_ORIGINS is set).
const ALLOWED = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim().replace(/\/+$/, "")).filter(Boolean);
const wss = new WebSocketServer({
  server, path: "/ws", maxPayload: 4096,
  verifyClient: ({ origin, req }) => {
    if (!ALLOWED.length || !origin) return true;
    const self = `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
    return origin === self || ALLOWED.includes(origin);
  }
});
wss.on("connection", (ws, req) => {
  ws.isAlive = true;
  ws.on("pong", () => (ws.isAlive = true));
  onConnection(ws, req);
});

// Keep-alive: hosting services close connections that go quiet (e.g. during a long turn),
// and a phone that loses signal can leave a dead connection behind. Ping every 25 seconds;
// anyone who didn't answer the last ping is disconnected (and replaced by a bot mid-game).
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 25000);
heartbeat.unref();

server.on("error", err => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n  Port ${PORT} is already in use. Another copy of the game (or another app) is running on it.`);
    console.error(`  Close that one, or start on another port:  PORT=${PORT + 1} npm start\n`);
    process.exit(1);
  }
  throw err;
});
wss.on("error", () => {});   // listen errors are reported once, above

server.listen(PORT, "0.0.0.0", () => {
  const lan = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === "IPv4" && !i.internal).map(i => i.address);
  console.log(`\n  Hundred Dollar Draft is running\n`);
  if (ALLOWED.length) console.log(`  Multiplayer allowed from: ${ALLOWED.join(", ")}`);
  console.log(`  On this computer:   http://localhost:${PORT}`);
  lan.forEach(ip => console.log(`  Friends on Wi-Fi:   http://${ip}:${PORT}`));
  console.log("");
});
