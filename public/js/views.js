// Screens. Each function returns an HTML string built from the app context.
// Anything a player typed (names) goes through esc() before it reaches the page.

import { THEMES, BUDGET, score, initials } from "/shared/themes.js";
import { MAXP, LOT_MS, theme, item, canAfford, maxBid, minNextBid, priceOf, fairPrice, slotsLeft } from "/shared/engine.js";
import { onlineAvailable } from "./net.js";
import { ctx, me, isHost, modeLabel } from "./state.js";
import { isSoundOn } from "./fx.js";

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* ---------- Icons ---------- */
const ICON = {
  arrow: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  back: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>`,
  soundOn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>`,
  soundOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="m22 9-6 6M16 9l6 6"/></svg>`,
  theme: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/></svg>`
};

/* ---------- Card art ---------- */
// A downloaded photo when there is one (see scripts/fetch-images.js), otherwise coloured art with initials.
const photo = (it, th) => ctx.photos[th.kind]?.[it.n];
const img = (it, p) => `<img src="/images/${esc(p.file)}" alt="${esc(it.n)}" loading="lazy" decoding="async">`;

export function portrait(it, th) {
  if (th.kind === "food") return `<div class="portrait food" style="--c1:${th.cats[it.t][1]}">${it.e}</div>`;
  const [label, c1, c2] = th.series ? th.series[it.e] : [th.cats[it.t][0], th.cats[it.t][1], "#1e293b"];
  const p = photo(it, th);
  if (p) return `<div class="portrait photo" style="--c1:${c1};--c2:${c2}">${img(it, p)}<span>${esc(label)}</span></div>`;
  return `<div class="portrait" style="--c1:${c1};--c2:${c2}"><b>${esc(initials(it.n))}</b><span>${esc(label)}</span></div>`;
}

// FIFA-style card (football + cricket): rating, role, nation, photo, name and six stats on a tiered shield.
const tierName = (it, th) => { const t = th.card.tier(it); return t === "icon" ? "Icon" : t[0].toUpperCase() + t.slice(1); };
export function futCard(it, th) {
  const tier = th.card.tier(it), p = photo(it, th), labels = th.card.alt[it.t] || th.card.labels;
  const pic = p ? img(it, p) : `<b>${esc(initials(it.n))}</b>`;
  const stat = k => it.s ? `<span><b>${it.s[k]}</b>${labels[k]}</span>` : "";
  return `<div class="fut ${tier}"><div class="fut-inner">
    <div class="fut-pic">${pic}</div>
    <div class="fut-top"><b class="ovr">${it.r}</b><span class="pos">${it.t}</span><span class="flag">${it.e || ""}</span></div>
    <div class="fut-name ${it.n.length > 11 ? "long" : ""}">${esc(it.n)}</div>
    <div class="fut-stats"><div class="col">${stat(0)}${stat(1)}${stat(2)}</div><div class="col">${stat(3)}${stat(4)}${stat(5)}</div></div>
    ${it.icon ? `<div class="fut-badge">ICON</div>` : ""}
  </div></div>`;
}
// The big card art: FIFA-style for football, portrait art for everything else.
const bigCard = (it, th) => (th.card ? futCard(it, th) : portrait(it, th));

function ava(it, th, cls = "ava") {
  const p = photo(it, th);
  if (p) return `<span class="${cls} photo">${img(it, p)}</span>`;
  if (th.series) return `<span class="${cls} init" style="--c:${th.series[it.e][1]}">${esc(initials(it.n))}</span>`;
  const c = th.cats[it.t][1];
  return th.kind !== "food"
    ? `<span class="${cls} init" style="--c:${c}">${esc(initials(it.n))}</span>`
    : `<span class="${cls}" style="--c:${c}">${it.e}</span>`;
}

// Gold = the top price band of a market, silver = the middle band.
const maxPrice = {};
function rarity(it, th) {
  if (th.card) return "futw";     // FIFA-style cards carry their own bronze / silver / gold / Icon tier
  maxPrice[th.label] ??= Math.max(...th.items.map(x => x.p));
  const m = maxPrice[th.label];
  return it.p >= m * 0.8 ? "rar-gold" : it.p >= m * 0.5 ? "rar-silver" : "";
}

const catLabel = (it, th) => (th.kind === "football" || th.kind === "cricket" ? it.t : th.cats[it.t][0]);
const tags = p => `${p.bot ? '<span class="tagsm">BOT</span>' : ""}${p.id === ctx.myId ? '<span class="tagsm you">YOU</span>' : ""}`;

