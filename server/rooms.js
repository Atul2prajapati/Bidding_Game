// Multiplayer rooms. The server owns every game's state, so nobody can cheat
// by editing their browser, and a game keeps going if the host drops out.

import { randomUUID } from "node:crypto";
import { THEMES } from "../shared/themes.js";
import { MAXP, newGame, handle, tick, publicState } from "../shared/engine.js";

const rooms = new Map();                 // code -> room
const CODE_LETTERS = "ABCDEFGHJKMNPQRSTUVWXYZ";

const clip = s => String(s || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 16);

function newCode() {
  let code;
  do { code = Array.from({ length: 4 }, () => CODE_LETTERS[(Math.random() * CODE_LETTERS.length) | 0]).join(""); }
  while (rooms.has(code));
  return code;
}

function lobbyPlayers(room) {
  const humans = [...room.clients.entries()].slice(0, MAXP).map(([id, c]) => ({ id, name: c.name, bot: false }));
  const nb = Math.max(0, Math.min(room.bots, MAXP - humans.length));
  const bots = THEMES[room.theme].bots.slice(0, nb).map((name, i) => ({ id: "bot" + i, name, bot: true }));
  return humans.concat(bots);
}

function roomState(room) {
  if (room.game) return { ...publicState(room.game), hostId: room.hostId };
  return { phase: "lobby", code: room.code, theme: room.theme, mode: room.mode, bots: room.bots, hostId: room.hostId, players: lobbyPlayers(room) };
}

function send(ws, msg) { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); }
function broadcast(room) {
  const state = roomState(room);
  for (const c of room.clients.values()) send(c.ws, { type: "state", state });
}

function leave(client) {
  const room = rooms.get(client.code);
  if (!room) return;
  room.clients.delete(client.id);
  client.code = null;
  if (!room.clients.size) { rooms.delete(room.code); return; }
  if (room.hostId === client.id) room.hostId = room.clients.keys().next().value;
  // A player who leaves mid-game is replaced by a bot so the game can finish.
  const p = room.game?.players.find(x => x.id === client.id);
  if (p && room.game.phase !== "end") { p.bot = true; p.name = p.name + " (bot)"; }
  broadcast(room);
}

/** Wire one WebSocket connection into the room system. */
export function onConnection(ws) {
  const client = { id: randomUUID().slice(0, 8), ws, code: null };

  ws.on("message", raw => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.type !== "string") return;
    const room = client.code ? rooms.get(client.code) : null;
    const isHost = room && room.hostId === client.id;

    switch (m.type) {
      case "create": {
        if (room) leave(client);
        const r = {
          code: newCode(), hostId: client.id, clients: new Map(), game: null, bots: 0,
          theme: THEMES[m.theme] ? m.theme : "anime", mode: m.mode === "auction" ? "auction" : "draft"
        };
        rooms.set(r.code, r);
        r.clients.set(client.id, { ws, name: clip(m.name) || "Host" });
        client.code = r.code;
        send(ws, { type: "welcome", you: client.id, code: r.code });
        broadcast(r);
        break;
      }
      case "join": {
        const code = String(m.code || "").toUpperCase();
        const r = rooms.get(code);
        if (!r) return send(ws, { type: "error", message: `No game found with code ${code}.`, fatal: true });
        if (room) leave(client);
        r.clients.set(client.id, { ws, name: clip(m.name) || "Guest" });
        client.code = code;
        send(ws, { type: "welcome", you: client.id, code });
        broadcast(r);
        break;
      }
      case "settings":
        if (!isHost || room.game) return;
        if (THEMES[m.theme]) room.theme = m.theme;
        if (m.mode === "draft" || m.mode === "auction") room.mode = m.mode;
        if (Number.isInteger(m.bots)) room.bots = Math.max(0, Math.min(MAXP - 1, m.bots));
        broadcast(room);
        break;
      case "start": {
        if (!isHost || room.game) return;
        const players = lobbyPlayers(room);
        if (players.length < 2) return send(ws, { type: "error", message: "You need at least 2 players. Add a bot." });
        room.game = newGame({ themeKey: room.theme, mode: room.mode, players, timed: true, code: room.code });
        broadcast(room);
        break;
      }
      case "act":
        if (room?.game && handle(room.game, client.id, m.data)) broadcast(room);
        break;
      case "again":
        if (!isHost || !room.game) return;
        room.bots = room.game.players.filter(p => p.bot && p.id.startsWith("bot")).length;
        room.game = null;
        broadcast(room);
        break;
      case "leave":
        leave(client);
        break;
    }
  });

  ws.on("close", () => leave(client));
}

// One clock for every room: timers, bot turns and auction countdowns.
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) if (room.game && tick(room.game, now)) broadcast(room);
}, 200).unref();

export const roomCount = () => rooms.size;
