// Release audit: independent coordinate oracle, live transactions, recovery,
// metadata and exported solution replay. No gameplay dependencies on this file.
import {createWorkshopSession,verifyWorkshopBundle} from "../workshop/replay.js";
import {createPhysicsWorld} from "../src/physics/collision.js";
import {isSafePosition,returnToSafety} from "../src/physics/recovery.js";
import {createAttemptHistory,recordCast,undoLastCast,attemptSummary} from "../src/core/attempt-history.js";
import {completedResult,starsForMoves,starThresholds} from "../src/core/level-results.js";
import {referencePoints} from "../src/transformations/preview-math.js";
import {commitTranslation} from "../src/transformations/translation.js";
import {commitRotation} from "../src/transformations/rotation.js";
import {commitEnlargement} from "../src/transformations/enlargement.js";
import {commitReflection} from "../src/transformations/reflection.js";
const commits={translate:commitTranslation,rotate:commitRotation,enlarge:commitEnlargement,reflect:commitReflection};
const near=(a,b)=>Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a),Math.abs(b));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const pointEqual=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===2&&b.length===2&&a.every((v,i)=>near(v,b[i]));
const kinds=["translate","rotate","enlarge","reflect"];
const sorted=a=>[...new Set(a)].sort();
const numeric=v=>typeof v==="string"&&v.includes("/")?v.split("/").map(Number).reduce((a,b)=>a/b):Number(v);
const lineKey=s=>String(s).toLowerCase().replace(/\s/g,"").replace(/−/g,"-");
const spellRecord=(r,c)=>r.type===c.type&&r.objectId===c.objectId&&(
 c.type==="translate"?near(r.dx,numeric(c.dx))&&near(r.dy,numeric(c.dy)):
 c.type==="rotate"?near(r.angle,numeric(c.angle))&&r.direction===c.direction&&pointEqual(r.centre,[numeric(c.cx),numeric(c.cy)]):
 c.type==="enlarge"?near(r.factor,numeric(c.factor))&&pointEqual(r.centre,[numeric(c.cx),numeric(c.cy)]):
 c.type==="reflect"?lineKey(r.line)===lineKey(c.line):false);

/** Independent matrix/trigonometric oracle. Deliberately does not use the
 * production transformPoint/previewGeometry implementations. */
export function expectedPoint([x,y],record){
 if(record.type==="translate")return [x+record.dx,y+record.dy];
 if(record.type==="rotate"){
  const [cx,cy]=record.centre,t=record.angle*Math.PI/180*(record.direction==="clockwise"?-1:1),u=x-cx,v=y-cy;
  return [cx+u*Math.cos(t)-v*Math.sin(t),cy+u*Math.sin(t)+v*Math.cos(t)];
 }
 if(record.type==="enlarge"){
  const [cx,cy]=record.centre,k=record.factor;
  return [k*x+(1-k)*cx,k*y+(1-k)*cy];
 }
 if(record.type==="reflect"){
  const l=lineKey(record.line);
  if(l==="y=x")return [y,x];
  if(l==="y=-x")return [-y,-x];
  if(/^x=/.test(l))return [2*Number(l.slice(2))-x,y];
  if(/^y=/.test(l))return [x,2*Number(l.slice(2))-y];
 }
 throw Error("Unknown coordinate oracle transformation");
}
export function exactImageErrors(before,after,record){
 if(!before||!after)return ["Missing transformed object"];
 const a=referencePoints(before),b=new Map(referencePoints(after).map(p=>[p.id,p.point])),errors=[];
 if(a.length!==b.size||a.some(p=>!b.has(p.id)))return ["Reference correspondence changed"];
 for(const p of a)if(!pointEqual(b.get(p.id),expectedPoint(p.point,record)))errors.push("Incorrect coordinate image: "+before.id+" / "+p.id);
 return errors;
}
function unchangedGeometry(o){return {vertices:o.vertices,vertexIds:o.vertexIds,hinge:o.hinge,fixedCentre:o.fixedCentre};}

/** All authored levels must be represented once. The advertised spells must
 * agree with the actual selectable capabilities, not merely the chosen answer. */
