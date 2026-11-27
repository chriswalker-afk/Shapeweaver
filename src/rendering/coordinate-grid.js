import { worldToScreen } from "./camera.js";
import { formatCoordinate,withinBounds } from "../geometry/coordinates.js";
const EPS=1e-8;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
/** 1–2–5 integer spacing; never pretend dense/hidden lines represent individual units. */
function niceStep(minimum) {
  const n=Math.max(1,minimum),p=10**Math.floor(Math.log10(n));
  return [1,2,5,10].map(k=>k*p).find(v=>v>=n-EPS)??10*p;
}
function ticks(min,max,step) {
  const first=Math.ceil((min-EPS)/step),last=Math.floor((max+EPS)/step);
  return Array.from({length:Math.max(0,Math.min(1000,last-first+1))},(_,i)=>(first+i)*step||0);
}
/** Geometry plan is pure and independent of DPR. Rulers display coordinates even off-origin. */
export function gridPlan(camera,bounds) {
  const minX=Math.max(bounds.minX,camera.left),maxX=Math.min(bounds.maxX,camera.right);
  const minY=Math.max(bounds.minY,camera.bottom),maxY=Math.min(bounds.maxY,camera.top);
  if(maxX-minX<=EPS||maxY-minY<=EPS)return null;
  const a=worldToScreen(camera,{x:minX,y:maxY}),b=worldToScreen(camera,{x:maxX,y:minY});
  const rect={left:clamp(a.x,0,camera.width),right:clamp(b.x,0,camera.width),top:clamp(a.y,0,camera.height),bottom:clamp(b.y,0,camera.height)};
  const extent=Math.max(maxX-minX,maxY-minY);
  const minorStep=niceStep(Math.max(8/camera.scale,extent/400));
  const majorStep=minorStep*niceStep(40/(camera.scale*minorStep));
  const visible={minX,maxX,minY,maxY};
  return {rect,visible,minorStep,majorStep,
    minorX:ticks(minX,maxX,minorStep),minorY:ticks(minY,maxY,minorStep),
    majorX:ticks(minX,maxX,majorStep),majorY:ticks(minY,maxY,majorStep),
    xAxis:minY<=EPS&&maxY>=-EPS,yAxis:minX<=EPS&&maxX>=-EPS};
}
function strokeLine(ctx,x1,y1,x2,y2) {
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
}
function arrow(ctx,x,y,direction) {
  ctx.beginPath();
  if(direction==="right"){ctx.moveTo(x-7,y-4);ctx.lineTo(x,y);ctx.lineTo(x-7,y+4);}
  else{ctx.moveTo(x-4,y+7);ctx.lineTo(x,y);ctx.lineTo(x+4,y+7);}
  ctx.stroke();
}
function text(ctx,label,x,y,align="left",colour="#fff5dd") {
  ctx.textAlign=align;ctx.textBaseline="middle";ctx.lineJoin="round";ctx.lineWidth=3;
  ctx.strokeStyle="#2b263b";ctx.strokeText(label,x,y);
  ctx.fillStyle=colour;ctx.fillText(label,x,y);
}
/** Draw after artwork; mathematical axes remain at x=0 and y=0. Edge rulers are labelled guides,
 * not displaced axes. The layer does not intercept pointer events or change any world state. */
