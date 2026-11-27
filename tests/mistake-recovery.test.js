import test from "node:test";
import assert from "node:assert/strict";
import {rectangle,deepFreeze} from "../src/geometry/world.js";
import {createPhysicsWorld,blocked} from "../src/physics/collision.js";
import {createPlayer,stepPlayer} from "../src/physics/platformer.js";
import {isSafePosition,returnDestination,returnToSafety} from "../src/physics/recovery.js";
import {createAttemptHistory,rememberSafePosition,recordCast,undoLastCast,attemptSummary} from "../src/core/attempt-history.js";
import {commitTranslation} from "../src/transformations/translation.js";
import {commitRotation} from "../src/transformations/rotation.js";
import {commitEnlargement} from "../src/transformations/enlargement.js";
import {commitReflection} from "../src/transformations/reflection.js";
import {ACROSS_THE_BROOK,BROOK_SOLUTION} from "../src/levels/across-the-brook.js";
import {STUBBORN_GATE,GATE_SOLUTION} from "../src/levels/stubborn-gate.js";
import {LITTLE_CHEESY,CHEESY_SOLUTION} from "../src/levels/little-cheesy.js";
import {MISSING_BARREL,BARREL_SOLUTION} from "../src/levels/missing-barrel.js";
import {transformationFeedback} from "../src/ui/transformation-feedback.js";
function cast(h,w,p,fn,id,raw,last=null){
 const tx=fn(w.room,p,id,raw);assert.ok(tx.ok,tx.message);
 return {...tx,history:recordCast(h,w,p,last,tx.record)};
}
test("all four spell undos restore exact old world and safe player, retain charged record",()=>{
 for(const [room,solution,fn] of [[ACROSS_THE_BROOK,BROOK_SOLUTION,commitTranslation],[STUBBORN_GATE,GATE_SOLUTION,commitRotation],[LITTLE_CHEESY,CHEESY_SOLUTION,commitEnlargement],[MISSING_BARREL,BARREL_SOLUTION,commitReflection]]){
  const w=createPhysicsWorld(room),p=createPlayer(w),initial=createAttemptHistory();
  const tx=cast(initial,w,p,fn,solution.objectId,solution);
  assert.equal(tx.history.entries.length,1);
  assert.equal(initial.entries.length,0);
  const result=undoLastCast(tx.history,{...p,x:room.exit.x,y:room.exit.y,vx:7,vy:-3,respawns:4});
  assert.ok(result.ok,result.message);assert.equal(result.room,room);assert.equal(result.physics.room,room);
  assert.equal(result.player.x,p.x);assert.equal(result.player.y,p.y);assert.ok(isSafePosition(result.physics,result.player));
  assert.equal(result.player.vx,0);assert.equal(result.player.vy,0);assert.equal(result.player.buffer,0);assert.equal(result.player.respawns,4);
  assert.deepEqual(attemptSummary(result.history,result.player),{moves:1,undos:1,activeMoves:0,respawns:4,entries:[{record:tx.record,undone:true}]});
  assert.equal(undoLastCast(result.history,result.player).code,"nothing-to-undo");assert.equal(tx.history.entries[0].undone,false);
 }
});
test("multiple undo, branch after undo, and no move refund",()=>{
 const w=createPhysicsWorld(ACROSS_THE_BROOK),p=createPlayer(w);
 const a=cast(createAttemptHistory(),w,p,commitTranslation,"brook-beam",{dx:2,dy:0});
 const b=cast(a.history,a.physics,p,commitTranslation,"brook-beam",{dx:10,dy:0});
 const ub=undoLastCast(b.history,p);assert.equal(ub.room,a.room);
 const c=cast(ub.history,ub.physics,ub.player,commitTranslation,"brook-beam",{dx:9.5,dy:0});
 const uc=undoLastCast(c.history,p);assert.equal(uc.room,a.room);
 const ua=undoLastCast(uc.history,p);assert.equal(ua.room,w.room);
 assert.deepEqual(attemptSummary(ua.history,p).entries.map(e=>e.undone),[true,true,true]);
 assert.equal(attemptSummary(ua.history,p).moves,3);
 assert.equal(undoLastCast(a.history,{...p,completed:true}).code,"attempt-ended");
});
test("airborne snapshot falls back to last valid grounded position, not the unsafe airborne pose",()=>{
 const w=createPhysicsWorld(ACROSS_THE_BROOK),p=createPlayer(w);
 const air={...p,x:10,y:6,grounded:false,vy:-5,buffer:.1};
 const last=rememberSafePosition(w,{...p,x:10,y:3});
 const tx=cast(createAttemptHistory(),w,air,commitTranslation,"brook-beam",{dx:12,dy:0},last);
 const u=undoLastCast(tx.history,{...p,x:20,y:3.5,respawns:2});
 assert.ok(u.ok);assert.equal(u.player.x,10);assert.equal(u.player.y,3);assert.equal(u.player.vy,0);
 assert.ok(isSafePosition(u.physics,u.player));assert.equal(u.player.buffer,0);
 assert.equal(rememberSafePosition(w,air,{x:20,y:1}),null);
 assert.equal(isSafePosition(w,{x:NaN,y:3}),false);
});
function recoveryRoom(){
 return deepFreeze({bounds:{minX:0,maxX:20,minY:0,maxY:10},spawn:{x:2,y:1},exit:{x:19,y:1,width:1,height:2},
 terrain:[{id:"floor",vertices:rectangle(0,0,20,1)}],hazards:[{id:"water",vertices:rectangle(14,1,3,2)}],
 objects:[{id:"piece",vertices:rectangle(10,1,1.5,1),permissions:["translate"],support:"supported"}],
 checkpoints:[{id:"first",x:6,y:1},{id:"unvisited",x:18,y:1}],ladders:[]});
}
test("automatic and manual return reject unsafe checkpoints, use valid spawn, and never use unvisited points",()=>{
 const room=recoveryRoom(),w=createPhysicsWorld(room),p=createPlayer(w);
 const cp=returnToSafety(w,{...p,x:12,checkpoint:"first",vx:7,buffer:.1});
 assert.ok(cp.ok);assert.equal(cp.code,"checkpoint");assert.equal(cp.player.x,6);assert.equal(cp.player.vx,0);assert.equal(cp.player.respawns,1);
 const tx=commitTranslation(room,{...p,x:12},"piece",{dx:-4.75,dy:0});assert.ok(tx.ok,tx.message);
 assert.equal(returnDestination(tx.physics,{...p,checkpoint:"first"}).kind,"spawn");
 const back=returnToSafety(tx.physics,{...p,checkpoint:"first"});assert.equal(back.player.checkpoint,null);assert.equal(back.player.x,2);
 assert.equal(returnToSafety(w,{...p,completed:true}).code,"attempt-ended");
 assert.equal(returnDestination(w,p).kind,"spawn");
});
test("blocked spawn triggers recovery-required state; undo repairs without refunding cast",()=>{
 const room=recoveryRoom(),w=createPhysicsWorld(room),p={...createPlayer(w),x:12,grounded:true};
 const tx=cast(createAttemptHistory(),w,p,commitTranslation,"piece",{dx:-8.75,dy:0});
 assert.ok(blocked(tx.physics,room.spawn));
 assert.equal(returnDestination(tx.physics,p),null);
 const manual=returnToSafety(tx.physics,p);assert.equal(manual.code,"reset-required");assert.equal(manual.player.blockedRespawn,true);assert.equal(manual.player.respawns,0);
 const fallen=stepPlayer(tx.physics,{...p,x:15,y:1,grounded:false},{});
 assert.equal(fallen.event,"reset-required");assert.equal(fallen.blockedRespawn,true);
 const frozen=stepPlayer(tx.physics,fallen,{move:1,jump:true});assert.equal(frozen.x,fallen.x);assert.equal(frozen.vy,0);
 const undo=undoLastCast(tx.history,fallen);assert.ok(undo.ok,undo.message);
 assert.equal(undo.room,room);assert.equal(undo.player.x,12);assert.equal(undo.player.blockedRespawn,false);
 assert.ok(isSafePosition(undo.physics,undo.player));assert.equal(attemptSummary(undo.history,undo.player).moves,1);
});
test("automatic fall preserves current transformed world and committed history",()=>{
 const w=createPhysicsWorld(ACROSS_THE_BROOK),p=createPlayer(w);
 const tx=cast(createAttemptHistory(),w,p,commitTranslation,"brook-beam",{dx:12,dy:0});
 const fallen=stepPlayer(tx.physics,{...p,x:20,y:1,grounded:false},{});
 assert.equal(fallen.event,"respawn");assert.equal(fallen.x,1.5);assert.equal(fallen.respawns,1);
 assert.equal(tx.physics.room.objects[0].vertices[0][0],15);
 assert.equal(attemptSummary(tx.history,fallen).moves,1);assert.equal(attemptSummary(tx.history,fallen).undos,0);
});
test("invalid feedback is specific, free and does not reveal level answers",()=>{
 for(const [type,phrase] of [["translate",/column vector/],["rotate",/angle and direction/],["enlarge",/positive scale factor/],["reflect",/equation of the form/]]){
  const message=transformationFeedback({ok:false,code:"parameters",message:"Enter all required mathematical parameters."},type);
  assert.match(message,phrase);assert.match(message,/No move used/);
 }
 assert.match(transformationFeedback({ok:false,code:"player-supported",message:"Move off."},"reflect"),/step off/);
 assert.match(transformationFeedback({ok:false,code:"path-bounds",message:"Outside room."},"rotate"),/entire arc/);
 assert.match(transformationFeedback({ok:false,code:"unsupported",message:"No support."},"enlarge"),/supporting surface/);
 assert.equal(transformationFeedback({ok:true,message:"Clear."},"translate"),"Clear.");
});
