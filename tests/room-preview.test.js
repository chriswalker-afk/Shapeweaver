import test from "node:test";
import assert from "node:assert/strict";
import {mountRoomPreview} from "../src/ui/room-preview.js";
import {worldToScreen} from "../src/rendering/camera.js";

function element() {
  const listeners=new Map(),attributes={};
  return {listeners,attributes,style:{},hidden:false,disabled:false,value:"",
    setAttribute(k,v){attributes[k]=v},
    addEventListener(k,v){listeners.set(k,v)},
    removeEventListener(k,v){if(listeners.get(k)===v)listeners.delete(k)},
    fire(k,event={}){listeners.get(k)?.(event)}};
}
function fixture(){
  const ids=["room-canvas","room-stage","room-status","camera-overview","camera-inspect","camera-left","camera-right","camera-up","camera-down","camera-zoom-in","camera-zoom-out","grid-toggle","axes-toggle","pick-toggle","coordinate-panel","coordinate-snap","coordinate-x","coordinate-y","coordinate-form","coordinate-result","coordinate-clear"];
  const els=Object.fromEntries(ids.map(id=>[id,element()]));
  const rect={left:50,top:80,width:1000,height:500};
  const ctx={
    save(){},restore(){},setTransform(){},createLinearGradient(){return{addColorStop(){}}},createRadialGradient(){return{addColorStop(){}}},
    fillRect(){},drawImage(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},clip(){},rect(){},translate(){},rotate(){},ellipse(){},arc(){},strokeRect(){},quadraticCurveTo(){},strokeText(){},fillText(){},measureText(s){return{width:s.length*7}}
  };
  els["room-canvas"].getContext=()=>ctx;
  els["room-canvas"].getBoundingClientRect=()=>rect;
  els["room-stage"].getBoundingClientRect=()=>rect;
  const listeners=new Map();
  const view={Image:class{},devicePixelRatio:2,addEventListener(k,v){listeners.set(k,v)},removeEventListener(k,v){if(listeners.get(k)===v)listeners.delete(k)}};
  return {els,rect,listeners,view,document:{getElementById:id=>els[id]}};
}
test("room coordinate controls, exact input, picking, resize and cleanup",()=>{
  const f=fixture(),{els,rect}=f,room=mountRoomPreview(f.document,f.view);
  const click=id=>els[id].fire("click");
  assert.deepEqual(room.getCoordinateState(),{grid:true,axes:true,picking:false,snap:1,point:null});
  assert.equal(els["coordinate-panel"].hidden,true);
  click("grid-toggle");assert.equal(room.getCoordinateState().grid,false);assert.equal(room.getCoordinateState().axes,true);
  click("axes-toggle");assert.equal(room.getCoordinateState().axes,false);
  assert.equal(room.pickAt({x:200,y:200}),false);
  click("pick-toggle");assert.equal(els["coordinate-panel"].hidden,false);
  els["coordinate-snap"].value="0.5";els["coordinate-snap"].fire("change");
  const p=worldToScreen(room.getCamera(),{x:6.26,y:4.24});
  els["room-canvas"].fire("click",{clientX:rect.left+p.x,clientY:rect.top+p.y});
  assert.deepEqual(room.getCoordinateState().point,{x:6.5,y:4});
  assert.equal(els["coordinate-result"].textContent,"(6.5, 4)");
  assert.equal(els["coordinate-x"].value,"6.5");
  assert.equal(els["coordinate-y"].value,"4");
  click("camera-zoom-in");const zoom=room.getCamera().zoom;
  assert.ok(zoom>1);click("camera-right");
  rect.width=390;rect.height=640;f.listeners.get("resize")();
  assert.equal(room.getCamera().zoom,zoom);
  assert.deepEqual(room.getCoordinateState().point,{x:6.5,y:4});
  els["coordinate-x"].value="2.125";els["coordinate-y"].value="7.33";
  let submitted=false;els["coordinate-form"].fire("submit",{preventDefault(){submitted=true}});
  assert.ok(submitted);assert.deepEqual(room.getCoordinateState().point,{x:2.125,y:7.33});
  assert.equal(room.enterPoint("99","0"),false);
  assert.deepEqual(room.getCoordinateState().point,{x:2.125,y:7.33});
  click("pick-toggle");assert.equal(els["coordinate-panel"].hidden,true);
  click("pick-toggle");assert.equal(els["coordinate-result"].textContent,"(2.125, 7.33)");
  click("coordinate-clear");assert.equal(room.getCoordinateState().point,null);
  click("camera-overview");assert.equal(room.getCamera().zoom,1);
  room.destroy();assert.equal(f.listeners.size,0);
  assert.ok(Object.values(els).every(el=>el.listeners.size===0));
});
