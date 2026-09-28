// Effects: sound, confetti, card tilt, the bought card flying into your team, and counting-up scores.
// Everything here is decoration: the game works the same with sound off and motion reduced.

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Sound (synthesised with Web Audio, so there are no files to download) ---------- */
let ac = null;
let soundOn = (() => { try { return localStorage.getItem("hdd-sound") === "on"; } catch { return false; } })();

export const isSoundOn = () => soundOn;
export function setSound(on) {
  soundOn = on;
  try { localStorage.setItem("hdd-sound", on ? "on" : "off"); } catch { /* storage blocked */ }
  if (on) { ac ??= new (window.AudioContext || window.webkitAudioContext)(); ac.resume?.(); play("toggle"); }
}

function tone(freq, start, dur, { type = "sine", gain = 0.12, slide = 0 } = {}) {
  const t = ac.currentTime + start;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t); o.stop(t + dur + 0.02);
}
function noise(start, dur, gain = 0.08, freq = 2000) {
  const t = ac.currentTime + start, len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  f.type = "bandpass"; f.frequency.value = freq; g.gain.value = gain;
  src.buffer = buf; src.connect(f).connect(g).connect(ac.destination); src.start(t);
}

const SOUNDS = {
  toggle: () => tone(880, 0, 0.08, { gain: 0.08 }),
  deal: () => { for (let i = 0; i < 5; i++) noise(i * 0.06, 0.05, 0.07, 3200); },
  select: () => tone(660, 0, 0.06, { type: "triangle", gain: 0.07 }),
  buy: () => { tone(988, 0, 0.1, { type: "square", gain: 0.05 }); tone(1319, 0.08, 0.22, { type: "square", gain: 0.05 }); noise(0, 0.08, 0.05, 6000); },
  pick: () => tone(440, 0, 0.09, { type: "triangle", gain: 0.05 }),
  turn: () => { tone(740, 0, 0.1, { gain: 0.08 }); tone(988, 0.1, 0.16, { gain: 0.08 }); },
  bid: () => tone(1200, 0, 0.05, { type: "square", gain: 0.035 }),
  sold: () => { tone(110, 0, 0.25, { type: "triangle", gain: 0.25, slide: 0.6 }); noise(0, 0.12, 0.12, 900); },
  pass: () => tone(300, 0, 0.2, { type: "sine", gain: 0.08, slide: 0.7 }),
  tick: () => tone(1600, 0, 0.03, { type: "square", gain: 0.025 }),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.35, { type: "triangle", gain: 0.09 })),
  end: () => [523, 440, 392].forEach((f, i) => tone(f, i * 0.14, 0.3, { type: "sine", gain: 0.07 }))
};
export function play(name) {
  if (!soundOn || !ac || !SOUNDS[name]) return;
  try { SOUNDS[name](); } catch { /* audio unavailable */ }
}

/* ---------- Card tilt + light that follows the pointer ---------- */
export function enableTilt(root) {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  root.addEventListener("pointermove", e => {
    const card = e.target.closest("button.hcard:not(:disabled)");
    if (!card || reducedMotion()) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    card.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
    card.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
    card.style.setProperty("--mx", `${x * 100}%`);
    card.style.setProperty("--my", `${y * 100}%`);
  });
  root.addEventListener("pointerout", e => {
    const card = e.target.closest?.("button.hcard");
    if (card && !card.contains(e.relatedTarget)) { card.style.removeProperty("--rx"); card.style.removeProperty("--ry"); }
  });
}

/* ---------- Bought card flies into your team ---------- */
export function fly(fromRect, html, toEl) {
  if (!fromRect || !toEl || reducedMotion()) { toEl?.classList.add("pop"); return; }
  const to = toEl.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "flyer";
  el.innerHTML = html;
  Object.assign(el.style, { left: fromRect.left + "px", top: fromRect.top + "px", width: fromRect.width + "px", height: fromRect.height + "px" });
  document.body.appendChild(el);
  const dx = to.left + to.width / 2 - (fromRect.left + fromRect.width / 2);
  const dy = to.top + to.height / 2 - (fromRect.top + fromRect.height / 2);
  const s = Math.max(to.width / fromRect.width, 0.08);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
    el.style.opacity = "0.2";
  }));
  setTimeout(() => { el.remove(); toEl.classList.add("pop"); }, 650);
}

