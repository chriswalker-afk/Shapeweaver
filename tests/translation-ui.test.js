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
 const ids="room-canvas room-stage room-status play-status room-heading room-chapter movement-controls camera-overview camera-inspect camera-left camera-right camera-up camera-down camera-zoom-in camera-zoom-out grid-toggle axes-toggle pick-toggle coordinate-panel coordinate-snap coordinate-x coordinate-y coordinate-form coordinate-result coordinate-clear object-panel object-toggle object-select object-spell object-form object-fields object-result object-references object-permissions object-close object-clear object-apply object-preview-note tutorial-tools tutorial-guide tutorial-hint tutorial-moves reset-practice".split(" ");
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
