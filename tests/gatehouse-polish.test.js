import test from "node:test";
import assert from "node:assert/strict";
import {placeReferenceLabels} from "../src/rendering/object-overlay.js";
import {castProgress} from "../src/rendering/cast-effects.js";
import {createPhysicsWorld} from "../src/physics/collision.js";
import {createPlayer,stepPlayer} from "../src/physics/platformer.js";
import {ACROSS_THE_BROOK,BROOK_SOLUTION} from "../src/levels/across-the-brook.js";
import {STUBBORN_GATE,GATE_SOLUTION} from "../src/levels/stubborn-gate.js";
import {LITTLE_CHEESY,CHEESY_SOLUTION} from "../src/levels/little-cheesy.js";
import {MISSING_BARREL,BARREL_SOLUTION} from "../src/levels/missing-barrel.js";
import {commitTranslation} from "../src/transformations/translation.js";
import {commitRotation} from "../src/transformations/rotation.js";
import {commitEnlargement} from "../src/transformations/enlargement.js";
import {commitReflection} from "../src/transformations/reflection.js";

test("labels near boundary remain visible and avoid overlap when space permits",()=>{
 const points=[{x:1,y:1,text:"A"},{x:2,y:2,text:"B"},{x:98,y:99,text:"C"},{x:99,y:98,text:"D"}],used=[];
 const labels=placeReferenceLabels(points,{left:0,top:0,right:100,bottom:100},s=>s.length*7,used);
 assert.equal(labels.length,4);
 for(const [i,p] of labels.entries()){assert.equal(p.x,points[i].x);assert.equal(p.y,points[i].y);assert.ok(used[i].left>=0&&used[i].right<=100&&used[i].top>=0&&used[i].bottom<=100);}
 for(let i=0;i<used.length;i++)for(let j=i+1;j<used.length;j++)assert.ok(used[i].right<=used[j].left||used[j].right<=used[i].left||used[i].bottom<=used[j].top||used[j].bottom<=used[i].top);
});
test("cosmetic easing has exact endpoints and is monotone",()=>{
 assert.equal(castProgress(-1),0);assert.equal(castProgress(1.5),1);assert.equal(castProgress(.5),.5);
 let prev=0;for(let i=0;i<=100;i++){const n=castProgress(i/100);assert.ok(n>=prev&&n<=1);prev=n;}
});
const cases=[
 [ACROSS_THE_BROOK,BROOK_SOLUTION,commitTranslation,[[215,1,false],[120,1,true],[400,1,false]]],
 [STUBBORN_GATE,GATE_SOLUTION,commitRotation,[[550,1,false]]],
 [LITTLE_CHEESY,CHEESY_SOLUTION,commitEnlargement,[[900,1,false]]],
 [MISSING_BARREL,BARREL_SOLUTION,commitReflection,[[175,1,false],[60,1,true],[40,0,false],[55,1,true],[140,1,false]]]
];
function replay(world,route){let p=createPlayer(world);for(const [n,move,jump] of route)for(let i=0;i<n;i++){p=stepPlayer(world,p,{move,jump:jump&&i===0});if(p.completed)return p;}return p;}
test("every Gatehouse intended route still completes in one cast without respawn",()=>{
 for(const [room,solution,commit,route] of cases){
  const world=createPhysicsWorld(room),p=createPlayer(world),tx=commit(room,p,solution.objectId,solution);
  assert.ok(tx.ok,tx.message);
  const q=replay(tx.physics,route);assert.equal(q.completed,true,room.id);assert.equal(q.respawns,0,room.id);
 }
});
test("sampled untransformed jumping attempts cannot skip the intended obstacle",()=>{
 for(const [room] of cases){
  const world=createPhysicsWorld(room);
  for(let n=120;n<=300;n+=30)assert.equal(replay(world,[[n,1,false],[500,1,true]]).completed,false,room.id+" jump at tick "+n);
 }
});
