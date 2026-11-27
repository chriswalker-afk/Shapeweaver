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
function object(ctx,camera,item,art) {
  if(item.kind==="mushroom"){
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
  }else if(item.material==="cheese"){
    polygon(ctx,camera,item.vertices);ctx.fillStyle="#e7b45f";ctx.fill();ctx.save();ctx.clip();
    const b=screenBounds(camera,item.vertices);
    for(const [u,v,r] of [[.68,.72,.1],[.87,.52,.07],[.43,.86,.06]]) {
      ctx.beginPath();ctx.ellipse(b.x+b.w*u,b.y+b.h*v,b.w*r,b.h*r,.15,0,Math.PI*2);
      ctx.fillStyle="#b77b4d";ctx.fill();
      ctx.strokeStyle="#f6d38b";ctx.lineWidth=1;ctx.stroke();
    }
    // Highlight the walkable sloping edge, within the collision silhouette.
    const a=xy(camera,item.vertices[0]),c=xy(camera,item.vertices[2]);
    ctx.strokeStyle="#ffe0a2";ctx.lineWidth=Math.max(2,camera.scale*.13);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(c.x,c.y);ctx.stroke();
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
function drawPlates(ctx,camera,room){
  for(const plate of room.plates??[]){
    const p=worldToScreen(camera,plate),g=room.objects.find(o=>o.id===plate.gateId),b=polygonBounds(g.vertices),q=worldToScreen(camera,{x:(b.minX+b.maxX)/2,y:plate.y});
    const s=camera.scale,colour=plate.pressed?"#c7ef9d":"#f1c37b";
    ctx.save();ctx.strokeStyle=colour;ctx.lineWidth=Math.max(1.5,s*.07);ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(p.x+plate.width*s/2,p.y+4);ctx.lineTo(p.x+plate.width*s/2,p.y+s*.7);ctx.lineTo(q.x,q.y+s*.7);ctx.lineTo(q.x,q.y+4);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="#665947";ctx.fillRect(p.x,p.y+1,plate.width*s,Math.max(4,s*.19));
    ctx.fillStyle=colour;ctx.fillRect(p.x+1,p.y+1,plate.width*s-2,Math.max(2,s*.10));
    worldLabel(ctx,camera,plate.x+plate.width/2,plate.y-.6,plate.pressed?"PLATE HELD":"WEIGHT PLATE",colour);
    worldLabel(ctx,camera,(b.minX+b.maxX)/2,plate.y+3.8,g.open?"OPEN":"CLOSED",colour);ctx.restore();
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
  const sky=ctx.createLinearGradient(0,0,0,metrics.height);sky.addColorStop(0,room.chapter===2?"#34584f":"#514963");sky.addColorStop(1,room.chapter===2?"#c7d3a4":"#d3a68d");ctx.fillStyle=sky;ctx.fillRect(0,0,metrics.width,metrics.height);
  if(room.chapter!==2){backdrop(ctx,art.distant,camera,room.bounds,.28);backdrop(ctx,art.ruins,camera,room.bounds,.48);}
  ctx.save();
  const b=room.bounds,tl=worldToScreen(camera,{x:b.minX,y:b.maxY}),br=worldToScreen(camera,{x:b.maxX,y:b.minY});
  ctx.beginPath();ctx.rect(tl.x,tl.y,br.x-tl.x,br.y-tl.y);ctx.clip();
  if(room.chapter===2)gardenBackdrop(ctx,camera,room);
  sceneDetails(ctx,camera,room);
  for(const item of room.hazards)hazard(ctx,camera,item,art);
  for(const item of room.terrain)terrain(ctx,camera,item,art);
  drawPlates(ctx,camera,room);
  for(const item of room.ladders??[])ladder(ctx,camera,item);
  for(const item of room.objects){
    if(item.reflectionOpacity!==undefined){ctx.save();ctx.globalAlpha=item.reflectionOpacity;object(ctx,camera,item,art);ctx.restore();}
    else object(ctx,camera,item,art);
  }
  for(const item of room.checkpoints??[])checkpoint(ctx,camera,item,player.checkpoint===item.id);
  for(const item of room.decor)decorate(ctx,camera,item);
  portal(ctx,camera,room.exit,art);apprentice(ctx,camera,player,art,reducedMotion);
  if(room.id==="gardens-06"){const m=room.objects.find(o=>o.kind==="mushroom"),b=polygonBounds(m.vertices);worldLabel(ctx,camera,(b.minX+b.maxX)/2,b.maxY+.65,"SPRING CAP","#f9dcb4");}
  if(room.tutorial){objectRunes(ctx,camera,room);worldLabel(ctx,camera,room.exit.x,room.exit.y+room.exit.height+.35,"EXIT","#ffe2a5");}
  ctx.restore();
  // Subtle vignette establishes the playable area without darkening the whole room.
  const v=ctx.createLinearGradient(0,0,0,metrics.height);v.addColorStop(0,"#28223930");v.addColorStop(.28,"#28223900");v.addColorStop(.82,"#28223900");v.addColorStop(1,"#28223950");
  ctx.fillStyle=v;ctx.fillRect(0,0,metrics.width,metrics.height);
}
