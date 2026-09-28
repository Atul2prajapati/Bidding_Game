// Game engine: pure functions over a plain state object `S`.
// Runs in the browser for solo games and on the server for multiplayer games,
// so both play by exactly the same rules.

import { THEMES, BUDGET, score } from "./themes.js";

export const MAXP = 5;          // players per game
export const HAND_SIZE = 5;     // cards dealt per turn
export const ICONS_PER_GAME = 8; // football / cricket: a different random set of legends each game
export const TURN_MS = 30000;   // time to pick in multiplayer
export const LOT_MS = 9000;     // auction: time before the first bid closes a lot
export const BID_MS = 5000;     // auction: every bid resets the clock to at least this
export const SOLD_MS = 2200;    // auction: pause on the SOLD banner

export const shuffle = a => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/* ---------- Helpers (also used by the UI) ---------- */
export const theme = S => THEMES[S.theme];
export const item = (S, i) => theme(S).items[i];
export const slotsLeft = (S, p) => theme(S).slots - p.picks.length;
export const minPrice = S => Math.min(...theme(S).items.map(x => x.p));
export const priceOf = (S, i) => S.reprice?.[i] ?? item(S, i).p;

// Money you must keep back to fill your other empty slots with the cheapest cards still in the deck.
function reserve(S, need, exclude) {
  if (need <= 0) return 0;
  // Auction: count the whole remaining deck (the list and the bench) at full price. Cheap second-chance
  // cards may be bought by someone else, so relying on them could leave a team unable to fill up.
  const cards = S.mode === "auction" ? S.pool.concat(S._bench || []) : S.pool;
  const prices = cards.filter(i => i !== exclude).map(i => item(S, i).p).sort((a, b) => a - b);
  let sum = 0;
  for (let k = 0; k < need; k++) sum += prices[k] ?? minPrice(S);
  return sum;
}
export const canAfford = (S, p, i) => {
  const left = slotsLeft(S, p);
  if (left <= 0) return false;
  return item(S, i).p + reserve(S, left - 1, i) <= p.money;
};
export const candidates = (S, p) => S.pool.filter(i => canAfford(S, p, i));
// Auction: the most you can bid and still fill your other slots with the cheapest cards left.
export const maxBid = (S, p) => (slotsLeft(S, p) > 0 ? p.money - reserve(S, slotsLeft(S, p) - 1, null) : 0);
// Auction: the opening bid is the card's list price; after that, any bid must beat the current one.
export const minNextBid = S => (S.auction ? (S.auction.lead ? S.auction.bid + 1 : S.auction.start) : 0);
// One clock for the whole engine: tick() sets it, so timers and tests agree.
const clock = S => S._clock ?? Date.now();
const gain = (S, p, i) => score(S.theme, p.picks.concat(i)).total - score(S.theme, p.picks).total - theme(S).base;

/* ---------- Setup ---------- */
export function newGame({ themeKey, mode, players, timed = true, code = null }) {
  const th = THEMES[themeKey];
  const S = {
    code, theme: themeKey, mode, phase: "play",
    players: shuffle(players).map(p => ({ id: p.id, name: p.name, bot: !!p.bot, money: BUDGET, picks: [] })),
    pool: th.items.map((_, i) => i),
    log: [], round: 1, pos: -1, dir: 1, turn: 0, hand: [],
    lot: 0, auction: null, last: null, reprice: {},   // reprice: unsold cards come back later, cheaper
    lastPick: null, history: [],          // who bought what, for the pick reveal and the "picks so far" feed
    ends: null, turnMs: timed ? TURN_MS : null,
    _botAt: 0, _botVals: {}, _botAct: {},
    _botStyle: {}                        // auction personality per bot (see BOT_STYLES)
  };
  S.players.filter(p => p.bot).forEach((p, k) => { S._botStyle[p.id] = BOT_STYLE_ORDER[k % BOT_STYLE_ORDER.length]; });
  // Markets with many legends (Icons) use only a random handful per game, so they stay special.
  const icons = S.pool.filter(i => th.items[i].icon);
  if (icons.length > ICONS_PER_GAME) {
    const keep = new Set(shuffle(icons).slice(0, ICONS_PER_GAME));
    S.pool = S.pool.filter(i => !th.items[i].icon || keep.has(i));
  }
  if (mode === "auction") {
    // The auction list: about 1.6 cards per empty slot, so cards are scarce enough that people bid properly.
    // The rest wait on the bench and only come in if the list runs short.
    const deck = weightedOrder(S, S.pool), size = Math.min(deck.length, Math.ceil(S.players.length * th.slots * 1.6));
    S.pool = shuffle(deck.slice(0, size));          // weighted pick of which cards, then a fair random order
    S._bench = deck.slice(size);
  }
  if (mode === "draft") nextDraftTurn(S); else nextLot(S);
  return S;
}

