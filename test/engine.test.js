import { test } from "node:test";
import assert from "node:assert/strict";
import { THEMES, BUDGET } from "../shared/themes.js";
import { newGame, handle, tick, canAfford, publicState } from "../shared/engine.js";

// Run a whole game with bots only, fast-forwarding the clock.
function playOut(themeKey, mode, nPlayers) {
  const players = Array.from({ length: nPlayers }, (_, i) => ({ id: "b" + i, name: "Bot " + i, bot: true }));
  const S = newGame({ themeKey, mode, players, timed: true });
  let now = Date.now(), steps = 0;   // fake clock, 400ms per step
  while (S.phase !== "end" && steps < 20000) { now += 400; tick(S, now); steps++; }
  return S;
}

for (const themeKey of Object.keys(THEMES)) {
  for (const mode of ["draft", "auction"]) {
    test(`${themeKey} / ${mode}: a 5-player bot game finishes within the rules`, () => {
      const S = playOut(themeKey, mode, 5);
      const th = THEMES[themeKey];
      assert.equal(S.phase, "end");
      const all = S.players.flatMap(p => p.picks);
      assert.equal(new Set(all).size, all.length, "no card is owned twice");
      for (const p of S.players) {
        assert.ok(p.money >= 0, `${p.name} never goes below $0`);
        assert.ok(p.picks.length <= th.slots, `${p.name} never overfills`);
        const spent = BUDGET - p.money;
        if (mode === "auction") assert.ok(p.picks.length > 0, `${p.name} won at least one lot`);
        if (mode === "draft" && p.picks.length < th.slots)
          assert.ok(!S.pool.some(i => canAfford(S, p, i)), `${p.name} stopped early only because nothing left was affordable`);
        if (mode === "draft") assert.equal(spent, p.picks.reduce((s, i) => s + th.items[i].p, 0), "draft pays list price");
      }
    });
  }
}

test("with 5 players, every market has enough cheap cards that nearly everyone fills their team", () => {
  for (const themeKey of Object.keys(THEMES)) {
    let full = 0, total = 0;
    for (let g = 0; g < 40; g++) { const S = playOut(themeKey, "draft", 5); S.players.forEach(p => { total++; if (p.picks.length === THEMES[themeKey].slots) full++; }); }
    assert.ok(full / total > 0.95, `${themeKey}: only ${Math.round(full / total * 100)}% of teams were completed`);
  }
});

test("every card has a sensible price and rating, and combos name real cards", () => {
  for (const [k, th] of Object.entries(THEMES)) {
    const names = new Set(th.items.map(x => x.n));
    assert.equal(names.size, th.items.length, `${k}: duplicate card names`);
    for (const it of th.items) {
      assert.ok(Number.isInteger(it.p) && it.p >= 1 && it.p <= BUDGET, `${k}/${it.n}: bad price ${it.p}`);
      assert.ok(Number.isFinite(it.r) && it.r > 0, `${k}/${it.n}: bad rating ${it.r}`);
      assert.ok(th.cats[it.t], `${k}/${it.n}: unknown category ${it.t}`);
      if (th.series) assert.ok(th.series[it.e], `${k}/${it.n}: unknown series ${it.e}`);
    }
    th.combos.forEach(([l, need]) => need.forEach(n => assert.ok(names.has(n), `${k}: combo "${l}" names missing card ${n}`)));
  }
});

test("5-card pick deals 5 cards with at least one the player can afford", () => {
  const S = newGame({ themeKey: "anime", mode: "draft", players: [{ id: "a", name: "A" }, { id: "b", name: "B" }], timed: false });
  assert.equal(S.hand.length, 5);
  assert.ok(S.hand.some(i => canAfford(S, S.players[S.turn], i)));
});

test("players can only buy from their own hand, on their own turn", () => {
  const S = newGame({ themeKey: "football", mode: "draft", players: [{ id: "a", name: "A" }, { id: "b", name: "B" }], timed: false });
  const cur = S.players[S.turn], other = S.players[1 - S.turn];
  const notInHand = S.pool.find(i => !S.hand.includes(i));
  const inHand = S.hand.find(i => canAfford(S, cur, i));
  assert.equal(handle(S, other.id, { t: "pick", i: inHand }), false, "not your turn");
  assert.equal(handle(S, cur.id, { t: "pick", i: notInHand }), false, "card not in hand");
  assert.equal(handle(S, cur.id, { t: "pick", i: inHand }), true);
  assert.equal(cur.picks[0], inHand);
});

test("auction opens at the card's price and rejects low or unaffordable bids", () => {
  const S = newGame({ themeKey: "football", mode: "auction", players: [{ id: "a", name: "A" }, { id: "b", name: "B" }], timed: true });
  const price = THEMES.football.items[S.auction.item].p;
  assert.equal(S.auction.start, price, "opening bid is the list price");
  if (price > 1) assert.equal(handle(S, "a", { t: "bid", a: price - 1 }), false, "can't open below the card's price");
  assert.equal(handle(S, "a", { t: "bid", a: price }), true, "opening at the list price works");
  assert.equal(handle(S, "b", { t: "bid", a: price }), false, "must beat the current bid");
  assert.equal(handle(S, "b", { t: "bid", a: 999 }), false, "can't bid more than you can afford");
  assert.equal(handle(S, "a", { t: "bid", a: price + 1 }), false, "can't outbid yourself");
  assert.equal(handle(S, "b", { t: "bid", a: price + 1 }), true);
});

