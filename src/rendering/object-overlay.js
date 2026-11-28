import {worldToScreen} from "./camera.js";
import {referencePoints} from "../transformations/preview-math.js";
import {signedRadians} from "../geometry/rotation-sweep.js";
const COLOURS={translate:"#72d2e3",rotate:"#f2c477",enlarge:"#9cdaa4",reflect:"#c5a2f2"};
function screen(camera,[x,y]){return worldToScreen(camera,{x,y});}
function path(ctx,camera,vertices){
  ctx.beginPath();vertices.forEach((v,i)=>{const p=screen(camera,v);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.closePath();
}
function label(ctx,t,x,y,c){
  ctx.font="600 11px system-ui, sans-serif";ctx.textAlign="left";ctx.textBaseline="middle";ctx.lineJoin="round";
  ctx.lineWidth=3;ctx.strokeStyle="#211c31";ctx.strokeText(t,x,y);ctx.fillStyle=c;ctx.fillText(t,x,y);
}
function dot(ctx,p,c,r=3){
  ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();ctx.strokeStyle="#211c31";ctx.lineWidth=1.3;ctx.stroke();
}
/** Keep reference labels inside the visible room, with deterministic leader lines
 * when the preferred position collides with another label. All dots stay exact. */
export function placeReferenceLabels(points,rect,measure,occupied=[]){
  const result=[];
  for(const p of points){
    if(p.x<rect.left-.1||p.x>rect.right+.1||p.y<rect.top-.1||p.y>rect.bottom+.1)continue;
    const w=Math.max(12,measure(p.text)+4),h=14;
    const offsets=[[7,-12],[-w-7,-12],[7,12],[-w-7,12],[-w/2,-24],[-w/2,24],[14,-25],[-w-14,-25],[14,25],[-w-14,25]];
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    let best=null;
    for(const [dx,dy] of offsets){
      const x=clamp(p.x+dx,rect.left+2,Math.max(rect.left+2,rect.right-w-2));
      const y=clamp(p.y+dy,rect.top+8,Math.max(rect.top+8,rect.bottom-8));
      const box={left:x,right:x+w,top:y-h/2,bottom:y+h/2};
      const overlap=occupied.reduce((n,q)=>n+Math.max(0,Math.min(box.right,q.right)-Math.max(box.left,q.left))*Math.max(0,Math.min(box.bottom,q.bottom)-Math.max(box.top,q.top)),0);
      const score=overlap*100+Math.hypot(x-p.x,y-p.y);
      if(!best||score<best.score)best={...box,x,y,score};
    }
    occupied.push(best);result.push({...p,labelX:best.x,labelY:best.y});
  }
  return result;
}
function markReferences(ctx,camera,refs,c,prime="",rect,occupied){
  const groups=[];
  for(const r of refs){
    const p=screen(camera,r.point),group=groups.find(g=>Math.hypot(g.p.x-p.x,g.p.y-p.y)<.1);
    if(group)group.ids.push(r.id+prime);else groups.push({p,ids:[r.id+prime]});
  }
  ctx.font="600 11px system-ui, sans-serif";
  const points=groups.map(g=>({...g.p,text:g.ids.join("/"),hinge:g.ids.some(id=>id==="H"+prime||id==="Hinge"+prime)}));
  for(const p of placeReferenceLabels(points,rect,t=>ctx.measureText(t).width,occupied)){
    dot(ctx,p,c,p.hinge?5:3);
    if(Math.hypot(p.labelX-p.x,p.labelY-p.y)>19){ctx.strokeStyle=c;ctx.lineWidth=.8;line(ctx,p,{x:p.labelX,y:p.labelY});}
    label(ctx,p.text,p.labelX,p.labelY,c);
  }
}
function line(ctx,a,b){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function mirrorSegment(line,b){
  if(line.kind==="x")return [[line.value,b.minY],[line.value,b.maxY]];
  if(line.kind==="y")return [[b.minX,line.value],[b.maxX,line.value]];
  if(line.kind==="y=x"){const lo=Math.max(b.minX,b.minY),hi=Math.min(b.maxX,b.maxY);return lo<=hi?[[lo,lo],[hi,hi]]:null;}
  const lo=Math.max(b.minX,-b.maxY),hi=Math.min(b.maxX,-b.minY);return lo<=hi?[[lo,-lo],[hi,-hi]]:null;
}
/** Draw above grid. Original geometry, reference vertices, ghost and mathematical construction guides. */
export function drawObjectOverlay(ctx,camera,bounds,objects,selected,preview,{shapeSockets=[],deliveries=[],gridPlan=null,axes=false}={}){
  ctx.save();
  const a=screen(camera,[bounds.minX,bounds.maxY]),b=screen(camera,[bounds.maxX,bounds.minY]);
  ctx.beginPath();ctx.rect(a.x,a.y,b.x-a.x,b.y-a.y);ctx.clip();
  const rect={left:Math.max(0,a.x),top:Math.max(0,a.y),right:Math.min(camera.width,b.x),bottom:Math.min(camera.height,b.y)},occupied=[];
  // Reserve the coordinate ruler bands for label placement, but keep exact
  // reference dots at their original points. Lock target labels share the same
  // occupancy list, avoiding collisions with the source/image references.
  const r=gridPlan?.rect;
  if(axes&&r&&r.right-r.left>=68&&r.bottom-r.top>=64){
    occupied.push({left:r.left,right:r.left+24,top:r.top,bottom:r.bottom},{left:r.left,right:r.right,top:r.bottom-24,bottom:r.bottom});
  }
  for(const slot of shapeSockets.filter(s=>s.objectId===selected)){
    markReferences(ctx,camera,slot.vertices.map((point,i)=>({id:"S"+(i+1),point})),slot.filled?"#c7e9a4":"#e9bd7b","",rect,occupied);
  }
  for(const target of deliveries.filter(t=>t.objectId===selected))markReferences(ctx,camera,target.vertices.map((point,i)=>({id:"T"+(i+1),point})),target.filled?"#c7e9a4":"#c6d8ff","",rect,occupied);
  for(const o of objects){
    const active=o.id===selected;
    path(ctx,camera,o.vertices);ctx.strokeStyle="#211c31";ctx.lineWidth=active?4:3;ctx.stroke();
    ctx.strokeStyle=active?"#ffe1a5":"#e9d6b2aa";ctx.lineWidth=active?2:1;ctx.stroke();
    if(!active)continue;
    const refs=referencePoints(o);
    markReferences(ctx,camera,refs,"#ffe1a5","",rect,occupied);
    if(!preview?.geometry||preview.objectId!==o.id)continue;
    const {request,geometry}=preview,c=preview.ok?COLOURS[request.type]:"#ff9b94";
    ctx.save();ctx.setLineDash?.([5,4]);ctx.lineWidth=1.5;ctx.strokeStyle=c;
    if(request.type==="translate")line(ctx,screen(camera,refs[0].point),screen(camera,geometry.points[0].point));
    if(request.type==="reflect"){
      const seg=mirrorSegment(request.line,bounds);
      if(seg){
        const a=screen(camera,seg[0]),b=screen(camera,seg[1]);
        ctx.lineWidth=2.2;line(ctx,a,b);
        const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
        label(ctx,request.line.equation,Math.max(8,Math.min(camera.width-70,mx+8)),Math.max(12,Math.min(camera.height-12,my-14)),c);
      }
      for(let i=0;i<o.vertices.length;i++){
        const a=screen(camera,refs[i].point),b=screen(camera,geometry.points[i].point);
        ctx.strokeStyle=c;ctx.lineWidth=1;line(ctx,a,b);
        if(Math.hypot(a.x-b.x,a.y-b.y)>5)dot(ctx,{x:(a.x+b.x)/2,y:(a.y+b.y)/2},c,2);
      }
    }
    if(request.centre){
      const p=screen(camera,request.centre);
      // Use the furthest vertex for a readable ray; the hinge may itself be vertex A.
      let index=0,max=0;
      refs.forEach((r,i)=>{const d=Math.hypot(r.point[0]-request.centre[0],r.point[1]-request.centre[1]);if(d>max){max=d;index=i;}});
      const from=screen(camera,refs[index].point),to=screen(camera,geometry.points[index].point);
      ctx.strokeStyle=c;line(ctx,p,from);line(ctx,p,to);
      if(request.type==="enlarge"){
        // All original vertices and their images lie on rays through the centre.
        for(let i=0;i<o.vertices.length;i++){
          const a=screen(camera,refs[i].point),b=screen(camera,geometry.points[i].point);
          line(ctx,p,request.factor>=1?b:a);
        }
        label(ctx,"Scale factor "+request.factor,Math.max(8,Math.min(camera.width-115,to.x+8)),Math.max(12,Math.min(camera.height-12,to.y-22)),c);
      }
      if(request.type==="rotate"&&max>0){
        const radius=Math.min(max*camera.scale*.62,120),start=Math.atan2(from.y-p.y,from.x-p.x),delta=-signedRadians(request),end=start+delta;
        ctx.beginPath();ctx.arc(p.x,p.y,radius,start,end,delta<0);ctx.stroke();
        const tip={x:p.x+radius*Math.cos(end),y:p.y+radius*Math.sin(end)},tangent=end+Math.sign(delta)*Math.PI/2;
        ctx.setLineDash?.([]);ctx.beginPath();ctx.moveTo(tip.x-8*Math.cos(tangent-.5),tip.y-8*Math.sin(tangent-.5));ctx.lineTo(tip.x,tip.y);ctx.lineTo(tip.x-8*Math.cos(tangent+.5),tip.y-8*Math.sin(tangent+.5));ctx.stroke();
        const middle=start+delta/2;label(ctx,request.angle+"° "+(request.direction==="clockwise"?"CW":"ACW"),p.x+(radius+12)*Math.cos(middle),p.y+(radius+12)*Math.sin(middle),c);
        ctx.setLineDash?.([5,4]);
      }
      dot(ctx,p,c,4);label(ctx,"Centre",p.x+6,p.y-9,c);
    }
    path(ctx,camera,geometry.vertices);ctx.fillStyle=preview.ok?"rgba(112,210,195,.24)":"rgba(255,110,104,.22)";ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=2.2;ctx.stroke();ctx.restore();
    markReferences(ctx,camera,geometry.points,c,"′",rect,occupied);
    for(const part of preview.attachedImages??[]){
      ctx.save();ctx.setLineDash?.([5,4]);path(ctx,camera,part.geometry.vertices);
      ctx.fillStyle=preview.ok?"rgba(112,210,195,.24)":"rgba(255,110,104,.22)";ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=2.2;ctx.stroke();ctx.restore();
      markReferences(ctx,camera,part.geometry.points.map(r=>({...r,id:"Beam "+r.id})),c,"′",rect,occupied);
    }
  }
  ctx.restore();
}

/** The cast is magical: a brief mirror shimmer, not a swept solid. */
export function drawReflectionFlash(ctx,camera,bounds,mirror,progress){
  const seg=mirrorSegment(mirror,bounds);if(!seg)return;
  const a=screen(camera,seg[0]),b=screen(camera,seg[1]),alpha=Math.sin(Math.PI*Math.max(0,Math.min(1,progress)));
  ctx.save();const tl=screen(camera,[bounds.minX,bounds.maxY]),br=screen(camera,[bounds.maxX,bounds.minY]);
  ctx.beginPath();ctx.rect(tl.x,tl.y,br.x-tl.x,br.y-tl.y);ctx.clip();
  ctx.globalAlpha=alpha;ctx.strokeStyle="#c5a2f2";ctx.lineWidth=10;line(ctx,a,b);
  ctx.strokeStyle="#f6e7ff";ctx.lineWidth=2;line(ctx,a,b);ctx.restore();
}
