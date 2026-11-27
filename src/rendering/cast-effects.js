import {worldToScreen} from "./camera.js";
import {polygonBounds} from "../geometry/world.js";
export const SPELL_COLOURS=Object.freeze({translate:"#8ce0e9",rotate:"#f6cc81",enlarge:"#a4e6aa",reflect:"#d3b1f9"});
/** Smooth visual easing only. Collision geometry and move timing remain exact. */
export function castProgress(t){t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);}
export function drawCastAura(ctx,camera,object,type,progress){
  if(!object)return;
  const b=polygonBounds(object.vertices),p=worldToScreen(camera,{x:(b.minX+b.maxX)/2,y:(b.minY+b.maxY)/2});
  const r=Math.max(8,Math.min(42,Math.max(b.maxX-b.minX,b.maxY-b.minY)*camera.scale*.36)),alpha=Math.sin(Math.PI*Math.max(0,Math.min(1,progress)));
  ctx.save();ctx.globalAlpha=alpha*.8;ctx.strokeStyle=SPELL_COLOURS[type]??"#f5d69a";ctx.lineWidth=1.5;
  for(let i=0;i<8;i++){
    const angle=i*Math.PI/4+progress*.5,rad=r*(.8+.35*progress);
    const x=p.x+Math.cos(angle)*rad,y=p.y+Math.sin(angle)*rad,size=2+2*alpha;
    ctx.beginPath();ctx.moveTo(x-size,y);ctx.lineTo(x+size,y);ctx.moveTo(x,y-size);ctx.lineTo(x,y+size);ctx.stroke();
  }
  ctx.restore();
}
