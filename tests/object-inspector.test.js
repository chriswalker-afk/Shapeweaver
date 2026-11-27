import test from "node:test";
import assert from "node:assert/strict";
import {mountObjectInspector} from "../src/ui/object-inspector.js";
import {GATEHOUSE_PREVIEW} from "../src/levels/gatehouse-preview.js";
import {createCamera,worldToScreen} from "../src/rendering/camera.js";
import {drawObjectOverlay} from "../src/rendering/object-overlay.js";
function element(tag="div"){
  const listeners=new Map(),attributes={};
  return {tag,listeners,attributes,children:[],dataset:{},value:"",hidden:false,disabled:false,
    setAttribute(k,v){attributes[k]=v},append(...items){this.children.push(...items)},replaceChildren(...items){this.children=items},
    querySelectorAll(){return this.children.flatMap(c=>c.tag==="input"||c.tag==="select"?[c]:c.querySelectorAll())},
    addEventListener(k,v){listeners.set(k,v)},removeEventListener(k,v){if(listeners.get(k)===v)listeners.delete(k)},
    fire(k,e={}){listeners.get(k)?.({preventDefault(){},...e})}};
}
test("inspector supports pointer/list selection, typed preview, stale-preview removal and closing",()=>{
  const ids=["object-panel","object-toggle","object-select","object-spell","object-form","object-fields","object-result","object-references","object-permissions","object-close","object-clear"];
  const els=Object.fromEntries(ids.map(id=>[id,element()]));let changes=0,ui;
  const doc={getElementById:id=>els[id],createElement:tag=>element(tag)};
  ui=mountObjectInspector(doc,GATEHOUSE_PREVIEW,()=>({x:2.5,y:3}),()=>changes++,v=>ui.setActive(v));
  assert.equal(els["object-panel"].hidden,true);
  els["object-toggle"].fire("click");assert.equal(els["object-panel"].hidden,false);
  const camera=createCamera(GATEHOUSE_PREVIEW.bounds,1000,500);
  assert.equal(ui.pick(camera,worldToScreen(camera,{x:4,y:6.8})),true);
  assert.equal(ui.getState().selected,"beam");assert.match(els["object-permissions"].textContent,/Translation/);
  assert.equal(ui.selectType("rotate"),false);
  els["object-spell"].value="translate";els["object-spell"].fire("change");
  const inputs=els["object-fields"].querySelectorAll();inputs.find(i=>i.name==="dx").value="14";inputs.find(i=>i.name==="dy").value="−3.65";
  els["object-form"].fire("submit");assert.equal(ui.getState().preview.ok,true);
  assert.equal(els["object-result"].dataset.state,"clear");
  els["object-fields"].fire("input");assert.equal(ui.getState().preview,null);
  els["object-select"].value="gate";els["object-select"].fire("change");
  assert.equal(ui.getState().selected,"gate");assert.match(els["object-references"].textContent,/H \(31.2, 6\)/);
  els["object-close"].fire("click");assert.equal(ui.getState().active,false);assert.equal(ui.getState().selected,null);assert.equal(els["object-panel"].hidden,true);
  assert.ok(changes>=4);ui.destroy();assert.ok(Object.values(els).every(el=>el.listeners.size===0));
});
test("ghost overlay balances canvas state and draws source and image reference labels",()=>{
  const room=GATEHOUSE_PREVIEW,camera=createCamera(room.bounds,1000,500);
  let depth=0;const labels=[];
  const ctx={save(){depth++},restore(){depth--;assert.ok(depth>=0)},beginPath(){},rect(){},clip(){},moveTo(){},lineTo(){},closePath(){},stroke(){},fill(){},arc(){},measureText(t){return {width:t.length*7}},strokeText(){},fillText(t){labels.push(t)},setLineDash(){}};
  const source=room.objects[0],geometry={vertices:source.vertices.map(([x,y])=>[x+14,y-3.65]),points:source.vertices.map(([x,y],i)=>({id:String.fromCharCode(65+i),point:[x+14,y-3.65]}))};
  drawObjectOverlay(ctx,camera,room.bounds,[source],source.id,{ok:true,objectId:source.id,request:{type:"translate"},geometry});
  assert.equal(depth,0);assert.ok(labels.includes("A"));assert.ok(labels.includes("A′"));
});
