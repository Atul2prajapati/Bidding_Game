// Controller: wires clicks to actions, runs solo games locally, and talks to the server online.

import { THEMES } from "/shared/themes.js";
import { MAXP, newGame, handle, tick } from "/shared/engine.js";
import { ctx, save, clip } from "./state.js";
import { view, ranking } from "./views.js";
import { connect } from "./net.js";
import { play, setSound, isSoundOn, enableTilt, fly, confetti, countUp } from "./fx.js";

const app = document.getElementById("app");
const toastEl = document.getElementById("toast");
let toastTimer = 0;

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), 3500);
}

/* ---------- Rendering + the moments worth animating ---------- */
let prev = null;   // what the last render showed, to spot what just changed

function snapshot(S) {
  if (!S || !S.players) return null;
  const mine = S.players.find(p => p.id === ctx.myId);
  return {
    phase: S.phase, hand: (S.hand || []).join(","), turn: S.players[S.turn]?.id,
    // Lobby players have no picks yet, so every count must cope with a missing list.
    myPicks: mine?.picks?.length ?? 0, allPicks: S.players.reduce((s, p) => s + (p.picks?.length ?? 0), 0),
    bid: S.auction?.bid ?? 0, lot: S.lot, lastWho: S.last?.who ?? null,
    pickNo: S.lastPick?.n ?? 0
  };
}

function render() {
  const S = ctx.S, now = snapshot(S), was = prev;
  const fresh = now && (!was || was.phase === "lobby");
  ctx.fx.deal = !!(now && S.mode === "draft" && S.phase === "play" && (!was || was.hand !== now.hand));
  const endedNow = now && now.phase === "end" && (!was || was.phase !== "end");
  // Your turn just started: bring the cards to the front on phones and give a little buzz (Android).
  const turnStarted = now && S.mode === "draft" && S.phase === "play" && now.turn === ctx.myId && (!was || was.turn !== ctx.myId);
  if (turnStarted) { ctx.mobileTab = "play"; buzz(30); }
  if (!now || now.phase === "lobby") ctx.mobileTab = "play";

  // Someone just bought a card: grab it from the screen before it disappears, so it can fly to their team.
  const newPick = !!(now && was && now.pickNo > was.pickNo && S.lastPick);
  ctx.fx.newPick = newPick;
  let flight = null;
  if (newPick) {
    const i = S.lastPick.i;
    const el = app.querySelector(`.hcard[data-v="${i}"] .fut, .hcard[data-v="${i}"] .portrait`) || app.querySelector(".lot .fut, .lot .portrait");
    if (el) flight = { rect: el.getBoundingClientRect(), html: el.outerHTML, pid: S.lastPick.pid };
  }

  app.innerHTML = view();
  updateTimers();

  // Keep the current picker visible in the turn-order bar (it scrolls sideways on small screens).
  const strip = app.querySelector(".order"), seat = strip?.querySelector(".seat.now");
  if (strip && seat) strip.scrollLeft = seat.offsetLeft - (strip.clientWidth - seat.clientWidth) / 2;

  if (now && !fresh && was) {
    if (now.turn === ctx.myId && was.turn !== ctx.myId && S.phase === "play" && S.mode === "draft") play("turn");
    else if (ctx.fx.deal) play("deal");
    if (now.myPicks > was.myPicks) { play("buy"); buzz([15, 40, 15]); }
    else if (S.mode === "draft" && now.allPicks > was.allPicks) play("pick");
    if (S.mode === "auction") {
      if (now.phase === "sold" && was.phase !== "sold") play(now.lastWho ? "sold" : "pass");
      else if (now.bid > was.bid && now.lot === was.lot) play("bid");
    }
  } else if (fresh && ctx.fx.deal) play("deal");

  // The card that was just bought flies into that player's team.
  if (flight) {
    const team = [...app.querySelectorAll(".team")].find(t => t.dataset.pid === flight.pid);
    const target = team?.querySelector(".slot.new") || team?.querySelector(".slot:not(.empty):last-of-type");
    if (target) fly(flight.rect, flight.html, target);
  }

  if (endedNow) {
    countUp(app);
    const winner = ranking(S)[0].p;
    if (winner.id === ctx.myId) { confetti(); play("win"); buzz([30, 60, 30, 60, 60]); } else play("end");
  }
  prev = now;
}

