import { createAppState } from "./core/app-state.js";
import { mountViewport } from "./rendering/viewport.js";

/** Export startup separately so it can be tested without loading a browser. */
export function startApp(document, view) {
  const canvas = document.getElementById("world");
  const host = document.querySelector(".game-viewport");
  const status = document.getElementById("app-status");
  if (!canvas || !host || !status) throw new Error("Missing Shapeweaver application shell");
  const state = createAppState();
  const viewport = mountViewport(canvas, host, view);
  status.textContent = viewport
    ? "Scaffold ready. The first playable rooms will arrive in later development stages."
    : "Canvas is unavailable in this browser. The game requires Canvas 2D.";
  return { state, viewport };
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
