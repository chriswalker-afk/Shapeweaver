import test from "node:test";
import assert from "node:assert/strict";
import {rectangle} from "../src/geometry/world.js";
import {translationSweepOverlaps} from "../src/geometry/translation-sweep.js";
import {previewObject} from "../src/core/object-engine.js";
import {previewTranslation,commitTranslation,translatedFrame} from "../src/transformations/translation.js";
import {ACROSS_THE_BROOK,BROOK_SOLUTION,brookHint} from "../src/levels/across-the-brook.js";
import {validateRoom} from "../src/levels/gatehouse-preview.js";
import {createPhysicsWorld,blocked,inHazard} from "../src/physics/collision.js";
import {createPlayer,stepPlayer,MOTION} from "../src/physics/platformer.js";

const room=validateRoom(ACROSS_THE_BROOK),world=createPhysicsWorld(room),player=createPlayer(world),id=BROOK_SOLUTION.objectId;
const near=(a,b,tol=.04)=>assert.ok(Math.abs(a-b)<tol,a+" != "+b);
function walk(w,p,n,input){for(let i=0;i<n;i++)p=stepPlayer(w,p,{...input,jump:Boolean(input.jump)&&i===0});return p;}
test("continuous sweep catches thin obstacles, diagonal sweeps and reverse movement; contact is legal",()=>{
 const a=rectangle(0,1,1,1);
 assert.equal(translationSweepOverlaps(a,rectangle(5,0,.001,4),10,0),true);
 assert.equal(translationSweepOverlaps(a,rectangle(0,0,12,1),10,0),false);
 assert.equal(translationSweepOverlaps(a,rectangle(5,6,.1,.1),10,10),true);
 assert.equal(translationSweepOverlaps(a,rectangle(5,8,.1,.1),10,10),false);
 assert.equal(translationSweepOverlaps(rectangle(10,1,1,1),rectangle(5,0,.001,4),-10,0),true);
 const l=[[0,0],[5,0],[5,1],[1,1],[1,5],[0,5]];
 assert.equal(translationSweepOverlaps(rectangle(2,2,.5,.5),l,2,1),false);
 assert.equal(translationSweepOverlaps(rectangle(2,2,.5,.5),l,-2,0),true);
 assert.equal(translationSweepOverlaps(a,rectangle(5,2,1,1),10,0),false);
});
function isolated(extra={},support="enchanted"){
 return {bounds:{minX:0,maxX:20,minY:0,maxY:10},terrain:[],hazards:[],objects:[{id:"beam",vertices:rectangle(1,3,1,1),permissions:["translate"],support}],...extra};
}
test("final-clear is insufficient: entire path checks solids, water and apprentice",()=>{
 const wall=isolated({terrain:[{id:"thin wall",vertices:rectangle(5,1,.01,6)}]});
 const raw={dx:9,dy:0};
 assert.equal(previewObject(wall,null,"beam","translate",raw).ok,true);
 assert.equal(previewTranslation(wall,null,"beam",raw).code,"path-solid");
 const water=isolated({hazards:[{id:"water",vertices:rectangle(5,2,1,2)}]});
 assert.equal(previewTranslation(water,null,"beam",raw).code,"path-hazard");
 const clear=isolated();
 assert.equal(previewObject(clear,{x:5,y:3},"beam","translate",raw).ok,true);
 assert.equal(previewTranslation(clear,{x:5,y:3},"beam",raw).code,"path-player");
 assert.equal(commitTranslation(wall,null,"beam",raw).ok,false);
});
test("apply is atomic, rebuilds actual solids, records correct vector, preserves source and animation",()=>{
 const before=JSON.stringify(room),p=JSON.stringify(player);
 const preview=previewTranslation(room,player,id,BROOK_SOLUTION);
 assert.equal(preview.ok,true);assert.equal(preview.scope,"translation-path");
 assert.equal(JSON.stringify(room),before);
 const tx=commitTranslation(room,player,id,BROOK_SOLUTION);
 assert.equal(tx.ok,true,tx.message);assert.equal(tx.room.objects[0].vertices[0][0],15);
 assert.equal(tx.physics.room,tx.room);assert.equal(JSON.stringify(room),before);assert.equal(JSON.stringify(player),p);
 assert.ok(Object.isFrozen(tx.room.objects[0].vertices[0]));
 assert.deepEqual(tx.record,{objectId:id,type:"translate",dx:12,dy:0});
 assert.equal(blocked(world,{x:20,y:3.1}),false);assert.equal(blocked(tx.physics,{x:20,y:3.1}),true);
 assert.deepEqual(translatedFrame(tx.room,tx.transition,0).objects[0].vertices,room.objects[0].vertices);
 assert.equal(translatedFrame(tx.room,tx.transition,.5).objects[0].vertices[0][0],9);
 assert.equal(translatedFrame(tx.room,tx.transition,1),tx.room);
 assert.equal(commitTranslation(room,player,id,{dx:0,dy:0}).code,"identity");
 assert.equal(commitTranslation(room,player,id,{dx:12,dy:1}).code,"unsupported");
 assert.equal(commitTranslation(room,{x:5,y:3.5},id,BROOK_SOLUTION).code,"player-supported");
 const mutable=JSON.parse(JSON.stringify(room));assert.equal(commitTranslation(mutable,player,id,BROOK_SOLUTION).ok,true);assert.equal(Object.isFrozen(mutable.terrain),false);
});
test("verified traversal after intended and alternative one-move translations",()=>{
 for(const dx of [12,11.5,13]){
  const tx=commitTranslation(room,player,id,{dx,dy:0});assert.equal(tx.ok,true,tx.message);
  let p=walk(tx.physics,player,215,{move:1});near(p.y,3);
  p=walk(tx.physics,p,120,{move:1,jump:true});near(p.y,3.5);assert.ok(p.grounded);
  p=walk(tx.physics,p,400,{move:1});assert.equal(p.completed,true,"dx="+dx);assert.equal(p.respawns,0);
 }
});
test("valid unhelpful moves can be corrected; fall preserves the translated world",()=>{
 const first=commitTranslation(room,player,id,{dx:2,dy:0});assert.equal(first.ok,true);
 const second=commitTranslation(first.room,player,id,{dx:10,dy:0});assert.equal(second.ok,true);
 assert.deepEqual(second.room.objects[0].vertices,commitTranslation(room,player,id,BROOK_SOLUTION).room.objects[0].vertices);
 const fallen=stepPlayer(second.physics,{...player,x:20,y:1,grounded:false},{});
 assert.equal(fallen.event,"respawn");assert.equal(fallen.x,room.spawn.x);
 assert.equal(second.room.objects[0].vertices[0][0],15);
 assert.match(brookHint(first.room,2),/5, 3/);assert.match(brookHint(first.room,3),/horizontal 10/);
});
test("unbridged gap defeats even a generous late full-speed jump; traversal not hardcoded to a move",()=>{
 let p={...player,x:17,y:3.5,vx:MOTION.speed,vy:0,grounded:false,coyote:MOTION.coyote};
 let respawn=false;
 for(let i=0;i<180;i++){p=stepPlayer(world,p,{move:1,jump:i===0});if(p.event==="respawn"){respawn=true;break;}}
 assert.ok(respawn);assert.equal(p.completed,false);
});
