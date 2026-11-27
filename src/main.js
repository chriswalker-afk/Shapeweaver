import { createAppState } from "./core/app-state.js";
import { mountViewport } from "./rendering/viewport.js";
import { mountIdentity } from "./ui/identity.js";

/** Export startup separately so it can be tested without loading a browser. */
export function startApp(document, view) {
  const canvas = document.getElementById("world");
  const host = document.querySelector(".game-viewport");
  const status = document.getElementById("app-status");
  if (!canvas || !host || !status) throw new Error("Missing Shapeweaver application shell");
  const state = createAppState();
  const viewport = mountViewport(canvas, host, view);
  status.textContent = viewport
    ? "Scaffold ready · Art and spellbook preview. Playable rooms are coming in later stages."
    : "Canvas is unavailable in this browser. The game requires Canvas 2D.";
  const identity = typeof document.querySelectorAll === "function" ? mountIdentity(document, state) : null;
  return { state, viewport, identity };
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