/* ---------- Timers (drawn between renders) ---------- */
const timeLeft = () => (ctx.S?.ends ? Math.max(0, ctx.S.ends - Date.now()) : null);
let lastSecond = null;
function updateTimers() {
  const l = timeLeft(), urgent = l != null && l < 3000;
  app.querySelectorAll("[data-ring]").forEach(el => {
    const C = 100.53, frac = l == null ? 1 : Math.min(1, l / +el.dataset.ring);
    el.style.strokeDashoffset = String(C * (1 - frac));
    el.classList.toggle("urgent", urgent);
  });
  // Tick in the last three seconds when it matters to you.
  const sec = l == null ? null : Math.ceil(l / 1000);
  const mineToAct = ctx.S?.mode === "auction" ? ctx.S?.phase === "play" : ctx.S?.players?.[ctx.S.turn]?.id === ctx.myId;
  if (urgent && sec !== lastSecond && sec > 0 && mineToAct) play("tick");
  lastSecond = sec;
  app.querySelectorAll("[data-timer]").forEach(el => { el.textContent = l == null ? "" : Math.ceil(l / 1000) + "s"; el.classList.toggle("urgent", urgent); });
  app.querySelectorAll("[data-bar]").forEach(el => { el.style.width = l == null ? "100%" : Math.min(100, (l / +el.dataset.bar) * 100) + "%"; el.classList.toggle("urgent", urgent); });
}

/* ---------- Solo ---------- */
function startSolo() {
  const { setup } = ctx, th = THEMES[setup.theme];
  const players = [{ id: "me", name: ctx.myName || "You" }]
    .concat(th.bots.slice(0, setup.bots).map((name, i) => ({ id: "bot" + i, name, bot: true })));
  Object.assign(ctx, { role: "solo", myId: "me", selected: null, filter: "all" });
  ctx.S = newGame({ themeKey: setup.theme, mode: setup.mode, players, timed: false });
  render();
}

/* ---------- Online ---------- */
function goOnline(firstMessage) {
  ctx.net?.close();
  Object.assign(ctx, { role: "online", S: null, myId: null, selected: null, filter: "all" });
  render();
  ctx.net = connect({
    onOpen: () => ctx.net.send(firstMessage),
    onMessage: onServer,
    onClose: () => { toast(ctx.S ? "Lost connection to the server." : "Couldn't reach the game server. It may be waking up, try again in a moment."); goHome(); }
  });
}

function onServer(m) {
  if (m.type === "welcome") { ctx.myId = m.you; ctx.pendingCode = m.code; return; }
  if (m.type === "error") { toast(m.message); if (m.fatal) goHome(); return; }
  if (m.type === "state") {
    const S = m.state;
    S.ends = S.left != null ? Date.now() + S.left : null;   // turn "time left" into a local deadline
    if (S.phase !== "play" || ctx.S?.turn !== S.turn) ctx.selected = null;
    ctx.S = S;
    render();
  }
}

function goHome() {
  if (ctx.net) { ctx.net.send({ type: "leave" }); ctx.net.close(); }
  Object.assign(ctx, { S: null, role: null, myId: null, net: null, selected: null, pendingCode: null });
  render();
}

/** Send a game move to whoever owns the game state. */
function act(d) {
  if (ctx.role === "solo") { if (handle(ctx.S, ctx.myId, d)) render(); }
  else ctx.net?.send({ type: "act", data: d });
}
const hostSend = msg => ctx.net?.send(msg);