/* ---------- Confetti ---------- */
export function confetti(duration = 2600) {
  if (reducedMotion()) return;
  const c = document.createElement("canvas");
  c.className = "fx-canvas";
  document.body.appendChild(c);
  const ctx = c.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1);
  const resize = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; };
  resize();
  const css = getComputedStyle(document.documentElement);
  const colors = [css.getPropertyValue("--accent"), css.getPropertyValue("--gold"), "#3884ff", "#ff6b8b", "#b18cff"].map(s => s.trim());
  const parts = Array.from({ length: 160 }, (_, i) => ({
    x: innerWidth * (i % 2 ? 0.2 : 0.8) + (Math.random() - 0.5) * 120, y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 6,
    w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
    c: colors[i % colors.length]
  }));
  const t0 = performance.now();
  (function frame(now) {
    const t = now - t0;
    ctx.clearRect(0, 0, c.width, c.height);
    for (const p of parts) {
      p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / duration);
      ctx.translate(p.x * dpr, p.y * dpr); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w * dpr / 2, -p.h * dpr / 2, p.w * dpr, p.h * dpr * Math.abs(Math.cos(p.r * 2)));
      ctx.restore();
    }
    if (t < duration) requestAnimationFrame(frame); else c.remove();
  })(t0);
}

/* ---------- Numbers that count up ---------- */
export function countUp(root) {
  root.querySelectorAll("[data-count]").forEach(el => {
    const target = Number(el.dataset.count);
    if (reducedMotion()) { el.textContent = target; return; }
    const t0 = performance.now(), dur = 1100;
    (function step(now) {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * e);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  });
}

/* ---------- The pick: chosen card lifts and glows, the rest drop away, it flies into the team ---------- */
// `handHtml` / `handRect`: the hand as it looked just before the pick (the page has already re-rendered).
// Timing: lift 130ms, then fly 320ms. PICK_MS is the whole thing; the next hand deals in after it.
export const PICK_MS = 450;
let current = null;                                   // only one pick animation at a time

function finishCurrent() {
  if (!current) return;
  current.timers.forEach(clearTimeout);
  current.stage.remove();
  current = null;
}

export function pickAnimation({ handHtml, handRect, chosen, target }) {
  finishCurrent();
  if (reducedMotion() || !handHtml || !handRect) { target?.classList.add("pop"); return; }
  const stage = document.createElement("div");
  stage.className = "pick-stage";
  Object.assign(stage.style, { left: handRect.left + "px", top: handRect.top + "px", width: handRect.width + "px", height: handRect.height + "px" });
  stage.innerHTML = handHtml;
  document.body.appendChild(stage);
  const hand = stage.firstElementChild;
  hand.classList.remove("deal", "late", "held");
  const cards = [...hand.querySelectorAll(".hcard")];
  const pick = cards.find(c => c.dataset.v === String(chosen));
  cards.forEach((c, k) => { if (c !== pick) { c.style.animationDelay = k * 25 + "ms"; c.classList.add("pick-away"); } });
  const timers = [];
  current = { stage, timers };
  if (!pick) { timers.push(setTimeout(finishCurrent, 300)); return; }
  pick.classList.add("pick-chosen");

  timers.push(setTimeout(() => {
    const from = pick.getBoundingClientRect(), to = target?.getBoundingClientRect();
    if (!to || !to.width) { pick.classList.add("pick-away"); timers.push(setTimeout(finishCurrent, 260)); return; }
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const s = Math.max(0.12, to.width / from.width);
    pick.style.transition = "transform .32s cubic-bezier(.45,0,.3,1), opacity .32s ease-in";
    pick.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${s}) rotate(${dx > 0 ? 12 : -12}deg)`;
    pick.style.opacity = "0.4";
    timers.push(setTimeout(() => {
      finishCurrent();
      target.classList.remove("pop"); void target.offsetWidth; target.classList.add("pop");
      burst(to.left + to.width / 2, to.top + to.height / 2);
    }, 320));
  }, 130));
}

/* ---------- Background photo loading ----------
   Download every card photo of the category once the game starts, a few at a time and only when the
   phone is idle, so new hands show their photos instantly instead of loading them on the spot. */
const warmed = new Set();
export function warmPhotos(files) {
  const todo = files.filter(f => !warmed.has(f));
  todo.forEach(f => warmed.add(f));
  const idle = window.requestIdleCallback || (cb => setTimeout(cb, 120));
  (function next() {
    const batch = todo.splice(0, 4);
    if (!batch.length) return;
    batch.forEach(f => { const im = new Image(); im.decoding = "async"; im.src = "/images/" + f; });
    idle(next, { timeout: 800 });
  })();
}

// Little sparkle burst where the card lands.
export function burst(x, y) {
  if (reducedMotion()) return;
  const css = getComputedStyle(document.documentElement);
  const colors = [css.getPropertyValue("--accent"), css.getPropertyValue("--gold"), "#ffffff"].map(s => s.trim());
  const box = document.createElement("div");
  box.className = "burst";
  Object.assign(box.style, { left: x + "px", top: y + "px" });
  for (let k = 0; k < 14; k++) {
    const d = document.createElement("i");
    const a = (k / 14) * Math.PI * 2, r = 26 + Math.random() * 22;
    d.style.setProperty("--tx", `${Math.cos(a) * r}px`);
    d.style.setProperty("--ty", `${Math.sin(a) * r}px`);
    d.style.background = colors[k % colors.length];
    box.appendChild(d);
  }
  const ring = document.createElement("b");
  box.appendChild(ring);
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 700);
}
