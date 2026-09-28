// App context shared by the views and the controller.

const load = k => { try { return localStorage.getItem(k); } catch { return null; } };
export const save = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };

export const ctx = {
  S: null,            // current game or lobby state (null on the home screens)
  role: null,         // "solo" | "online" | null
  myId: null,         // my player id in S.players
  myName: load("hdd-name") || "",
  setup: { theme: "anime", mode: "draft", bots: 3 },
  homeStep: "pick",   // "pick" (category) | "setup" (solo / friends) | "credits"
  joinCode: "",
  pendingCode: null,
  selected: null,     // card index chosen but not yet confirmed
  filter: "all",
  net: null,          // WebSocket connection when online
  photos: {},         // card photos from /images/manifest.json, by market kind then card name
  fx: { deal: false, dealLate: false, dealtAt: 0, newPick: false },  // animation flags for the next render
  mobileTab: "play"   // phone layout: "play" | "teams" | "picks"
};

export const me = () => ctx.S?.players?.find(p => p.id === ctx.myId) || null;
export const isHost = () => ctx.role === "solo" || (ctx.S && ctx.S.hostId === ctx.myId);
import { THEMES } from "/shared/themes.js";
// "Pick your XI" for 11-a-side markets, "Pick your team" elsewhere; the hand is always 5 cards.
export const modeLabel = (m, themeKey) => (m === "draft" ? (THEMES[themeKey]?.slots === 11 ? "Pick your XI" : "Pick your team") : "Auction");
export const modeDetail = themeKey => `5 cards each turn · ${THEMES[themeKey]?.slots ?? 6} players`;
export const clip = s => String(s || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 16);