// A stable colour per player, so the same person looks the same everywhere.
const AV = ["#0e9f5f", "#3884ff", "#e5484d", "#b67cff", "#f5a524", "#12a8b8"];
export function avatar(p, idx) {
  const n = (p.name || "?").trim();
  return `<span class="avatar" style="--c:${AV[idx % AV.length]}">${esc(n.slice(0, 1).toUpperCase())}</span>`;
}

function clock(total) {
  return `<div class="clock" aria-label="Time left"><svg viewBox="0 0 36 36"><circle class="bg" cx="18" cy="18" r="16"/><circle class="fg" cx="18" cy="18" r="16" stroke-dasharray="100.53" data-ring="${total}"/></svg><span class="timer" data-timer></span></div>`;
}

function header() {
  const S = ctx.S;
  const chips = S && S.phase ? `<div class="chips"><span class="chip accent">${esc(THEMES[S.theme].label)}</span><span class="chip">${modeLabel(S.mode)}</span>${S.code ? `<span class="chip">Room <span class="num">${esc(S.code)}</span></span>` : ""}</div>` : "";
  return `<header class="top">
    <div class="brand"><span class="logo">$</span><span class="word">Hundred Dollar Draft</span></div>
    <div class="top-right">${chips}
      <button class="icon-btn ${isSoundOn() ? "on" : ""}" data-a="sound" aria-label="${isSoundOn() ? "Turn sound off" : "Turn sound on"}" title="Sound">${isSoundOn() ? ICON.soundOn : ICON.soundOff}</button>
      <button class="icon-btn" data-a="themeToggle" aria-label="Switch light or dark" title="Light / dark">${ICON.theme}</button>
      ${S && S.phase ? `<button class="btn ghost" data-a="home">Leave</button>` : ""}
    </div></header>`;
}

/* ---------- Home: choose a category ---------- */
function fan(tk, names) {
  const th = THEMES[tk];
  return `<div class="fan">${names.map(n => th.items.find(x => x.n === n)).filter(Boolean).map(it => portrait(it, th)).join("")}</div>`;
}
function catTile(key, title, blurb, faces, meta) {
  return `<button class="cat" data-a="cat" data-v="${key}">${fan(key, faces)}<h3>${title}</h3><p>${blurb}</p><div class="meta-line">${meta}</div><span class="go">${ICON.arrow}</span></button>`;
}
const metaFor = k => `<span>${THEMES[k].slots} picks</span><span>${THEMES[k].items.length} cards</span>`;

function homeView() {
  return header() + `
  <div class="home">
    <section class="hero">
      <h1>Build the best team with <em>$${BUDGET}</em>.</h1>
      <p>Every turn you're dealt five random cards at different prices. Buy one, pass the turn, and keep going until your money runs out. Play solo against bots or with friends.</p>
    </section>
    <section>
      <div class="section-head"><h2>Choose a category</h2></div>
      <div class="cats">
        ${catTile("anime", "Anime", "Gojo, Goku, Luffy, Levi and 60 more.", ["Goku", "Gojo", "Luffy", "Naruto"], metaFor("anime"))}
        ${catTile("pokemon", "Pokémon", "Pikachu, Charizard, Mewtwo and 75 more.", ["Pikachu", "Charizard", "Mewtwo", "Gengar"], metaFor("pokemon"))}
        ${catTile("heroes", "Superheroes", "Marvel and DC, from Iron Man to Thanos.", ["Iron Man", "Batman", "Spider-Man", "Thanos"], metaFor("heroes"))}
        ${catTile("football", "Football", "Messi, Ronaldo, Neymar, Bale and more.", ["Messi", "Ronaldo", "Neymar", "Bale"], metaFor("football"))}
        ${catTile("cricket", "Cricket", "Kohli, Dhoni, Bumrah, Stokes and more.", ["Virat Kohli", "MS Dhoni", "Jasprit Bumrah", "Rohit Sharma"], metaFor("cricket"))}
        ${catTile("pizza", "Food", "Build the perfect pizza or burger.", ["Neapolitan dough", "San Marzano", "Burrata", "Pepperoni"], `<span>6 picks</span><span>Pizza or burger</span>`)}
      </div>
    </section>
    <ol class="how">
      <li><span class="step">1</span><b>Pick a category</b>Anime, Pokémon, heroes, football, cricket or food.</li>
      <li><span class="step">2</span><b>Get five cards</b>Each one has a different price. Buy one per turn.</li>
      <li><span class="step">3</span><b>Mind your budget</b>Keep enough to fill the rest of your team.</li>
      <li><span class="step">4</span><b>Top score wins</b>Ratings plus bonuses for famous combos.</li>
    </ol>
    ${Object.values(ctx.photos).some(v => v && typeof v === "object" && Object.keys(v).length) ? `<p style="margin:0"><button class="back" data-a="credits">Photo credits</button></p>` : ""}
  </div>`;
}

