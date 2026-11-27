import test from "node:test";
import assert from "node:assert/strict";
import {FIND_THE_HINGE,A_TIGHT_SQUEEZE,HINGE_SOLUTION,SQUEEZE_SOLUTION} from "../src/levels/clockwork-gallery.js";
import {validateRoom} from "../src/levels/gatehouse-preview.js";
import {createPhysicsWorld} from "../src/physics/collision.js";
import {createPlayer,stepPlayer} from "../src/physics/platformer.js";
import {dockedSocket,validateSockets} from "../src/mechanisms/hinge-sockets.js";
import {commitTranslation,previewTranslation,translatedFrame} from "../src/transformations/translation.js";
import {commitRotation,previewRotation} from "../src/transformations/rotation.js";
import {createAttemptHistory,recordCast,undoLastCast} from "../src/core/attempt-history.js";
import {completedResult,starThresholds} from "../src/core/level-results.js";
import {tutorialSituation,tutorialHint} from "../src/levels/tutorial-guidance.js";
const commits={translate:commitTranslation,rotate:commitRotation};
const routes=[[[245,1,false],[120,1,true],[600,1,false]],[[345,1,false],[120,1,true],[600,1,false]]];
function cast(world,p,s){const tx=commits[s.type](world.room,p,s.objectId,s);assert.ok(tx.ok,tx.message);return tx;}
function replay(world,route){let p=createPlayer(world);for(const [n,move,jump] of route)for(let i=0;i<n;i++){p=stepPlayer(world,p,{move,jump:jump&&i===0});if(p.completed)return p;}return p;}
test("ordered two-cast routes transform the same object, reach the portal and earn three stars",()=>{
 for(const [i,[room,solution]] of [[FIND_THE_HINGE,HINGE_SOLUTION],[A_TIGHT_SQUEEZE,SQUEEZE_SOLUTION]].entries()){
  validateRoom(room);assert.deepEqual(starThresholds(room),{threeStar:2,twoStar:4});
  let w=createPhysicsWorld(room),p=createPlayer(w),h=createAttemptHistory();
  assert.equal(replay(w,routes[i]).completed,false);
  const reversed=commits[solution[1].type](room,p,solution[1].objectId,solution[1]);assert.equal(reversed.ok,false);
  for(const [j,s] of solution.entries()){
   const tx=cast(w,p,s);h=recordCast(h,w,p,null,tx.record);w=tx.physics;
   if(j===0)assert.equal(replay(w,routes[i]).completed,false);
  }
  const q=replay(w,routes[i]);assert.equal(q.completed,true,room.id);assert.equal(q.respawns,0);
  const result=completedResult(w.room,q,h);assert.equal(result.moves,2);assert.equal(result.stars,3);
  assert.equal(new Set(h.entries.map(e=>e.record.objectId)).size,1);
 }
});
test("docking uses exact geometry, prevents early or remote-centre rotations, and restores on undo",()=>{
 const r=FIND_THE_HINGE,w=createPhysicsWorld(r),p=createPlayer(w),id="socket-beam",rotate=HINGE_SOLUTION[1];
 assert.equal(dockedSocket(r,r.objects[0]),null);
 assert.equal(previewRotation(r,p,id,{...rotate,cx:6}).code,"not-docked");
 const near=cast(w,p,{...HINGE_SOLUTION[0],dx:10.9});
 assert.equal(dockedSocket(near.room,near.room.objects[0]),null);
 assert.equal(previewRotation(near.room,p,id,{...rotate,cx:16.9}).code,"not-docked");
 const t=cast(w,p,HINGE_SOLUTION[0]);assert.deepEqual(t.room.objects[0].hinge,[17,3]);
 assert.equal(dockedSocket(t.room,t.room.objects[0]).id,"bridge-socket");
 assert.match(previewTranslation(r,p,id,HINGE_SOLUTION[0]).mechanismEffects[0],/will dock/);
 assert.equal(previewRotation(t.room,p,id,{...rotate,cx:16}).code,"hinge");
 const frame=translatedFrame(t.room,t.transition,.5);assert.deepEqual(frame.objects[0].hinge,[11.5,3]);
 assert.deepEqual(translatedFrame(t.room,t.transition,0).objects[0].hinge,[6,3]);
 const h=recordCast(createAttemptHistory(),w,p,null,t.record),u=undoLastCast(h,p);
 assert.ok(u.ok);assert.equal(u.room,r);assert.equal(dockedSocket(u.room,u.room.objects[0]),null);
 assert.throws(()=>validateSockets({...r,sockets:[{...r.sockets[0],y:5}]}),/terrain anchor/);
});
test("translation sweep rejects a vertical plank across the low arch even if final position is clear",()=>{
 const r=A_TIGHT_SQUEEZE,w=createPhysicsWorld(r),p=createPlayer(w),id="clearance-plank";
 // Final position on the east platform, but the entire straight path crosses the arch.
 assert.equal(previewTranslation(r,p,id,{dx:30,dy:0}).code,"path-solid");
 assert.equal(previewRotation(r,p,id,{...SQUEEZE_SOLUTION[0],cx:12}).code,"hinge");
 const t=cast(w,p,SQUEEZE_SOLUTION[0]);assert.deepEqual(t.room.objects[0].hinge,[6,3]);
 const s=cast(t.physics,p,SQUEEZE_SOLUTION[1]);assert.deepEqual(s.room.objects[0].hinge,[23,3]);
});
test("live hints choose the correct next spell and update after partial translations",()=>{
 for(const [r,solution] of [[FIND_THE_HINGE,HINGE_SOLUTION],[A_TIGHT_SQUEEZE,SQUEEZE_SOLUTION]]){
  let w=createPhysicsWorld(r),p=createPlayer(w);
  for(const s of solution){
   const g=tutorialSituation(w.room);assert.equal(g.config.type,s.type);assert.equal(g.ready,false);
   assert.match(tutorialHint(w.room,p,5).text,/Enter these parameters yourself/);
   w=cast(w,p,{objectId:s.objectId,type:s.type,...g.raw}).physics;
  }
  assert.equal(tutorialSituation(w.room).ready,true);
 }
 const w=createPhysicsWorld(FIND_THE_HINGE),p=createPlayer(w),t=cast(w,p,{...HINGE_SOLUTION[0],dx:5});
 assert.deepEqual(tutorialSituation(t.room).raw,{dx:6,dy:0});
});
