import test from "node:test";
import assert from "node:assert/strict";
import {mountRoomPreview} from "../src/ui/room-preview.js";
import {worldToScreen} from "../src/rendering/camera.js";
function node(tag="div"){
 const listeners=new Map(),attributes={};
 return {tag,listeners,attributes,children:[],dataset:{},style:{},value:"",hidden:false,disabled:false,
  setAttribute(k,v){attributes[k]=v},append(...items){this.children.push(...items)},replaceChildren(...items){this.children=items},
  querySelectorAll(){return this.children.flatMap(c=>c.tag==="input"||c.tag==="select"?[c]:c.querySelectorAll())},
  addEventListener(k,v){listeners.set(k,v)},removeEventListener(k,v){if(listeners.get(k)===v)listeners.delete(k)},
  fire(k,event={}){listeners.get(k)?.({preventDefault(){},...event})},focus(){}};
}
function fixture(reduce){
 const ids="room-canvas room-stage room-status play-status room-heading room-chapter movement-controls camera-overview camera-inspect camera-left camera-right camera-up camera-down camera-zoom-in camera-zoom-out grid-toggle axes-toggle pick-toggle coordinate-panel coordinate-snap coordinate-x coordinate-y coordinate-form coordinate-result coordinate-clear object-panel object-toggle object-select object-spell object-form object-fields object-result object-references object-permissions object-close object-clear object-apply object-preview-note tutorial-tools tutorial-guide tutorial-hint tutorial-moves reset-practice undo-cast return-safety recovery-count".split(" ");
 const els=Object.fromEntries(ids.map(id=>[id,node()])),rect={left:0,top:0,width:1000,height:500};
 const ctx={save(){},restore(){},setTransform(){},createLinearGradient(){return{addColorStop(){}}},createRadialGradient(){return{addColorStop(){}}},
 fillRect(){},drawImage(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},clip(){},rect(){},translate(){},rotate(){},ellipse(){},arc(){},strokeRect(){},quadraticCurveTo(){},strokeText(){},fillText(){},measureText(s){return{width:s.length*7}},setLineDash(){}};
 els["room-canvas"].getContext=()=>ctx;els["room-canvas"].getBoundingClientRect=()=>rect;els["room-stage"].getBoundingClientRect=()=>rect;
 const view=node();view.Image=class{};view.devicePixelRatio=1;view.matchMedia=()=>({matches:reduce});
 let time=0,id=0;const callbacks=new Map();
 view.requestAnimationFrame=fn=>{callbacks.set(++id,fn);return id};view.cancelAnimationFrame=i=>callbacks.delete(i);
 function frame(n=1){for(let i=0;i<n;i++){time+=1000/60;for(const [key,fn] of [...callbacks]){callbacks.delete(key);fn(time);}}}
 const document={...node(),getElementById:id=>els[id],createElement:tag=>node(tag),querySelectorAll:()=>[]};
 const controller=mountRoomPreview(document,view);
 return {els,view,controller,frame};
}
test("first tutorial selection, actual Apply, animation locks, reset, and separate practice",()=>{
 for(const reduce of [false,true]){
  const {els,view,controller:c,frame}=fixture(reduce),click=id=>els[id].fire("click");
  c.setLevel("level1");c.setActive(true);assert.equal(c.room.id,"gatehouse-01");assert.equal(els["tutorial-tools"].hidden,false);
  assert.match(els["tutorial-guide"].textContent,/bridge the brook/);
  click("tutorial-hint");click("tutorial-hint");assert.match(els["tutorial-guide"].textContent,/3, 3/);
  click("object-toggle");const p=worldToScreen(c.getCamera(),{x:5,y:3.2});
  els["room-canvas"].fire("click",{clientX:p.x,clientY:p.y});
  assert.equal(c.inspector.getState().selected,"brook-beam");
  els["object-spell"].value="translate";els["object-spell"].fire("change");
  const fields=els["object-fields"].querySelectorAll(),dx=fields.find(x=>x.name==="dx"),dy=fields.find(x=>x.name==="dy");
  dx.value="12";dy.value="1";els["object-form"].fire("submit");assert.equal(els["object-apply"].disabled,true);
  click("object-apply");assert.equal(c.getRecords().length,0);
  dy.value="0";els["object-form"].fire("submit");assert.equal(els["object-apply"].disabled,false);
  dx.value="13";click("object-apply");assert.equal(c.getRecords().length,0);assert.equal(c.inspector.getState().preview.request.dx,13);
  dx.value="12";els["object-fields"].fire("input");assert.equal(els["object-apply"].disabled,true);
  els["object-form"].fire("submit");click("object-apply");
  assert.equal(c.getRecords().length,1);assert.equal(c.room.objects[0].vertices[0][0],15);assert.equal(els["object-panel"].hidden,true);
  assert.equal(els["object-toggle"].disabled,!reduce);
  if(!reduce){assert.equal(c.setObjectMode(true),false);assert.equal(c.setPicking(true),false);}
  frame(45);assert.equal(els["object-toggle"].disabled,false);assert.equal(c.getPlayer().x,1.5);
  assert.equal(els["tutorial-moves"].textContent,"Moves: 1");
  click("reset-practice");assert.equal(c.room.objects[0].vertices[0][0],3);assert.equal(c.getRecords().length,0);assert.equal(c.getPlayer().completed,false);
  c.setActive(false);c.setLevel("room");assert.equal(c.room.id,"gatehouse-movement-preview");assert.equal(els["tutorial-tools"].hidden,true);
  c.setActive(true);click("object-toggle");c.inspector.selectObject("beam");c.inspector.selectType("translate");c.inspector.showPreview({dx:14,dy:-3.65});
  assert.equal(els["object-apply"].hidden,true);c.destroy();
 }
});

