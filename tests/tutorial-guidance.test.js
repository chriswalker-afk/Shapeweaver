import test from "node:test";
import assert from "node:assert/strict";
import {HINT_STAGES,tutorialSituation,tutorialHint,contextualGuide} from "../src/levels/tutorial-guidance.js";
import {ACROSS_THE_BROOK,BROOK_SOLUTION} from "../src/levels/across-the-brook.js";
import {STUBBORN_GATE,GATE_SOLUTION} from "../src/levels/stubborn-gate.js";
import {LITTLE_CHEESY,CHEESY_SOLUTION} from "../src/levels/little-cheesy.js";
import {MISSING_BARREL,BARREL_SOLUTION} from "../src/levels/missing-barrel.js";
import {GATEHOUSE_PREVIEW} from "../src/levels/gatehouse-preview.js";
import {commitTranslation} from "../src/transformations/translation.js";
import {commitRotation} from "../src/transformations/rotation.js";
import {commitEnlargement} from "../src/transformations/enlargement.js";
import {commitReflection} from "../src/transformations/reflection.js";
import {createPhysicsWorld} from "../src/physics/collision.js";
import {createPlayer} from "../src/physics/platformer.js";
const cases=[
 [ACROSS_THE_BROOK,BROOK_SOLUTION,commitTranslation,/Enter column vector \(12, 0\)/],
 [STUBBORN_GATE,GATE_SOLUTION,commitRotation,/Use 90° anticlockwise about \(14, 8\)/],
 [LITTLE_CHEESY,CHEESY_SOLUTION,commitEnlargement,/9 ÷ 3 = 3.*Centre \(25, 3\)/],
 [MISSING_BARREL,BARREL_SOLUTION,commitReflection,/Reflect in x = 15/]
];
const player=r=>createPlayer(createPhysicsWorld(r));
test("five stages, complete mathematical answer only on final request, no mutation",()=>{
 assert.deepEqual(HINT_STAGES,["Obstacle","Useful object","Transformation","Mathematical reasoning","Worked solution"]);
 for(const [room,solution,commit,answer] of cases){
  const p=player(room),before=JSON.stringify(room),snapshot=JSON.stringify(p),s=tutorialSituation(room);
  assert.equal(s.ready,false);assert.equal(s.config.objectId,solution.objectId);
  for(let i=1;i<=5;i++){
   const h=tutorialHint(room,p,i,s);assert.equal(h.stage,i);assert.equal(h.label,HINT_STAGES[i-1]);assert.ok(h.text.length>20);
   if(i<5)assert.doesNotMatch(h.text,answer);else{assert.match(h.text,answer);assert.match(h.text,/Enter these parameters yourself/);}
  }
  assert.equal(tutorialHint(room,p,0),null);assert.equal(tutorialHint(room,p,6),null);
  assert.equal(JSON.stringify(room),before);assert.equal(JSON.stringify(p),snapshot);
  const tx=commit(room,p,solution.objectId,s.raw);assert.ok(tx.ok,tx.message);
  assert.equal(tutorialSituation(tx.room).ready,true);
  assert.match(tutorialHint(tx.room,p,5).text,/already in a useful position/);
  assert.equal(contextualGuide(tx.room,p,null).step,"Traverse");
 }
 assert.equal(tutorialSituation(GATEHOUSE_PREVIEW),null);
 assert.equal(tutorialHint(GATEHOUSE_PREVIEW,player(GATEHOUSE_PREVIEW),1),null);
});
test("live translation and enlargement hints calculate remaining moves, including fractional factors",()=>{
 const p=player(ACROSS_THE_BROOK),a=commitTranslation(ACROSS_THE_BROOK,p,"brook-beam",{dx:2,dy:0});
 assert.ok(a.ok);assert.deepEqual(tutorialSituation(a.room).raw,{dx:10,dy:0});
 assert.match(tutorialHint(a.room,p,4).text,/A \(5, 3\)/);
 assert.match(tutorialHint(a.room,p,5).text,/column vector \(10, 0\)/);
 const alternative=commitTranslation(ACROSS_THE_BROOK,p,"brook-beam",{dx:11.5,dy:0});
 assert.ok(alternative.ok);assert.equal(tutorialSituation(alternative.room).ready,true);
 const q=player(LITTLE_CHEESY),b=commitEnlargement(LITTLE_CHEESY,q,"cheesy-wedge",{factor:2,cx:25,cy:3});
 assert.ok(b.ok);assert.match(tutorialHint(b.room,q,4).text,/6 units high/);
 assert.deepEqual(tutorialSituation(b.room).raw,{factor:1.5,cx:25,cy:3});
 assert.match(tutorialHint(b.room,q,5).text,/9 ÷ 6 = 1.5/);
 const small=commitEnlargement(LITTLE_CHEESY,q,"cheesy-wedge",{factor:.5,cx:25,cy:3});
 assert.ok(small.ok);assert.match(tutorialHint(small.room,q,5).text,/intermediate step is factor 3/);
});
test("reflection uses stable labels and current position after a corrective cast",()=>{
 const p=player(MISSING_BARREL),first=commitReflection(MISSING_BARREL,p,"missing-barrel",{line:"x=4"});
 assert.ok(first.ok);assert.deepEqual(tutorialSituation(first.room).raw,{line:"x = 14.5"});
 assert.match(tutorialHint(first.room,p,4).text,/A = \(5, 3\).*A′ is \(24, 3\)/);
 assert.match(tutorialHint(first.room,p,5).text,/Reflect in x = 14.5/);
 const next=commitReflection(first.room,p,"missing-barrel",tutorialSituation(first.room).raw);
 assert.ok(next.ok);assert.equal(tutorialSituation(next.room).ready,true);
});
test("worked answer validates against current apprentice and never promises an obstructed cast",()=>{
 const room=ACROSS_THE_BROOK,p={...player(room),x:13,y:3.5};
 const h=tutorialHint(room,p,5);assert.match(h.text,/not currently clear/);
 assert.match(h.text,/Undo \/ Reset/);assert.doesNotMatch(h.text,/Enter these parameters yourself/);
});
test("context follows interaction and recovery without gating actions",()=>{
 const room=STUBBORN_GATE,p=player(room);
 assert.equal(contextualGuide(room,p,null).step,"Explore");
 assert.equal(contextualGuide(room,p,null,{picking:true}).step,"Read coordinates");
 assert.equal(contextualGuide(room,p,{active:true}).step,"Select object");
 assert.equal(contextualGuide(room,p,{active:true,selected:"stubborn-gate"}).step,"Choose transformation");
 const inspection={active:true,selected:"stubborn-gate",type:"rotate"};
 assert.match(contextualGuide(room,p,inspection).text,/whole arc/);
 assert.equal(contextualGuide(room,p,{...inspection,preview:{ok:true}}).step,"Apply or revise");
 assert.match(contextualGuide(room,p,{...inspection,preview:{ok:false}}).text,/no moves/);
 assert.equal(contextualGuide(room,p,null,{casting:true}).step,"Cast");
 assert.match(contextualGuide(room,{...p,blockedRespawn:true},null,{canUndo:true}).text,/Undo or Reset/);
 assert.equal(contextualGuide(room,{...p,completed:true},null,{moves:2}).step,"Complete");
});