export function auditCatalog(levels,chapters,primary,alternatives){
 const errors=[],check=(ok,message)=>{if(!ok)errors.push(message);};
 check(same(levels.map(l=>l.number),Array.from({length:36},(_,i)=>i+1)),"Expected every level 1–36");
 check(same(primary.map(f=>f.number),levels.map(l=>l.number)),"Primary fixtures are incomplete, duplicated or unordered");
 check(new Set(levels.map(l=>l.id)).size===levels.length,"Duplicate level ID");
 check(new Set(levels.map(l=>l.route)).size===levels.length,"Duplicate route");
 check(chapters.length===7&&same(chapters.flatMap(c=>Array.from({length:c.last-c.first+1},(_,i)=>c.first+i)),levels.map(l=>l.number)),"Chapter boundaries are incomplete");
 const totals=Object.fromEntries(kinds.map(k=>[k,0]));
 for(const l of levels){
  const f=primary.find(v=>v.number===l.number),c=chapters.find(v=>v.id===l.chapter),r=l.room;
  check(c&&l.number>=c.first&&l.number<=c.last,"Wrong chapter: "+l.id);
  check(r.id===l.id&&r.number===l.number&&r.chapter===l.chapter&&r.title===l.title&&l.route==="level"+l.number,"Inconsistent room metadata: "+l.id);
  check([l.math,l.puzzle].every(n=>Number.isInteger(n)&&n>=1&&n<=5),"Invalid difficulty: "+l.id);
  const allowed=sorted(r.objects.filter(o=>!o.decorative).flatMap(o=>o.permissions??[]));
  check(same(sorted(l.spells),allowed)&&new Set(l.spells).size===l.spells.length,"Spell metadata differs from object permissions: "+l.id);
  check(f&&starThresholds(r)?.threeStar===f.casts.length,"Incorrect three-star target: "+l.id);
  for(const route of [f,...alternatives.filter(v=>v.number===l.number)].filter(Boolean)){
   for(const cast of route.casts)check(l.spells.includes(cast.type)&&r.objects.some(o=>o.id===cast.objectId&&o.permissions?.includes(cast.type)),"Fixture uses unavailable spell: "+l.id);
   if(route.segments)check(route.segments.length===route.casts.length&&same(route.route,route.segments.flat()),"Fixture chronology mismatch: "+l.id);
  }
  for(const k of l.spells)if(k in totals)totals[k]++;
 }
 check(alternatives.every(a=>levels.some(l=>l.number===a.number)),"Alternative fixture has no released level");
 check(new Set(alternatives.map(a=>a.number+":"+a.name)).size===alternatives.length,"Duplicate alternative fixture");
 check(Object.values(totals).every(n=>n>0),"Missing spell coverage");
 return {levels:levels.length,chapters:chapters.length,availableStars:levels.length*3,spellLevels:totals,errors};
}

/** The workshop's export verifier reconstructs a fresh session. Use an
 * untouched canonical session, and fork the recovery history at each cast
 * so checking Undo/Return cannot accidentally make a route pass. */