test("second tutorial validates angle, direction and exact centre; applies, animates and traverses",()=>{
 for(const reduce of [false,true]){
  const {els,view,controller:c,frame}=fixture(reduce),click=id=>els[id].fire("click");
  c.setLevel("level2");c.setActive(true);assert.equal(c.room.id,"gatehouse-02");
  assert.match(els["room-chapter"].textContent,/Level 2.*Rotation/);
  assert.match(els["tutorial-guide"].textContent,/open the gate/);
  click("tutorial-hint");click("tutorial-hint");assert.match(els["tutorial-guide"].textContent,/14, 8/);
  click("object-toggle");const p=worldToScreen(c.getCamera(),{x:14.25,y:5});
  els["room-canvas"].fire("click",{clientX:p.x,clientY:p.y});
  assert.equal(c.inspector.getState().selected,"stubborn-gate");assert.equal(c.inspector.selectType("translate"),false);
  els["object-spell"].value="rotate";els["object-spell"].fire("change");
  const fields=Object.fromEntries(els["object-fields"].querySelectorAll().map(x=>[x.name,x]));
  fields.angle.value="90";fields.direction.value="anticlockwise";fields.cx.value="14";fields.cy.value="7";
  els["object-form"].fire("submit");assert.equal(c.inspector.getState().preview.code,"hinge");assert.equal(els["object-apply"].disabled,true);
  fields.cy.value="8";fields.direction.value="clockwise";els["object-form"].fire("submit");
  assert.equal(c.inspector.getState().preview.code,"path-solid");assert.equal(els["object-apply"].disabled,true);
  click("object-apply");assert.equal(c.getRecords().length,0);
  fields.direction.value="anticlockwise";els["object-form"].fire("submit");assert.equal(els["object-apply"].disabled,false);
  assert.equal(els["object-apply"].textContent,"Apply rotation");
  fields.angle.value="270";click("object-apply");assert.equal(c.getRecords().length,0);assert.equal(els["object-apply"].disabled,true);
  fields.angle.value="90";els["object-form"].fire("submit");click("object-apply");
  assert.equal(c.getRecords().length,1);assert.deepEqual(c.getRecords()[0],{objectId:"stubborn-gate",type:"rotate",angle:90,direction:"anticlockwise",centre:[14,8]});
  assert.deepEqual(c.room.objects[0].vertices[0],[19,8]);assert.equal(els["object-panel"].hidden,true);
  assert.equal(els["object-toggle"].disabled,!reduce);
  if(!reduce){assert.equal(c.setObjectMode(true),false);assert.equal(c.setPicking(true),false);}
  frame(50);assert.equal(els["object-toggle"].disabled,false);assert.equal(c.getPlayer().x,2);
  view.fire("keydown",{code:"ArrowRight"});frame(300);view.fire("keyup",{code:"ArrowRight"});
  assert.equal(c.getPlayer().completed,true);assert.equal(c.getPlayer().respawns,0);
  assert.match(els["tutorial-guide"].textContent,/using 1 rotation/);
  click("reset-practice");assert.deepEqual(c.room.objects[0].vertices[0],[14,3]);assert.equal(c.getRecords().length,0);assert.equal(c.getPlayer().completed,false);
  c.setLevel("level1");assert.equal(c.room.id,"gatehouse-01");assert.match(els["room-chapter"].textContent,/Level 1.*Translation/);
  c.setLevel("room");assert.equal(els["tutorial-tools"].hidden,true);click("object-toggle");c.inspector.selectObject("gate");c.inspector.selectType("rotate");
  c.inspector.showPreview({angle:90,direction:"anticlockwise",cx:31.2,cy:6});assert.equal(els["object-apply"].hidden,true);
  c.destroy();
 }
});

