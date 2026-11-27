import test from "node:test";
import assert from "node:assert/strict";
import {mountRoomPreview} from "../src/ui/room-preview.js";
import {startApp} from "../src/main.js";
import {worldToScreen} from "../src/rendering/camera.js";
function node(tag="div"){
 const listeners=new Map(),attributes={};
 return {tag,listeners,attributes,children:[],dataset:{},style:{setProperty(k,v){attributes[k]=v}},value:"",hidden:false,disabled:false,
  setAttribute(k,v){attributes[k]=v},append(...items){this.children.push(...items)},replaceChildren(...items){this.children=items},
  querySelectorAll(){return this.children.flatMap(c=>c.tag==="input"||c.tag==="select"?[c]:c.querySelectorAll())},
  addEventListener(k,v){listeners.set(k,v)},removeEventListener(k,v){if(listeners.get(k)===v)listeners.delete(k)},
  fire(k,event={}){listeners.get(k)?.({preventDefault(){},...event})},focus(){this.focused=true}};
}
function fixture(reduce,withApp=false){
 const ids="room-canvas room-stage room-status room-tools-toggle room-secondary-tools climb-controls coordinate-close play-status room-heading room-chapter movement-controls camera-overview camera-inspect camera-left camera-right camera-up camera-down camera-zoom-in camera-zoom-out grid-toggle axes-toggle pick-toggle coordinate-panel coordinate-snap coordinate-x coordinate-y coordinate-form coordinate-result coordinate-clear object-panel object-toggle object-select object-spell object-form object-fields object-result object-references object-permissions object-close object-clear object-apply object-preview-note tutorial-tools tutorial-guide tutorial-hint tutorial-guidance-toggle tutorial-hint-panel tutorial-hint-title tutorial-hint-text tutorial-hint-previous tutorial-hint-next tutorial-hint-close tutorial-moves reset-practice undo-cast return-safety recovery-count world app-status title-view spellbook-view title-art room-view spell-name spell-description spell-example spell-image spell-detail translation-vector open-spellbook close-spellbook spellbook-heading open-room open-level1 open-level2 open-level3 open-level4 close-room results-view results-heading results-level results-stars results-message results-stats results-thresholds results-best results-history results-empty results-replay results-next results-title".split(" ");
 const els=Object.fromEntries(ids.map(id=>[id,node()])),rect={left:0,top:0,width:1000,height:500};
 const ctx={save(){},restore(){},setTransform(){},createLinearGradient(){return{addColorStop(){}}},createRadialGradient(){return{addColorStop(){}}},
 fillRect(){},drawImage(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},clip(){},rect(){},translate(){},rotate(){},ellipse(){},arc(){},strokeRect(){},quadraticCurveTo(){},strokeText(){},fillText(){},measureText(s){return{width:s.length*7}},setLineDash(){}};
 els["room-canvas"].getContext=()=>ctx;els["room-canvas"].getBoundingClientRect=()=>rect;els["room-stage"].getBoundingClientRect=()=>rect;
 const view=node();view.Image=class{};view.devicePixelRatio=1;view.matchMedia=()=>({matches:reduce});
 let time=0,id=0;const callbacks=new Map();
 view.requestAnimationFrame=fn=>{callbacks.set(++id,fn);return id};view.cancelAnimationFrame=i=>callbacks.delete(i);
 function frame(n=1){for(let i=0;i<n;i++){time+=1000/60;for(const [key,fn] of [...callbacks]){callbacks.delete(key);fn(time);}}}
 const document={...node(),getElementById:id=>els[id],createElement:tag=>node(tag),querySelector:()=>els["room-stage"],querySelectorAll:()=>[]};
 els.world.getContext=()=>ctx;els["results-view"].hidden=true;els["room-view"].hidden=true;els["spellbook-view"].hidden=true;
 const saved=new Map();view.localStorage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)};
 const app=withApp?startApp(document,view):null;
 const controller=app?.room??mountRoomPreview(document,view);
 return {els,view,controller,frame,app,saved};
}
test("first tutorial selection, actual Apply, animation locks, reset, and separate practice",()=>{
 for(const reduce of [false,true]){
  const {els,view,controller:c,frame}=fixture(reduce),click=id=>els[id].fire("click");
  c.setLevel("level1");c.setActive(true);assert.equal(c.room.id,"gatehouse-01");assert.equal(els["tutorial-tools"].hidden,false);
  assert.match(els["tutorial-guide"].textContent,/bridge the brook/);
  click("tutorial-hint");for(let i=0;i<3;i++)click("tutorial-hint-next");assert.match(els["tutorial-hint-text"].textContent,/3, 3/);click("tutorial-hint-close");
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
  click("tutorial-hint");for(let i=0;i<3;i++)click("tutorial-hint-next");assert.match(els["tutorial-hint-text"].textContent,/14, 8/);click("tutorial-hint-close");
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
  click("tutorial-hint");for(let i=0;i<3;i++)click("tutorial-hint-next");assert.match(els["tutorial-hint-text"].textContent,/3 units high/);click("tutorial-hint-close");
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
  click("tutorial-hint");for(let i=0;i<3;i++)click("tutorial-hint-next");assert.match(els["tutorial-hint-text"].textContent,/midpoint/);click("tutorial-hint-close");
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

test("actual completion routes to results once, replay and next level start clean attempts; best survives",()=>{
 const f=fixture(true,true),{controller:c,els,view,frame,app}=f;
 const click=id=>els[id].fire("click");
 const raw={angle:90,direction:"anticlockwise",cx:14,cy:8};
 const openGate=()=>assert.equal(cast(f,"stubborn-gate","rotate",raw).ok,true);
 const walk=()=>{view.fire("keydown",{code:"ArrowRight"});frame(300);view.fire("keyup",{code:"ArrowRight"});};
 click("open-level2");assert.equal(app.state.view,"level2");assert.equal(c.getResult(),null);
 openGate();assert.equal(c.undoCast(),true);openGate();
 assert.equal(c.getResult(),null);assert.equal(app.bestResults.get("gatehouse-02"),null);
 walk();
 assert.equal(c.getPlayer().completed,true);assert.equal(app.state.view,"results");
 assert.equal(app.state.playable,false);assert.equal(els["room-view"].hidden,true);assert.equal(els["results-view"].hidden,false);
 assert.equal(els["results-heading"].focused,true);
 const result=c.getResult();assert.equal(result,app.results.getResult());
 assert.equal(result.stars,2);assert.equal(result.moves,2);assert.equal(result.undos,1);
 assert.equal(result.entries[0].undone,true);assert.equal(result.entries[1].undone,false);
 assert.equal(els["results-stars"].attributes["aria-label"],"2 out of 3 stars");
 assert.equal(els["results-history"].children.length,2);
 assert.match(els["results-history"].children[0].children[2].textContent,/Undone/);
 assert.deepEqual(app.bestResults.get("gatehouse-02"),{moves:2,stars:2});
 frame(100);assert.equal(c.getResult(),result);
 click("results-replay");assert.equal(app.state.view,"level2");assert.equal(els["results-view"].hidden,true);
 assert.equal(c.getResult(),null);assert.equal(c.getAttemptSummary().moves,0);
 assert.equal(c.getPlayer().completed,false);assert.equal(app.results.getResult(),null);
 assert.deepEqual(app.bestResults.get("gatehouse-02"),{moves:2,stars:2});
 openGate();walk();assert.equal(c.getResult().stars,3);assert.deepEqual(app.bestResults.get("gatehouse-02"),{moves:1,stars:3});
 click("results-next");assert.equal(app.state.view,"level3");assert.equal(c.room.id,"gatehouse-03");assert.equal(c.getResult(),null);assert.equal(c.getAttemptSummary().moves,0);
 click("close-room");assert.equal(app.state.view,"title");assert.equal(app.bestResults.get("gatehouse-03"),null);
 c.destroy();app.identity.destroy();app.results.destroy();app.viewport.destroy();
});
test("Level 4 continues into the Enchanted Gardens",()=>{
 const f=fixture(true,true),{controller:c,els,view,frame,app}=f;
 els["open-level4"].fire("click");
 assert.equal(cast(f,"missing-barrel","reflect",{line:"x=15"}).ok,true);
 const down=code=>view.fire("keydown",{code}),up=code=>view.fire("keyup",{code});
 frame(2);down("ArrowRight");frame(88);down("Space");frame(30);up("Space");up("ArrowRight");frame(20);
 down("ArrowRight");down("Space");frame(28);up("Space");frame(72);up("ArrowRight");
 assert.equal(app.state.view,"results");assert.equal(c.getResult().stars,3);
 assert.equal(els["results-next"].hidden,false);assert.equal(els["results-next"].disabled,false);
 els["results-next"].fire("click");assert.equal(app.state.view,"level5");assert.equal(c.room.id,"gardens-05");assert.equal(c.getAttemptSummary().moves,0);
 c.destroy();app.identity.destroy();app.results.destroy();app.viewport.destroy();
});

test("guide follows selection, parameters, preview and cast without forcing steps",()=>{
 const f=fixture(true),{controller:c,els}=f,click=id=>els[id].fire("click");
 c.setLevel("level1");c.setActive(true);
 assert.equal(c.getTutorialState().step,"Explore");assert.equal(els["tutorial-hint-panel"].hidden,true);
 click("object-toggle");assert.equal(c.getTutorialState().step,"Select object");
 c.inspector.selectObject("brook-beam");assert.equal(c.getTutorialState().step,"Choose transformation");
 c.inspector.selectType("translate");assert.equal(c.getTutorialState().step,"Enter parameters");
 assert.match(els["tutorial-guide"].textContent,/horizontal first, vertical second/);
 c.inspector.showPreview({dx:12,dy:1});assert.equal(c.getTutorialState().step,"Revise");
 c.inspector.showPreview({dx:12,dy:0});assert.equal(c.getTutorialState().step,"Apply or revise");
 const fields=c.inspector.getState().preview;assert.ok(fields.ok);
 click("object-close");assert.equal(c.getTutorialState().step,"Explore");
 click("pick-toggle");assert.equal(c.getTutorialState().step,"Read coordinates");click("pick-toggle");
 assert.equal(cast(f,"brook-beam","translate",{dx:12,dy:0}).ok,true);
 assert.equal(c.getTutorialState().step,"Traverse");
 assert.equal(c.undoCast(),true);assert.equal(c.getTutorialState().step,"Explore");
 assert.equal(c.getAttemptSummary().moves,1);c.destroy();
});
test("five-stage hints reveal only on request and never alter inspector fields, history or stars",()=>{
 const f=fixture(true),{controller:c,els,view,frame}=f,click=id=>els[id].fire("click");
 c.setLevel("level2");c.setActive(true);
 click("tutorial-guidance-toggle");assert.equal(els["tutorial-guide"].hidden,true);
 click("tutorial-hint");assert.equal(c.getTutorialState().hintStage,1);
 assert.match(els["tutorial-hint-title"].textContent,/1 of 5.*Obstacle/);
 assert.equal(els["tutorial-hint-previous"].disabled,true);
 const initial=c.room,player=c.getPlayer(),summary=c.getAttemptSummary();
 for(let i=0;i<3;i++)click("tutorial-hint-next");
 assert.match(els["tutorial-hint-title"].textContent,/4 of 5.*Mathematical reasoning/);
 assert.match(els["tutorial-hint-text"].textContent,/14, 8/);
 assert.doesNotMatch(els["tutorial-hint-text"].textContent,/90° anticlockwise/);
 assert.equal(els["tutorial-hint-next"].textContent,"Show worked solution");
 click("tutorial-hint-next");assert.match(els["tutorial-hint-text"].textContent,/90° anticlockwise/);
 assert.equal(els["tutorial-hint-next"].hidden,true);
 assert.equal(c.room,initial);assert.deepEqual(c.getPlayer(),player);assert.deepEqual(c.getAttemptSummary(),summary);
 assert.equal(c.inspector.getState().active,false);
 click("tutorial-hint-previous");assert.equal(c.getTutorialState().hintStage,4);
 click("tutorial-hint-close");assert.equal(els["tutorial-hint-panel"].hidden,true);assert.equal(els["tutorial-hint-text"].textContent,"");
 click("tutorial-hint");assert.equal(c.getTutorialState().hintStage,1);
 click("object-toggle");c.inspector.selectObject("stubborn-gate");c.inspector.selectType("rotate");
 const inputs=els["object-fields"].querySelectorAll();
 for(const field of inputs)field.value="";inputs.find(x=>x.name==="cx").value="14";
 for(let i=0;i<4;i++)click("tutorial-hint-next");
 assert.equal(inputs.find(x=>x.name==="cx").value,"14");assert.equal(inputs.find(x=>x.name==="cy").value,"");
 assert.equal(c.inspector.getState().preview,null);assert.equal(c.getAttemptSummary().moves,0);
 assert.equal(cast(f,"stubborn-gate","rotate",{angle:90,direction:"anticlockwise",cx:14,cy:8}).ok,true);
 assert.equal(c.getTutorialState().hintStage,0);assert.equal(els["tutorial-hint-panel"].hidden,true);
 click("tutorial-hint");assert.match(els["tutorial-hint-text"].textContent,/already in a useful position/);
 click("tutorial-hint-close");
 view.fire("keydown",{code:"ArrowRight"});frame(300);view.fire("keyup",{code:"ArrowRight"});
 assert.equal(c.getResult().stars,3);assert.equal(c.getResult().moves,1);
 assert.equal(els["tutorial-hint"].disabled,true);assert.equal(c.setHintStage(1),false);
 c.setLevel("level3");assert.equal(c.getTutorialState().guidanceEnabled,false);assert.equal(els["tutorial-guide"].hidden,true);
 click("tutorial-guidance-toggle");assert.equal(els["tutorial-guide"].hidden,false);
 click("tutorial-hint");click("reset-practice");assert.equal(c.getTutorialState().hintStage,0);
 click("tutorial-hint");assert.equal(c.recoverPlayer(),true);assert.equal(c.getTutorialState().hintStage,0);
 c.setLevel("room");assert.equal(els["tutorial-tools"].hidden,true);assert.equal(c.setHintStage(1),false);c.destroy();
});

test("compact view controls collapse safely, picking can always be closed, Escape dismisses interaction",()=>{
 const f=fixture(true),{els,controller:c}=f,click=id=>els[id].fire("click");
 c.setLevel("level1");c.setActive(true);
 assert.equal(c.getToolsOpen(),false);assert.equal(els["room-secondary-tools"].hidden,true);
 assert.equal(els["climb-controls"].hidden,true);
 click("room-tools-toggle");assert.equal(els["room-secondary-tools"].hidden,false);
 click("pick-toggle");assert.equal(c.getCoordinateState().picking,true);
 click("room-tools-toggle");assert.equal(c.getCoordinateState().picking,false);assert.equal(els["coordinate-panel"].hidden,true);
 c.setPicking(true);assert.equal(c.getToolsOpen(),true);click("coordinate-close");assert.equal(c.getCoordinateState().picking,false);
 c.setLevel("room");assert.equal(els["climb-controls"].hidden,false);assert.equal(c.getToolsOpen(),false);
 c.destroy();
});

test("garden levels support separate spells, mechanism rollback and continued chapter navigation",()=>{
 const f=fixture(true,true),{controller:c,els,view,frame,app}=f;
 app.identity.show("level5");assert.match(els["room-chapter"].textContent,/Chapter II.*Translation \+ Rotation/);
 assert.equal(cast(f,"garden-hinge","rotate",{angle:90,direction:"anticlockwise",cx:37,cy:8}).ok,true);
 assert.equal(cast(f,"garden-beam","translate",{dx:12,dy:0}).ok,true);
 assert.equal(c.getAttemptSummary().moves,2);assert.equal(c.getTutorialState().step,"Traverse");
 app.identity.show("level6");
 assert.equal(cast(f,"garden-barrel","reflect",{line:"x=9"}).ok,true);assert.equal(c.room.plates[0].pressed,true);
 assert.equal(c.undoCast(),true);assert.equal(c.room.plates[0].pressed,false);assert.equal(c.room.objects.find(o=>o.id==="plate-gate").open,false);
 c.resetPlayer();
 assert.equal(cast(f,"garden-barrel","reflect",{line:"x=9"}).ok,true);
 assert.equal(cast(f,"garden-mushroom","enlarge",{factor:2,cx:30,cy:3}).ok,true);
 assert.equal(c.getTutorialState().step,"Traverse");
 const down=code=>view.fire("keydown",{code}),up=code=>view.fire("keyup",{code});
 frame(2);down("ArrowRight");down("Space");frame(30);up("Space");frame(105);
 down("Space");frame(30);up("Space");up("ArrowRight");frame(30);
 assert.equal(c.getPlayer().grounded,true);assert.ok(Math.abs(c.getPlayer().y-5.5)<.05);
 down("ArrowRight");down("Space");frame(60);up("Space");frame(100);up("ArrowRight");
 assert.equal(app.state.view,"results");assert.equal(c.getResult().stars,3);assert.equal(c.getResult().moves,2);assert.equal(c.getResult().returns,0);
 assert.deepEqual(c.getResult().entries.map(e=>e.type),["reflect","enlarge"]);
 assert.equal(els["results-next"].hidden,false);assert.equal(els["results-next"].disabled,false);
 els["results-next"].fire("click");assert.equal(app.state.view,"level7");assert.equal(c.room.id,"gardens-07");assert.equal(c.getAttemptSummary().moves,0);
 c.destroy();app.identity.destroy();app.results.destroy();app.viewport.destroy();
});

test("ladder orientation controls climbing availability and reset/undo rebuilds the segment",()=>{
 const f=fixture(true,true),{controller:c,els,app}=f;
 app.identity.show("level7");assert.equal(els["climb-controls"].hidden,true);
 assert.equal(cast(f,"garden-ladder","rotate",{angle:90,direction:"anticlockwise",cx:24,cy:12}).ok,true);
 assert.equal(els["climb-controls"].hidden,false);
 assert.equal(c.undoCast(),true);assert.equal(els["climb-controls"].hidden,true);
 assert.equal(cast(f,"ladder-crate","translate",{dx:17,dy:0}).ok,true);
 assert.equal(cast(f,"garden-ladder","rotate",{angle:90,direction:"anticlockwise",cx:24,cy:12}).ok,true);
 assert.equal(c.getTutorialState().step,"Traverse");assert.equal(els["climb-controls"].hidden,false);
 c.resetPlayer();assert.equal(els["climb-controls"].hidden,true);assert.equal(c.getAttemptSummary().moves,0);
 c.destroy();app.identity.destroy();app.results.destroy();app.viewport.destroy();
});
test("horizontal mirror and enlargement complete chapter II and continue into the Clockwork Gallery",()=>{
 const f=fixture(true,true),{controller:c,els,view,frame,app}=f;
 app.identity.show("level8");assert.equal(c.room.id,"gardens-08");
 assert.equal(cast(f,"mirror-platform","reflect",{line:"y=3"}).ok,true);
 assert.equal(cast(f,"garden-wedge","enlarge",{factor:3,cx:34,cy:7}).ok,true);
 assert.equal(c.getTutorialState().step,"Traverse");
 const down=code=>view.fire("keydown",{code}),up=code=>view.fire("keyup",{code});
 frame(2);down("ArrowRight");frame(71);down("Space");frame(45);up("Space");up("ArrowRight");frame(10);
 down("ArrowRight");down("Space");frame(45);up("Space");frame(225);up("ArrowRight");
 assert.equal(app.state.view,"results");assert.equal(c.getResult().moves,2);assert.equal(c.getResult().stars,3);
 assert.equal(c.getResult().returns,0);
 assert.deepEqual(c.getResult().entries.map(e=>e.type),["reflect","enlarge"]);
 assert.equal(els["results-next"].hidden,false);assert.equal(els["results-next"].disabled,false);
 els["results-next"].fire("click");assert.equal(app.state.view,"level9");assert.equal(c.room.id,"clockwork-09");assert.equal(c.getAttemptSummary().moves,0);
 c.destroy();app.identity.destroy();app.results.destroy();app.viewport.destroy();
});

test("mobile hinge updates on translation; early rotation is free and undo removes docking",()=>{
 const f=fixture(true,true),{controller:c,els,app}=f;
 app.identity.show("level9");assert.match(els["room-chapter"].textContent,/Chapter III.*Translation \+ Rotation/);
 const rotate={angle:90,direction:"clockwise",cx:17,cy:3};
 assert.equal(cast(f,"socket-beam","rotate",{...rotate,cx:6}).code,"not-docked");
 assert.equal(c.getAttemptSummary().moves,0);
 assert.equal(cast(f,"socket-beam","translate",{dx:11,dy:0}).ok,true);
 assert.deepEqual(c.room.objects[0].hinge,[17,3]);
 c.setObjectMode(true);c.inspector.selectObject("socket-beam");
 assert.match(els["object-permissions"].textContent,/Mobile hinge H \(17, 3\) \(docked\)/);
 assert.equal(cast(f,"socket-beam","rotate",rotate).ok,true);
 assert.equal(c.getTutorialState().step,"Traverse");assert.equal(c.getAttemptSummary().moves,2);
 assert.equal(c.undoCast(),true);assert.deepEqual(c.room.objects[0].hinge,[17,3]);
 assert.equal(c.undoCast(),true);assert.deepEqual(c.room.objects[0].hinge,[6,3]);
 assert.equal(cast(f,"socket-beam","rotate",{...rotate,cx:6}).code,"not-docked");
 assert.equal(c.getAttemptSummary().moves,2);assert.equal(c.getAttemptSummary().undos,2);
 c.destroy();app.identity.destroy();app.results.destroy();app.viewport.destroy();
});
test("clockwork clearance puzzle completes with two casts on one object and continues",()=>{
 const f=fixture(true,true),{controller:c,els,view,frame,app}=f;
 app.identity.show("level10");assert.equal(c.room.id,"clockwork-10");
 const blocked=cast(f,"clearance-plank","translate",{dx:17,dy:0});
 assert.equal(blocked.ok,false);assert.equal(c.getAttemptSummary().moves,0);
 assert.equal(cast(f,"clearance-plank","rotate",{angle:90,direction:"clockwise",cx:6,cy:3}).ok,true);
 assert.equal(cast(f,"clearance-plank","translate",{dx:17,dy:0}).ok,true);
 assert.equal(c.getTutorialState().step,"Traverse");
 frame(2);view.fire("keydown",{code:"ArrowRight"});frame(172);
 view.fire("keydown",{code:"Space"});frame(60);view.fire("keyup",{code:"Space"});frame(300);view.fire("keyup",{code:"ArrowRight"});
 assert.equal(app.state.view,"results");assert.equal(c.getResult().stars,3);assert.equal(c.getResult().moves,2);assert.equal(c.getResult().returns,0);
 assert.deepEqual(c.getRecords().map(e=>e.objectId),["clearance-plank","clearance-plank"]);
 assert.deepEqual(c.getResult().entries.map(e=>e.type),["rotate","translate"]);
 assert.equal(els["results-next"].hidden,false);assert.equal(els["results-next"].disabled,false);
 els["results-next"].fire("click");assert.equal(app.state.view,"level11");assert.equal(c.room.id,"clockwork-11");
 c.destroy();app.identity.destroy();app.results.destroy();app.viewport.destroy();
});

test("external enlargement and reflected reference points complete level 11",()=>{
 const f=fixture(true,true),{controller:c,els,view,frame,app}=f;
 app.identity.show("level11");
 assert.equal(cast(f,"clockwork-wedge","reflect",{line:"x=13"}).ok,true);
 assert.equal(cast(f,"clockwork-wedge","enlarge",{factor:3,cx:10,cy:3}).ok,true);
 assert.equal(c.getTutorialState().step,"Traverse");
 frame(2);view.fire("keydown",{code:"ArrowRight"});frame(500);view.fire("keyup",{code:"ArrowRight"});
 assert.equal(app.state.view,"results");assert.equal(c.getResult().moves,2);assert.equal(c.getResult().stars,3);
 els["results-next"].fire("click");assert.equal(app.state.view,"level12");assert.equal(c.room.id,"clockwork-12");
 c.destroy();app.identity.destroy();app.results.destroy();app.viewport.destroy();
});
test("key outline preview, geometric fit, undo/reset and Riverworks navigation",()=>{
 const f=fixture(true,true),{controller:c,els,view,frame,app}=f;
 app.identity.show("level12");
 c.setObjectMode(true);c.inspector.selectObject("brass-key");
 assert.match(els["object-references"].textContent,/Lock outline: S1/);
 const grow={factor:2,cx:8,cy:5},turn={angle:90,direction:"clockwise",cx:13,cy:8};
 assert.equal(cast(f,"brass-key","enlarge",grow).ok,true);assert.equal(c.room.shapeSockets[0].filled,false);
 assert.equal(cast(f,"brass-key","rotate",turn).ok,true);assert.equal(c.room.shapeSockets[0].filled,true);
 assert.equal(c.undoCast(),true);assert.equal(c.room.shapeSockets[0].filled,false);
 c.resetPlayer();assert.equal(c.room.shapeSockets[0].filled,false);
 assert.equal(cast(f,"brass-key","enlarge",grow).ok,true);
 assert.equal(cast(f,"brass-key","rotate",turn).ok,true);
 assert.equal(c.getTutorialState().step,"Traverse");
 frame(2);view.fire("keydown",{code:"ArrowRight"});frame(500);view.fire("keyup",{code:"ArrowRight"});
 assert.equal(app.state.view,"results");assert.equal(c.getResult().moves,2);assert.equal(c.getResult().stars,3);
 assert.equal(els["results-next"].hidden,false);assert.equal(els["results-next"].disabled,false);
 els["results-next"].fire("click");assert.equal(app.state.view,"level13");assert.equal(c.room.id,"riverworks-13");
 c.destroy();app.identity.destroy();app.results.destroy();app.viewport.destroy();
});

test("bridge construction allows two translations, rejects obstructed order and continues to staircase",()=>{
 const f=fixture(true,true),{controller:c,els,view,frame,app}=f;
 app.identity.show("level13");assert.match(els["room-chapter"].textContent,/Chapter IV.*Translation/);
 assert.equal(cast(f,"west-span","translate",{dx:26,dy:0}).ok,false);
 assert.equal(c.getAttemptSummary().moves,0);
 c.setObjectMode(true);c.inspector.selectObject("east-span");
 assert.match(els["object-permissions"].textContent,/Both ends require support/);
 assert.equal(cast(f,"east-span","translate",{dx:25,dy:0}).ok,true);
 assert.equal(cast(f,"west-span","translate",{dx:26,dy:0}).ok,true);
 assert.equal(c.getTutorialState().step,"Traverse");
 frame(2);view.fire("keydown",{code:"ArrowRight"});frame(228);
 view.fire("keydown",{code:"Space"});frame(60);view.fire("keyup",{code:"Space"});frame(400);view.fire("keyup",{code:"ArrowRight"});
 assert.equal(app.state.view,"results");assert.equal(c.getResult().moves,2);assert.equal(c.getResult().stars,3);assert.equal(c.getResult().returns,0);
 els["results-next"].fire("click");assert.equal(app.state.view,"level14");assert.equal(c.room.id,"riverworks-14");
 c.destroy();app.identity.destroy();app.results.destroy();app.viewport.destroy();
});
test("staircase retains support, undo rebuilds climb geometry and three-cast route completes",()=>{
 const f=fixture(true,true),{controller:c,els,view,frame,app}=f;
 app.identity.show("level14");assert.equal(els["climb-controls"].hidden,true);
 assert.equal(cast(f,"upper-step","translate",{dx:26,dy:0}).ok,false);
 assert.equal(cast(f,"lower-step","translate",{dx:15,dy:0}).ok,true);
 assert.equal(cast(f,"upper-step","translate",{dx:26,dy:0}).ok,true);
 assert.equal(cast(f,"lower-step","translate",{dx:-15,dy:0}).code,"bearing-unsupported");
 assert.equal(cast(f,"service-ladder","rotate",{angle:90,direction:"anticlockwise",cx:34,cy:15}).ok,true);
 assert.equal(els["climb-controls"].hidden,false);assert.equal(c.getTutorialState().step,"Traverse");
 assert.equal(c.undoCast(),true);assert.equal(els["climb-controls"].hidden,true);
 c.resetPlayer();
 assert.equal(cast(f,"lower-step","translate",{dx:15,dy:0}).ok,true);
 assert.equal(cast(f,"upper-step","translate",{dx:26,dy:0}).ok,true);
 assert.equal(cast(f,"service-ladder","rotate",{angle:90,direction:"anticlockwise",cx:34,cy:15}).ok,true);
 assert.equal(c.getAttemptSummary().moves,3);assert.equal(els["climb-controls"].hidden,false);
 // Align movement frames to the fixed-step recording. The exact physics
 // traversal itself is tested independently by campaign-audit and workshop.
 assert.equal(c.getTutorialState().step,"Traverse");
 assert.equal(c.room.objects.find(o=>o.id==="upper-step").vertices[0][0],30);
 assert.equal(c.getResult(),null);
 c.destroy();app.identity.destroy();app.results.destroy();app.viewport.destroy();
});
