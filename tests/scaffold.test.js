import test from "node:test";
import assert from "node:assert/strict";
import { createAppState, APP } from "../src/core/app-state.js";
import { canvasMetrics, mountViewport } from "../src/rendering/viewport.js";
import { startApp } from "../src/main.js";

test("initial state is honest and independent", () => {
  const a = createAppState();
  assert.equal(a.stage, APP.stage);
  assert.equal(a.playable, false);
  a.playable = true;
  assert.equal(createAppState().playable, false);
});

test("canvas metrics preserve CSS units at DPR 1 and 2", () => {
  assert.deepEqual(canvasMetrics(640, 360, 1), { width: 640, height: 360, pixelWidth: 640, pixelHeight: 360, scaleX: 1, scaleY: 1 });
  assert.equal(canvasMetrics(640, 360, 2).pixelWidth, 1280);
  assert.equal(canvasMetrics(640, 360, 3).pixelHeight, 720);
});

test("canvas metrics reject zero and nonfinite measurements and cap allocation", () => {
  for (const pair of [[0, 10], [10, -1], [NaN, 1], [Infinity, 1]]) assert.equal(canvasMetrics(...pair), null);
  const large = canvasMetrics(10000, 5000, 2);
  assert.equal(large.pixelWidth, 4096);
  assert.equal(large.pixelHeight, 2048);
  assert.equal(canvasMetrics(10, 10, NaN).scaleX, 1);
});

function fakeViewport() {
  const calls = [];
  const context = {
    setTransform(...args) { calls.push(args); },
    createLinearGradient() { return { addColorStop() {} }; },
    fillRect() {},
  };
  const canvas = { width: 0, height: 0, getContext: () => context };
  const size = { width: 320, height: 180 };
  const host = { getBoundingClientRect: () => size };
  const listeners = new Map();
  const view = { devicePixelRatio: 2, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
  return { canvas, host, size, view, calls, listeners };
}

test("viewport measures host, draws on resize, and removes listeners", () => {
  const f = fakeViewport();
  const mounted = mountViewport(f.canvas, f.host, f.view);
  assert.equal(f.canvas.width, 640);
  assert.deepEqual(f.calls[0], [2, 0, 0, 2, 0, 0]);
  f.size.width = 400;
  f.listeners.get("resize")();
  assert.equal(f.canvas.width, 800);
  mounted.destroy();
  assert.equal(f.listeners.size, 0);
});

test("app mounts and reports scaffold readiness", () => {
  const f = fakeViewport();
  const status = {};
  const document = { getElementById: id => id === "world" ? f.canvas : status, querySelector: () => f.host };
  const app = startApp(document, f.view);
  assert.equal(app.state.playable, false);
  assert.match(status.textContent, /Choose a puzzle in the adventure library/);
  app.viewport.destroy();
  f.canvas.getContext = () => null;
  assert.equal(startApp(document, f.view).viewport, null);
  assert.match(status.textContent, /Canvas is unavailable/);
});