export function drawCoordinateOverlay(ctx,camera,bounds,{grid=true,axes=true,point=null,picking=false}={}) {
  const plan=gridPlan(camera,bounds);if(!plan)return null;
  const r=plan.rect;
  if(!grid&&!axes&&!(picking&&point))return plan;
  ctx.save();ctx.beginPath();ctx.rect(r.left,r.top,r.right-r.left,r.bottom-r.top);ctx.clip();
  const xAt=x=>worldToScreen(camera,{x,y:0}).x;
  const yAt=y=>worldToScreen(camera,{x:0,y}).y;
  if(grid){
    ctx.strokeStyle="rgba(246,239,218,.25)";ctx.lineWidth=.8;
    for(const x of plan.minorX)strokeLine(ctx,xAt(x),r.top,xAt(x),r.bottom);
    for(const y of plan.minorY)strokeLine(ctx,r.left,yAt(y),r.right,yAt(y));
    ctx.strokeStyle="rgba(255,241,213,.46)";ctx.lineWidth=1.15;
    for(const x of plan.majorX)strokeLine(ctx,xAt(x),r.top,xAt(x),r.bottom);
    for(const y of plan.majorY)strokeLine(ctx,r.left,yAt(y),r.right,yAt(y));
  }
  if(axes){
    // A contrasting under-stroke prevents an axis disappearing against bright water or stone.
    function axis(x1,y1,x2,y2){
      ctx.strokeStyle="#272235";ctx.lineWidth=3.8;strokeLine(ctx,x1,y1,x2,y2);
      ctx.strokeStyle="#ffe4a8";ctx.lineWidth=1.8;strokeLine(ctx,x1,y1,x2,y2);
    }
    if(plan.xAxis){const y=yAt(0);axis(r.left,y,r.right,y);if(y>r.top+8&&y<r.bottom-8)arrow(ctx,r.right-3,y,"right");}
    if(plan.yAxis){const x=xAt(0);axis(x,r.bottom,x,r.top);if(x>r.left+8&&x<r.right-8)arrow(ctx,x,r.top+3,"up");}
    if(plan.xAxis&&plan.yAxis){ctx.fillStyle="#ffe4a8";ctx.beginPath();ctx.arc(xAt(0),yAt(0),3,0,Math.PI*2);ctx.fill();}
    ctx.font="600 11px system-ui, sans-serif";
    // Explicit x/y rulers sit at visible edges so labels remain readable at room boundaries and after panning.
    // They are not drawn as mathematical axes when zero is off-screen.
    if(r.right-r.left>=68&&r.bottom-r.top>=64){
      const band=24;
      ctx.fillStyle="rgba(36,30,48,.84)";
      ctx.fillRect(r.left,r.bottom-band,r.right-r.left,band);
      ctx.fillRect(r.left,r.top,band,r.bottom-r.top);
      ctx.font="600 11px system-ui, sans-serif";
      for(const x of plan.majorX){
        const px=xAt(x);
        if(px<r.left+band+10||px>r.right-18)continue;
        ctx.strokeStyle="#d9c7a4";ctx.lineWidth=1;strokeLine(ctx,px,r.bottom-band,px,r.bottom-band+4);
        text(ctx,String(x),px,r.bottom-10,"center");
      }
      for(const y of plan.majorY){
        const py=yAt(y);
        if(py<r.top+22||py>r.bottom-band-8)continue;
        ctx.strokeStyle="#d9c7a4";ctx.lineWidth=1;strokeLine(ctx,r.left+band-4,py,r.left+band,py);
        text(ctx,String(y),r.left+band/2,py,"center");
      }
      // Explicit origin label only when it is in the actual viewport.
      if(plan.xAxis&&plan.yAxis){
        const ox=xAt(0),oy=yAt(0);
        if(ox<=r.left+band&&oy>=r.bottom-band)text(ctx,"0",r.left+band/2,r.bottom-10,"center");
        else if(ox>r.left+band+8&&oy<r.bottom-band-8&&ox<r.right-15&&oy>r.top+8)text(ctx,"0",ox+7,oy+10);
      }
      text(ctx,"y",r.left+band/2,r.top+10,"center","#ffe4a8");
      text(ctx,"x",r.right-10,r.bottom-10,"center","#ffe4a8");
    }
  }
  if(picking&&point&&withinBounds(point,plan.visible,EPS)){
    const p=worldToScreen(camera,point);
    ctx.strokeStyle="#272235";ctx.lineWidth=4.5;strokeLine(ctx,p.x-8,p.y,p.x+8,p.y);strokeLine(ctx,p.x,p.y-8,p.x,p.y+8);
    ctx.strokeStyle="#8de5f2";ctx.lineWidth=2;strokeLine(ctx,p.x-8,p.y,p.x+8,p.y);strokeLine(ctx,p.x,p.y-8,p.x,p.y+8);
    ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.stroke();
    ctx.font="600 12px system-ui, sans-serif";
    const label=formatCoordinate(point),w=ctx.measureText(label).width+12;
    if(r.right-r.left>=w+4&&r.bottom-r.top>=22){
      const lx=clamp(p.x+10,r.left+2,r.right-w-2),ly=clamp(p.y-25,r.top+2,r.bottom-20);
      ctx.fillStyle="#272235";ctx.fillRect(lx,ly,w,18);text(ctx,label,lx+6,ly+9);
    }
  }
  ctx.restore();return plan;
}
