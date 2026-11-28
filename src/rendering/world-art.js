import {deliveryReady,deliveryFilled} from "../mechanisms/delivery.js";
import {mirrorRails,railMirrorValue,railEquation} from "../mechanisms/movable-mirrors.js";
import {isBridgeDeck,ladderSegment} from "../mechanisms/transformable-ladders.js";
import {plateGroups,mixedGateProgress,selectorPlates,plateHeld} from "../mechanisms/pressure-plates.js";
import { polygonBounds } from "../geometry/world.js";
import { worldToScreen } from "./camera.js";
import {SPELL_COLOURS} from "./cast-effects.js";

export const WORLD_ASSETS=Object.freeze({
  distant:"environments/gatehouse-distant.svg",ruins:"environments/gatehouse-ruins.svg",
  stone:"terrain/stone.svg",grass:"terrain/grass.svg",timber:"terrain/timber.svg",water:"terrain/water.svg",
  portal:"objects/portal.svg",apprentice:"characters/apprentice.svg"
});

/** Image loading is optional for the renderer; fallbacks keep geometry visible. */
export function loadWorldArt(view,onChange) {
  const art={};
  const pending=[];
  for (const [key,path] of Object.entries(WORLD_ASSETS)) {
    const image=new view.Image();
    pending.push(image);
    image.onload=()=>{art[key]=image;onChange();};
    image.onerror=()=>onChange();
    image.src=new URL("../../assets/"+path,import.meta.url).href;
  }
  return {art,destroy(){for(const image of pending){image.onload=null;image.onerror=null;}}};
}