/* ---------- Setup: solo or friends ---------- */
const FACES = { anime: ["Goku", "Gojo", "Luffy", "Naruto"], pokemon: ["Pikachu", "Charizard", "Mewtwo", "Gengar"], heroes: ["Iron Man", "Batman", "Spider-Man", "Thanos"],
  football: ["Messi", "Ronaldo", "Neymar", "Bale"], cricket: ["Virat Kohli", "MS Dhoni", "Jasprit Bumrah", "Rohit Sharma"],
  pizza: ["Neapolitan dough", "San Marzano", "Burrata", "Pepperoni"], burger: ["Brioche bun", "Wagyu patty", "Crispy bacon", "American cheese"] };

function setupView() {
  const { setup } = ctx, th = THEMES[setup.theme], food = th.kind === "food", online = onlineAvailable();
  return header() + `
  <div class="home" style="gap:24px">
    <div><button class="back" data-a="back">${ICON.back} All categories</button></div>
    <div class="setup-head">
      ${fan(setup.theme, FACES[setup.theme])}
      <div><h1 class="setup-title">${food ? "Food" : esc(th.label)}</h1><p>${esc(th.blurb)} $${BUDGET} budget, ${th.slots} slots.</p></div>
    </div>
    <div class="row" style="gap:16px; align-items:flex-start">
      ${food ? `<div><div class="label">Dish</div><div class="seg"><button class="${setup.theme === "pizza" ? "on" : ""}" data-a="theme" data-v="pizza">🍕 Pizza</button><button class="${setup.theme === "burger" ? "on" : ""}" data-a="theme" data-v="burger">🍔 Burger</button></div></div>` : ""}
      <div><div class="label">Game style</div><div class="seg">
        <button class="${setup.mode === "draft" ? "on" : ""}" data-a="mode" data-v="draft">5-card pick<small>Five random cards each turn</small></button>
        <button class="${setup.mode === "auction" ? "on" : ""}" data-a="mode" data-v="auction">Auction<small>Bid live, highest wins</small></button>
      </div></div>
    </div>
    <div class="modes">
      <div class="panel">
        <h2>Solo</h2><p class="sub">Play against bots right now.</p>
        <label class="field-label" for="nm">Your name</label>
        <input type="text" id="nm" maxlength="16" placeholder="e.g. Atul" value="${esc(ctx.myName)}" autocomplete="nickname">
        <div class="row" style="margin-top:16px; justify-content:space-between">
          <div class="stepper"><button data-a="bots-" aria-label="Fewer bots">−</button><b>${setup.bots}</b><button data-a="bots+" aria-label="More bots">+</button><span>bot${setup.bots > 1 ? "s" : ""}</span></div>
          <button class="btn big" data-a="solo">Play solo ${ICON.arrow}</button>
        </div>
      </div>
      <div class="panel">
        <h2>With friends</h2><p class="sub">Up to ${MAXP} players. Friends open the same address and join with your code.</p>
        <button class="btn" data-a="host" ${online ? "" : "disabled"}>Host a game</button>
        <div class="or">OR JOIN</div>
        <div class="row"><input type="text" id="code" class="codein" maxlength="4" placeholder="CODE" value="${esc(ctx.joinCode)}" autocomplete="off"><button class="btn white" data-a="join" ${online ? "" : "disabled"}>Join</button></div>
        <p class="note">${online ? "Friends on the same Wi-Fi use the \"Friends on Wi-Fi\" address shown in the terminal." : "Multiplayer needs the server. Run <code>npm start</code> and open http://localhost:3000."}</p>
      </div>
    </div>
  </div>`;
}

function waitingView() {
  return header() + `<div class="center-msg"><div class="code">${esc(ctx.pendingCode || "····")}</div><p>Connecting to the game…</p><button class="btn white" data-a="home">Cancel</button></div>`;
}

