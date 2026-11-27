/** Convert a measured CSS viewport to a bounded high-DPI canvas backing store. */
export function canvasMetrics(width, height, pixelRatio = 1) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  const dpr = Number.isFinite(pixelRatio) ? Math.max(1, Math.min(pixelRatio, 2)) : 1;
  // Keep allocations bounded for unusually large displays.
  const scale = Math.min(dpr, 4096 / width, 4096 / height);
  const pixelWidth = Math.max(1, Math.round(width * scale));
  const pixelHeight = Math.max(1, Math.round(height * scale));
  return { width, height, pixelWidth, pixelHeight, scaleX: pixelWidth / width, scaleY: pixelHeight / height };
}

export function drawPlaceholder(context, metrics) {
  const { width, height, scaleX, scaleY } = metrics;
  context.setTransform(scaleX, 0, 0, scaleY, 0, 0);
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#30293c");
  gradient.addColorStop(1, "#201e2a");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

/** Observe the actual viewport rather than relying on screen resolution. */
export function mountViewport(canvas, host, view = globalThis.window, draw = drawPlaceholder) {
  const context = canvas.getContext("2d");
  if (!context) return null;
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    const metrics = canvasMetrics(width, height, view.devicePixelRatio);
    if (!metrics) return;
    if (canvas.width !== metrics.pixelWidth) canvas.width = metrics.pixelWidth;
    if (canvas.height !== metrics.pixelHeight) canvas.height = metrics.pixelHeight;
    draw(context, metrics);
  }
  const observer = typeof view.ResizeObserver === "function" ? new view.ResizeObserver(resize) : null;
  observer?.observe(host);
  view.addEventListener("resize", resize);
  resize();
  return {
    resize,
    destroy() {
      observer?.disconnect();
      view.removeEventListener("resize", resize);
    },
  };
}