const xy=(camera,p)=>worldToScreen(camera,{x:p[0],y:p[1]});
function polygon(ctx,camera,vertices) {
  ctx.beginPath(); for (let i=0;i<vertices.length;i++){const p=xy(camera,vertices[i]);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.closePath();
}
function screenBounds(camera,vertices) {
  const b=polygonBounds(vertices);
  const p=worldToScreen(camera,{x:b.minX,y:b.maxY});
  return {x:p.x,y:p.y,w:(b.maxX-b.minX)*camera.scale,h:(b.maxY-b.minY)*camera.scale};
}
function backdrop(ctx,image,camera,bounds,factor) {
  if (!image)return;
  const {width,height}=camera;
  const scale=Math.max(width/image.naturalWidth,height/image.naturalHeight);
  // Overscan allows gentle parallax without exposing empty edges.
  const w=image.naturalWidth*scale*1.24,h=image.naturalHeight*scale*1.24;
  const half=(bounds.maxX-bounds.minX)/2, centre=bounds.minX+half;
  const offset=Math.max(-1,Math.min(1,(camera.cx-centre)/half));
  ctx.drawImage(image,(width-w)/2-offset*(w-width)*factor,(height-h)/2,w,h);
}
function tilePolygon(ctx,camera,vertices,image,colour,tileW,tileH) {
  const b=screenBounds(camera,vertices);
  polygon(ctx,camera,vertices);ctx.fillStyle=colour;ctx.fill();
  if(!image)return;
  ctx.save();ctx.clip();
  const w=tileW*camera.scale,h=tileH*camera.scale;
  const left=Math.max(b.x,0),top=Math.max(b.y,0),right=Math.min(b.x+b.w,camera.width),bottom=Math.min(b.y+b.h,camera.height);
  // Tile phase is anchored to geometry, not the camera.
  for(let x=b.x+Math.floor((left-b.x)/w)*w;x<right;x+=w){
    for(let y=b.y+Math.floor((top-b.y)/h)*h;y<bottom;y+=h)ctx.drawImage(image,x,y,w+.3,h+.3);
  }
  ctx.restore();
}
function outline(ctx,camera,vertices,colour,width=1.3) {
  polygon(ctx,camera,vertices);ctx.strokeStyle=colour;ctx.lineWidth=width;ctx.stroke();
}
function terrain(ctx,camera,item,art) {
  if(item.material==="timber")tilePolygon(ctx,camera,item.vertices,art.timber,"#ab805b",3,.65);
  else tilePolygon(ctx,camera,item.vertices,art.stone,"#7b7480",2.4,1.5);
  outline(ctx,camera,item.vertices,"#4e495a",Math.max(1,camera.scale*.045));
  // A narrow interior bevel separates collidable terrain from the distant ruins.
  ctx.save();polygon(ctx,camera,item.vertices);ctx.clip();
  ctx.strokeStyle="#d4c2a333";ctx.lineWidth=Math.max(1,camera.scale*.11);polygon(ctx,camera,item.vertices);ctx.stroke();ctx.restore();
  if (!item.grass)return;
  // CCW polygons: leftward edges face up. The grass trim does not add collision thickness.
  for(let i=0;i<item.vertices.length;i++){
    const a=xy(camera,item.vertices[i]),b=xy(camera,item.vertices[(i+1)%item.vertices.length]);
    if(b.x>=a.x)continue;
    const dx=a.x-b.x,dy=a.y-b.y,len=Math.hypot(dx,dy);
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(dy,dx));
    const depth=Math.max(3,camera.scale*.23);
    ctx.fillStyle="#7f9464";ctx.fillRect(0,-depth*.16,len,depth*.65);
    if(art.grass){
      const w=camera.scale*2.2;
      ctx.beginPath();ctx.rect(0,-depth*.35,len,depth*1.5);ctx.clip();
      for(let x=0;x<len;x+=w)ctx.drawImage(art.grass,x,-depth*.35,w,depth*1.5);
    }
    ctx.restore();
  }
}
function hazard(ctx,camera,item,art) {
  tilePolygon(ctx,camera,item.vertices,art.water,"#4b8696",2.8,1.1);
  const b=screenBounds(camera,item.vertices);
  ctx.strokeStyle="#b9dfd8";ctx.lineWidth=Math.max(1,camera.scale*.045);
  ctx.beginPath();
  for(let x=0;x<=b.w;x+=Math.max(2,camera.scale*.15)){
    const y=b.y+Math.sin(x/camera.scale*5)*camera.scale*.035;
    if(x===0)ctx.moveTo(b.x+x,y);else ctx.lineTo(b.x+x,y);
  }
  ctx.stroke();
}
// The axle and external-centre orbit guides are non-solid scenery. Only
// the selected timber polygon is a physical platform. Guides are deliberately
// thin/dashed, never rendered as extra walkable spokes or bridges.
function drawRotationMechanisms(ctx,camera,room){
 for(const o of room.objects){
  const centre=o.kind==="waterwheel"?o.hinge:o.fixedCentre;
  if(!centre||o.decorative)continue;
  const p=xy(camera,centre),b=polygonBounds(o.vertices),q=worldToScreen(camera,{x:(b.minX+b.maxX)/2,y:(b.minY+b.maxY)/2});
  const radius=o.kind==="waterwheel"?Math.max(...o.vertices.map(v=>Math.hypot(v[0]-centre[0],v[1]-centre[1]))):Math.hypot((b.minX+b.maxX)/2-centre[0],(b.minY+b.maxY)/2-centre[1]);
  ctx.save();ctx.strokeStyle="#f1cf9588";ctx.lineWidth=Math.max(1,camera.scale*.07);ctx.setLineDash([4,5]);
  ctx.beginPath();ctx.arc(p.x,p.y,radius*camera.scale,0,Math.PI*2);ctx.stroke();
  if(o.fixedCentre){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
  ctx.setLineDash([]);ctx.fillStyle="#594f4c";ctx.strokeStyle="#f0ce96";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.arc(p.x,p.y,Math.max(3,camera.scale*.18),0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.restore();
 }
}
function object(ctx,camera,item,art) {
  if(item.kind==="ladder"){
    // Rail and rung positions use the actual long and short edges, including
    // intermediate rotated frames, not an axis-aligned decorative image.
    const v=item.vertices.map(p=>xy(camera,p));
    const len=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    const [a,b,c,d]=len(v[0],v[1])>=len(v[1],v[2])?v:[v[1],v[2],v[3],v[0]];
    const at=(p,q,t)=>({x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t});
    const line=(p,q)=>{ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);};
    const width=len(a,d),length=len(a,b),count=Math.max(2,Math.round(length/(camera.scale*.55)));
    ctx.save();polygon(ctx,camera,item.vertices);ctx.clip();
    ctx.lineCap="round";ctx.strokeStyle="#614b40";ctx.lineWidth=Math.max(2,width*.29);
    ctx.beginPath();line(at(a,d,.13),at(b,c,.13));line(at(a,d,.87),at(b,c,.87));ctx.stroke();
    ctx.strokeStyle="#dfb779";ctx.lineWidth=Math.max(1,width*.17);
    ctx.beginPath();line(at(a,d,.13),at(b,c,.13));line(at(a,d,.87),at(b,c,.87));
    for(let i=1;i<count;i++){line(at(a,b,i/count),at(d,c,i/count));}ctx.stroke();
    if(isBridgeDeck(item)){
      polygon(ctx,camera,item.vertices);ctx.fillStyle="#b89c7355";ctx.fill();
      ctx.strokeStyle="#f0d3a1";ctx.lineWidth=Math.max(1,camera.scale*.06);ctx.beginPath();line(at(a,d,0),at(b,c,0));line(at(a,d,1),at(b,c,1));ctx.stroke();
    }
    ctx.restore();
  }else if(item.kind==="waterwheel"){
    tilePolygon(ctx,camera,item.vertices,art.timber,"#ae825c",2.5,.65);
    outline(ctx,camera,item.vertices,"#58473e",2);
    ctx.save();polygon(ctx,camera,item.vertices);ctx.clip();
    for(const v of item.vertices){const p=xy(camera,v);ctx.fillStyle="#e7c186";ctx.beginPath();ctx.arc(p.x,p.y,Math.max(1,camera.scale*.10),0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }else if(item.kind==="mushroom"){
    const b=screenBounds(camera,item.vertices),capHeight=b.h*.48;
    ctx.save();polygon(ctx,camera,item.vertices);ctx.clip();
    ctx.fillStyle="#e6cfa5";ctx.fillRect(b.x,b.y,b.w,b.h);
    ctx.fillStyle="#b86975";ctx.fillRect(b.x,b.y,b.w,capHeight);
    ctx.fillStyle="#f3bdab";
    for(const [u,v,r] of [[.2,.53,.075],[.46,.28,.09],[.76,.6,.065],[.87,.22,.04]]){
      ctx.beginPath();ctx.ellipse(b.x+b.w*u,b.y+capHeight*v,b.w*r,capHeight*.17,0,0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle="#9e5267";ctx.fillRect(b.x,b.y+capHeight*.81,b.w,capHeight*.19);
    ctx.fillStyle="#fae1c4";ctx.fillRect(b.x,b.y,b.w,Math.max(1.5,camera.scale*.055));
    ctx.restore();outline(ctx,camera,item.vertices,"#603e50",1.7);
  }else if(item.kind==="linked-gate"){
    const b=screenBounds(camera,item.vertices);
    if(item.open){
      ctx.fillStyle="#c7e5a966";ctx.fillRect(b.x,b.y,Math.max(2,b.w*.11),b.h);ctx.fillRect(b.x+b.w*.89,b.y,Math.max(2,b.w*.11),b.h);
      ctx.fillStyle="#e3e9a7";ctx.fillRect(b.x+b.w*.2,b.y,b.w*.6,Math.max(2,camera.scale*.15));
    }else{
      tilePolygon(ctx,camera,item.vertices,art.timber,"#5c6551",1.2,1.8);
      ctx.fillStyle="#45574b99";ctx.fillRect(b.x,b.y,b.w,b.h);
      for(let y=b.y;y<b.y+b.h;y+=camera.scale*1.2){ctx.fillStyle="#bca878";ctx.fillRect(b.x,y,b.w,Math.max(2,camera.scale*.1));}
      outline(ctx,camera,item.vertices,"#394c42",2);
    }
  }else if(item.kind==="crystal"){
    const b=screenBounds(camera,item.vertices),g=ctx.createLinearGradient(b.x,b.y,b.x+b.w,b.y+b.h);
    g.addColorStop(0,"#e4fbff");g.addColorStop(.4,"#75cfda");g.addColorStop(1,"#4775ab");
    ctx.save();polygon(ctx,camera,item.vertices);ctx.fillStyle=g;ctx.fill();ctx.clip();
    ctx.beginPath();ctx.moveTo(b.x+b.w*.5,b.y);ctx.lineTo(b.x+b.w*.66,b.y+b.h*.62);ctx.lineTo(b.x+b.w*.3,b.y+b.h);
    ctx.strokeStyle="#e5f9f9aa";ctx.lineWidth=2;ctx.stroke();ctx.restore();outline(ctx,camera,item.vertices,"#d3faff",1.7);
  }else if(item.material==="brass"){
    const b=screenBounds(camera,item.vertices);
    polygon(ctx,camera,item.vertices);ctx.fillStyle="#c79e5e";ctx.fill();
    ctx.save();ctx.clip();const metal=ctx.createLinearGradient(b.x,b.y,b.x+b.w,b.y+b.h);
    metal.addColorStop(0,"#f1d49b");metal.addColorStop(.48,"#c79b59");metal.addColorStop(1,"#92683d");
    ctx.fillStyle=metal;ctx.fillRect(b.x,b.y,b.w,b.h);
    ctx.lineWidth=Math.max(2,camera.scale*.14);ctx.strokeStyle="#f5dbaa";polygon(ctx,camera,item.vertices);ctx.stroke();
    for(const vertex of item.vertices){const p=xy(camera,vertex);ctx.fillStyle="#725747";ctx.beginPath();ctx.arc(p.x,p.y,Math.max(1,camera.scale*.09),0,Math.PI*2);ctx.fill();}
    ctx.restore();outline(ctx,camera,item.vertices,"#59463e",1.6);
  }else if(item.material==="cheese"){
    polygon(ctx,camera,item.vertices);ctx.fillStyle="#e7b45f";ctx.fill();ctx.save();ctx.clip();
    const b=screenBounds(camera,item.vertices);
    for(const [u,v,r] of [[.68,.72,.1],[.87,.52,.07],[.43,.86,.06]]) {
      ctx.beginPath();ctx.ellipse(b.x+b.w*u,b.y+b.h*v,b.w*r,b.h*r,.15,0,Math.PI*2);
      ctx.fillStyle="#b77b4d";ctx.fill();
      ctx.strokeStyle="#f6d38b";ctx.lineWidth=1;ctx.stroke();
    }
    // Highlight the walkable sloping edge, within the collision silhouette.
    ctx.strokeStyle="#ffe0a2";ctx.lineWidth=Math.max(2,camera.scale*.13);
    for(const [i,a] of item.vertices.entries()){const c=item.vertices[(i+1)%item.vertices.length];if(Math.abs(a[0]-c[0])>1e-7&&Math.abs(a[1]-c[1])>1e-7){const p=xy(camera,a),q=xy(camera,c);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}}
    ctx.restore();outline(ctx,camera,item.vertices,"#8e5b42",1.4);
  }else if(item.kind==="barrel"&&item.vertices.length===4&&(!item.vertexIds||["A","B","C","D"].every(id=>item.vertexIds.includes(id)))){
    const ids=item.vertexIds??["A","B","C","D"];
    const a=xy(camera,item.vertices[ids.indexOf("A")]),b=xy(camera,item.vertices[ids.indexOf("B")]),d=xy(camera,item.vertices[ids.indexOf("D")]);
    const ux=b.x-a.x,uy=b.y-a.y,vx=d.x-a.x,vy=d.y-a.y,w=Math.hypot(ux,uy),h=Math.hypot(vx,vy);
    ctx.save();polygon(ctx,camera,item.vertices);ctx.clip();
    ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(uy,ux));
    if(typeof ctx.scale==="function")ctx.scale(1,Math.sign(ux*vy-uy*vx));
    ctx.fillStyle="#b48960";ctx.fillRect(0,0,w,h);
    if(art.timber)ctx.drawImage(art.timber,0,0,w,h);
    ctx.strokeStyle="#74513f";ctx.lineWidth=Math.max(1,w*.025);
    for(const u of [.18,.38,.62,.82]){ctx.beginPath();ctx.moveTo(w*u,0);ctx.quadraticCurveTo(w*u+(u-.5)*w*.12,h*.5,w*u,h);ctx.stroke();}
    ctx.fillStyle="#817d86";for(const v of [.14,.77])ctx.fillRect(0,v*h,w,h*.10);
    ctx.fillStyle="#e5c390";ctx.beginPath();ctx.ellipse(w*.27,h*.58,w*.075,h*.09,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#674b40";ctx.lineWidth=1.4;ctx.stroke();
    ctx.restore();outline(ctx,camera,item.vertices,"#513d46",2);
  }else if(item.kind==="gate"&&item.vertices.length===4){
    // Align timber grain and metal straps to the gate itself, not the camera-aligned AABB.
    const a=xy(camera,item.vertices[0]),b=xy(camera,item.vertices[3]),d=xy(camera,item.vertices[1]);
    const length=Math.hypot(b.x-a.x,b.y-a.y),width=Math.hypot(d.x-a.x,d.y-a.y);
    ctx.save();polygon(ctx,camera,item.vertices);ctx.clip();
    ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x));
    ctx.fillStyle="#ab805b";ctx.fillRect(0,0,length,width);
    if(art.timber)ctx.drawImage(art.timber,0,0,length,width);
    ctx.fillStyle="#887c83";for(const fraction of [.18,.82])ctx.fillRect(length*fraction-width*.24,0,width*.48,width);
    ctx.restore();outline(ctx,camera,item.vertices,"#513d46",2);
  }else{
    tilePolygon(ctx,camera,item.vertices,art.timber,"#ab805b",3,.65);
    outline(ctx,camera,item.vertices,"#513d46",2);
    const b=screenBounds(camera,item.vertices);
    if(item.kind==="crate"){
      ctx.strokeStyle="#715146";ctx.lineWidth=Math.max(2,camera.scale*.12);ctx.strokeRect(b.x+2,b.y+2,b.w-4,b.h-4);
      ctx.beginPath();ctx.moveTo(b.x+2,b.y+2);ctx.lineTo(b.x+b.w-2,b.y+b.h-2);ctx.stroke();
    }
  }
  if(item.bearing==="both-ends"){
    const b=screenBounds(camera,item.vertices),w=Math.max(3,Math.min(camera.scale*.5,b.w/4)),h=Math.min(b.h,Math.max(2,camera.scale*.22));
    ctx.fillStyle="#e0b76e";ctx.fillRect(b.x,b.y+b.h-h,w,h);ctx.fillRect(b.x+b.w-w,b.y+b.h-h,w,h);
    ctx.strokeStyle="#5c514c";ctx.lineWidth=.8;ctx.strokeRect(b.x,b.y+b.h-h,w,h);ctx.strokeRect(b.x+b.w-w,b.y+b.h-h,w,h);
  }
  if(item.hinge){
    const p=xy(camera,item.hinge);ctx.beginPath();ctx.arc(p.x,p.y,Math.max(3,camera.scale*.13),0,Math.PI*2);
    ctx.fillStyle="#e7c186";ctx.fill();ctx.strokeStyle="#544357";ctx.lineWidth=1.5;ctx.stroke();
  }
}
function decorate(ctx,camera,item) {
  const p=worldToScreen(camera,item),s=camera.scale;
  ctx.save();ctx.translate(p.x,p.y);
  if(item.kind==="lantern"){
    const glow=ctx.createRadialGradient(0,0,0,0,0,s*.8);
    glow.addColorStop(0,"#ffcf8588");glow.addColorStop(1,"#ffcf8500");ctx.fillStyle=glow;ctx.fillRect(-s*.8,-s*.8,s*1.6,s*1.6);
    ctx.fillStyle="#513e50";ctx.fillRect(-s*.14,-s*.22,s*.28,s*.44);
    ctx.fillStyle="#ffe3a1";ctx.fillRect(-s*.09,-s*.13,s*.18,s*.27);
    ctx.strokeStyle="#6c5260";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-s*.19,-s*.22);ctx.lineTo(0,-s*.35);ctx.lineTo(s*.19,-s*.22);ctx.stroke();
  }else{
    ctx.strokeStyle="#7b9366";ctx.lineWidth=Math.max(1,s*.045);ctx.lineCap="round";
    for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(i*s*.1,-s*.37,i*s*.19,-s*(.35+(.2-Math.abs(i)*.05)));ctx.stroke();}
  }
  ctx.restore();
}
function gardenBackdrop(ctx,camera,room){
  // Layered woodland silhouettes and flowering vines are decorative only.
  const s=camera.scale,b=room.bounds;
  for(let i=0;i<=Math.ceil((b.maxX-b.minX)/4);i++){
    const x=b.minX+i*4+.7,p=worldToScreen(camera,{x,y:2.8}),h=s*(7+(i%4)*1.25),r=s*(1.8+(i%3)*.22);
    ctx.fillStyle=i%2?"#38594e":"#46685a";ctx.fillRect(p.x-s*.18,p.y-h,s*.36,h);
    for(const [ox,oy,k] of [[-.7,.12,1],[.75,.18,.84],[0,.7,.9]]){
      ctx.beginPath();ctx.ellipse(p.x+ox*s,p.y-h-oy*s,r*k,r*.64*k,0,0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle="#d6b89266";for(let j=0;j<3;j++){ctx.beginPath();ctx.arc(p.x+(j-1)*s*.62,p.y-h+(j%2)*s*.6,Math.max(1,s*.055),0,Math.PI*2);ctx.fill();}
  }
}
function clockworkBackdrop(ctx,camera,room){
  const s=camera.scale;
  // Copper pipes, gear silhouettes and riveted columns: decorative only.
  for(let i=0;i<Math.ceil((room.bounds.maxX-room.bounds.minX)/5);i++){
    const x=2+i*5,p=worldToScreen(camera,{x,y:3}),h=s*(room.bounds.maxY-3);
    ctx.fillStyle=i%2?"#444d56":"#4c555e";ctx.fillRect(p.x-s*.28,p.y-h,s*.56,h);
    ctx.fillStyle="#9c896555";for(let k=1;k<5;k++)ctx.fillRect(p.x-s*.4,p.y-h*k/5,s*.8,Math.max(1,s*.12));
    if(i%2===0){
      const g=worldToScreen(camera,{x:x+2.4,y:7+(i%3)*2}),r=s*(1.15+(i%3)*.22);
      ctx.save();ctx.translate(g.x,g.y);ctx.fillStyle="#b59b6855";
      for(let j=0;j<12;j++){ctx.rotate(Math.PI/6);ctx.fillRect(-r*.18,-r*1.17,r*.36,r*.42);}
      ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#c2a57566";ctx.lineWidth=Math.max(1,s*.07);ctx.beginPath();ctx.arc(0,0,r*.7,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle="#424950";ctx.beginPath();ctx.arc(0,0,r*.29,0,Math.PI*2);ctx.fill();ctx.restore();
    }
  }
  const a=worldToScreen(camera,{x:room.bounds.minX,y:10.5}),b=worldToScreen(camera,{x:room.bounds.maxX,y:10.5});
  ctx.strokeStyle="#aa90664d";ctx.lineWidth=Math.max(2,s*.26);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
}
function observatoryBackdrop(ctx,camera,room){
 const b=room.bounds,s=camera.scale;
 ctx.save();
 for(let i=0;i<44;i++){
  const x=b.minX+(b.maxX-b.minX)*((i*37%101)/101),y=b.minY+(b.maxY-b.minY)*(.42+.56*((i*19%97)/97));
  const p=worldToScreen(camera,{x,y});ctx.fillStyle=i%4===0?"#f5dea8b0":"#d9dbfa65";
  ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.8,s*(i%4===0?.095:.045)),0,Math.PI*2);ctx.fill();
 }
 for(let x=b.minX+4;x<b.maxX;x+=12){
  const p=worldToScreen(camera,{x,y:4}),w=9*s,h=(b.maxY-5)*s;
  ctx.strokeStyle="#9dabc238";ctx.lineWidth=Math.max(1,s*.12);ctx.beginPath();ctx.moveTo(p.x-w/2,p.y);ctx.lineTo(p.x-w/2,p.y-h*.72);ctx.quadraticCurveTo(p.x,p.y-h,p.x+w/2,p.y-h*.72);ctx.lineTo(p.x+w/2,p.y);ctx.stroke();
 }
 ctx.restore();
}
function drawMirrorRails(ctx,camera,room){
 for(const rail of mirrorRails(room)){
  const x=railMirrorValue(rail),b=polygonBounds(rail.vertices),a=worldToScreen(camera,{x,y:room.bounds.minY}),z=worldToScreen(camera,{x,y:room.bounds.maxY});
  ctx.save();ctx.strokeStyle="#b9aff3bb";ctx.lineWidth=1.5;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(z.x,z.y);ctx.stroke();ctx.restore();
  worldLabel(ctx,camera,x,b.maxY+.65,"MIRROR · "+railEquation(rail),"#e5d7ff");
 }
}
function alchemistBackdrop(ctx,camera,room){
 const s=camera.scale,b=room.bounds;
 // Muted laboratory shelving, round flasks and copper pipes. Scenery only.
 ctx.save();
 for(let i=0;i<Math.ceil((b.maxX-b.minX)/8);i++){
  const q=worldToScreen(camera,{x:b.minX+1+i*8,y:4}),w=6*s,h=(b.maxY-4)*s;
  ctx.fillStyle="#253c4266";ctx.fillRect(q.x,q.y-h,w,h);
  ctx.strokeStyle="#a8a58d44";ctx.lineWidth=Math.max(1,s*.12);ctx.strokeRect(q.x,q.y-h,w,h);
  for(let j=0;j<Math.floor(h/(4*s));j++){
   const y=q.y-h+(j+1)*4*s;ctx.fillStyle="#857b5c77";ctx.fillRect(q.x,y,w,Math.max(1,s*.12));
   for(let k=0;k<3;k++){
    const x=q.x+s*(1+k*1.7),radius=s*(.52+((i+k+j)%3)*.12);
    ctx.fillStyle=["#82c7ae55","#d6ba8255","#9c9ace55"][(i+j+k)%3];
    ctx.beginPath();ctx.ellipse(x,y-radius,radius,radius,0,0,Math.PI*2);ctx.fill();
    ctx.fillRect(x-radius*.22,y-radius*2.55,radius*.44,radius*.9);
    ctx.strokeStyle="#b9d2c555";ctx.beginPath();ctx.ellipse(x,y-radius,radius,radius,0,0,Math.PI*2);ctx.stroke();
   }
  }
 }
 ctx.restore();
}
function archivesBackdrop(ctx,camera,room){
 const b=room.bounds,s=camera.scale;
 // Scenic bookcases and violet arched windows, not collision geometry.
 ctx.save();
 for(let i=0;i<Math.ceil((b.maxX-b.minX)/8)+1;i++){
  const p=worldToScreen(camera,{x:b.minX+i*8+.6,y:b.minY+1}),w=6.8*s,h=(b.maxY-b.minY-2)*s;
  ctx.fillStyle="#332b465f";ctx.fillRect(p.x,p.y-h,w,h);
  ctx.strokeStyle="#9e88ae65";ctx.lineWidth=Math.max(1,s*.16);ctx.strokeRect(p.x,p.y-h,w,h);
  for(let j=0;j<Math.floor(h/(2.8*s));j++){
   const y=p.y-h+(j+1)*2.8*s;
   ctx.fillStyle="#9c829668";ctx.fillRect(p.x,y,w,Math.max(1,s*.14));
   for(let k=0;k<9;k++){
    const bw=s*(.38+(k%3)*.05),bh=s*(.85+((k+i+j)%4)*.24);
    ctx.fillStyle=["#ad8b7a55","#8c739755","#c2b08e55","#6c849d55"][(k+i+j)%4];
    ctx.fillRect(p.x+s*.45+k*s*.64,y-bh,bw,bh);
   }
  }
  if(i%3===1){const q=worldToScreen(camera,{x:b.minX+i*8+4,y:b.maxY-3});
    ctx.beginPath();ctx.moveTo(q.x-s*.7,q.y+s*1.6);ctx.lineTo(q.x-s*.7,q.y);ctx.quadraticCurveTo(q.x,q.y-s*1.8,q.x+s*.7,q.y);ctx.lineTo(q.x+s*.7,q.y+s*1.6);ctx.closePath();ctx.fillStyle="#c4b0ef42";ctx.fill();ctx.strokeStyle="#c4b0ef75";ctx.stroke();
  }
 }
 ctx.restore();
}
function riverworksBackdrop(ctx,camera,room){
  // Hazy aqueducts and dock gantries are scenic silhouettes, never solid.
  const s=camera.scale,b=room.bounds;
  ctx.save();
  for(let i=0;i<Math.ceil((b.maxX-b.minX)/8)+1;i++){
    const p=worldToScreen(camera,{x:b.minX+i*8,y:3}),h=s*(5+(i%3)*1.15),w=s*6.4;
    ctx.fillStyle="#41677955";ctx.fillRect(p.x-w*.55,p.y-h,w*.12,h);
    ctx.fillRect(p.x+w*.45,p.y-h,w*.12,h);
    ctx.strokeStyle="#547b875d";ctx.lineWidth=Math.max(2,s*.36);
    ctx.beginPath();ctx.moveTo(p.x-w*.5,p.y-h*.36);ctx.quadraticCurveTo(p.x,p.y-h*1.5,p.x+w*.5,p.y-h*.36);ctx.stroke();
    ctx.fillStyle="#547b8766";ctx.fillRect(p.x-w*.62,p.y-h,w*1.24,Math.max(2,s*.28));
  }
  for(let i=0;i<Math.ceil((b.maxX-b.minX)/14);i++){
    const p=worldToScreen(camera,{x:b.minX+5+i*14,y:3}),h=s*8;
    ctx.strokeStyle="#2e56646b";ctx.lineWidth=Math.max(1,s*.16);
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y-h);ctx.lineTo(p.x+s*3.4,p.y-h);ctx.lineTo(p.x,p.y-h*.63);ctx.stroke();
    ctx.strokeStyle="#3c626c66";ctx.beginPath();ctx.moveTo(p.x+s*3.4,p.y-h);ctx.lineTo(p.x+s*3.4,p.y-h*.52);ctx.stroke();
  }
  ctx.restore();
}
function drawSockets(ctx,camera,room){
  for(const socket of room.sockets??[]){
    const object=room.objects.find(o=>o.id===socket.objectId),held=object?.hinge&&Math.hypot(object.hinge[0]-socket.x,object.hinge[1]-socket.y)<1e-7;
    const p=worldToScreen(camera,socket),r=Math.max(5,camera.scale*.34),colour=held?"#c7e9a4":"#f4c675";
    ctx.save();ctx.fillStyle="#423b39";ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=colour;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,r*.47,0,Math.PI*2);ctx.stroke();ctx.restore();
    worldLabel(ctx,camera,socket.x,socket.y-.8,held?"S · DOCKED":"S · SOCKET",colour);
  }
}
function drawDeliveries(ctx,camera,room){
 for(const t of room.deliveries??[]){
  const filled=deliveryFilled(room,t),b=polygonBounds(t.vertices),colour=filled?"#b8edb1":"#c6d8ff";
  ctx.save();polygon(ctx,camera,t.vertices);ctx.fillStyle=filled?"#b8edb122":"#19294388";ctx.fill();
  ctx.strokeStyle=colour;ctx.lineWidth=2;ctx.setLineDash(filled?[]:[5,3]);ctx.stroke();ctx.restore();
  worldLabel(ctx,camera,(b.minX+b.maxX)/2,b.maxY+.55,filled?"STAR DELIVERED":"CRYSTAL RECEIVER",colour);
 }
}
function drawShapeSockets(ctx,camera,room,foreground=false){
  for(const slot of room.shapeSockets??[]){
    const b=polygonBounds(slot.vertices),g=room.objects.find(o=>o.id===slot.gateId),gb=polygonBounds(g.vertices);
    const colour=slot.filled?"#c7e9a4":"#e9bd7b",s=camera.scale;
    ctx.save();polygon(ctx,camera,slot.vertices);
    if(!foreground){ctx.fillStyle="#292e39c9";ctx.fill();}
    else {
      ctx.strokeStyle=colour;ctx.lineWidth=2;ctx.setLineDash(slot.filled?[]:[5,3]);ctx.stroke();
      const p=worldToScreen(camera,{x:b.maxX,y:b.maxY}),q=worldToScreen(camera,{x:(gb.minX+gb.maxX)/2,y:gb.maxY-.5});
      ctx.strokeStyle=colour;ctx.lineWidth=Math.max(1,s*.045);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,q.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.setLineDash([]);
      worldLabel(ctx,camera,(b.minX+b.maxX)/2,b.maxY+.55,slot.locking?(slot.filled?"KEY CAPTURED":(slot.label??"LOCKING RECESS").toUpperCase()+" · LOCKS"):(slot.filled?"KEY FITS":"LOCK RECESS"),colour);
      if(!mixedGateProgress(room,g.id))worldLabel(ctx,camera,(gb.minX+gb.maxX)/2,gb.minY+4,g.open?"OPEN":"LOCKED",colour);
    }
    ctx.restore();
  }
}
function drawPlates(ctx,camera,room){
  for(const group of plateGroups(room)){
    const g=room.objects.find(o=>o.id===group.gateId),b=polygonBounds(g.vertices);
    for(const [i,plate] of group.plates.entries()){
      if(plate.closedGateId!==undefined)continue;
      const p=worldToScreen(camera,plate),q=worldToScreen(camera,{x:(b.minX+b.maxX)/2,y:plate.y});
      const s=camera.scale,colour=plate.pressed?"#c7ef9d":"#f1c37b",lane=s*(.72+i*.65);
      ctx.save();ctx.strokeStyle=colour;ctx.lineWidth=Math.max(1.5,s*.07);ctx.setLineDash([4,3]);ctx.beginPath();
      ctx.moveTo(p.x+plate.width*s/2,p.y+4);ctx.lineTo(p.x+plate.width*s/2,p.y+lane);ctx.lineTo(q.x,q.y+lane);ctx.lineTo(q.x,q.y+4);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle="#665947";ctx.fillRect(p.x,p.y+1,plate.width*s,Math.max(4,s*.19));
      ctx.fillStyle=colour;ctx.fillRect(p.x+1,p.y+1,plate.width*s-2,Math.max(2,s*.10));
      const label=plate.latch?(plate.latched?"LATCHED OPEN":"ONE-WAY LATCH"):group.total>1?(plate.label??"Plate "+(i+1)).toUpperCase()+" · "+(plate.pressed?"HELD":"FREE"):(plate.pressed?"PLATE HELD":"WEIGHT PLATE");
      worldLabel(ctx,camera,plate.x+plate.width/2,plate.y-.45,label,colour);ctx.restore();
    }
  }
}
function drawSelectors(ctx,camera,room){
 for(const plate of selectorPlates(room)){
  const held=plateHeld(room,plate),s=camera.scale,p=worldToScreen(camera,{x:plate.x+plate.width/2,y:plate.y});
  const colours=["#aee8ab","#e6ad76"];
  ctx.save();
  for(const [i,id] of [plate.closedGateId,plate.gateId].entries()){
   const gate=room.objects.find(o=>o.id===id),b=polygonBounds(gate.vertices),q=worldToScreen(camera,{x:(b.minX+b.maxX)/2,y:plate.y}),lane=s*(.75+i*.65);
   ctx.strokeStyle=gate.open?colours[0]:colours[1];ctx.lineWidth=Math.max(1.4,s*.07);ctx.setLineDash(gate.open?[]:[4,3]);
   ctx.beginPath();ctx.moveTo(p.x,p.y+3);ctx.lineTo(p.x,p.y+lane);ctx.lineTo(q.x,q.y+lane);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.setLineDash([]);
  }
  ctx.fillStyle=held?colours[0]:colours[1];ctx.fillRect(p.x-plate.width*s/2,p.y+1,plate.width*s,Math.max(3,s*.13));ctx.restore();
  worldLabel(ctx,camera,plate.x+plate.width/2,plate.y-.55,"SELECTOR · "+(held?"HELD":"FREE"),held?colours[0]:colours[1]);
 }
}
function drawPlateGateStates(ctx,camera,room){
  for(const group of plateGroups(room)){
    const g=room.objects.find(o=>o.id===group.gateId),b=polygonBounds(g.vertices);
    if(group.plates.some(p=>p.closedGateId!==undefined))continue;
    const mixed=mixedGateProgress(room,g.id);
    const label=(mixed?mixed.held+"/"+mixed.total+" LINKED · ":group.total>1?group.held+"/"+group.total+" HELD · ":"")+(g.open?"OPEN":"CLOSED");
    worldLabel(ctx,camera,(b.minX+b.maxX)/2,Math.min(b.maxY-.55,b.minY+4),label,g.open?"#c7ef9d":"#f1c37b");
  }
 for(const plate of selectorPlates(room))for(const [i,id] of [plate.closedGateId,plate.gateId].entries()){
  const g=room.objects.find(o=>o.id===id),b=polygonBounds(g.vertices);
  worldLabel(ctx,camera,(b.minX+b.maxX)/2,Math.min(b.maxY-.6,b.minY+4),(i===0?"FREE":"HELD")+" → "+(g.open?"OPEN":"CLOSED"),g.open?"#aee8ab":"#e6ad76");
 }
}

