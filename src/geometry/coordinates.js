import { screenToWorld } from "../rendering/camera.js";
export const SNAP_STEPS=Object.freeze([1,0.5,0.1]);
const EPSILON=1e-8;
const clean=n=>Object.is(n,-0)?0:n;

export function withinBounds(p,b,epsilon=0) {
  return Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&p.x>=b.minX-epsilon&&p.x<=b.maxX+epsilon&&p.y>=b.minY-epsilon&&p.y<=b.maxY+epsilon;
}

/** Picking is a mathematical point, not an object movement. Reject scenery outside the room. */
export function snapPoint(point,step,bounds) {
  if(!SNAP_STEPS.includes(step)||!withinBounds(point,bounds,EPSILON))return null;
  const axis=(value,min,max)=>{
    const lower=Math.ceil((min-EPSILON)/step),upper=Math.floor((max+EPSILON)/step);
    if(lower>upper)return null;
    const index=Math.max(lower,Math.min(upper,Math.round(value/step)));
    return clean(Number((index*step).toFixed(8)));
  };
  const x=axis(point.x,bounds.minX,bounds.maxX),y=axis(point.y,bounds.minY,bounds.maxY);
  return x===null||y===null?null:{x,y};
}
export function pickCoordinate(camera,bounds,screenPoint,step=1) {
  if(!Number.isFinite(screenPoint?.x)||!Number.isFinite(screenPoint?.y)||
     screenPoint.x<0||screenPoint.x>camera.width||screenPoint.y<0||screenPoint.y>camera.height)return null;
  return snapPoint(screenToWorld(camera,screenPoint),step,bounds);
}

/** Typed coordinates are exact numeric input, not automatically snapped. */
export function parseCoordinate(x,y,bounds) {
  const number=value=>{
    if(typeof value==="number")return Number.isFinite(value)?value:NaN;
    if(typeof value!=="string"||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()))return NaN;
    return Number(value.trim());
  };
  const p={x:clean(number(x)),y:clean(number(y))};
  return withinBounds(p,bounds)?p:null;
}
export function formatCoordinate(point) {
  return point?"("+clean(point.x)+", "+clean(point.y)+")":"No point selected";
}

/** Convert client coordinates using the measured CSS box, never canvas backing pixels. */
export function clientToScreen(rect,clientX,clientY,camera) {
  if(!rect||![rect.left,rect.top,rect.width,rect.height,clientX,clientY].every(Number.isFinite)||rect.width<=0||rect.height<=0)return null;
  return {x:(clientX-rect.left)*camera.width/rect.width,y:(clientY-rect.top)*camera.height/rect.height};
}
