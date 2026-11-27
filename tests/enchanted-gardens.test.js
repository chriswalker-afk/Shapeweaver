import test from "node:test";
import assert from "node:assert/strict";
import {TWO_SMALL_PROBLEMS,SECRET_GARDEN,GARDEN_BRIDGE,GARDEN_SECRET} from "../src/levels/enchanted-gardens.js";
import {validateRoom} from "../src/levels/gatehouse-preview.js";
import {createPhysicsWorld,blocked} from "../src/physics/collision.js";
import {createPlayer,stepPlayer,MOTION} from "../src/physics/platformer.js";
import {platePressed} from "../src/mechanisms/pressure-plates.js";
import {onMushroomCap,MUSHROOM_JUMP_SPEED} from "../src/mechanisms/mushroom.js";
import {commitTranslation} from "../src/transformations/translation.js";
import {commitRotation} from "../src/transformations/rotation.js";
import {commitEnlargement} from "../src/transformations/enlargement.js";
import {previewReflection,commitReflection} from "../src/transformations/reflection.js";
import {createAttemptHistory,recordCast,undoLastCast} from "../src/core/attempt-history.js";
import {completedResult,starThresholds} from "../src/core/level-results.js";
import {tutorialSituation,tutorialHint} from "../src/levels/tutorial-guidance.js";
import {rectangle} from "../src/geometry/world.js";
const commits={translate:commitTranslation,rotate:commitRotation,enlarge:commitEnlargement,reflect:commitReflection};
const routes=[[[215,1,false],[120,1,true],[650,1,false]],[[60,1,true],[210,1,false],[60,1,true],[60,0,false],[120,1,true],[200,1,false]]];
function cast(world,p,s){const tx=commits[s.type](world.room,p,s.objectId,s);assert.ok(tx.ok,tx.message);return tx;}
function replay(world,route){let p=createPlayer(world);for(const [n,move,jump] of route)for(let i=0;i<n;i++){p=stepPlayer(world,p,{move,jump:jump&&i===0});if(p.completed)return p;}return p;}
test("both two-object puzzles complete with two moves in either order and earn three stars",()=>{
 for(const [i,[room,solution]] of [[TWO_SMALL_PROBLEMS,GARDEN_BRIDGE],[SECRET_GARDEN,GARDEN_SECRET]].entries()){
  validateRoom(room);assert.deepEqual(starThresholds(room),{threeStar:2,twoStar:4});
  for(const order of [solution,[...solution].reverse()]){
   let w=createPhysicsWorld(room),p=createPlayer(w),h=createAttemptHistory();
   for(const s of order){const tx=cast(w,p,s);h=recordCast(h,w,p,null,tx.record);w=tx.physics;}
   const q=replay(w,routes[i]);assert.equal(q.completed,true,room.id);assert.equal(q.respawns,0);
   const r=completedResult(w.room,q,h);assert.equal(r.moves,2);assert.equal(r.stars,3);assert.equal(r.entries.length,2);
  }
 }
});
test("individual intended casts are not sufficient on the recorded physical routes",()=>{
 for(const [i,[room,solution]] of [[TWO_SMALL_PROBLEMS,GARDEN_BRIDGE],[SECRET_GARDEN,GARDEN_SECRET]].entries()){
  const w=createPhysicsWorld(room),p=createPlayer(w);
  assert.equal(replay(w,routes[i]).completed,false);
  for(const s of solution){const tx=cast(w,p,s);assert.equal(replay(tx.physics,routes[i]).completed,false,s.objectId);}
 }
});
test("actual weight contact opens the gate, releases it, rejects closing on apprentice and undoes exactly",()=>{
 const room=SECRET_GARDEN,w=createPhysicsWorld(room),p=createPlayer(w),s=GARDEN_SECRET[0],gate=r=>r.objects.find(o=>o.id==="plate-gate");
 assert.equal(platePressed(room,room.plates[0]),false);assert.equal(blocked(w,{x:18.5,y:3}),true);
 const t=cast(w,p,s);assert.equal(t.room.plates[0].pressed,true);assert.equal(gate(t.room).open,true);
 assert.equal(blocked(t.physics,{x:18.5,y:3}),false);
 const rejected=previewReflection(t.room,{...p,x:18.5,y:3},s.objectId,s);
 assert.equal(rejected.code,"gate-obstructed");
 assert.equal(commitReflection(t.room,{...p,x:18.5,y:3},s.objectId,s).ok,false);
 const reverse=cast(t.physics,p,s);assert.equal(gate(reverse.room).open,false);assert.equal(blocked(reverse.physics,{x:18.5,y:3}),true);
 const h=recordCast(createAttemptHistory(),w,p,null,t.record),u=undoLastCast(h,p);
 assert.ok(u.ok);assert.equal(u.room,room);assert.equal(u.room.plates[0].pressed,false);assert.equal(u.history.entries[0].undone,true);
 const partial={...room,objects:[{pressesPlates:true,vertices:rectangle(14,3,3,2.5)}]};
 assert.equal(platePressed(partial,room.plates[0]),false);
 const floating={...room,objects:[{pressesPlates:true,vertices:rectangle(12,3.1,3,2.5)}]};
 assert.equal(platePressed(floating,room.plates[0]),false);
});
test("spring jump requires actual cap contact and preserves normal floor jump",()=>{
 const w=createPhysicsWorld(SECRET_GARDEN),p=createPlayer(w);
 assert.equal(onMushroomCap(w.room,p),false);
 const ground=stepPlayer(w,p,{jump:true});assert.ok(Math.abs(ground.vy-(MOTION.jumpSpeed-MOTION.gravity/120))<1e-7);
 const t=cast(w,p,GARDEN_SECRET[1]),cap={...p,x:30,y:5.5,grounded:true};
 assert.equal(onMushroomCap(t.room,cap),true);assert.equal(onMushroomCap(t.room,{...cap,y:5}),false);
 const spring=stepPlayer(t.physics,cap,{jump:true});assert.ok(Math.abs(spring.vy-(MUSHROOM_JUMP_SPEED-MOTION.gravity/120))<1e-7);
});
test("progressive garden hints choose the remaining object and validate worked parameters",()=>{
 for(const [room,solution] of [[TWO_SMALL_PROBLEMS,GARDEN_BRIDGE],[SECRET_GARDEN,GARDEN_SECRET]]){
  let w=createPhysicsWorld(room),p=createPlayer(w);
  for(const s of solution){
   const g=tutorialSituation(w.room);assert.equal(g.config.objectId,s.objectId);assert.equal(g.ready,false);
   assert.match(tutorialHint(w.room,p,5).text,/Enter these parameters yourself/);
   const tx=cast(w,p,{objectId:s.objectId,type:s.type,...g.raw});w=tx.physics;
  }
  assert.equal(tutorialSituation(w.room).ready,true);
 }
});