function log(S, m) { S.log = [m].concat(S.log).slice(0, 5); }
function recordPick(S, p, i, price, auto = false) {
  S.lastPick = { pid: p.id, i, price, auto, n: S.history.length + 1 };
  S.history = S.history.concat({ pid: p.id, i, price }).slice(-80);
}
function endGame(S) { S.phase = "end"; S.ends = null; log(S, "Market closed"); }

/* ---------- 5-card pick ---------- */
function nextDraftTurn(S) {
  const n = S.players.length;
  for (let k = 0; k < n * 2 + 2; k++) {
    S.pos += S.dir;                                   // snake order: 1..n, n..1, 1..n
    if (S.pos >= n) { S.pos = n - 1; S.dir = -1; S.round++; }
    else if (S.pos < 0) { S.pos = 0; S.dir = 1; S.round++; }
    const p = S.players[S.pos];
    if (candidates(S, p).length) {
      S.turn = S.pos;
      dealHand(S, p);
      S.ends = !p.bot && S.turnMs ? clock(S) + S.turnMs : null;
      S._botAt = 0;
      return;
    }
  }
  endGame(S);
}

/* ---------- Legends are rare ----------
   Icons (football / cricket legends) and a market's top price band are dealt less often, so they make up
   about RARE_SHARE of the cards you see, and never more than one per hand. Football has lots of Icons in
   its deck, so they get a lower weight than, say, Pokémon legendaries. */
export const RARE_SHARE = 0.07;
const weightCache = new Map();
function rareWeight(S) {
  const th = theme(S);
  if (!weightCache.has(th)) {
    const share = th.items.filter((_, i) => isRare(S, i)).length / th.items.length;
    weightCache.set(th, share ? Math.min(0.33, (RARE_SHARE * (1 - share)) / (share * (1 - RARE_SHARE))) : 1);
  }
  return weightCache.get(th);
}
const rareCache = new Map();
export function isRare(S, i) {
  const th = theme(S);
  if (!rareCache.has(th)) {
    const hasIcons = th.items.some(x => x.icon), top = Math.max(...th.items.map(x => x.p)) * 0.8;
    rareCache.set(th, new Set(th.items.map((x, k) => (hasIcons ? x.icon : x.p >= top) ? k : -1).filter(k => k >= 0)));
  }
  return rareCache.get(th).has(i);
}
// Random order where each card's chance of coming early follows its weight (weighted shuffle).
function weightedOrder(S, cards) {
  const w = rareWeight(S);
  return cards.map(i => ({ i, k: Math.pow(Math.random(), 1 / (isRare(S, i) ? w : 1)) }))
    .sort((a, b) => b.k - a.k).map(x => x.i);
}
function drawHand(S) {
  const out = [];
  let rare = 0;
  for (const i of weightedOrder(S, S.pool)) {
    if (isRare(S, i)) { if (rare) continue; rare++; }
    out.push(i);
    if (out.length === HAND_SIZE) break;
  }
  return out;
}

// Deal 5 random cards (legends rare): prefer a spread of prices, and always one this player can afford.
function dealHand(S, p) {
  let best = null, bs = -1;
  for (let t = 0; t < 30; t++) {
    const h = drawHand(S);
    const aff = h.filter(i => canAfford(S, p, i)).length;
    const dist = Math.min(4, new Set(h.map(i => item(S, i).p)).size);   // capped, so rare high prices aren't favoured
    const s = (aff ? 20 : 0) + Math.min(aff, 3) * 2 + dist;
    if (s > bs) { bs = s; best = h; }
  }
  if (!best.some(i => canAfford(S, p, i))) {
    const c = candidates(S, p).filter(i => !best.includes(i));
    if (c.length) best[best.length - 1] = c[(Math.random() * c.length) | 0];
  }
  S.hand = shuffle(best);
}

function botPick(S, p) {
  let c = S.hand.filter(i => canAfford(S, p, i));
  if (!c.length) c = candidates(S, p);
  if (!c.length) return null;
  const th = theme(S), per = p.money / slotsLeft(S, p);
  let best = c[0], bv = -1e9;
  for (const i of c) {
    const v = gain(S, p, i) * (0.85 + Math.random() * 0.3) - Math.max(0, item(S, i).p - per * 1.25) * th.pw;
    if (v > bv) { bv = v; best = i; }
  }
  return best;
}