/* ---------- Lobby ---------- */
function lobbyView() {
  const S = ctx.S, host = isHost(), th = THEMES[S.theme];
  const inGame = S.players.some(p => p.id === ctx.myId);
  const humans = S.players.filter(p => !p.bot).length;
  return header() + `
  <div class="lobby">
    <div class="panel">
      <div class="label">Room code</div>
      <div class="code">${esc(S.code)}</div>
      <p class="sub" style="margin-top:16px">Friends open this site, pick any category, then <b>Join</b> with this code.</p>
      ${host ? `
        <div class="label" style="margin-top:18px">Category</div>
        <div class="seg">${Object.entries(THEMES).map(([k, t]) => `<button class="${S.theme === k ? "on" : ""}" data-a="ltheme" data-v="${k}">${esc(t.label)}</button>`).join("")}</div>
        <div class="label" style="margin-top:16px">Style</div>
        <div class="seg"><button class="${S.mode === "draft" ? "on" : ""}" data-a="lmode" data-v="draft">5-card pick</button><button class="${S.mode === "auction" ? "on" : ""}" data-a="lmode" data-v="auction">Auction</button></div>`
      : `<div class="chips"><span class="chip accent">${esc(th.label)}</span><span class="chip">${modeLabel(S.mode)}</span></div>`}
    </div>
    <div class="panel">
      <div class="label">Players · ${S.players.length}/${MAXP}</div>
      <ul class="plist">${S.players.map((p, i) => `<li>${avatar(p, i)}<span class="grow">${esc(p.name)}</span>${p.id === S.hostId ? '<span class="tagsm host">HOST</span>' : ""}${tags(p)}</li>`).join("")}</ul>
      ${host ? `<div class="row" style="margin-top:16px; justify-content:space-between">
        <div class="row"><button class="btn white" data-a="addbot" ${S.players.length >= MAXP ? "disabled" : ""}>Add bot</button><button class="btn white" data-a="rmbot" ${S.bots && S.players.length > humans ? "" : "disabled"}>Remove bot</button></div>
        <button class="btn big" data-a="start" ${S.players.length < 2 ? "disabled" : ""}>Start game ${ICON.arrow}</button></div>
        ${S.players.length < 2 ? '<p class="note">Waiting for a friend to join, or add a bot.</p>' : ""}`
      : `<p class="note" style="margin-top:16px">${inGame ? "You're in. Waiting for the host to start." : "The lobby is full, so you'll be watching this round."}</p>`}
    </div>
  </div>`;
}

/* ---------- Game ---------- */
const playerIdx = pid => ctx.S.players.findIndex(p => p.id === pid);
const withTitle = (html, title) => html.replace("<span ", `<span title="${esc(title)}" `);

function teamsHtml() {
  const S = ctx.S, th = theme(S), a = S.auction, lp = S.lastPick;
  return S.players.map((p, idx) => {
    const picking = S.mode === "draft" && idx === S.turn && S.phase === "play";
    const leading = S.mode === "auction" && a && a.lead === p.id && S.phase === "play";
    const slots = [];
    for (let k = 0; k < th.slots; k++) {
      const i = p.picks[k];
      if (i == null) { slots.push('<span class="slot empty"></span>'); continue; }
      const isNew = lp && lp.pid === p.id && lp.i === i;
      slots.push(withTitle(ava(th.items[i], th, "slot" + (isNew ? " new" : "")), `${th.items[i].n} · $${th.items[i].p}`));
    }
    const latest = p.picks.length ? th.items[p.picks[p.picks.length - 1]] : null;
    const badge = picking ? `<span class="pill live">${p.id === ctx.myId ? "Your turn" : "Picking"}</span>` : leading ? '<span class="pill live">Leading</span>' : "";
    return `<div class="team ${picking || leading ? "active" : ""} ${p.id === ctx.myId ? "me" : ""}" data-pid="${esc(p.id)}">
      <div class="hd">${avatar(p, idx)}<span class="grow">${esc(p.name)}</span>${tags(p)}${badge}<span class="money">$${p.money}</span></div>
      <div class="st"><span>${p.picks.length}/${th.slots} picks</span><span>${score(S.theme, p.picks).total} pts</span></div>
      <div class="slots">${slots.join("")}</div>
      <div class="latest">${latest ? `Latest: <b>${esc(latest.n)}</b> · $${lp && lp.pid === p.id ? lp.price : latest.p}` : "No picks yet"}</div></div>`;
  }).join("");
}

