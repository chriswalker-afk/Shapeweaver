import test from "node:test";
import assert from "node:assert/strict";
import {MIND_THE_GAP,ABOVE_AND_BELOW,LADDER_SOLUTION,ABOVE_SOLUTION} from "../src/levels/garden-finale.js";
import {validateRoom,GATEHOUSE_PREVIEW} from "../src/levels/gatehouse-preview.js";
import {createPhysicsWorld,blocked} from "../src/physics/collision.js";
import {createPlayer,stepPlayer} from "../src/physics/platformer.js";
import {ladderSegment,roomLadders} from "../src/mechanisms/transformable-ladders.js";
import {commitTranslation} from "../src/transformations/translation.js";
import {commitRotation,previewRotation} from "../src/transformations/rotation.js";
import {commitEnlargement} from "../src/transformations/enlargement.js";
import {commitReflection} from "../src/transformations/reflection.js";
import {createAttemptHistory,recordCast,undoLastCast} from "../src/core/attempt-history.js";
import {completedResult,starThresholds} from "../src/core/level-results.js";
import {tutorialSituation,tutorialHint} from "../src/levels/tutorial-guidance.js";
const commits={translate:commitTranslation,rotate:commitRotation,enlarge:commitEnlargement,reflect:commitReflection};
const routes=[[[295,1,false,0],[60,1,true,0],[60,0,false,0],[40,1,false,0],[1,0,true,0],[300,0,false,1],[1,1,true,0],[300,1,false,0]],[[142,1,false,0],[90,1,true,0],[20,0,false,0],[90,1,true,0],[450,1,false,0]]];
function cast(world,p,s){const tx=commits[s.type](world.room,p,s.objectId,s);assert.ok(tx.ok,tx.message);return tx;}
function replay(world,route){let p=createPlayer(world);for(const [n,move,jump,climb] of route)for(let i=0;i<n;i++){p=stepPlayer(world,p,{move,jump:jump&&i===0,climb});if(p.completed)return p;}return p;}
test("both finale levels complete with two casts in either order without respawning",()=>{
 for(const [i,[room,solution]] of [[MIND_THE_GAP,LADDER_SOLUTION],[ABOVE_AND_BELOW,ABOVE_SOLUTION]].entries()){
  validateRoom(room);assert.deepEqual(starThresholds(room),{threeStar:2,twoStar:4});
  for(const order of [solution,[...solution].reverse()]){
   let w=createPhysicsWorld(room),p=createPlayer(w),h=createAttemptHistory();
   for(const s of order){const tx=cast(w,p,s);h=recordCast(h,w,p,null,tx.record);w=tx.physics;}
   const q=replay(w,routes[i]);assert.equal(q.completed,true,room.id);assert.equal(q.respawns,0);
   const result=completedResult(w.room,q,h);assert.equal(result.moves,2);assert.equal(result.stars,3);
  }
 }
});
test("the recorded routes need both intended casts",()=>{
 for(const [i,[room,solution]] of [[MIND_THE_GAP,LADDER_SOLUTION],[ABOVE_AND_BELOW,ABOVE_SOLUTION]].entries()){
  const w=createPhysicsWorld(room),p=createPlayer(w);assert.equal(replay(w,routes[i]).completed,false);
  for(const s of solution)assert.equal(replay(cast(w,p,s).physics,routes[i]).completed,false,s.objectId);
 }
});
test("rotated ladder has real climb geometry, no solid blocking, and safe undo",()=>{
 const room=MIND_THE_GAP,w=createPhysicsWorld(room),p=createPlayer(w),s=LADDER_SOLUTION[0];
 assert.equal(roomLadders(room).length,0);assert.equal(ladderSegment(room.objects[0]),null);
 const t=cast(w,p,s),segment=t.physics.ladders[0];
 assert.equal(segment.id,"garden-ladder");assert.equal(segment.x,23.7);assert.equal(segment.bottom,7);assert.equal(segment.top,12);
 assert.equal(blocked(t.physics,{x:23.5,y:8}),false);
 const climbing={...p,x:23.5,y:8,climbing:true,grounded:false};
 const q=stepPlayer(t.physics,climbing,{climb:1});assert.equal(q.climbing,true);assert.ok(q.y>8);
 const denied=previewRotation(t.room,climbing,s.objectId,{...s,direction:"clockwise"});assert.equal(denied.code,"player-supported");
 const reverse=cast(t.physics,p,{...s,direction:"clockwise"});assert.equal(reverse.physics.ladders.length,0);
 const u=undoLastCast(recordCast(createAttemptHistory(),w,p,null,t.record),p);
 assert.ok(u.ok);assert.equal(u.room,room);assert.equal(u.physics.ladders.length,0);assert.equal(u.history.entries[0].undone,true);
 assert.deepEqual(roomLadders(GATEHOUSE_PREVIEW),GATEHOUSE_PREVIEW.ladders);
});
test("horizontal reflection preserves x and matches the physical raised platform",()=>{
 const w=createPhysicsWorld(ABOVE_AND_BELOW),p=createPlayer(w),t=cast(w,p,ABOVE_SOLUTION[0]);
 const o=t.room.objects[0];assert.deepEqual([...o.vertices].sort(),[[12,4.5],[12,5],[19.5,4.5],[19.5,5]].sort());
 assert.equal(t.record.line,"y = 3");
 const u=undoLastCast(recordCast(createAttemptHistory(),w,p,null,t.record),p);
 assert.ok(u.ok);assert.equal(u.room,ABOVE_AND_BELOW);
});
test("worked hints adapt to remaining geometry and never consume a move",()=>{
 for(const [room,solution] of [[MIND_THE_GAP,LADDER_SOLUTION],[ABOVE_AND_BELOW,ABOVE_SOLUTION]]){
  let w=createPhysicsWorld(room),p=createPlayer(w);
  for(const s of solution){
   const g=tutorialSituation(w.room);assert.equal(g.config.objectId,s.objectId);assert.equal(g.ready,false);
   assert.match(tutorialHint(w.room,p,5).text,/Enter these parameters yourself/);
   const tx=cast(w,p,{objectId:s.objectId,type:s.type,...g.raw});w=tx.physics;
  }
  assert.equal(tutorialSituation(w.room).ready,true);
 }
});