function doPick(S, p, i, auto = false) {
  if (S.phase !== "play" || S.mode !== "draft" || S.players[S.turn] !== p) return false;
  if (i == null || !S.pool.includes(i) || !canAfford(S, p, i)) return false;
  if (!S.hand.includes(i) && S.hand.some(h => canAfford(S, p, h))) return false;
  const it = item(S, i);
  p.picks.push(i); p.money -= it.p; S.pool = S.pool.filter(x => x !== i);
  recordPick(S, p, i, it.p, auto);
  log(S, `${p.name}${auto ? " ran out of time, auto-picked " : " bought "}${it.n} for $${it.p}`);
  nextDraftTurn(S);
  return true;
}

/* ---------- Auction ---------- */
function nextLot(S) {
  // Skip cards that nobody can afford at their opening price, instead of making everyone wait.
  if (S.players.every(p => slotsLeft(S, p) <= 0)) return endGame(S);
  // Not enough cards left to fill every team? Bring fresh ones in from the bench, at full price.
  const open = S.players.reduce((n, p) => n + Math.max(0, slotsLeft(S, p)), 0);
  while (S._bench?.length && S.pool.length < open) S.pool.push(S._bench.shift());
  // Nobody can afford the next card? If someone still has empty slots, sell it at a price they can pay
  // (clearance) rather than skipping it and leaving their team short.
  while (S.pool.length && !S.players.some(p => maxBid(S, p) >= priceOf(S, S.pool[0]))) {
    const needy = S.players.filter(p => slotsLeft(S, p) > 0 && p.money > 0);
    if (!needy.length) { S.pool.shift(); continue; }
    const affordable = Math.max(1, Math.min(...needy.map(p => Math.floor(p.money / slotsLeft(S, p)))));
    if (priceOf(S, S.pool[0]) <= affordable) break;
    S.reprice[S.pool[0]] = affordable;
    if (S.players.some(p => maxBid(S, p) >= affordable)) break;
    S.pool.shift();
  }
  if (!S.pool.length) return endGame(S);
  S.lot++;
  const i = S.pool.shift();
  S.auction = { item: i, bid: 0, lead: null, start: priceOf(S, i), list: item(S, i).p };
  S.phase = "play"; S.ends = clock(S) + LOT_MS; S._botVals = {}; S._botAct = {};
}

function doBid(S, p, amt) {
  const a = S.auction;
  if (S.phase !== "play" || S.mode !== "auction" || !a) return false;
  amt = Math.floor(amt);
  if (amt < minNextBid(S) || amt > maxBid(S, p) || a.lead === p.id) return false;
  a.bid = amt; a.lead = p.id;
  S._botAct = {};
  S.ends = Math.max(S.ends, clock(S) + BID_MS);
  return true;
}

function resolveLot(S) {
  const a = S.auction, it = item(S, a.item), p = S.players.find(x => x.id === a.lead);
  if (p) { p.picks.push(a.item); p.money -= a.bid; S.last = { i: a.item, who: p.name, price: a.bid }; recordPick(S, p, a.item, a.bid); log(S, `${p.name} won ${it.n} for $${a.bid}`); }
  else {
    S.last = { i: a.item, who: null, price: 0 };
    // Second chance: back at 80% of its price, then 65%, then dropped. Small enough that waiting for bargains
    // doesn't beat bidding (a 60% discount made patient players win most games).
    S.returns = S.returns || {};
    const n = (S.returns[a.item] = (S.returns[a.item] || 0) + 1);
    let lower = n <= 2 ? Math.max(1, Math.min(a.start - 1, Math.round(it.p * (n === 1 ? 0.8 : 0.65)))) : a.start;
    // Last call: if dropping this card would leave teams unable to fill up, bring it back once more at $1.
    const open = S.players.reduce((c, p) => c + Math.max(0, slotsLeft(S, p)), 0);
    if (n > 2 && a.start > 1 && open > S.pool.length + (S._bench?.length || 0)) lower = 1;
    if (lower < a.start) { S.reprice[a.item] = lower; S.pool.push(a.item); log(S, `No bids on ${it.n}: back later at $${lower}`); }
    else log(S, `No bids on ${it.n}`);
  }
  S.phase = "sold"; S.ends = clock(S) + SOLD_MS;
}

/* ---------- Auction bots ----------
   Each bot has a personality: how much over the card's price it will go, how fast it reacts,
   and whether it jumps the bidding. Bots re-plan after every bid, so a human bid gets answered. */
const BOT_STYLES = {
  aggressive: { pay: 1.07, react: [350, 900], jump: 0.35 },   // answers fast, jumps the bidding
  balanced:   { pay: 1.03, react: [650, 1500], jump: 0.15 },
  bargain:    { pay: 1.0, react: [1400, 2800], jump: 0 }      // bids late
};
const BOT_STYLE_ORDER = ["aggressive", "balanced", "bargain"];

