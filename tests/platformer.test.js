import test from "node:test";
import assert from "node:assert/strict";
import {rectangle} from "../src/geometry/world.js";
import {GATEHOUSE_PREVIEW,validateRoom} from "../src/levels/gatehouse-preview.js";
import {blocked,inHazard,supported,polygonIntersectsBox,createPhysicsWorld,playerBox,sweepAxis} from "../src/physics/collision.js";
import {createPlayer,stepPlayer,FIXED_DT,MOTION} from "../src/physics/platformer.js";
const room=GATEHOUSE_PREVIEW,world=createPhysicsWorld(room);
const near=(a,b,tol=.03)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
function run(w,p,input,n){
  for(let i=0;i<n;i++)p=stepPlayer(w,p,{...input,jump:Boolean(input.jump)&&i===0});
  return p;
}
function at(x,y){return {...createPlayer(world),x,y};}
function smallWorld(extra=[]){
  return createPhysicsWorld({bounds:{minX:0,maxX:16,minY:0,maxY:10},spawn:{x:2,y:1},exit:{x:15,y:1,width:1,height:2},
    terrain:[{id:"floor",vertices:rectangle(0,0,16,1)},...extra],objects:[],hazards:[]});
}
test("boundary contact is legal, concave shape interiors are solid",()=>{
  const poly=rectangle(0,0,4,3);
  assert.equal(polygonIntersectsBox(poly,{minX:1,maxX:2,minY:3,maxY:4}),false);
  assert.equal(polygonIntersectsBox(poly,{minX:1,maxX:2,minY:2.9,maxY:4}),true);
  const concave=[[0,0],[4,0],[4,1],[1,1],[1,4],[0,4]];
  assert.equal(polygonIntersectsBox(concave,{minX:2,maxX:3,minY:2,maxY:3}),false);
  assert.equal(polygonIntersectsBox(concave,{minX:.5,maxX:1.5,minY:2,maxY:3}),true);
  const p=createPlayer(world);
  assert.equal(blocked(world,p),false);assert.equal(supported(world,p),true);assert.equal(inHazard(world,p),false);
  assert.equal(validateRoom(room),room);
});
test("fixed-step walking, stopping, wall and ceiling contacts",()=>{
  const w=smallWorld([{id:"wall",vertices:rectangle(5,1,.15,7)},{id:"ceiling",vertices:rectangle(1,3,3,.15)}]);
  let p=createPlayer(w),highest=p.y;
  for(let i=0;i<160;i++){p=stepPlayer(w,p,{jump:i===0});highest=Math.max(highest,p.y);assert.equal(blocked(w,p),false);}
  near(highest,1.45,.002);assert.ok(p.grounded);
  p=run(w,p,{move:1},200);
  near(p.x,4.67,.002);assert.equal(p.vx,0);assert.equal(blocked(w,p),false);
  const far=sweepAxis(w,{x:2,y:1},"x",10);
  assert.ok(far.hit);near(far.x,4.67,.002);
  p=run(w,p,{move:-1},30);assert.equal(p.facing,-1);assert.ok(p.x<4);
  p=run(w,p,{},30);assert.equal(p.vx,0);
});
test("jump reaches plausible height; held jump does not repeat without new press",()=>{
  const w=smallWorld();
  let p=createPlayer(w),apex=p.y;
  for(let i=0;i<160;i++){p=stepPlayer(w,p,{jump:i===0});apex=Math.max(apex,p.y);}
  assert.ok(apex>3.8&&apex<4.1);
  assert.ok(p.grounded);near(p.y,1);
  assert.equal(p.pose,"idle");
  assert.equal(FIXED_DT,1/120);assert.ok(MOTION.coyote>0&&MOTION.buffer>0);
});
test("walkable slopes rise and descend, ladder climb holds and dismounts",()=>{
  let p=run(world,at(23,3),{move:1},90);
  near(p.y,6);assert.ok(p.grounded);assert.equal(blocked(world,p),false);
  p=run(world,p,{move:-1},115);near(p.y,3);assert.ok(p.grounded);
  p=run(world,at(8.4,3),{climb:1},140);
  near(p.y,6.65);assert.ok(p.climbing);
  p=run(world,p,{},30);near(p.y,6.65);
  p=run(world,p,{climb:-1},140);near(p.y,3);assert.ok(p.grounded);
  p=run(world,p,{jump:true},1);assert.equal(p.climbing,false);assert.ok(p.vy>0);
});
test("water fall returns to last safe checkpoint; spawn fallback and reset",()=>{
  let p=run(world,createPlayer(world),{move:1},210);
  assert.equal(p.checkpoint,"central");
  let event=null;
  for(let i=0;i<150;i++){p=stepPlayer(world,p,{move:1});if(p.event==="respawn"){event=p;break;}}
  assert.ok(event);near(event.x,15);near(event.y,3);assert.equal(event.respawns,1);
  assert.equal(event.vx,0);assert.equal(event.vy,0);assert.equal(inHazard(world,event),false);
  let fallen={...createPlayer(world),x:18,y:1,grounded:false};
  fallen=stepPlayer(world,fallen,{});
  assert.equal(fallen.event,"respawn");near(fallen.x,room.spawn.x);near(fallen.y,room.spawn.y);
  assert.equal(createPlayer(world).respawns,0);
});
test("complete actual Gatehouse practice route deterministically, no shortcuts or falls",()=>{
  function replay(){
    let p=run(world,createPlayer(world),{move:1},210);
    assert.equal(p.checkpoint,"central");assert.ok(p.x>14&&p.x<16);
    p=run(world,p,{move:1,jump:true},120);
    assert.equal(p.checkpoint,"east");assert.ok(p.x>21&&p.x<23);
    p=run(world,p,{move:1},160);
    assert.ok(p.completed);assert.equal(p.respawns,0);near(p.y,6);assert.ok(p.x>=28.99);
    return p;
  }
  const a=replay(),b=replay();assert.deepEqual(a,b);
  assert.equal(stepPlayer(world,a,{move:-1}).x,a.x);
  assert.equal(JSON.stringify(room),JSON.stringify(GATEHOUSE_PREVIEW));
});
test("coyote grace and buffered jump operate at fixed steps",()=>{
  // A short platform with a lower floor; walk until just off the edge.
  const w=createPhysicsWorld({bounds:{minX:0,maxX:16,minY:0,maxY:10},spawn:{x:2,y:3},exit:{x:15,y:1,width:1,height:2},
    terrain:[{id:"floor",vertices:rectangle(0,0,16,1)},{id:"ledge",vertices:rectangle(0,1,4,2)}],objects:[],hazards:[]});
  let p=createPlayer(w);
  for(let i=0;i<120&&p.grounded;i++)p=stepPlayer(w,p,{move:1});
  assert.ok(!p.grounded&&p.coyote>0);
  p=stepPlayer(w,p,{move:1,jump:true});assert.ok(p.vy>0);
  // Press just before reaching the lower floor.
  p={...createPlayer(w),x:8,y:1.09,grounded:false,coyote:0,vy:-4};
  p=stepPlayer(w,p,{jump:true});assert.ok(p.buffer>0);
  p=run(w,p,{},12);assert.ok(p.vy>0&&p.y>1);
});
