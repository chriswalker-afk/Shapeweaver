import { createAppState } from "./core/app-state.js";
import { mountViewport } from "./rendering/viewport.js";
import { mountIdentity } from "./ui/identity.js";
import { mountRoomPreview } from "./ui/room-preview.js";

/** Export startup separately so it can be tested without loading a browser. */
export function startApp(document, view) {
  const canvas = document.getElementById("world");
  const host = document.querySelector(".game-viewport");
  const status = document.getElementById("app-status");
  if (!canvas || !host || !status) throw new Error("Missing Shapeweaver application shell");
  const state = createAppState();
  const viewport = mountViewport(canvas, host, view);
  status.textContent = viewport
    ? "Scaffold ready · Play Across the Brook or The Stubborn Gate, explore practice, or open the spellbook."
    : "Canvas is unavailable in this browser. The game requires Canvas 2D.";
  const room = typeof view.Image === "function" ? mountRoomPreview(document, view) : null;
  const identity = typeof document.querySelectorAll === "function" ? mountIdentity(document, state, next => { const playable = next === "room" || next === "level1" || next === "level2"; if(playable)room?.setLevel(next); room?.setActive(playable); state.playable = playable && Boolean(room); }) : null;
  return { state, viewport, identity, room };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  try {
    startApp(document, window);
  } catch (error) {
    const status = document.getElementById("app-status");
    if (status) status.textContent = "The development preview could not start. Try refreshing the page.";
    console.error("Shapeweaver startup failed", error);
  }
}