test("third tutorial requires explicit positive factor and centre, previews, applies and traverses",()=>{
 for(const reduce of [false,true]){
  const {els,view,controller:c,frame}=fixture(reduce),click=id=>els[id].fire("click");
  c.setLevel("level3");c.setActive(true);assert.equal(c.room.id,"gatehouse-03");
  assert.match(els["room-chapter"].textContent,/Level 3.*Enlargement/);
  assert.match(els["tutorial-guide"].textContent,/high ledge/);
  click("tutorial-hint");click("tutorial-hint");assert.match(els["tutorial-guide"].textContent,/3 units high/);
  click("object-toggle");const p=worldToScreen(c.getCamera(),{x:24,y:4});
  els["room-canvas"].fire("click",{clientX:p.x,clientY:p.y});
  assert.equal(c.inspector.getState().selected,"cheesy-wedge");assert.equal(c.inspector.selectType("rotate"),false);
  els["object-spell"].value="enlarge";els["object-spell"].fire("change");
  const fields=Object.fromEntries(els["object-fields"].querySelectorAll().map(x=>[x.name,x]));
  fields.factor.value="3";fields.cx.value="25";fields.cy.value="";
  els["object-form"].fire("submit");assert.equal(c.inspector.getState().preview.code,"parameters");assert.equal(els["object-apply"].disabled,true);
  fields.cy.value="3";fields.factor.value="4";els["object-form"].fire("submit");
  assert.equal(c.inspector.getState().preview.code,"scale-limit");assert.equal(els["object-apply"].disabled,true);
  fields.factor.value="3";els["object-form"].fire("submit");assert.equal(els["object-apply"].disabled,false);
  assert.equal(els["object-apply"].textContent,"Apply enlargement");
  fields.factor.value="2";click("object-apply");assert.equal(c.getRecords().length,0);assert.equal(c.inspector.getState().preview.request.factor,2);
  fields.factor.value="3";els["object-fields"].fire("input");assert.equal(els["object-apply"].disabled,true);
  els["object-form"].fire("submit");click("object-apply");
  assert.deepEqual(c.getRecords(),[{objectId:"cheesy-wedge",type:"enlarge",factor:3,centre:[25,3]}]);
  assert.deepEqual(c.room.objects[0].vertices,[[7,3],[25,3],[25,12]]);
  assert.equal(els["object-toggle"].disabled,!reduce);
  if(!reduce){assert.equal(c.setObjectMode(true),false);assert.equal(c.setPicking(true),false);}
  frame(55);assert.equal(els["object-toggle"].disabled,false);assert.equal(c.getPlayer().x,2);
  view.fire("keydown",{code:"ArrowRight"});frame(460);view.fire("keyup",{code:"ArrowRight"});
  assert.equal(c.getPlayer().completed,true);assert.equal(c.getPlayer().respawns,0);
  assert.match(els["tutorial-guide"].textContent,/using 1 enlargement/);
  click("reset-practice");assert.deepEqual(c.room.objects[0].vertices,[[19,3],[25,3],[25,6]]);assert.equal(c.getRecords().length,0);assert.equal(c.getPlayer().completed,false);
  c.setLevel("level2");assert.match(els["room-chapter"].textContent,/Level 2.*Rotation/);
  c.setLevel("room");click("object-toggle");c.inspector.selectObject("wedge");c.inspector.selectType("enlarge");
  c.inspector.showPreview({factor:1.5,cx:4,cy:3});assert.equal(els["object-apply"].hidden,true);c.destroy();
 }
});

