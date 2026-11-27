import test from "node:test";
import assert from "node:assert/strict";
import {mountMovementInput} from "../src/ui/movement-input.js";
import {createFixedLoop} from "../src/core/fixed-loop.js";
function node(dataset={}){
 const listeners=new Map();
 return {dataset,listeners,addEventListener(k,v){listeners.set(k,v)},removeEventListener(k,v){if(listeners.get(k)===v)listeners.delete(k)},
 fire(k,event={}){listeners.get(k)?.({preventDefault(){},...event})}};
}
test("keyboard and simultaneous touch inputs stay independent and clear correctly",()=>{
 const view=node(),doc=node(),left=node({move:"left"}),right=node({move:"right"}),jump=node({move:"jump"});
 doc.querySelectorAll=()=>[left,right,jump];let enabled=true;
 const input=mountMovementInput(doc,view,()=>enabled);
 view.fire("keydown",{code:"ArrowRight"});assert.equal(input.sample().move,1);
 right.fire("pointerdown",{pointerId:1,button:0});
 jump.fire("pointerdown",{pointerId:2,button:0});
 assert.deepEqual(input.sample(),{move:1,climb:0,jump:true});
 assert.equal(input.sample().jump,false);
 view.fire("keyup",{code:"ArrowRight"});assert.equal(input.sample().move,1);
 right.fire("pointercancel",{pointerId:1});assert.equal(input.sample().move,0);
 jump.fire("pointerup",{pointerId:2});assert.equal(input.pressed("jump"),false);
 view.fire("keydown",{code:"Space",repeat:true});assert.equal(input.sample().jump,false);
 view.fire("keydown",{code:"KeyA",target:{closest:s=>s.includes("input")}});assert.equal(input.sample().move,0);
 left.fire("pointerdown",{pointerId:3,button:0});assert.equal(input.sample().move,-1);
 view.fire("blur");assert.equal(input.sample().move,0);
 enabled=false;view.fire("keydown",{code:"KeyD"});assert.equal(input.sample().move,0);
 input.destroy();assert.ok([view,doc,left,right,jump].every(n=>n.listeners.size===0));
});
test("fixed loop accumulates render-independent updates, caps catch-up and cancels",()=>{
 let id=0,updates=0,draws=0;const callbacks=new Map();
 const view={requestAnimationFrame(fn){callbacks.set(++id,fn);return id},cancelAnimationFrame(i){callbacks.delete(i)}};
 const loop=createFixedLoop(view,()=>updates++,()=>draws++);
 function frame(t){const [key,fn]=callbacks.entries().next().value;callbacks.delete(key);fn(t);}
 loop.start();frame(0);frame(1000/60);assert.equal(updates,2);assert.equal(draws,2);
 frame(1000);assert.equal(updates,14);
 loop.stop();assert.equal(callbacks.size,0);assert.equal(loop.running,false);
 loop.start();frame(5000);assert.equal(updates,14);loop.stop();
});
