import test from "node:test";
import assert from "node:assert/strict";
import {WRONG_WAY_ROUND,THE_GIANT_KEY,WEDGE_SOLUTION,KEY_SOLUTION} from "../src/levels/clockwork-finale.js";
import {validateRoom} from "../src/levels/gatehouse-preview.js";
import {createPhysicsWorld,blocked} from "../src/physics/collision.js";
import {createPlayer,stepPlayer} from "../src/physics/platformer.js";
import {shapeFits,shapeSocketFilled} from "../src/mechanisms/shape-sockets.js";
import {commitEnlargement} from "../src/transformations/enlargement.js";
import {commitReflection} from "../src/transformations/reflection.js";
import {commitRotation,previewRotation} from "../src/transformations/rotation.js";
import {createAttemptHistory,recordCast,undoLastCast} from "../src/core/attempt-history.js";
import {completedResult,starThresholds} from "../src/core/level-results.js";
import {tutorialSituation,tutorialHint} from "../src/levels/tutorial-guidance.js";
import {referencePoints} from "../src/transformations/preview-math.js";
const commits={reflect:commitReflection,enlarge:commitEnlargement,rotate:commitRotation};
function cast(w,p,s){const t=commits[s.type](w.room,p,s.objectId,s);assert.ok(t.ok,t.message);return t;}
function replay(w){let p=createPlayer(w);for(let i=0;i<1000;i++){p=stepPlayer(w,p,{move:1});if(p.completed)break;}return p;}
test("both finale puzzles complete physically in two moves on a single object",()=>{
 for(const [r,solution] of [[WRONG_WAY_ROUND,WEDGE_SOLUTION],[THE_GIANT_KEY,KEY_SOLUTION]]){
  validateRoom(r);assert.deepEqual(starThresholds(r),{threeStar:2,twoStar:4});
  let w=createPhysicsWorld(r),p=createPlayer(w),h=createAttemptHistory();
  assert.equal(replay(w).completed,false);
  for(const [i,s] of solution.entries()){
   const t=cast(w,p,s);h=recordCast(h,w,p,null,t.record);w=t.physics;
   if(i===0)assert.equal(replay(w).completed,false);
  }
  const q=replay(w);assert.equal(q.completed,true);assert.equal(q.respawns,0);
  assert.equal(completedResult(w.room,q,h).stars,3);
  assert.equal(new Set(h.entries.map(e=>e.record.objectId)).size,1);
 }
});
test("reflected vertex labels survive enlargement about a truly external centre",()=>{
 const r=WRONG_WAY_ROUND,w=createPhysicsWorld(r),p=createPlayer(w);
 const t=cast(w,p,WEDGE_SOLUTION[0]);const pts=referencePoints(t.room.objects[0]);
 assert.deepEqual(pts.find(v=>v.id==="B").point,[14,3]);
 const s=cast(t.physics,p,WEDGE_SOLUTION[1]);const image=referencePoints(s.room.objects[0]);
 assert.deepEqual(image.find(v=>v.id==="B").point,[22,3]);assert.deepEqual(image.find(v=>v.id==="C").point,[34,9]);
 // Alternative enlargement then reflection, using conjugate mirror line.
 const a=cast(w,p,WEDGE_SOLUTION[1]),b=cast(a.physics,p,{...WEDGE_SOLUTION[0],line:"x=19"});
 assert.equal(replay(b.physics).completed,true);
});
test("socket matches concave outline, not bounds or vertex ordering",()=>{
 const slot=THE_GIANT_KEY.shapeSockets[0],v=slot.vertices;
 assert.equal(shapeFits(v,v),true);assert.equal(shapeFits([...v.slice(2),...v.slice(0,2)],v),true);
 assert.equal(shapeFits([...v].reverse(),v),true);
 const wrong=v.map(p=>[...p]);wrong[3]=[13,9];
 assert.equal(shapeFits(wrong,v),false);
 assert.equal(shapeFits(v.map(([x,y])=>[x+.01,y]),v),false);
});
test("fitted key releases the gate, unsafe release is rejected, undo restores shape state",()=>{
 const r=THE_GIANT_KEY,w=createPhysicsWorld(r),p=createPlayer(w),gate=v=>v.objects.find(o=>o.id==="key-gate");
 const t=cast(w,p,KEY_SOLUTION[0]);assert.equal(shapeSocketFilled(t.room,t.room.shapeSockets[0]),false);
 assert.equal(blocked(t.physics,{x:24.5,y:3}),true);
 const preview=previewRotation(t.room,p,"brass-key",KEY_SOLUTION[1]);assert.ok(preview.ok);assert.match(preview.mechanismEffects.join(" "),/Key will fit.*gate will open/);
 const s=cast(t.physics,p,KEY_SOLUTION[1]);assert.equal(s.room.shapeSockets[0].filled,true);
 assert.equal(gate(s.room).open,true);assert.equal(blocked(s.physics,{x:24.5,y:3}),false);
 const reverse={...KEY_SOLUTION[1],direction:"anticlockwise"};
 assert.equal(previewRotation(s.room,{...p,x:24.5,y:3},"brass-key",reverse).code,"gate-obstructed");
 assert.equal(commitRotation(s.room,{...p,x:24.5,y:3},"brass-key",reverse).ok,false);
 const back=cast(s.physics,p,reverse);assert.equal(back.room.shapeSockets[0].filled,false);assert.equal(gate(back.room).open,false);
 const h=recordCast(createAttemptHistory(),t.physics,p,null,s.record),u=undoLastCast(h,p);
 assert.ok(u.ok);assert.equal(u.room,t.room);assert.equal(u.room.shapeSockets[0].filled,false);
 // Equivalent order: inverse-scaled centre of rotation, followed by original enlargement.
 const a=cast(w,p,{...KEY_SOLUTION[1],cx:10.5,cy:6.5}),b=cast(a.physics,p,KEY_SOLUTION[0]);
 assert.equal(b.room.shapeSockets[0].filled,true);assert.equal(replay(b.physics).completed,true);
});
test("live hints choose correct next spell and generate valid parameters",()=>{
 for(const [r,solution] of [[WRONG_WAY_ROUND,WEDGE_SOLUTION],[THE_GIANT_KEY,KEY_SOLUTION]]){
  let w=createPhysicsWorld(r),p=createPlayer(w);
  for(const s of solution){
   const g=tutorialSituation(w.room);assert.equal(g.config.type,s.type);assert.equal(g.ready,false);
   assert.match(tutorialHint(w.room,p,5).text,/Enter these parameters yourself/);
   w=cast(w,p,{objectId:s.objectId,type:s.type,...g.raw}).physics;
  }
  assert.equal(tutorialSituation(w.room).ready,true);
 }
});
