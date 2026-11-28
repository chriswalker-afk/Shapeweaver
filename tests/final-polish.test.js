import test from "node:test";
import assert from "node:assert/strict";
import {createPresentationPreferences,PRESENTATION_KEY} from "../src/core/presentation.js";
import {createGameAudio} from "../src/core/game-audio.js";
import {createCamera,frameBoundsCamera,worldToScreen,MAX_ZOOM} from "../src/rendering/camera.js";
import {layoutWorldLabels} from "../src/rendering/label-layout.js";
import {mountViewport} from "../src/rendering/viewport.js";
test("presentation preferences default silent, respect system motion and survive storage failure",()=>{
 const saved=new Map(),view={localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},matchMedia:()=>({matches:true})};
 const p=createPresentationPreferences(view);assert.equal(p.sound,false);assert.equal(p.reduceMotion,true);
 p.setSound(true);p.setReduced(true);assert.deepEqual(JSON.parse(saved.get(PRESENTATION_KEY)),{version:1,sound:true,reduced:true});
 const copy=createPresentationPreferences({...view,matchMedia:()=>({matches:false})});assert.ok(copy.sound&&copy.reduceMotion);copy.setReduced(false);assert.equal(copy.reduceMotion,false);
 const blocked=createPresentationPreferences({get localStorage(){throw Error("denied");}});assert.equal(blocked.setSound(true),true);assert.equal(blocked.sound,true);
});
test("audio is lazy, optional, safely stopped on mute and gracefully unsupported",()=>{
 let created=0,stopped=0,started=0,closed=0;
 const parameter=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
 class Audio{
  constructor(){created++;this.state="running";this.currentTime=0;this.destination={};}
  createGain(){return {gain:parameter(),connect(){},disconnect(){}}}
  createOscillator(){return {frequency:parameter(),connect(){},disconnect(){},start(){started++},stop(t){if(t===undefined)stopped++}}}
  close(){closed++;return Promise.resolve();}
 }
 const p=createPresentationPreferences({}),a=createGameAudio({AudioContext:Audio},p);
 assert.equal(a.unlock(),false);assert.equal(a.play("translate"),false);assert.equal(created,0);
 a.setEnabled(true);assert.equal(created,1);assert.ok(a.play("reflect"));assert.equal(started,3);
 a.setEnabled(false);assert.equal(stopped,3);assert.equal(a.play("complete"),false);a.destroy();assert.equal(closed,1);
 const unsupported=createGameAudio({},createPresentationPreferences({}));assert.equal(unsupported.setEnabled(true),true);assert.equal(unsupported.play("undo"),false);unsupported.destroy();
});
test("close-up frames remote geometry without changing coordinates or exceeding zoom limit",()=>{
 const bounds={minX:0,minY:0,maxX:92,maxY:23};
 for(const [w,h] of [[1366,500],[390,320],[844,190]]){
  const c=createCamera(bounds,w,h),box={minX:82,maxX:85,minY:15,maxY:18},f=frameBoundsCamera(c,bounds,box);
  assert.ok(f.zoom>1&&f.zoom<=MAX_ZOOM);assert.ok(f.cx>50);assert.equal(f.width,w);
  for(const [x,y] of [[82,15],[85,18]]){const p=worldToScreen(f,{x,y});assert.ok(p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h);}
 }
});
test("world labels remain inside viewport, avoid collisions and retain original anchors",()=>{
 const labels=[{x:195,y:15,text:"EXIT"},{x:180,y:16,text:"MIRROR"},{x:1,y:50,text:"RECEIVER"},{x:500,y:500,text:"OFFSCREEN"}],rect={left:0,right:200,top:0,bottom:110};
 const layout=layoutWorldLabels(labels,rect,s=>s.length*6);assert.equal(layout.length,3);
 for(let i=0;i<layout.length;i++){const a=layout[i];assert.equal(a.x,labels[i].x);assert.ok(a.left>=0&&a.right<=200&&a.top>=0&&a.bottom<=110);for(const b of layout.slice(0,i))assert.ok(a.left>=b.right||a.right<=b.left||a.top>=b.bottom||a.bottom<=b.top);}
});
test("observed canvas redraw reuses dimensions until a resize actually happens",()=>{
 let reads=0,draws=0,notify;
 const canvas={getContext:()=>({})},host={getBoundingClientRect(){reads++;return {width:900,height:400};}};
 const view={devicePixelRatio:2,ResizeObserver:class{constructor(fn){notify=fn;}observe(){}disconnect(){}},addEventListener(){},removeEventListener(){}};
 const v=mountViewport(canvas,host,view,()=>draws++);
 assert.equal(reads,1);for(let i=0;i<60;i++)v.redraw();assert.equal(reads,1);assert.equal(draws,61);
 notify();assert.equal(reads,2);assert.equal(canvas.width,1800);v.destroy();
});
