import test from "node:test";
import assert from "node:assert/strict";
import {starThresholds,starsForMoves,describeCast,completedResult} from "../src/core/level-results.js";
import {createBestResults,BEST_RESULTS_KEY} from "../src/core/best-results.js";
import {createAttemptHistory,recordCast,undoLastCast} from "../src/core/attempt-history.js";
import {createPhysicsWorld} from "../src/physics/collision.js";
import {createPlayer} from "../src/physics/platformer.js";
import {commitTranslation} from "../src/transformations/translation.js";
import {ACROSS_THE_BROOK,BROOK_SOLUTION} from "../src/levels/across-the-brook.js";
import {STUBBORN_GATE} from "../src/levels/stubborn-gate.js";
import {LITTLE_CHEESY} from "../src/levels/little-cheesy.js";
import {MISSING_BARREL} from "../src/levels/missing-barrel.js";
import {GATEHOUSE_PREVIEW} from "../src/levels/gatehouse-preview.js";

test("all four tutorial targets, rating boundaries and configurable allowance",()=>{
 for(const room of [ACROSS_THE_BROOK,STUBBORN_GATE,LITTLE_CHEESY,MISSING_BARREL]){
  const t=starThresholds(room);assert.deepEqual(t,{threeStar:1,twoStar:3});
  assert.deepEqual([0,1,2,3,4,100].map(n=>starsForMoves(n,t)),[3,3,2,2,1,1]);
 }
 const t=starThresholds({id:"future",tutorial:{efficientMoves:4,twoStarMoves:7}});
 assert.deepEqual([3,4,5,7,8].map(n=>starsForMoves(n,t)),[3,3,2,2,1]);
 assert.equal(starThresholds(GATEHOUSE_PREVIEW),null);
 assert.throws(()=>starsForMoves(-1,t));assert.throws(()=>starsForMoves(1.2,t));assert.throws(()=>starThresholds({id:"bad",tutorial:{efficientMoves:4,twoStarMoves:3}}));
});
test("formal descriptions include complete mathematical parameters and signed components",()=>{
 assert.deepEqual(describeCast({type:"translate",dx:4,dy:-2}),{name:"Translation",text:"Column vector (4, −2)",vector:["4","−2"]});
 assert.deepEqual(describeCast({type:"translate",dx:-0,dy:0}).vector,["0","0"]);
 assert.equal(describeCast({type:"rotate",angle:270,direction:"clockwise",centre:[-2,3]}).text,"270° clockwise about (−2, 3)");
 assert.equal(describeCast({type:"enlarge",factor:.5,centre:[3,-1]}).text,"Scale factor 0.5, centre (3, −1)");
 assert.equal(describeCast({type:"reflect",line:"y = -x"}).text,"In the line y = −x");
});
test("unfinished, blocked and practice attempts never earn results",()=>{
 const history=createAttemptHistory(),room=ACROSS_THE_BROOK,p=createPlayer(createPhysicsWorld(room));
 assert.equal(completedResult(room,p,history),null);
 assert.equal(completedResult(room,{...p,completed:true,blockedRespawn:true},history),null);
 assert.equal(completedResult(GATEHOUSE_PREVIEW,{...p,completed:true},history),null);
 assert.equal(completedResult(room,{...p,completed:true},history).stars,3); // genuine better-than-target routes are accepted
});
test("completion snapshot includes every cast, undone casts cost their original move, returns and hint/time data do not affect stars",()=>{
 const room=ACROSS_THE_BROOK,w=createPhysicsWorld(room),p=createPlayer(w);
 const a=commitTranslation(room,p,BROOK_SOLUTION.objectId,{dx:2,dy:0});assert.ok(a.ok);
 const history=recordCast(createAttemptHistory(),w,p,null,a.record);
 const undo=undoLastCast(history,p);assert.ok(undo.ok);
 const b=commitTranslation(undo.room,undo.player,BROOK_SOLUTION.objectId,BROOK_SOLUTION);assert.ok(b.ok);
 const finalHistory=recordCast(undo.history,undo.physics,undo.player,null,b.record);
 const result=completedResult(b.room,{...p,completed:true,respawns:13,elapsed:9999,hints:3},finalHistory);
 assert.equal(result.moves,2);assert.equal(result.stars,2);assert.equal(result.undos,1);assert.equal(result.activeMoves,1);assert.equal(result.returns,13);
 assert.deepEqual(result.entries.map(e=>[e.number,e.objectLabel,e.vector,e.undone]),[[1,"Timber beam",["2","0"],true],[2,"Timber beam",["12","0"],false]]);
 assert.equal(completedResult(b.room,{...p,completed:true,respawns:0},finalHistory).stars,result.stars);
 assert.ok(Object.isFrozen(result.entries));assert.ok(Object.isFrozen(result.entries[0].vector));assert.ok(Object.isFrozen(result.thresholds));
 assert.equal(history.entries[0].undone,false);assert.equal(undo.history.entries[0].undone,true);
});
const score=(id,moves,stars)=>({levelId:id,moves,stars});
function memoryStorage(initial=null){
 let raw=initial;
 return {getItem:key=>{assert.equal(key,BEST_RESULTS_KEY);return raw;},setItem:(key,value)=>{assert.equal(key,BEST_RESULTS_KEY);raw=value;}};
}
test("best scores persist per level and do not downgrade on worse attempts",()=>{
 const localStorage=memoryStorage(),a=createBestResults({localStorage});
 assert.equal(a.get("gatehouse-01"),null);
 assert.deepEqual(a.record(score("gatehouse-01",5,1)),{best:{moves:5,stars:1},improved:true,persisted:true});
 assert.deepEqual(a.record(score("gatehouse-01",2,2)).best,{moves:2,stars:2});
 assert.equal(a.record(score("gatehouse-01",6,1)).improved,false);
 assert.equal(a.record(score("gatehouse-01",2,2)).improved,false);
 assert.equal(a.record(score("gatehouse-02",1,3)).improved,true);
 const b=createBestResults({localStorage});assert.deepEqual(b.get("gatehouse-01"),{moves:2,stars:2});
 assert.deepEqual(b.get("gatehouse-02"),{moves:1,stars:3});
 const copy=b.get("gatehouse-01");copy.moves=99;assert.equal(b.get("gatehouse-01").moves,2);
 assert.equal(b.record(score("gatehouse-01",-1,3)),null);
 assert.equal(b.record(score("gatehouse-01",1,4)),null);
 assert.equal(b.record(null),null);
 assert.deepEqual(JSON.parse(localStorage.getItem(BEST_RESULTS_KEY)),{version:1,levels:{"gatehouse-01":{moves:2,stars:2},"gatehouse-02":{moves:1,stars:3}}});
});
test("corrupt, unavailable and read-only localStorage safely fall back to session bests",()=>{
 const corrupt=createBestResults({localStorage:memoryStorage("not JSON")});
 assert.equal(corrupt.get("gatehouse-01"),null);assert.equal(corrupt.record(score("gatehouse-01",1,3)).persisted,true);
 const malformed=createBestResults({localStorage:memoryStorage(JSON.stringify({version:1,levels:{ok:{moves:1,stars:3},bad:{moves:-1,stars:4}}}))});
 assert.deepEqual(malformed.get("ok"),{moves:1,stars:3});assert.equal(malformed.get("bad"),null);
 for(const view of [{},{get localStorage(){throw Error("blocked");}},{localStorage:{getItem:()=>null,setItem(){throw Error("quota");}}}]){
  const store=createBestResults(view),first=store.record(score("gatehouse-01",3,2));
  assert.equal(first.persisted,false);assert.deepEqual(store.get("gatehouse-01"),{moves:3,stars:2});
  assert.equal(store.record(score("gatehouse-01",1,3)).improved,true);
 }
});