test("fourth tutorial validates mirror equation, commits a magical transfer and completes two jumps",()=>{
 for(const reduce of [false,true]){
  const {els,view,controller:c,frame}=fixture(reduce),click=id=>els[id].fire("click");
  c.setLevel("level4");c.setActive(true);assert.equal(c.room.id,"gatehouse-04");
  assert.match(els["room-chapter"].textContent,/Level 4.*Reflection/);
  assert.match(els["tutorial-guide"].textContent,/rescue the barrel/);
  click("tutorial-hint");click("tutorial-hint");assert.match(els["tutorial-guide"].textContent,/midpoint/);
  click("object-toggle");const p=worldToScreen(c.getCamera(),{x:4.5,y:4.2});
  els["room-canvas"].fire("click",{clientX:p.x,clientY:p.y});
  assert.equal(c.inspector.getState().selected,"missing-barrel");assert.equal(c.inspector.selectType("translate"),false);
  els["object-spell"].value="reflect";els["object-spell"].fire("change");
  const field=els["object-fields"].querySelectorAll().find(x=>x.name==="line");
  field.value="x=2x";els["object-form"].fire("submit");assert.equal(c.inspector.getState().preview.code,"parameters");
  assert.equal(els["object-apply"].disabled,true);
  field.value="x=6";els["object-form"].fire("submit");assert.equal(c.inspector.getState().preview.code,"solid-overlap");
  assert.equal(els["object-apply"].disabled,true);
  field.value="x = 15";els["object-form"].fire("submit");assert.equal(els["object-apply"].disabled,false);
  assert.equal(els["object-apply"].textContent,"Apply reflection");
  field.value="x=14.5";click("object-apply");assert.equal(c.getRecords().length,0);
  assert.equal(c.inspector.getState().preview.request.line.value,14.5);
  field.value="x=15";els["object-fields"].fire("input");assert.equal(els["object-apply"].disabled,true);
  els["object-form"].fire("submit");click("object-apply");
  assert.deepEqual(c.getRecords(),[{objectId:"missing-barrel",type:"reflect",line:"x = 15"}]);
  assert.deepEqual(c.room.objects[0].vertices,[[27,5.5],[24,5.5],[24,3],[27,3]]);
  assert.deepEqual(c.room.objects[0].vertexIds,["D","C","B","A"]);
  assert.equal(els["object-toggle"].disabled,!reduce);
  if(!reduce){assert.equal(c.setObjectMode(true),false);assert.equal(c.setPicking(true),false);}
  frame(55);assert.equal(els["object-toggle"].disabled,false);assert.equal(c.getPlayer().x,10);
  // Each animation frame advances two physics ticks after the initial frame.
  // An exact odd-tick approach isn't necessary: the jump window is forgiving.
  const down=code=>view.fire("keydown",{code}),up=code=>view.fire("keyup",{code});
  down("ArrowRight");frame(88);down("Space");frame(30);up("Space");up("ArrowRight");frame(20);
  assert.equal(c.getPlayer().grounded,true);assert.ok(Math.abs(c.getPlayer().y-5.5)<.04);
  down("ArrowRight");down("Space");frame(28);up("Space");frame(72);up("ArrowRight");
  assert.equal(c.getPlayer().completed,true);assert.equal(c.getPlayer().respawns,0);
  assert.match(els["tutorial-guide"].textContent,/using 1 reflection/);
  click("reset-practice");assert.deepEqual(c.room.objects[0].vertices,[[3,3],[6,3],[6,5.5],[3,5.5]]);
  assert.equal(c.room.objects[0].vertexIds,undefined);assert.equal(c.getRecords().length,0);
  c.setLevel("level3");assert.match(els["room-chapter"].textContent,/Level 3.*Enlargement/);
  c.setLevel("room");click("object-toggle");c.inspector.selectObject("wedge");c.inspector.selectType("reflect");
  c.inspector.showPreview({line:"x=5.2"});assert.equal(els["object-apply"].hidden,true);
  c.destroy();
 }
});