function sceneDetails(ctx,camera,room){
  // Architecture behind the playable silhouettes, never added to collision geometry.
  const rect=(x,y,w,h,colour)=>{const p=worldToScreen(camera,{x,y:y+h});ctx.fillStyle=colour;ctx.fillRect(p.x,p.y,w*camera.scale,h*camera.scale);};
  if(room.id==="gardens-06")rect(0,3,7,5,"#253c35c9");
  if(room.id==="gatehouse-04"){
    rect(0,3,7,5,"#34293dc9");
    for(const x of [1,3.5,6])rect(x,3,.12,5,"#78657980");
    rect(0,7.55,7,.14,"#ae927462");
  }
  if(room.id==="gatehouse-02"){
    rect(12.2,3,.5,5.5,"#6b5b7177");rect(19.3,3,.5,5.5,"#6b5b7177");
    rect(12.2,7.7,7.6,.5,"#71607555");
  }
  if(room.id==="gatehouse-03"){
    rect(26,12,.35,2,"#87758766");rect(33,12,.35,2,"#87758766");
  }
}
function worldLabel(ctx,camera,x,y,label,colour){
  const p=worldToScreen(camera,{x,y});
  if(p.x<22||p.x>camera.width-22||p.y<10||p.y>camera.height-10)return;
  ctx.save();ctx.font="700 11px system-ui, sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineWidth=3.2;ctx.lineJoin="round";ctx.strokeStyle="#272034";ctx.strokeText(label,p.x,p.y);ctx.fillStyle=colour;ctx.fillText(label,p.x,p.y);ctx.restore();
}
function objectRunes(ctx,camera,room){
  for(const o of room.objects){
    if(o.decorative||!o.permissions?.length||o.reflectionOpacity!==undefined)continue;
    const b=polygonBounds(o.vertices),p=worldToScreen(camera,{x:(b.minX+b.maxX)/2,y:b.maxY});
    const y=p.y-8;
    if(p.x<8||p.x>camera.width-8||y<6||y>camera.height-6)continue;
    ctx.save();ctx.beginPath();ctx.moveTo(p.x,y-4);ctx.lineTo(p.x+4,y);ctx.lineTo(p.x,y+4);ctx.lineTo(p.x-4,y);ctx.closePath();
    ctx.fillStyle=SPELL_COLOURS[o.permissions[0]]??"#f5d69a";ctx.fill();ctx.strokeStyle="#34273e";ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
  }
}
function portal(ctx,camera,exit,art) {
  const p=worldToScreen(camera,exit),w=exit.width*camera.scale,h=exit.height*camera.scale;
  const glow=ctx.createRadialGradient(p.x,p.y-h*.5,0,p.x,p.y-h*.5,h);
  glow.addColorStop(0,"#ffce8780");glow.addColorStop(1,"#ffce8700");
  ctx.fillStyle=glow;ctx.fillRect(p.x-h,p.y-h*1.5,h*2,h*2);
  if(art.portal)ctx.drawImage(art.portal,p.x-w/2,p.y-h,w,h);
  else{ctx.fillStyle="#efc47f";ctx.beginPath();ctx.moveTo(p.x-w/2,p.y);ctx.lineTo(p.x-w/2,p.y-h*.63);ctx.quadraticCurveTo(p.x-w/2,p.y-h,p.x,p.y-h);ctx.quadraticCurveTo(p.x+w/2,p.y-h,p.x+w/2,p.y-h*.63);ctx.lineTo(p.x+w/2,p.y);ctx.closePath();ctx.fill();}
}
function ladder(ctx,camera,l) {
  const a=worldToScreen(camera,{x:l.x-l.width/2,y:l.top}),b=worldToScreen(camera,{x:l.x+l.width/2,y:l.bottom});
  const s=camera.scale;
  ctx.strokeStyle="#513d46";ctx.lineWidth=Math.max(3,s*.13);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x,b.y);ctx.moveTo(b.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  ctx.strokeStyle="#d0a477";ctx.lineWidth=Math.max(1.5,s*.075);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x,b.y);ctx.moveTo(b.x,a.y);ctx.lineTo(b.x,b.y);
  for(let y=l.bottom+.2;y<l.top;y+=.38){const p=worldToScreen(camera,{x:l.x,y});ctx.moveTo(a.x,p.y);ctx.lineTo(b.x,p.y);}
  ctx.stroke();
}
function checkpoint(ctx,camera,c,active){
  const p=worldToScreen(camera,c),s=camera.scale;
  ctx.strokeStyle="#664b4f";ctx.lineWidth=Math.max(1.5,s*.055);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y-s*.85);ctx.stroke();
  ctx.fillStyle=active?"#efcb85":"#88749f";ctx.beginPath();ctx.moveTo(p.x,p.y-s*.85);ctx.lineTo(p.x+s*.5,p.y-s*.7);ctx.lineTo(p.x,p.y-s*.55);ctx.closePath();ctx.fill();
}
function apprentice(ctx,camera,player,art,reducedMotion) {
  const p=worldToScreen(camera,player),h=camera.scale*1.72,w=h*120/168;
  // Foot anchor is fixed. Small pose-dependent lean/stretch is purely cosmetic.
  const animated=!reducedMotion&&(player.pose==="walk"||player.pose==="climb");
  const gait=animated?Math.sin(player.phase??0):0;
  const lean=reducedMotion?0:player.pose==="jump"?-.08:player.pose==="walk" ? .055*gait : 0;
  const stretch=1+(animated ? .025*gait : 0);
  ctx.save();ctx.translate(p.x,p.y);
  if(typeof ctx.scale==="function")ctx.scale(player.facing===-1?-1:1,stretch);
  ctx.rotate(lean);
  if(art.apprentice)ctx.drawImage(art.apprentice,-w*.5,-h*157/168,w,h);
  else{ctx.fillStyle="#9670b3";ctx.fillRect(-w*.3,-h*.55,w*.6,h*.55);ctx.beginPath();ctx.arc(0,-h*.72,w*.3,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}

/** A deterministic scene draw. Art never modifies the room or collision polygons. */
export function renderWorld(ctx,metrics,camera,room,art={},player=room.spawn,reducedMotion=false) {
  ctx.setTransform(metrics.scaleX,0,0,metrics.scaleY,0,0);
  const sky=ctx.createLinearGradient(0,0,0,metrics.height);sky.addColorStop(0,room.chapter===7?"#202846":room.chapter===6?"#263e43":room.chapter===5?"#302b45":room.chapter===4?"#31596d":room.chapter===3?"#34434e":room.chapter===2?"#34584f":"#514963");sky.addColorStop(1,room.chapter===7?"#747da8":room.chapter===6?"#8ca79b":room.chapter===5?"#9c8ba9":room.chapter===4?"#b4d0ca":room.chapter===3?"#a6a99b":room.chapter===2?"#c7d3a4":"#d3a68d");ctx.fillStyle=sky;ctx.fillRect(0,0,metrics.width,metrics.height);
  if(![2,3,4,5,6,7].includes(room.chapter)){backdrop(ctx,art.distant,camera,room.bounds,.28);backdrop(ctx,art.ruins,camera,room.bounds,.48);}
  ctx.save();
  const b=room.bounds,tl=worldToScreen(camera,{x:b.minX,y:b.maxY}),br=worldToScreen(camera,{x:b.maxX,y:b.minY});
  ctx.beginPath();ctx.rect(tl.x,tl.y,br.x-tl.x,br.y-tl.y);ctx.clip();
  if(room.chapter===2)gardenBackdrop(ctx,camera,room);
  if(room.chapter===3)clockworkBackdrop(ctx,camera,room);
  if(room.chapter===4)riverworksBackdrop(ctx,camera,room);
  if(room.chapter===5)archivesBackdrop(ctx,camera,room);
   if(room.chapter===6)alchemistBackdrop(ctx,camera,room);
  if(room.chapter===7)observatoryBackdrop(ctx,camera,room);
  sceneDetails(ctx,camera,room);
  for(const item of room.hazards)hazard(ctx,camera,item,art);
  for(const item of room.terrain)terrain(ctx,camera,item,art);
  drawMirrorRails(ctx,camera,room);
  drawRotationMechanisms(ctx,camera,room);
  drawPlates(ctx,camera,room);
  drawSelectors(ctx,camera,room);
  drawSockets(ctx,camera,room);
  drawShapeSockets(ctx,camera,room);
  for(const item of room.ladders??[])ladder(ctx,camera,item);
  for(const item of room.objects){
    if(item.reflectionOpacity!==undefined){ctx.save();ctx.globalAlpha=item.reflectionOpacity;object(ctx,camera,item,art);ctx.restore();}
    else object(ctx,camera,item,art);
  }
  drawPlateGateStates(ctx,camera,room);
  drawShapeSockets(ctx,camera,room,true);
  drawDeliveries(ctx,camera,room);
  for(const item of room.checkpoints??[])checkpoint(ctx,camera,item,player.checkpoint===item.id);
  for(const item of room.decor)decorate(ctx,camera,item);
  portal(ctx,camera,room.exit,art);apprentice(ctx,camera,player,art,reducedMotion);
  if(room.id==="gardens-06"){const m=room.objects.find(o=>o.kind==="mushroom"),b=polygonBounds(m.vertices);worldLabel(ctx,camera,(b.minX+b.maxX)/2,b.maxY+.65,"SPRING CAP","#f9dcb4");}
  if(room.id==="riverworks-13")worldLabel(ctx,camera,42,1.5,"CENTRAL PIER","#f7d7a1");
  if(room.id==="riverworks-16")worldLabel(ctx,camera,3.5,8,"STORAGE SHELF","#f7d7a1");
  for(const o of room.objects){
    if(!o.decorative&&o.fixedCentre)worldLabel(ctx,camera,o.fixedCentre[0],o.fixedCentre[1]+.55,"EXTERNAL CENTRE","#ffe1a7");
    else if(!o.decorative&&o.kind==="waterwheel"&&o.hinge)worldLabel(ctx,camera,o.hinge[0],o.hinge[1]+.85,"AXLE","#ffe1a7");
    else if(o.kind==="pivot-carrier"&&o.reflectionOpacity===undefined)worldLabel(ctx,camera,o.hinge[0],o.hinge[1]-.8,"MOVABLE H","#d1eac9");
  }
  if(room.id==="archives-19")worldLabel(ctx,camera,34,7.35,"READING BALCONY","#e9cffa");
  if(room.id==="archives-20")worldLabel(ctx,camera,36,6.35,"SAFE BALCONY","#e9cffa");
   if(room.id==="alchemist-25")worldLabel(ctx,camera,29,8.2,"RAISED WORKBENCH","#d1eac9");
   if(room.id==="alchemist-26"){worldLabel(ctx,camera,21,13.45,"NARROW CHANNEL","#d1eac9");worldLabel(ctx,camera,21,10.15,"1.6 UNITS CLEAR","#d1eac9");}
  if(room.id==="observatory-35")worldLabel(ctx,camera,39,5.35,"MACHINE ISLAND","#e5d7ff");
  if(room.id==="observatory-36"){worldLabel(ctx,camera,39,4.5,"SAFE ISLAND","#e5d7ff");worldLabel(ctx,camera,83,14.2,"SUMMIT","#e5d7ff");}
  if(room.id==="observatory-33")worldLabel(ctx,camera,39,3.8,"STAR ISLAND","#e5d7ff");
  if(room.id==="observatory-32")worldLabel(ctx,camera,39,5.35,"SAFE STAR PLATFORM","#e5d7ff");
  if(room.id==="alchemist-29")worldLabel(ctx,camera,24,5.4,"SAFE CHAMBER","#d1eac9");
  if(room.id==="alchemist-30"){worldLabel(ctx,camera,21,12.8,"NARROW CHANNEL","#d1eac9");worldLabel(ctx,camera,44.5,8.85,"SAFE WORKBENCH","#d1eac9");}
  if(room.id==="alchemist-28")worldLabel(ctx,camera,17,7.4,"MIRROR PARTITION","#d1eac9");
  for(const o of room.objects)if(o.bridgeDeck){const b=polygonBounds(o.vertices);worldLabel(ctx,camera,(b.minX+b.maxX)/2,b.maxY+.45,isBridgeDeck(o)?"BRIDGE":ladderSegment(o)?"LADDER":"TURNING","#f7d7a1");}
  if(room.id==="riverworks-14")worldLabel(ctx,camera,6,5.6,"STORAGE RACK","#f7d7a1");
  if(room.id==="clockwork-10")worldLabel(ctx,camera,21.5,6.65,"LOW ARCH","#f1d09b");
  if(room.tutorial){objectRunes(ctx,camera,room);worldLabel(ctx,camera,room.exit.x,room.exit.y+room.exit.height+.35,deliveryReady(room)?"EXIT":"EXIT · STAR REQUIRED",deliveryReady(room)?"#ffe2a5":"#c6d8ff");}
  ctx.restore();
  // Subtle vignette establishes the playable area without darkening the whole room.
  const v=ctx.createLinearGradient(0,0,0,metrics.height);v.addColorStop(0,"#28223930");v.addColorStop(.28,"#28223900");v.addColorStop(.82,"#28223900");v.addColorStop(1,"#28223950");
  ctx.fillStyle=v;ctx.fillRect(0,0,metrics.width,metrics.height);
}
