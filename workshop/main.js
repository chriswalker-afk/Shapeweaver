import {LEVELS} from "../src/levels/campaign.js";
import {createCamera,worldToScreen,screenToWorld} from "../src/rendering/camera.js";
import {canvasMetrics} from "../src/rendering/viewport.js";
import {drawCoordinateOverlay} from "../src/rendering/coordinate-grid.js";
import {drawObjectOverlay} from "../src/rendering/object-overlay.js";
import {renderWorld,loadWorldArt} from "../src/rendering/world-art.js";
import {createFixedLoop} from "../src/core/fixed-loop.js";
import {mountMovementInput} from "../src/ui/movement-input.js";
import {selectableObjects} from "../src/core/object-engine.js";
import {referencePoints} from "../src/transformations/preview-math.js";
import {pointPolygonDistance} from "../src/geometry/polygons.js";
import {PALETTE,newDraft,copyCampaignRoom,prepareDraft,itemEntries,getItem,itemBounds,moveItem,replaceItem,removeItem,addTemplate,validateDraft,copy} from "./model.js";
import {createWorkshopSession,verifyWorkshopBundle} from "./replay.js";
const $=id=>document.getElementById(id),canvas=$("workshop-canvas"),ctx=canvas.getContext("2d");
if(!ctx)throw Error("Canvas 2D is required");
let draft=newDraft(),selection=null,placement=null,drag=null,camera=null,grid=true,session=null,running=false,proof=null,preview=null,finished=false;
const art=loadWorldArt(window,()=>draw());
const input=mountMovementInput(document,window,()=>Boolean(session&&running&&!session.player.completed&&!session.player.blockedRespawn));
const loop=createFixedLoop(window,()=>{
 if(!session||!running||document.hidden)return;
 const r=session.step(input.sample());if(!r.ok){pause();status(r.message,"error");}
 if(session.player.completed||session.player.blockedRespawn){pause();updateAttempt();if(session.player.completed)finish();}
},()=>{draw();updateAttempt(false);});
const message=e=>e?.message??String(e);
function status(text,state=""){const el=$("status");el.textContent=text;el.dataset.state=state;}
function option(value,text){const el=document.createElement("option");el.value=value;el.textContent=text;return el;}
function proofStatus(text,state=""){const el=$("proof");el.textContent=text;el.dataset.state=state;for(const id of ["download","verify","copy-bundle"])$(id).disabled=!proof;}
function invalidate(){proof=null;proofStatus("Draft — no verified solution. Start a fresh playtest after editing.");}
const selected=()=>selection?getItem(draft,selection.group,selection.id):null;
function updateList(){
 const items=itemEntries(draft);
 $("item-list").replaceChildren(option("","Choose an item…"),...items.map(e=>option(e.group+":"+e.id,e.group+" · "+(e.item.label??e.id))));
 $("item-list").value=selection?selection.group+":"+selection.id:"";
}
function select(group,id){
 selection=group&&getItem(draft,group,id)?{group,id}:null;const o=selected();
 $("selection-name").textContent=o?selection.group+" · "+selection.id:"Select an item.";
 $("properties").value=o?JSON.stringify(o,null,2):"";
 $("apply-properties").disabled=!o;$("delete-item").disabled=!o||["spawn","exit"].includes(selection.group);
 updateList();draw();
}
function changed(next,keep=selection){
 draft=next;invalidate();select(keep?.group,keep?.id);status("Draft changed — validate before playtesting.");$("room-json").value=JSON.stringify(draft,null,2);
}
function resetDraft(next){
 pause();session=null;finished=false;preview=null;placement=null;drag=null;syncMode();changed(next,null);
}
function syncMode(){
 const play=Boolean(session);$("author-tools").hidden=play;$("property-panel").hidden=play;$("play-tools").hidden=!play;$("cast-panel").hidden=!play;
 for(const id of ["template","load-template","validate","start"])$(id).disabled=play;
 $("edit").disabled=!play;$("scene-title").textContent=play?"Engine playtest":"Draft canvas";
 document.querySelector(".workspace").classList.toggle("playing",play);
}
function setPlacement(type){
 placement=type;for(const b of $("palette").querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.type===type));
 if(type)status("Place "+PALETTE.find(p=>p[0]===type)[1]+" at a grid coordinate.");
 canvas.style.cursor=type?"crosshair":"grab";
}
function line(a,b,c="#c0c6bd"){ctx.strokeStyle=c;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
const screen=(x,y)=>worldToScreen(camera,{x,y});
function drawDraft(room,metrics){
 ctx.setTransform(metrics.scaleX,0,0,metrics.scaleY,0,0);ctx.fillStyle="#34434b";ctx.fillRect(0,0,metrics.width,metrics.height);
 const a=screen(room.bounds.minX,room.bounds.maxY),b=screen(room.bounds.maxX,room.bounds.minY);
 ctx.save();ctx.beginPath();ctx.rect(a.x,a.y,b.x-a.x,b.y-a.y);ctx.clip();ctx.fillStyle="#4a615a";ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);
 const colours={terrain:"#9d9b93",hazards:"#619dae",objects:"#c5a072",shapeSockets:"#655579",deliveries:"#729cbd",plates:"#dfbc74",ladders:"#bb966c",sockets:"#e6c786",spawn:"#88d7ba",exit:"#eed6a0",checkpoints:"#85c2dc",decor:"#88ae85"};
 for(const e of itemEntries(room).sort((a,b)=>Number(["spawn","exit"].includes(a.group))-Number(["spawn","exit"].includes(b.group)))){
  const {group,id,item:o}=e,active=selection?.group===group&&selection?.id===id,bb=itemBounds(group,o),tl=screen(bb.minX,bb.maxY),br=screen(bb.maxX,bb.minY);
  ctx.beginPath();if(o.vertices){for(const [i,[x,y]] of o.vertices.entries()){const p=screen(x,y);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.closePath();}else ctx.rect(tl.x,tl.y,br.x-tl.x,br.y-tl.y);
  ctx.fillStyle=colours[group];ctx.globalAlpha=["shapeSockets","deliveries"].includes(group)?.35:.95;ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=active?3:1.2;ctx.strokeStyle=active?"#ffec9b":"#2c3339";if(["shapeSockets","deliveries"].includes(group))ctx.setLineDash([5,3]);ctx.stroke();ctx.setLineDash([]);
  if(o.fixedCentre){const h=screen(...o.fixedCentre),c=screen((bb.minX+bb.maxX)/2,(bb.minY+bb.maxY)/2);ctx.setLineDash([4,3]);line(h,c,"#fce2a4");ctx.setLineDash([]);ctx.fillStyle="#fce2a4";ctx.beginPath();ctx.arc(h.x,h.y,4,0,Math.PI*2);ctx.fill();}
  if(o.hinge){const h=screen(...o.hinge);ctx.fillStyle="#fce2a4";ctx.beginPath();ctx.arc(h.x,h.y,4,0,Math.PI*2);ctx.fill();}
  if(active&&o.vertices)for(const [x,y] of o.vertices){const p=screen(x,y);ctx.fillStyle="#ffec9b";ctx.fillRect(p.x-2.5,p.y-2.5,5,5);}
  if(active||["spawn","exit","plates","sockets","shapeSockets","deliveries","checkpoints"].includes(group)){ctx.font="600 11px system-ui";ctx.fillStyle="#fff1d2";ctx.strokeStyle="#232433";ctx.lineWidth=3;const label=group==="spawn"?"START":group==="exit"?"EXIT":id;ctx.strokeText(label,tl.x+3,tl.y-5);ctx.fillText(label,tl.x+3,tl.y-5);}
 }
 ctx.restore();
}
function draw(){
 const host=$("canvas-host").getBoundingClientRect(),m=canvasMetrics(host.width,host.height,window.devicePixelRatio||1);if(!m)return;
 if(canvas.width!==m.pixelWidth)canvas.width=m.pixelWidth;if(canvas.height!==m.pixelHeight)canvas.height=m.pixelHeight;
 const room=session?.room??draft;camera=createCamera(room.bounds,m.width,m.height);
 try{
  if(session)renderWorld(ctx,m,camera,room,art.art,session.player,true);else drawDraft(room,m);
  const plan=drawCoordinateOverlay(ctx,camera,room.bounds,{grid,axes:grid});
  if(session&&!running){drawObjectOverlay(ctx,camera,room.bounds,selectableObjects(room),$("spell-object").value,preview,{shapeSockets:room.shapeSockets??[],gridPlan:plan,axes:grid});}
 }catch(e){status("Cannot render current draft: "+message(e),"error");}
}
function coordinate(event){const r=canvas.getBoundingClientRect(),p=screenToWorld(camera,{x:(event.clientX-r.left)*camera.width/r.width,y:(event.clientY-r.top)*camera.height/r.height});return p;}
const snap=n=>Number((Math.round(n/Number($("snap").value))*Number($("snap").value)).toFixed(8));
function hit(p){
 const entries=itemEntries(draft),priority=["spawn","exit","objects","plates","sockets","shapeSockets","deliveries","ladders","checkpoints","decor","hazards","terrain"];
 for(const group of priority)for(const e of entries.filter(v=>v.group===group).reverse()){
  if(e.item.vertices){if(pointPolygonDistance([p.x,p.y],e.item.vertices)<=5/camera.scale)return e;}
  else{const b=itemBounds(group,e.item),t=6/camera.scale;if(p.x>=b.minX-t&&p.x<=b.maxX+t&&p.y>=b.minY-t&&p.y<=b.maxY+t)return e;}
 }return null;
}
canvas.addEventListener("pointerdown",e=>{
 if(session||!camera||e.button!==0)return;e.preventDefault();const p=coordinate(e);
 if(placement){try{const added=addTemplate(draft,placement,snap(p.x),snap(p.y));setPlacement(null);changed(added.room,added);}catch(err){status(message(err),"error");}return;}
 const h=hit(p);select(h?.group,h?.id);if(h){drag={id:e.pointerId,start:p,room:draft,selection:{group:h.group,id:h.id},moved:false};canvas.setPointerCapture(e.pointerId);}
});
canvas.addEventListener("pointermove",e=>{
 if(!camera)return;const p=coordinate(e);$("coords").textContent="("+snap(p.x)+", "+snap(p.y)+")";
 if(!drag||drag.id!==e.pointerId)return;
 const dx=snap(p.x-drag.start.x),dy=snap(p.y-drag.start.y);
 try{draft=moveItem(drag.room,drag.selection.group,drag.selection.id,dx,dy);drag.moved=dx!==0||dy!==0;draw();}catch(err){status(message(err),"error");}
});
canvas.addEventListener("pointerup",e=>{if(drag?.id!==e.pointerId)return;const d=drag;drag=null;if(d.moved)changed(draft,d.selection);else select(d.selection.group,d.selection.id);});
canvas.addEventListener("pointercancel",()=>{if(drag){draft=drag.room;drag=null;draw();}});
$("template").append(...LEVELS.map(l=>option(String(l.number),l.number+" · "+l.title)));
for(const [type,label] of PALETTE){const b=document.createElement("button");b.type="button";b.dataset.type=type;b.textContent="+ "+label;b.setAttribute("aria-pressed","false");b.addEventListener("click",()=>setPlacement(type));$("palette").append(b);}
$("cancel-place").onclick=()=>setPlacement(null);
$("load-template").onclick=()=>{const n=Number($("template").value);if(n){const l=LEVELS.find(v=>v.number===n);resetDraft(copyCampaignRoom(l.room));}else resetDraft(newDraft());};
$("item-list").onchange=()=>{const value=$("item-list").value,i=value.indexOf(":");select(value.slice(0,i),value.slice(i+1));};
$("apply-properties").onclick=()=>{try{if(selection)changed(replaceItem(draft,selection.group,selection.id,JSON.parse($("properties").value)));}catch(e){status(message(e),"error");}};
$("delete-item").onclick=()=>{try{if(selection)changed(removeItem(draft,selection.group,selection.id),null);}catch(e){status(message(e),"error");}};
$("refresh-json").onclick=()=>{$("room-json").value=JSON.stringify(draft,null,2);};
function importValue(text){
 if(text.length>2_000_000)throw Error("JSON exceeds 2 MB");
 const value=JSON.parse(text);
 if(value?.version===1&&value.room&&value.actions){
  const checked=verifyWorkshopBundle(value);if(!checked.ok)throw Error("Import proof failed: "+checked.message);
  resetDraft(prepareDraft(value.room));proof=copy(value);proofStatus("Imported proof replayed successfully · "+checked.result.moves+" moves · "+checked.result.ticks+" ticks","good");
  $("action-log").textContent=JSON.stringify(proof.actions,null,2);
 }else resetDraft(prepareDraft(value));
}
$("apply-json").onclick=()=>{try{importValue($("room-json").value);}catch(e){status(message(e),"error");}};
$("file").onchange=async()=>{const file=$("file").files[0];if(!file)return;try{if(file.size>2_000_000)throw Error("File exceeds 2 MB");importValue(await file.text());}catch(e){status(message(e),"error");}finally{$("file").value="";}};
$("validate").onclick=()=>{try{validateDraft(draft);status("Geometry, links, spawn and exit validated. Playtest to prove solvability.","good");}catch(e){status(message(e),"error");}};
$("grid").onclick=()=>{grid=!grid;$("grid").setAttribute("aria-pressed",String(grid));$("grid").textContent="Grid: "+(grid?"on":"off");draw();};
function pause(){
 running=false;loop.stop();input.clear();$("run").textContent="Run movement";
 if(session)updateSpellControls();
}
function clearPreview(){preview=null;$("apply-cast").disabled=true;$("cast-feedback").textContent="";draw();}
function updateSpellControls(){
 const can=Boolean(session&&!running&&!session.player.completed&&!session.player.blockedRespawn);
 for(const id of ["spell-object","spell-type","preview","step","ticks","step-move","step-climb","step-jump"])$(id).disabled=!can;
 $("apply-cast").disabled=!can||!preview?.ok;
 $("undo").disabled=running||!session||session.player.completed;
 $("recover").disabled=running||!session||session.player.completed;
 $("run").disabled=!session||session.player.completed||session.player.blockedRespawn;
}
function updateAttempt(log=true){
 if(!session)return;const s=session.summary();$("attempt").textContent=s.moves+" moves · "+s.undos+" undos · "+s.respawns+" returns · "+s.ticks+" ticks";
 if(log)$("action-log").textContent=JSON.stringify(session.actions,null,2);
 if(session.player.blockedRespawn)status("No safe return point. Undo or restart.","error");
}
function refreshSpells(keep=$("spell-object").value){
 const objects=selectableObjects(session.room);$("spell-object").replaceChildren(option("","Choose object…"),...objects.map(o=>option(o.id,o.label??o.id)));
 if(objects.some(o=>o.id===keep))$("spell-object").value=keep;else if(objects.length)$("spell-object").value=objects[0].id;
 refreshTypes();
}
function refreshTypes(){
 const o=session.room.objects.find(o=>o.id===$("spell-object").value),keep=$("spell-type").value;
 $("spell-type").replaceChildren(option("","Choose spell…"),...(o?.permissions??[]).map(t=>option(t,{translate:"Translation",rotate:"Rotation",enlarge:"Enlargement",reflect:"Reflection"}[t])));
 if(o?.permissions.includes(keep))$("spell-type").value=keep;else if(o?.permissions.length===1)$("spell-type").value=o.permissions[0];
 const slot=session.room.shapeSockets?.find(s=>s.objectId===o?.id)??session.room.deliveries?.find(s=>s.objectId===o?.id);
 $("references").textContent=o?referencePoints(o).map(p=>p.id+" ("+p.point.join(", ")+")").join(" · ")+(slot?" · Target "+slot.vertices.map((p,i)=>"S"+(i+1)+" ("+p.join(", ")+")").join(" · "):""):"";
 refreshFields();
}
function refreshFields(){
 const t=$("spell-type").value,fields={translate:[["dx","Horizontal"],["dy","Vertical"]],rotate:[["angle","Angle"],["direction","Direction"],["cx","Centre x"],["cy","Centre y"]],enlarge:[["factor","Scale factor"],["cx","Centre x"],["cy","Centre y"]],reflect:[["line","Mirror line"]]}[t]??[];
 $("spell-fields").replaceChildren(...fields.map(([name,label])=>{
  const l=document.createElement("label");l.textContent=label;
  let el;if(name==="angle"||name==="direction"){el=document.createElement("select");el.append(...(name==="angle"?["90","180","270"]:["clockwise","anticlockwise"]).map(v=>option(v,v)));}else{el=document.createElement("input");el.type="text";el.required=true;el.autocomplete="off";}
  el.name=name;l.append(el);return l;
 }));clearPreview();updateSpellControls();
}
const parameters=()=>Object.fromEntries(new FormData($("spell-form")));
$("spell-object").onchange=refreshTypes;$("spell-type").onchange=refreshFields;$("spell-fields").oninput=clearPreview;$("spell-fields").onchange=clearPreview;
$("spell-form").onsubmit=e=>{e.preventDefault();if(!session||running)return;preview=session.preview($("spell-type").value,$("spell-object").value,parameters());$("cast-feedback").textContent=preview.message+(preview.mechanismEffects?.length?" · "+preview.mechanismEffects.join(" "):"");updateSpellControls();draw();};
$("apply-cast").onclick=()=>{if(!session||running||!preview?.ok)return;const r=session.cast($("spell-type").value,$("spell-object").value,parameters());const text=r.message??r.code;if(r.ok){refreshSpells();updateAttempt();status("Committed transformation. Continue playtest.","good");}else clearPreview();$("cast-feedback").textContent=text;draw();};
function start(){
 try{pause();const next=createWorkshopSession(draft);session=next;finished=false;invalidate();preview=null;syncMode();refreshSpells();updateAttempt();status("Playtest started — paused for mathematical inspection.","good");draw();}catch(e){status(message(e),"error");}
}
$("start").onclick=start;$("restart").onclick=start;
$("edit").onclick=()=>{pause();session=null;finished=false;preview=null;syncMode();select(selection?.group,selection?.id);status(proof?"Original draft restored. Editing will invalidate proof.":"Original draft restored.");};
$("run").onclick=()=>{if(!session)return;if(running){pause();updateAttempt();draw();}else{clearPreview();running=true;$("run").textContent="Pause movement";updateSpellControls();canvas.focus({preventScroll:true});loop.start();}};
$("step").onclick=()=>{if(!session||running)return;const n=Number($("ticks").value);if(!Number.isInteger(n)||n<1||n>1200){status("Enter 1–1200 ticks","error");return;}clearPreview();for(let i=0;i<n;i++){const r=session.step({move:Number($("step-move").value),climb:Number($("step-climb").value),jump:i===0&&$("step-jump").checked});if(!r.ok){status(r.message,"error");break;}if(session.player.completed||session.player.blockedRespawn)break;}$("step-jump").checked=false;updateAttempt();updateSpellControls();draw();if(session.player.completed)finish();};
$("undo").onclick=()=>{if(session&&!running){const r=session.undo();status(r.ok?"Cast undone; the committed move still counts.":r.message,r.ok?"good":"error");refreshSpells();updateAttempt();draw();}};
$("recover").onclick=()=>{if(session&&!running){const r=session.recover();clearPreview();status(r.recovered?"Returned safely.":"No safe return point. Undo or restart.",r.recovered?"good":"error");updateAttempt();updateSpellControls();draw();}};
function finish(){
 if(finished)return;finished=true;pause();updateAttempt();
 try{proof=session.bundle();const s=proof.result;proofStatus("VERIFIED · "+s.moves+" moves · "+s.respawns+" returns · "+s.ticks+" ticks. Independent replay reached the portal.","good");status("Playtest complete. Verified export available.","good");}catch(e){proof=null;proofStatus(message(e),"error");}
}
$("verify").onclick=()=>{if(proof){const r=verifyWorkshopBundle(proof);proofStatus(r.ok?"VERIFIED · independent replay reached the portal in "+r.result.ticks+" ticks.":r.message,r.ok?"good":"error");if(!r.ok){proof=null;proofStatus(r.message,"error");}}};
$("download").onclick=()=>{if(!proof)return;const checked=verifyWorkshopBundle(proof);if(!checked.ok){proof=null;proofStatus(checked.message,"error");return;}const href=URL.createObjectURL(new Blob([JSON.stringify(proof,null,2)+"\n"],{type:"application/json"})),a=document.createElement("a");a.href=href;a.download=proof.room.id.replace(/[^a-zA-Z0-9_-]/g,"-")+".verified.json";a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);};
$("copy-bundle").onclick=()=>{if(proof){const text=JSON.stringify(proof,null,2);if(session)$("edit").click();$("room-json").value=text;$("room-json").closest("details").open=true;}};
window.addEventListener("resize",draw);new ResizeObserver(draw).observe($("canvas-host"));
document.addEventListener("visibilitychange",()=>{if(document.hidden&&running)pause();});
syncMode();select(null,null);$("room-json").value=JSON.stringify(draft,null,2);invalidate();draw();
