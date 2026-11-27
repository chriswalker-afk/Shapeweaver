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
function markReferences(ctx,camera,refs,c,prime=""){
  const groups=[];
  for(const r of refs){
    const p=screen(camera,r.point),group=groups.find(g=>Math.hypot(g.p.x-p.x,g.p.y-p.y)<.1);
    if(group)group.ids.push(r.id+prime);else groups.push({p,ids:[r.id+prime]});
  }
  for(const g of groups){dot(ctx,g.p,c,g.ids.some(id=>id==="H"+prime||id==="Hinge"+prime)?5:3);label(ctx,g.ids.join("/"),g.p.x+5,g.p.y-9,c);}
}
function line(ctx,a,b){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function mirrorSegment(line,b){
  if(line.kind==="x")return [[line.value,b.minY],[line.value,b.maxY]];
  if(line.kind==="y")return [[b.minX,line.value],[b.maxX,line.value]];
  if(line.kind==="y=x"){const lo=Math.max(b.minX,b.minY),hi=Math.min(b.maxX,b.maxY);return lo<=hi?[[lo,lo],[hi,hi]]:null;}
  const lo=Math.max(b.minX,-b.maxY),hi=Math.min(b.maxX,-b.minY);return lo<=hi?[[lo,-lo],[hi,-hi]]:null;
}
/** Draw above grid. Original geometry, reference vertices, ghost and mathematical construction guides. */
export function drawObjectOverlay(ctx,camera,bounds,objects,selected,preview){
  ctx.save();
  const a=screen(camera,[bounds.minX,bounds.maxY]),b=screen(camera,[bounds.maxX,bounds.minY]);
  ctx.beginPath();ctx.rect(a.x,a.y,b.x-a.x,b.y-a.y);ctx.clip();
  for(const o of objects){
    const active=o.id===selected;
    path(ctx,camera,o.vertices);ctx.strokeStyle="#211c31";ctx.lineWidth=active?4:3;ctx.stroke();
    ctx.strokeStyle=active?"#ffe1a5":"#e9d6b2aa";ctx.lineWidth=active?2:1;ctx.stroke();
    if(!active)continue;
    const refs=referencePoints(o);
    markReferences(ctx,camera,refs,"#ffe1a5");
    if(!preview?.geometry||preview.objectId!==o.id)continue;
    const {request,geometry}=preview,c=preview.ok?COLOURS[request.type]:"#ff9b94";
    ctx.save();ctx.setLineDash?.([5,4]);ctx.lineWidth=1.5;ctx.strokeStyle=c;
    if(request.type==="translate")line(ctx,screen(camera,refs[0].point),screen(camera,geometry.points[0].point));
    if(request.type==="reflect"){
      const seg=mirrorSegment(request.line,bounds);if(seg)line(ctx,screen(camera,seg[0]),screen(camera,seg[1]));
    }
    if(request.centre){
      const p=screen(camera,request.centre);
      // Use the furthest vertex for a readable ray; the hinge may itself be vertex A.
      let index=0,max=0;
      refs.forEach((r,i)=>{const d=Math.hypot(r.point[0]-request.centre[0],r.point[1]-request.centre[1]);if(d>max){max=d;index=i;}});
      const from=screen(camera,refs[index].point),to=screen(camera,geometry.points[index].point);
      ctx.strokeStyle=c;line(ctx,p,from);line(ctx,p,to);
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
    markReferences(ctx,camera,geometry.points,c,"′");
  }
  ctx.restore();
}