// Everyone in picking order; the current picker is highlighted and arrows show which way the snake is going.
function orderStrip() {
  const S = ctx.S, th = theme(S), arrow = S.dir === -1 ? "‹" : "›";
  return `<div class="order" role="list" aria-label="Turn order">${S.players.map((p, i) => {
    const full = p.picks.length >= th.slots;
    return `<div class="seat ${i === S.turn ? "now" : ""} ${full ? "done" : ""} ${p.id === ctx.myId ? "me" : ""}" role="listitem">${avatar(p, i)}
      <span class="seat-txt"><b>${p.id === ctx.myId ? "You" : esc(p.name)}</b><small>$${p.money} · ${p.picks.length}/${th.slots}</small></span></div>`;
  }).join(`<span class="sep">${arrow}</span>`)}</div>`;
}

// "Pep picked Messi · $10", shown right after every purchase.
function lastPickBanner() {
  const S = ctx.S, th = theme(S), lp = S.lastPick;
  if (!lp) return "";
  const idx = playerIdx(lp.pid), p = S.players[idx], it = th.items[lp.i];
  if (!p || !it) return "";
  const who = p.id === ctx.myId ? "You" : esc(p.name);
  return `<div class="lastpick ${ctx.fx.newPick ? "flash" : ""}">${avatar(p, idx)}<span class="lp-txt"><b>${who}</b> ${lp.auto ? "auto-picked" : S.mode === "auction" ? "won" : "picked"}</span>
    ${ava(it, th)}<b class="lp-card">${esc(it.n)}</b><span class="lp-price num">$${lp.price}</span></div>`;
}

// Every purchase so far, newest first.
function feedHtml() {
  const S = ctx.S, th = theme(S), h = (S.history || []).slice(-8).reverse();
  if (!h.length) return "";
  return `<div class="feed"><div class="label">Picks so far</div><ol>${h.map(x => {
    const idx = playerIdx(x.pid), p = S.players[idx], it = th.items[x.i];
    if (!p || !it) return "";
    return `<li>${avatar(p, idx)}<span class="who">${p.id === ctx.myId ? "You" : esc(p.name)}</span>${ava(it, th)}<span class="card-n">${esc(it.n)}</span><span class="num">$${x.price}</span></li>`;
  }).join("")}</ol></div>`;
}

function draftStage() {
  const S = ctx.S, th = theme(S), mine = me(), p = S.players[S.turn], myTurn = mine && p.id === ctx.myId;
  let conf = "";
  if (myTurn && ctx.selected != null && S.hand.includes(ctx.selected)) {
    const it = item(S, ctx.selected);
    conf = `<div class="confirm">${ava(it, th)}<div class="grow"><b>${esc(it.n)}</b><span class="meta">${esc(catLabel(it, th))} · ${it.r} ${th.rate} · you'll have $${mine.money - it.p} left</span></div>
      <button class="btn white" data-a="unsel">Cancel</button><button class="btn big" data-a="confirm">Buy for $${it.p}</button></div>
      <p class="tap-hint">Tap the card again or press Buy</p>`;
  }
  const cards = S.hand.map(i => {
    const it = item(S, i), ok = myTurn && canAfford(S, mine, i);
    return `<button class="hcard ${rarity(it, th)} ${ctx.selected === i && myTurn ? "sel" : ""}" data-a="${ctx.selected === i && myTurn ? "confirm" : "sel"}" data-v="${i}" ${ok ? "" : "disabled"} aria-label="${esc(it.n)}, $${it.p}">
      <span class="shine"></span><span class="price">$${it.p}</span>${bigCard(it, th)}<span class="nm">${esc(it.n)}</span>
      <span class="meta">${th.card ? tierName(it, th) + " · " + esc(it.t) : esc(catLabel(it, th)) + " · " + it.r + " " + th.rate}</span>${myTurn && !ok ? '<span class="cant">Over your budget</span>' : ""}</button>`;
  }).join("");
  const who = myTurn
    ? `<h2 class="who-now mine">Your turn — pick one card</h2>`
    : `<h2 class="who-now">${avatar(p, S.turn)}<span><b>${esc(p.name)}</b> is picking<span class="dots"><i></i><i></i><i></i></span></span></h2>`;
  return `<div class="panel stage-panel ${myTurn ? "my-turn" : ""}">${orderStrip()}
    <div class="turn"><div><div class="label">Round ${Math.min(S.round, th.slots)} of ${th.slots} · ${myTurn ? "you have" : esc(p.name) + " has"} <span class="num">$${p.money}</span> to spend</div>${who}</div>
    ${S.ends ? clock(S.turnMs || 1) : ""}</div>
    ${lastPickBanner()}
    <div class="hand ${ctx.fx.deal ? "deal" : ""} ${myTurn ? "" : "waiting"}">${cards}</div>${conf}</div>`;
}

