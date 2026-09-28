// WebSocket connection to the game server (multiplayer only).
//
// Where the server lives:
//   - Local / Render-only: the server also serves this page, so we connect back to the same address.
//   - Vercel: the page is on Vercel but the server is elsewhere (e.g. Render). config.js sets
//     window.HDD_CONFIG.server to that address, e.g. "https://hundred-dollar-draft.onrender.com".

const configured = () => (window.HDD_CONFIG && window.HDD_CONFIG.server || "").trim().replace(/\/+$/, "");

/** The WebSocket address for multiplayer. */
export function serverUrl() {
  const base = configured();
  if (base) return base.replace(/^http/i, "ws") + "/ws";            // https://x -> wss://x/ws, http://x -> ws://x/ws
  return `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
}

export const onlineAvailable = () => !!configured() || location.protocol === "http:" || location.protocol === "https:";

/**
 * Open a connection. `onMessage(msg)` gets every server message;
 * `onClose()` fires if the connection drops or can't be made.
 */
export function connect({ onOpen, onMessage, onClose }) {
  const ws = new WebSocket(serverUrl());
  let closedByUs = false;
  ws.addEventListener("open", () => onOpen?.());
  ws.addEventListener("message", e => {
    let msg;
    try { msg = JSON.parse(e.data); } catch { return; }   // ignore malformed messages only
    onMessage(msg);                                        // errors in the game code must surface, not vanish
  });
  ws.addEventListener("close", () => { if (!closedByUs) onClose?.(); });
  return {
    send(msg) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg)); },
    close() { closedByUs = true; ws.close(); }
  };
}
