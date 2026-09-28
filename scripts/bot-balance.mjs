// Measures how hard the bots fight in auctions against two kinds of human player.
//   node scripts/bot-balance.mjs
// "Overpayer": bids on every card up to 1.3x its price.  "Smart": bids only on good cards for the team, up to 1.1x.
import { THEMES, score } from "../shared/themes.js";
import { newGame, tick, handle, maxBid, minNextBid, item, slotsLeft } from "../shared/engine.js";

const GAMES = 60;
const STRATS = {
  overpayer: (S, me, it) => Math.floor(it.p * 1.3),
  smart: (S, me, it) => {
    const g = score(S.theme, me.picks.concat(S.auction.item)).total - score(S.theme, me.picks).total;
    return g > THEMES[S.theme].base * 1.05 ? Math.floor(it.p * 1.1) : 0;   // only cards that clearly improve the team
  }
};

function run(themeKey, strat) {
  let contested = 0, humanBidLots = 0, paid = 0, list = 0, wins = 0;
  for (let g = 0; g < GAMES; g++) {
    const players = [{ id: "me", name: "Human" }, ...[0, 1, 2].map(i => ({ id: "b" + i, name: "Bot " + i, bot: true }))];
    const S = newGame({ themeKey, mode: "auction", players, timed: true });
    const me = S.players[0];
    let now = Date.now(), steps = 0, last = 0, lot = -1, humanBid = false, botAfterHuman = false;
    while (S.phase !== "end" && steps++ < 100000) {
      now += 200;
      if (S.lot !== lot) { if (humanBid) { humanBidLots++; if (botAfterHuman) contested++; } lot = S.lot; humanBid = botAfterHuman = false; }
      if (S.phase === "play" && S.auction && S.auction.lead !== "me" && slotsLeft(S, me) > 0 && now - last > 900) {
        const it = item(S, S.auction.item), next = minNextBid(S);
        if (next <= Math.min(maxBid(S, me), STRATS[strat](S, me, it))) { handle(S, "me", { t: "bid", a: next }, now); last = now; humanBid = true; }
      }
      const lead = S.auction?.lead;
      tick(S, now);
      if (humanBid && S.auction && S.auction.lead && S.auction.lead !== "me" && S.auction.lead !== lead) botAfterHuman = true;
    }
    S.history.filter(h => h.pid === "me").forEach(h => { paid += h.price; list += THEMES[themeKey].items[h.i].p; });
    const ranked = S.players.map(p => ({ id: p.id, t: score(themeKey, p.picks).total })).sort((a, b) => b.t - a.t);
    if (ranked[0].id === "me") wins++;
  }
  return { contested: contested / Math.max(1, humanBidLots), markup: paid / Math.max(1, list), wins: wins / GAMES };
}

console.log("Contested = a bot fought back after you bid · Markup = what you paid vs list price · Win = you finished 1st of 4 (fair = 25%)\n");
for (const themeKey of Object.keys(THEMES)) {
  const o = run(themeKey, "overpayer"), s = run(themeKey, "smart");
  const f = r => `contested ${(r.contested * 100).toFixed(0).padStart(3)}% · markup ${r.markup.toFixed(2)}x · win ${(r.wins * 100).toFixed(0).padStart(3)}%`;
  console.log(`${themeKey.padEnd(9)} overpayer: ${f(o)}   |   smart: ${f(s)}`);
}