// Helps players avoid overpaying: is this price good for the card's rating, and how much can you spend per card?
function valueHint(S, it, mine, price) {
  const fair = Math.round(fairPrice(S, it));
  const ratio = price / Math.max(1, fair);
  const [cls, label] = ratio <= 0.9 ? ["good", "Good value"] : ratio <= 1.15 ? ["fair", "Fair price"] : ["high", "Pricey"];
  const budget = mine && slotsLeft(S, mine) > 0 ? Math.floor(mine.money / slotsLeft(S, mine)) : null;
  return `<div class="value-hint"><span class="vh ${cls}">${label}</span><span>Worth about <b class="num">$${fair}</b> for its rating</span>${budget != null ? `<span>· Your budget per card <b class="num">$${budget}</b></span>` : ""}</div>`;
}

function auctionStage() {
  const S = ctx.S, th = theme(S), mine = me();
  if (S.phase === "sold" && S.last) {
    const it = item(S, S.last.i);
    return `<div class="panel"><div class="lot"><div>${bigCard(it, th)}</div><div><div class="label">Lot ${S.lot}</div><h2>${esc(it.n)}</h2></div>
      <div class="bidnow">${S.last.who ? `<span class="sold">SOLD · $${S.last.price}</span><div class="who">to ${esc(S.last.who)}</div>` : `<span class="sold none">No bids</span>`}</div></div></div>`;
  }
  const a = S.auction, it = item(S, a.item), lead = S.players.find(p => p.id === a.lead);
  const mb = mine ? maxBid(S, mine) : 0, leading = mine && a.lead === ctx.myId;
  // Before anyone bids: open at the card's price (or a little above). After that: raise the current bid.
  const start = a.start ?? it.p, next = minNextBid(S) || start;
  const steps = a.lead ? [0, 1, 4, 9] : [0, 1, 2, 5];
  const incs = steps.map((n, k) => { const val = next + n; return `<button class="btn ${k === 0 ? "" : "white"}" data-a="bid" data-v="${val}" ${!mine || leading || val > mb ? "disabled" : ""}>${k === 0 && !a.lead ? "Open " : ""}$${val}</button>`; }).join("");
  return `<div class="panel"><div class="lot"><div>${bigCard(it, th)}</div><div><div class="label">Lot ${S.lot} · ${esc(th.cats[it.t][0])}</div><h2>${esc(it.n)}</h2>
    <div class="meta">${it.r} ${th.rate} · ${start < it.p ? `<b class="second">Second chance</b> · back at $${start} (was $${it.p})` : `opens at $${start}`}</div></div>
    <div class="bidnow"><div class="amt">$${a.lead ? a.bid : start}</div><div class="who ${leading ? "me" : ""}">${lead ? (lead.id === ctx.myId ? "You're winning" : esc(lead.name) + " leads") : "No bids yet · opens at $" + start}</div></div></div>
    ${valueHint(S, it, mine, a.lead ? a.bid : start)}
    <div class="bar"><i data-bar="${LOT_MS}"></i></div>${lastPickBanner()}
    <div class="bids">${mine ? incs + `<span class="spacer"></span><span class="note" style="margin:0">Your max bid <b class="num">$${Math.max(0, mb)}</b></span>` : '<span class="note" style="margin:0">You are watching this game.</span>'}</div></div>`;
}

