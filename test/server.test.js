// End-to-end: start the real server, connect two players, play a full game.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import WebSocket from "ws";
import { canAfford } from "../shared/engine.js";

const PORT = 3999;
const server = spawn(process.execPath, ["server/index.js"], { env: { ...process.env, PORT: String(PORT) }, stdio: "pipe" });
after(() => server.kill());
await new Promise((res, rej) => {
  server.stdout.on("data", d => String(d).includes("running") && res());
  server.on("exit", code => rej(new Error("server exited " + code)));
});

function player(name) {
  const ws = new WebSocket(`ws://localhost:${PORT}/ws`);
  const p = { ws, name, id: null, state: null, waiters: [] };
  ws.on("message", raw => {
    const m = JSON.parse(raw);
    if (m.type === "welcome") { p.id = m.you; p.code = m.code; }
    if (m.type === "state") p.state = m.state;
    p.waiters = p.waiters.filter(w => !w(m));
  });
  p.send = msg => ws.send(JSON.stringify(msg));
  p.until = (pred, ms = 8000) => new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error(`${name} timed out`)), ms);
    const check = m => { if (pred(m, p)) { clearTimeout(t); res(m); return true; } return false; };
    p.waiters.push(check);
  });
  p.open = new Promise(r => ws.on("open", r));
  return p;
}

test("serves the game page and shared engine", async () => {
  const html = await (await fetch(`http://localhost:${PORT}/`)).text();
  assert.match(html, /<title>Hundred Dollar Draft<\/title>/);
  const js = await fetch(`http://localhost:${PORT}/shared/engine.js`);
  assert.equal(js.status, 200);
  assert.match(js.headers.get("content-type"), /javascript/);
  const bad = await fetch(`http://localhost:${PORT}/..%2f..%2fpackage.json`);
  assert.notEqual(bad.status, 200, "no path traversal");
});

test("two players host, join and finish a game with a bot", { timeout: 60000 }, async () => {
  const a = player("Atul"), b = player("Friend");
  await Promise.all([a.open, b.open]);

  a.send({ type: "create", name: "Atul", theme: "anime", mode: "draft" });
  await a.until(m => m.type === "state" && m.state.phase === "lobby");
  b.send({ type: "join", code: a.code, name: "Friend" });
  await a.until(m => m.type === "state" && m.state.players.length === 2);

  b.send({ type: "start" });                                   // guests can't start
  a.send({ type: "settings", bots: 1 });
  await a.until(m => m.type === "state" && m.state.players.length === 3);
  a.send({ type: "start" });
  await a.until(m => m.type === "state" && m.state.phase === "play");

  // Each human buys the first affordable card whenever it's their turn.
  const autoPlay = p => p.until((m, pl) => {
    if (m.type !== "state") return false;
    const S = m.state;
    if (S.phase === "end") return true;
    const cur = S.players[S.turn];
    if (cur.id === pl.id) {
      const i = S.hand.find(i => canAfford(S, cur, i));
      pl.send({ type: "act", data: { t: "pick", i } });
    }
    return false;
  }, 50000);
  const kick = s => { const cur = s.players[s.turn]; const who = cur.id === a.id ? a : cur.id === b.id ? b : null;
    if (who) who.send({ type: "act", data: { t: "pick", i: s.hand.find(i => canAfford(s, cur, i)) } }); };
  const done = Promise.all([autoPlay(a), autoPlay(b)]);
  kick(a.state);
  await done;

  const S = a.state;
  assert.equal(S.phase, "end");
  assert.equal(S.players.length, 3);
  S.players.forEach(p => assert.equal(p.picks.length, 6, `${p.name} filled all 6 slots`));
  a.ws.close(); b.ws.close();
});