function cast(f,id,type,raw){
 const {els,controller:c}=f;
 if(!c.inspector.getState().active)els["object-toggle"].fire("click");
 assert.equal(c.inspector.selectObject(id),true);
 assert.equal(c.inspector.selectType(type),true);
 for(const field of els["object-fields"].querySelectorAll())field.value=String(raw[field.name]??"");
 els["object-form"].fire("submit");
 const preview=c.inspector.getState().preview;
 if(preview.ok)els["object-apply"].fire("click");
 return preview;
}
test("undo in all four tutorials restores exact geometry and stable reference IDs; move stays charged",()=>{
 const cases=[
  ["level1","brook-beam","translate",{dx:12,dy:0}],
  ["level2","stubborn-gate","rotate",{angle:90,direction:"anticlockwise",cx:14,cy:8}],
  ["level3","cheesy-wedge","enlarge",{factor:3,cx:25,cy:3}],
  ["level4","missing-barrel","reflect",{line:"x=15"}]
 ];
 for(const [level,id,type,raw] of cases){
  const f=fixture(true),{controller:c,els}=f;
  c.setLevel(level);c.setActive(true);
  const original=c.room,spawn=c.getPlayer();
  assert.equal(els["undo-cast"].disabled,true);
  assert.equal(cast(f,id,type,raw).ok,true);assert.notEqual(c.room,original);
  assert.equal(els["undo-cast"].disabled,false);
  // A stale inspection preview must disappear on undo.
  c.setObjectMode(true);c.inspector.selectObject(id);c.inspector.selectType(type);c.inspector.showPreview(raw);
  els["undo-cast"].fire("click");
  assert.equal(c.room,original);assert.equal(c.getPlayer().x,spawn.x);assert.equal(c.getPlayer().y,spawn.y);
  assert.equal(c.inspector.getState().preview,null);assert.equal(els["object-panel"].hidden,true);
  assert.equal(c.getAttemptSummary().moves,1);assert.equal(c.getAttemptSummary().undos,1);assert.equal(c.getAttemptSummary().activeMoves,0);
  assert.equal(c.getAttemptSummary().entries[0].undone,true);assert.equal(c.getRecords().length,1);
  assert.equal(els["tutorial-moves"].textContent,"Moves: 1");assert.match(els["play-status"].textContent,/still counts/);
  assert.equal(els["undo-cast"].disabled,true);assert.equal(c.undoCast(),false);
  assert.equal(cast(f,id,type,raw).ok,true);assert.equal(c.getAttemptSummary().moves,2);
  els["reset-practice"].fire("click");
  assert.equal(c.room,original);assert.deepEqual(c.getAttemptSummary(),{moves:0,undos:0,activeMoves:0,respawns:0,entries:[]});
  c.destroy();
 }
});
test("manual return keeps transformations, invalid preview is free, multiple undos are LIFO",()=>{
 const f=fixture(true),{controller:c,els,view,frame}=f;
 c.setLevel("level1");c.setActive(true);
 const initial=c.room;
 assert.equal(cast(f,"brook-beam","translate",{dx:2,dy:0}).ok,true);
 const intermediate=c.room;
 assert.equal(cast(f,"brook-beam","translate",{dx:10,dy:0}).ok,true);
 const bridged=c.room;
 view.fire("keydown",{code:"ArrowRight"});frame(30);
 assert.ok(c.getPlayer().x>1.5);
 els["return-safety"].fire("click");
 assert.equal(c.room,bridged);assert.equal(c.getPlayer().x,1.5);assert.equal(c.getAttemptSummary().respawns,1);
 frame(20);assert.equal(c.getPlayer().x,1.5); // held key was cleared
 assert.equal(cast(f,"brook-beam","translate",{dx:100,dy:0}).ok,false);
 assert.match(els["object-result"].textContent,/No move used/);
 assert.equal(c.getAttemptSummary().moves,2);assert.equal(c.room,bridged);
 assert.equal(c.undoCast(),true);assert.equal(c.room,intermediate);
 assert.equal(c.undoCast(),true);assert.equal(c.room,initial);
 assert.deepEqual(c.getAttemptSummary().entries.map(e=>e.undone),[true,true]);
 assert.equal(c.getAttemptSummary().respawns,1);assert.equal(c.getAttemptSummary().moves,2);
 assert.equal(c.undoCast(),false);
 c.setLevel("room");assert.equal(c.getAttemptSummary().moves,0);assert.equal(els["undo-cast"].disabled,true);
 assert.equal(c.recoverPlayer(),true);assert.equal(c.getAttemptSummary().respawns,1);
 c.destroy();
});
test("recovery controls lock during animation; reset cancels animation and clears history",()=>{
 const f=fixture(false),{controller:c,els,frame}=f;
 c.setLevel("level3");c.setActive(true);
 assert.equal(cast(f,"cheesy-wedge","enlarge",{factor:3,cx:25,cy:3}).ok,true);
 assert.equal(els["undo-cast"].disabled,true);assert.equal(els["return-safety"].disabled,true);
 assert.equal(c.undoCast(),false);assert.equal(c.recoverPlayer(),false);
 els["reset-practice"].fire("click");frame(70);
 assert.equal(c.getAttemptSummary().moves,0);assert.equal(c.room.objects[0].vertices[0][0],19);
 assert.equal(els["object-toggle"].disabled,false);assert.equal(els["return-safety"].disabled,false);
 c.destroy();
});
test("after portal completion, undo and return cannot alter the finished result",()=>{
 const f=fixture(true),{controller:c,els,view,frame}=f;c.setLevel("level2");c.setActive(true);
 assert.equal(cast(f,"stubborn-gate","rotate",{angle:90,direction:"anticlockwise",cx:14,cy:8}).ok,true);
 view.fire("keydown",{code:"ArrowRight"});frame(300);view.fire("keyup",{code:"ArrowRight"});
 assert.equal(c.getPlayer().completed,true);
 assert.equal(els["undo-cast"].disabled,true);assert.equal(els["return-safety"].disabled,true);
 assert.equal(c.undoCast(),false);assert.equal(c.recoverPlayer(),false);assert.equal(c.getAttemptSummary().moves,1);
 c.destroy();
});
