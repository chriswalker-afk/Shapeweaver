/** World-space geometry is independent of the artwork. x right, y up. */
export function rectangle(x, y, width, height) {
  if (![x,y,width,height].every(Number.isFinite) || width <= 0 || height <= 0) throw new Error("Invalid rectangle");
  return [[x,y],[x+width,y],[x+width,y+height],[x,y+height]];
}
export function polygonBounds(vertices) {
  if (!Array.isArray(vertices) || vertices.length < 3 || vertices.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))) throw new Error("Invalid vertices");
  const xs=vertices.map(p=>p[0]), ys=vertices.map(p=>p[1]);
  return { minX:Math.min(...xs), maxX:Math.max(...xs), minY:Math.min(...ys), maxY:Math.max(...ys) };
}
export function signedArea(vertices) {
  return vertices.reduce((sum,p,i)=>{const q=vertices[(i+1)%vertices.length];return sum+p[0]*q[1]-q[0]*p[1]},0)/2;
}
export function boundsContain(outer,inner) {
  return inner.minX>=outer.minX && inner.maxX<=outer.maxX && inner.minY>=outer.minY && inner.maxY<=outer.maxY;
}
export function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