/* ---------- Events ---------- */
app.addEventListener("input", e => {
  if (e.target.id === "nm") { ctx.myName = clip(e.target.value); save("hdd-name", ctx.myName); }
  if (e.target.id === "code") { ctx.joinCode = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4); e.target.value = ctx.joinCode; }
});
app.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.id === "code") join(); });

function join() {
  if (ctx.joinCode.length !== 4) return toast("Enter the 4-letter room code.");
  ctx.pendingCode = ctx.joinCode;
  goOnline({ type: "join", code: ctx.joinCode, name: ctx.myName || "Guest" });
}

app.addEventListener("click", e => {
  const b = e.target.closest("[data-a]");
  if (!b || b.disabled) return;
  const v = b.dataset.v, S = ctx.S;
  switch (b.dataset.a) {
    case "cat": ctx.setup.theme = v; ctx.homeStep = "setup"; render(); scrollTo(0, 0); break;
    case "back": ctx.homeStep = "pick"; render(); break;
    case "credits": ctx.homeStep = "credits"; render(); scrollTo(0, 0); break;
    case "theme": ctx.setup.theme = v; render(); break;
    case "mode": ctx.setup.mode = v; render(); break;
    case "bots-": ctx.setup.bots = Math.max(1, ctx.setup.bots - 1); render(); break;
    case "bots+": ctx.setup.bots = Math.min(MAXP - 1, ctx.setup.bots + 1); render(); break;
    case "solo": startSolo(); break;
    case "host": ctx.pendingCode = null; goOnline({ type: "create", name: ctx.myName || "Host", theme: ctx.setup.theme, mode: ctx.setup.mode }); break;
    case "join": join(); break;
    case "home": goHome(); break;
    case "ltheme": hostSend({ type: "settings", theme: v }); break;
    case "lmode": hostSend({ type: "settings", mode: v }); break;
    case "addbot": hostSend({ type: "settings", bots: S.bots + 1 }); break;
    case "rmbot": hostSend({ type: "settings", bots: Math.max(0, S.bots - 1) }); break;
    case "start": hostSend({ type: "start" }); break;
    case "sel": ctx.selected = Number(v); play("select"); buzz(8); render(); break;
    case "tab": ctx.mobileTab = v; render(); scrollTo({ top: 0 }); break;
    case "unsel": ctx.selected = null; render(); break;
    case "confirm": if (ctx.selected != null) {
      const i = ctx.selected;
      ctx.selected = null; act({ t: "pick", i }); render();
    } break;
    case "sound": setSound(!isSoundOn()); render(); break;
    case "themeToggle": toggleTheme(); break;
    case "bid": act({ t: "bid", a: Number(v) }); break;
    case "filter": ctx.filter = v; render(); break;
    case "again": ctx.role === "solo" ? startSolo() : hostSend({ type: "again" }); break;
  }
});

/* ---------- Haptics (Android; iPhones ignore web vibration) ---------- */
function buzz(pattern) { try { navigator.vibrate?.(pattern); } catch { /* not supported */ } }

/* ---------- Light / dark ---------- */
function applyTheme(t) { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
function toggleTheme() {
  const current = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  save("hdd-theme", next);
}
try { applyTheme(localStorage.getItem("hdd-theme")); } catch { /* storage blocked */ }
enableTilt(app);

/* ---------- Main loop ---------- */
setInterval(() => {
  if (ctx.role === "solo" && tick(ctx.S)) render();   // solo: run bots and timers here
  else updateTimers();
}, 200);

render();

// Card photos are optional: without a manifest every card keeps its coloured art.
fetch("/images/manifest.json")
  .then(r => (r.ok ? r.json() : {}))
  .then(p => { ctx.photos = p || {}; render(); })
  .catch(() => {});

// Installed-app support: cache the game so it opens instantly and solo works offline.
// Browsers only allow this on https or localhost.
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
