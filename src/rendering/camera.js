const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export const MAX_ZOOM=8;
export const ZOOM_STEP=1.25;
/** Uniform CSS-pixel scale. Zoom is relative to the full-room fit and survives resize. */
export function createCamera(bounds,width,height,mode="overview",focus=null,zoom=null) {
  const bw=bounds.maxX-bounds.minX,bh=bounds.maxY-bounds.minY;
  if (![width,height,bw,bh,bounds.minX,bounds.minY].every(Number.isFinite)||Math.min(width,height,bw,bh)<=0) throw new Error("Invalid camera dimensions");
  if (mode!=="overview"&&mode!=="inspect") throw new Error("Unknown camera mode");
  if (zoom!==null&&(!Number.isFinite(zoom)||zoom<=0)) throw new Error("Invalid zoom");
  const fit=Math.min(width/bw,height/bh);
  const defaultZoom=Math.max(1.55,Math.min(width/12,height/8)/fit);
  const factor=mode==="overview"?1:clamp(zoom??defaultZoom,1,MAX_ZOOM);
  const scale=fit*factor;
  const halfW=width/(2*scale),halfH=height/(2*scale);
  const midX=(bounds.minX+bounds.maxX)/2,midY=(bounds.minY+bounds.maxY)/2;
  const axis=(target,min,max,half,mid)=>max-min<=2*half?mid:clamp(target,min+half,max-half);
  const cx=axis(Number.isFinite(focus?.x)?focus.x:midX,bounds.minX,bounds.maxX,halfW,midX);
  const cy=axis(Number.isFinite(focus?.y)?focus.y:midY,bounds.minY,bounds.maxY,halfH,midY);
  return Object.freeze({width,height,scale,cx,cy,mode:factor===1?"overview":"inspect",zoom:factor,fitScale:fit,
    left:cx-halfW,right:cx+halfW,bottom:cy-halfH,top:cy+halfH});
}
export function worldToScreen(camera,point) {
  return {x:camera.width/2+(point.x-camera.cx)*camera.scale,y:camera.height/2-(point.y-camera.cy)*camera.scale};
}
export function screenToWorld(camera,point) {
  return {x:camera.cx+(point.x-camera.width/2)/camera.scale,y:camera.cy-(point.y-camera.height/2)/camera.scale};
}
export function panCamera(camera,bounds,dx,dy) {
  if (![dx,dy].every(Number.isFinite)) throw new Error("Invalid camera pan");
  return createCamera(bounds,camera.width,camera.height,camera.mode,{x:camera.cx+dx,y:camera.cy+dy},camera.zoom);
}
export function zoomCamera(camera,bounds,multiplier,focus=null) {
  if(!Number.isFinite(multiplier)||multiplier<=0)throw new Error("Invalid zoom multiplier");
  const next=clamp(camera.zoom*multiplier,1,MAX_ZOOM);
  return createCamera(bounds,camera.width,camera.height,next===1?"overview":"inspect",focus??{x:camera.cx,y:camera.cy},next);
}