test("in a full bot auction, every card sells for at least its price", () => {
  for (const themeKey of Object.keys(THEMES)) {
    const S = playOut(themeKey, "auction", 4);
    const th = THEMES[themeKey];
    assert.ok(S.history.length > 0, themeKey + ": something sold");
    for (const h of S.history) {
      const asking = S.reprice[h.i] ?? th.items[h.i].p;          // full price, or its lower second-chance price
      assert.ok(h.price >= asking, `${themeKey}: ${th.items[h.i].n} sold for $${h.price}, below its $${asking} asking price`);
    }
    S.players.forEach(p => assert.equal(p.picks.length, th.slots, `${themeKey}: ${p.name} filled every slot`));
  }
});

test("publicState hides internal fields and sends time left", () => {
  const S = newGame({ themeKey: "burger", mode: "auction", players: [{ id: "a", name: "A" }, { id: "b", name: "B" }] });
  const pub = publicState(S);
  assert.ok(!Object.keys(pub).some(k => k.startsWith("_")));
  assert.equal(typeof pub.left, "number");
  assert.ok(JSON.stringify(pub).length < 4000);
});

test("football: FIFA-style stat bonuses and Icon combos score", async () => {
  const { score } = await import("../shared/themes.js");
  const idx = names => names.map(n => THEMES.football.items.findIndex(x => x.n === n));
  const labels = names => score("football", idx(names)).lines.map(l => l.l);
  // Mbappé, Vinícius Jr and Theo-level pace up front: average pace 88+.
  assert.ok(labels(["Mbappé", "Vinícius Jr", "Henry"]).some(l => l.startsWith("Rapid attack")));
  // Three elite defenders.
  assert.ok(labels(["Maldini", "Nesta", "Van Dijk"]).some(l => l.startsWith("Brick wall")));
  // Icon combo + Hall of fame for 3 Icons.
  const t = labels(["Xavi", "Iniesta", "Messi", "Pelé"]);
  assert.ok(t.includes("Tiki-taka"));
  assert.ok(t.some(l => l.startsWith("Hall of fame")), "Xavi, Iniesta and Pelé are 3 Icons");
  assert.ok(!labels(["Xavi", "Iniesta", "Messi"]).some(l => l.startsWith("Hall of fame")), "Messi is not an Icon");
  // Every footballer has six stats and a nation.
  THEMES.football.items.forEach(it => { assert.equal(it.s?.length, 6, it.n); assert.ok(it.e, it.n + " nation"); });
});

test("cricket: FIFA-style stats, legend combos and bonuses score", async () => {
  const { score } = await import("../shared/themes.js");
  const idx = names => names.map(n => THEMES.cricket.items.findIndex(x => x.n === n));
  const labels = names => score("cricket", idx(names)).lines.map(l => l.l);
  const t = labels(["Ricky Ponting", "Adam Gilchrist", "Glenn McGrath", "Shane Warne"]);
  assert.ok(t.includes("Aussie dynasty"));
  assert.ok(t.some(l => l.startsWith("Hall of fame")), "4 legends");
  assert.ok(labels(["Jasprit Bumrah", "Wasim Akram", "Glenn McGrath", "Dale Steyn"]).some(l => l.startsWith("Bowling attack")));
  assert.ok(labels(["Sachin Tendulkar", "Don Bradman", "Brian Lara", "Virat Kohli"]).some(l => l.startsWith("Top order")));
  THEMES.cricket.items.forEach(it => { assert.equal(it.s?.length, 6, it.n); assert.ok(it.e, it.n + " nation"); });
  assert.equal(THEMES.cricket.items.filter(x => x.icon).length, 29);
});

test("auction bots answer a human bid instead of letting it through", () => {
  const S = newGame({ themeKey: "football", mode: "auction", players: [{ id: "me", name: "Me" }, { id: "b0", name: "Bot", bot: true }], timed: true });
  let now = Date.now();
  const price = S.auction.start;
  S._botVals[`${S.lot}:b0`] = price + 5;                 // this bot wants the card more than the human
  assert.equal(handle(S, "me", { t: "bid", a: price }, now), true);
  for (let k = 0; k < 20 && S.auction.lead === "me"; k++) { now += 100; tick(S, now); }   // up to 2 seconds
  assert.equal(S.auction.lead, "b0", "the bot counter-bid within a couple of seconds");
  assert.ok(S.auction.bid > price);
});

test("legends stay rare: at most one per hand, and only a handful of Icons per game", async () => {
  const { isRare, ICONS_PER_GAME } = await import("../shared/engine.js");
  for (const themeKey of ["football", "cricket", "anime", "pokemon"]) {
    const S = newGame({ themeKey, mode: "draft", players: [0, 1, 2, 3].map(i => ({ id: "b" + i, name: "b", bot: true })), timed: true });
    const icons = S.pool.filter(i => THEMES[themeKey].items[i].icon).length;
    assert.ok(icons <= ICONS_PER_GAME, `${themeKey}: ${icons} Icons in one game`);
    let now = Date.now(), last = "";
    while (S.phase !== "end") {
      const key = S.hand.join();
      if (key !== last) { last = key; assert.ok(S.hand.filter(i => isRare(S, i)).length <= 1, `${themeKey}: two legends in one hand`); }
      now += 400; tick(S, now);
    }
  }
});