function upcomingHtml() {
  const S = ctx.S, th = theme(S), cats = Object.keys(th.cats), f = ctx.filter;
  const list = S.pool.map((i, pos) => ({ i, pos })).filter(x => f === "all" || item(S, x.i).t === f);
  const cards = list.map(({ i, pos }) => {
    const it = item(S, i);
    const now = priceOf(S, i);
    return `<div class="card ${pos === 0 ? "next" : ""}"><span class="price ${now < it.p ? "cut" : ""}">$${now}${now < it.p ? `<s>$${it.p}</s>` : ""}</span>${ava(it, th)}<span class="nm">${esc(it.n)}</span>
      <span class="meta"><span class="dot" style="--c:${th.cats[it.t][1]}"></span>${esc(catLabel(it, th))} · ${it.r}</span>${pos < 3 ? `<span class="upnext">${pos === 0 ? "UP NEXT" : "IN " + (pos + 1)}</span>` : ""}</div>`;
  }).join("");
  return `<div class="sec-head"><div class="label" style="margin:0">Coming up · ${S.pool.length} left</div>
    <div class="filters"><button class="${f === "all" ? "on" : ""}" data-a="filter" data-v="all">All</button>${cats.map(c => `<button class="${f === c ? "on" : ""}" data-a="filter" data-v="${c}">${esc(th.cats[c][0])}</button>`).join("")}</div></div>
    <div class="grid">${cards || '<p class="note">Nothing left in this category.</p>'}</div>`;
}

function combosHtml() {
  const S = ctx.S, th = theme(S), mine = me();
  const owned = new Set(mine ? mine.picks.map(i => th.items[i].n) : []);
  return `<div class="combos"><div class="label">Combo bonuses</div><ul class="combo-list">${th.combos.map(([l, need, v]) =>
    `<li><span><b>${esc(l)}</b> · ${need.map(n => (owned.has(n) ? `<u>${esc(n)}</u>` : esc(n))).join(" + ")}</span><span class="pts ${v < 0 ? "neg" : ""}">${v > 0 ? "+" : ""}${v}</span></li>`).join("")}</ul></div>`;
}

// Your own team as one compact strip, shown under your cards on phones.
function myTeamMini() {
  const S = ctx.S, th = theme(S), mine = me();
  if (!mine) return "";
  const lp = S.lastPick, slots = [];
  for (let k = 0; k < th.slots; k++) {
    const i = mine.picks[k];
    slots.push(i == null ? '<span class="slot empty"></span>' : ava(th.items[i], th, "slot" + (lp && lp.pid === mine.id && lp.i === i ? " new" : "")));
  }
  return `<div class="myteam team me" data-pid="${esc(mine.id)}"><div class="mt-head"><b>Your team</b><span>${mine.picks.length}/${th.slots} · ${score(S.theme, mine.picks).total} pts</span><span class="money">$${mine.money}</span></div>
    <div class="slots">${slots.join("")}</div></div>`;
}

// Phone navigation: one screen at a time, like a native game.
function tabBar() {
  const S = ctx.S, t = ctx.mobileTab, picks = (S.history || []).length;
  const btn = (key, label, icon, badge) => `<button class="${t === key ? "on" : ""}" data-a="tab" data-v="${key}" aria-label="${label}">${icon}<span>${label}</span>${badge ? `<i class="badge">${badge}</i>` : ""}</button>`;
  const myTurn = S.mode === "draft" && S.players[S.turn]?.id === ctx.myId && S.phase === "play";
  return `<nav class="tabbar">
    ${btn("play", myTurn ? "Your turn" : "Play", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="8" height="14" rx="2"/><rect x="13" y="5" width="8" height="14" rx="2"/></svg>', myTurn && t !== "play" ? "!" : "")}
    ${btn("teams", "Teams", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9.5" r="2.5"/><path d="M3 19c.8-3.2 3.2-5 6-5s5.2 1.8 6 5M15 14.5c2.6-.3 4.8 1.2 5.5 4"/></svg>', "")}
    ${btn("picks", "Picks", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>', picks ? String(picks) : "")}
  </nav>`;
}

function gameView() {
  const S = ctx.S;
  return header() + `<div class="game tab-${ctx.mobileTab}">
  <div class="pane pane-play stage">${S.mode === "draft" ? draftStage() : auctionStage()}${myTeamMini()}</div>
  <div class="layout"><section class="pane pane-picks">${S.mode === "auction" ? upcomingHtml() : `<div class="label">${S.pool.length} cards left in the deck</div>`}${feedHtml()}${combosHtml()}</section>
  <aside class="pane pane-teams teams">${teamsHtml()}</aside></div>
  ${tabBar()}</div>`;
}