export function auditIntegrityRoute(level,fixture,actions){
 const errors=[],check=(ok,message)=>{if(!ok)errors.push(message);};
 let casts=0,images=0,undos=0,returns=0,resetRequired=0,previewChecks=0,bundleVerified=false,history=createAttemptHistory(),s;
 try{
  s=createWorkshopSession(level.room);
  for(const action of actions){
   if(s.player.completed)break;
   if(action.kind==="move"){
    const [ticks,move,jump,climb=0]=action.segment;
    for(let i=0;i<ticks&&!s.player.completed;i++){
     const step=s.step({move,jump:Boolean(jump&&i===0),climb});
     if(!step.ok)throw Error("Movement rejected: "+step.message);
    }
    continue;
   }
   const c=action.cast,before=s.room,p=s.player,world=createPhysicsWorld(before),snapshot=JSON.stringify(before),pose=JSON.stringify(p),summary=s.summary(),actionSnapshot=JSON.stringify(s.actions),prefix="cast "+(casts+1)+": ";
   const preview=s.preview(c.type,c.objectId,c);
   check(preview.ok,prefix+"preview rejected");
   check(!commits[c.type](before,p,c.objectId,{}).ok,prefix+"missing parameters accepted");
   check(JSON.stringify(s.room)===snapshot&&JSON.stringify(s.player)===pose&&same(s.summary(),summary)&&JSON.stringify(s.actions)===actionSnapshot,prefix+"preview or rejected input changed attempt");
   previewChecks++;
   const tx=s.cast(c.type,c.objectId,c);
   if(!tx.ok)throw Error(prefix+"commit rejected: "+tx.message);
   casts++;
   check(spellRecord(tx.record,c),prefix+"committed description differs from requested mathematics");
   check(JSON.stringify(before)===snapshot,prefix+"source snapshot mutated");
   check(s.summary().moves===summary.moves+1,prefix+"successful cast not counted exactly once");
   const attached=before.objects.filter(o=>o.attachedTo===c.objectId).map(o=>o.id);
   const moved=new Set([c.objectId,...attached]);
   check(same(sorted(tx.record.attachedIds??[]),sorted(attached)),prefix+"dependent IDs differ");
   for(const o of before.objects){
    const after=s.room.objects.find(v=>v.id===o.id);
    if(!after){errors.push(prefix+"object disappeared: "+o.id);continue;}
    if(moved.has(o.id)){
     images+=referencePoints(o).length;
     errors.push(...exactImageErrors(o,after,tx.record).map(e=>prefix+e));
     const shown=o.id===c.objectId?preview.geometry:preview.attachedImages?.find(v=>v.id===o.id)?.geometry;
     check(shown&&same(shown.vertices,after.vertices)&&(!o.hinge||same(shown.hinge,after.hinge)),prefix+"preview and committed image differ: "+o.id);
    }else check(same(unchangedGeometry(o),unchangedGeometry(after)),prefix+"unselected geometry changed: "+o.id);
   }
   for(const k of ["terrain","hazards","spawn","exit","bounds","checkpoints","ladders","deliveries"])check(same(before[k],s.room[k]),prefix+"authored geometry changed: "+k);
   history=recordCast(history,world,p,null,tx.record);
   const u=undoLastCast(history,s.player);
   check(u.ok,prefix+"undo could not recover prior snapshot");
   if(u.ok){
    undos++;
    check(same(u.room,before)&&isSafePosition(u.physics,u.player),prefix+"undo failed to restore geometry and safe pose");
    const a=attemptSummary(u.history,u.player);
    check(a.moves===casts&&a.undos===1&&a.activeMoves===casts-1,prefix+"undo incorrectly erased the move");
   }
   // A return cannot teleport to an unvisited checkpoint. Compare with the
   // only legitimate destinations in the committed geometry.
   const cp=tx.physics.checkpoints.find(v=>v.id===s.player.checkpoint),expected=isSafePosition(tx.physics,cp)?cp:isSafePosition(tx.physics,s.room.spawn)?s.room.spawn:null;
   const recovery=returnToSafety(tx.physics,s.player);
   if(expected){
    returns++;
    check(recovery.ok&&isSafePosition(tx.physics,recovery.player)&&pointEqual([recovery.player.x,recovery.player.y],[expected.x,expected.y])&&recovery.player.respawns===s.player.respawns+1,prefix+"return destination is unsafe or unvisited");
   }else{
    resetRequired++;
    check(!recovery.ok&&recovery.player.blockedRespawn,prefix+"unsafe return did not require reset");
   }
  }
  check(s.player.completed&&s.player.respawns===0,"Route did not complete without respawn");
  check(casts===fixture.casts.length,"Route did not use every recorded cast");
  if(s.player.completed){
   const bundle=s.bundle(),verified=verifyWorkshopBundle(bundle),result=completedResult(s.room,s.player,history);
   bundleVerified=verified.ok&&same(verified.result,bundle.result);
   check(bundleVerified,"Independent exported bundle replay failed");
   check(result?.moves===casts&&result?.stars===(fixture.expectedStars??3),"Actual completion score differs");
   const thresholds=starThresholds(level.room);
   check(starsForMoves(thresholds.threeStar,thresholds)===3&&starsForMoves(thresholds.threeStar+1,thresholds)===2&&starsForMoves(thresholds.twoStar+1,thresholds)===1,"Star boundary incorrect");
   check(!s.cast(fixture.casts[0].type,fixture.casts[0].objectId,fixture.casts[0]).ok&&!s.undo().ok,"Completed attempt still accepts edits");
  }
  // A fresh attempt must start with the authored geometry and zero history.
  const reset=createWorkshopSession(level.room);
  check(reset.summary().moves===0&&reset.summary().undos===0&&reset.summary().respawns===0&&!reset.player.completed,"Fresh attempt not reset");
  check(same(reset.room,createWorkshopSession(level.room).room),"Fresh room is not deterministic");
 }catch(e){errors.push(e.message);}
 return {number:level.number,route:fixture.name??"recorded",casts,images,previewChecks,undos,returns,resetRequired,bundleVerified,errors};
}