// What a card "should" cost for its rating in this market (straight-line fit of price against rating).
const fitCache = new Map();
export function fairPrice(S, it) {
  const th = theme(S);
  if (!fitCache.has(th)) {
    const xs = th.items.map(x => x.r), ys = th.items.map(x => x.p), n = xs.length;
    const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
    const b = xs.reduce((s, x, k) => s + (x - mx) * (ys[k] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
    fitCache.set(th, { a: my - b * mx, b });
  }
  const { a, b } = fitCache.get(th);
  return Math.max(1, a + b * it.r);
}

// Bots don't care about most lots, but fight hard for the ones that would improve their team most ("targets").
export function botValue(S, b) {
  const k = S.lot + ":" + b.id;
  if (S._botVals[k] == null) {
    const i = S.auction.item, it = item(S, i), th = theme(S);
    const style = BOT_STYLES[S._botStyle[b.id]] || BOT_STYLES.balanced;
    const g = gain(S, b, i);
    // How this card ranks against what's still to come in the auction list, for this bot's team.
    const upcoming = S.pool.slice(0, 40).map(j => gain(S, b, j));
    const rank = upcoming.length ? upcoming.filter(x => x < g).length / upcoming.length : 1;
    const openSlots = S.players.reduce((n, p) => n + Math.max(0, slotsLeft(S, p)), 0);
    const scarce = openSlots / Math.max(1, S.pool.length + 1) >= 0.6;        // few cards left: fill the team
    const target = g > 0 && rank >= 0.7;
    const desire = target ? 1.25 + Math.random() * 0.2                        // really wants it: keeps raising
      : g > 0 && (rank >= 0.35 || scarce) ? 1.02 + Math.random() * 0.13       // happy to pay about list price
      : 0.55 + Math.random() * 0.2;                                           // not interested unless it's cheap
    const worth = 0.5 * it.p + 0.5 * fairPrice(S, it);                        // list price, nudged by rating-for-price
    const perSlot = maxBid(S, b) / Math.max(1, slotsLeft(S, b));
    const pace = Math.min(1.3, Math.max(0.85, perSlot / (BUDGET / th.slots)));
    let v = worth * desire * pace * style.pay * (scarce ? 1.15 : 1);
    v = Math.min(v, perSlot * (target ? 2.6 : 1.7));                           // never blow the budget on one card
    S._botVals[k] = Math.floor(v);
  }
  return S._botVals[k];
}

/* ---------- Public API ---------- */

/** Apply a player's action. Returns true when the state changed. */
export function handle(S, pid, d, now = Date.now()) {
  if (!S || !d || S.phase !== "play") return false;
  S._clock = now;
  const p = S.players.find(x => x.id === pid);
  if (!p) return false;
  if (d.t === "pick") return doPick(S, p, Number(d.i));
  if (d.t === "bid") return doBid(S, p, Number(d.a));
  return false;
}

/** Advance timers and bots. Call a few times a second. Returns true when the state changed. */
export function tick(S, now = Date.now()) {
  if (!S || (S.phase !== "play" && S.phase !== "sold")) return false;
  S._clock = now;
  if (S.mode === "draft") {
    const p = S.players[S.turn];
    if (p.bot) {
      if (!S._botAt) S._botAt = now + 700 + Math.random() * 1000;
      return now >= S._botAt ? doPick(S, p, botPick(S, p)) : false;
    }
    return S.ends && now >= S.ends ? doPick(S, p, botPick(S, p), true) : false;
  }
  if (S.phase === "sold") { if (now >= S.ends) { nextLot(S); return true; } return false; }
  if (now >= S.ends) { resolveLot(S); return true; }
  const a = S.auction, left = S.ends - now, next = minNextBid(S);
  for (const b of shuffle(S.players.filter(x => x.bot))) {
    if (a.lead === b.id) continue;
    const cap = Math.min(botValue(S, b), maxBid(S, b));
    if (next > cap) continue;                                        // not worth it at this price
    const style = BOT_STYLES[S._botStyle[b.id]] || BOT_STYLES.balanced;
    if (S._botAct[b.id] == null) {
      let wait = style.react[0] + Math.random() * (style.react[1] - style.react[0]);
      if (left - wait < 700) wait = Math.max(150, left - 700 - Math.random() * 400);   // always get a bid in before the hammer
      S._botAct[b.id] = now + wait;
    }
    if (now >= S._botAct[b.id]) {
      const jump = a.lead && Math.random() < style.jump ? 1 + Math.floor(Math.random() * 3) : 0;
      return doBid(S, b, Math.min(cap, next + jump));
    }
  }
  return false;
}

/** State safe to send over the network: private fields dropped, deadline as time remaining. */
export function publicState(S, now = Date.now()) {
  const o = {};
  for (const k of Object.keys(S)) if (!k.startsWith("_") && k !== "ends") o[k] = S[k];
  o.left = S.ends ? Math.max(0, S.ends - now) : null;
  return o;
}