/* ---------- Photo credits ---------- */
function creditsView() {
  const section = (kind, title, note) => {
    const th = Object.values(THEMES).find(t => t.kind === kind);
    const rows = th.items.filter(it => ctx.photos[kind]?.[it.n]).map(it => {
      const p = ctx.photos[kind][it.n];
      return `<li><span class="ava photo">${img(it, p)}</span><span class="grow"><b>${esc(it.n)}</b><br><small>${esc(p.credit)}</small></span>${p.source ? `<a href="${esc(p.source)}" target="_blank" rel="noopener">Source</a>` : ""}</li>`;
    }).join("");
    return rows ? `<div class="panel"><h2>${title}</h2><p class="sub">${note}</p><ul class="plist credits">${rows}</ul></div>` : "";
  };
  return header() + `
  <div class="home" style="gap:16px">
    <div><button class="back" data-a="back">${ICON.back} Back</button></div>
    ${section("football", "Football photos", "From Wikimedia Commons under free licences. Each photographer is credited below.")}
    ${section("cricket", "Cricket photos", "From Wikimedia Commons under free licences. Each photographer is credited below.")}
    ${section("anime", "Anime images", "Characters and artwork belong to their creators and studios. Images are from AniList for <b>private, non-commercial play only</b>.")}
    ${section("pokemon", "Pokémon artwork", "© Nintendo, Game Freak and The Pokémon Company. Images via PokeAPI for <b>private, non-commercial play only</b>.")}
    ${section("heroes", "Superhero images", "Characters © Marvel and DC Comics. Images via the open Superhero API for <b>private, non-commercial play only</b>.")}
  </div>`;
}

/* ---------- Results ---------- */
export function ranking(S) {
  return S.players.map((p, idx) => ({ p, idx, s: score(S.theme, p.picks) }))
    .sort((a, b) => b.s.total - a.s.total || b.p.money - a.p.money);
}

function endView() {
  const S = ctx.S, th = theme(S), rows = ranking(S), w = rows[0];
  const pod = (r, place) => r ? `<div class="pod p${place}">${avatar(r.p, r.idx)}<div class="nm">${esc(r.p.name)}</div><div class="score" data-count="${r.s.total}">${r.s.total}</div><div class="block">${place}</div></div>` : "<div></div>";
  return header() + `
  <div class="winner">
    <div class="label" style="margin:0">Final results</div>
    <h1>${w.p.id === ctx.myId ? "You win! 🏆" : esc(w.p.name) + " wins"}</h1>
    <p>${w.s.total} points with $${w.p.money} left over.</p>
  </div>
  <div class="podium">${pod(rows[1], 2)}${pod(rows[0], 1)}${pod(rows[2], 3)}</div>
  <div class="row" style="justify-content:center; margin-bottom:28px">${isHost() ? `<button class="btn big" data-a="again">Play again</button>` : '<span class="note">Waiting for the host to start another round.</span>'}<button class="btn white big" data-a="home">Home</button></div>
  <div class="results">${rows.map((r, k) => `
    <div class="panel result ${k === 0 ? "win" : ""}"><div class="rank">${k + 1}</div>
      <div><div class="row">${avatar(r.p, r.idx)}<h2>${esc(r.p.name)}</h2>${tags(r.p)}</div>
        <div class="picks">${r.p.picks.map(i => { const it = th.items[i]; return `<span class="pk">${ava(it, th)}${esc(it.n)} <span class="r">${it.r}</span></span>`; }).join("") || '<span class="note">No picks</span>'}</div>
        <div class="breakdown"><div><span>Ratings (${r.p.picks.length} picks)</span><span class="v">${r.s.base}</span></div>
          ${r.s.lines.map(x => `<div><span>${x.combo ? "Combo: " : ""}${esc(x.l)}</span><span class="v ${x.v < 0 ? "neg" : "pos"}">${x.v > 0 ? "+" : ""}${x.v}</span></div>`).join("")}
          <div><span>Money left</span><span class="v">$${r.p.money}</span></div></div>
      </div>
      <div class="total"><span data-count="${r.s.total}">${r.s.total}</span><small>points</small></div></div>`).join("")}</div>`;
}

/** Pick the screen for the current context. */
export function view() {
  const S = ctx.S;
  if (!S) {
    if (ctx.role === "online") return waitingView();
    return ctx.homeStep === "setup" ? setupView() : ctx.homeStep === "credits" ? creditsView() : homeView();
  }
  if (S.phase === "lobby") return lobbyView();
  if (S.phase === "end") return endView();
  return gameView();
}
