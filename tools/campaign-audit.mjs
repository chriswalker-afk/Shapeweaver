import {pathToFileURL} from "node:url";
import {LEVELS} from "../src/levels/campaign.js";
import {validateRoom} from "../src/levels/gatehouse-preview.js";
import {BROOK_SOLUTION} from "../src/levels/across-the-brook.js";
import {GATE_SOLUTION} from "../src/levels/stubborn-gate.js";
import {CHEESY_SOLUTION} from "../src/levels/little-cheesy.js";
import {BARREL_SOLUTION} from "../src/levels/missing-barrel.js";
import {GARDEN_BRIDGE,GARDEN_SECRET} from "../src/levels/enchanted-gardens.js";
import {LADDER_SOLUTION,ABOVE_SOLUTION} from "../src/levels/garden-finale.js";
import {HINGE_SOLUTION,SQUEEZE_SOLUTION} from "../src/levels/clockwork-gallery.js";
import {WEDGE_SOLUTION,KEY_SOLUTION} from "../src/levels/clockwork-finale.js";
import {BRIDGE_BUILDERS_SOLUTION,BROKEN_STAIRCASE_SOLUTION} from "../src/levels/riverworks.js";
import {DOUBLE_TROUBLE_SOLUTION,DIAGONAL_DOCK_SOLUTION} from "../src/levels/riverworks-mechanisms.js";
import {WATERMILL_SOLUTION,AROUND_THE_TOWER_SOLUTION} from "../src/levels/riverworks-finale.js";
import {BRING_IT_WITH_YOU_CASTS,A_BRIDGE_AND_A_LADDER_CASTS} from "../src/levels/mirror-archives.js";
import {NO_GOING_BACK_CASTS,LOCKED_PASSAGE_CASTS} from "../src/levels/archives-latches.js";
import {DOUBLE_SEAL_CASTS,ARCHIVISTS_CHAIN_CASTS} from "../src/levels/archives-finale.js";
import {TOO_BIG_CASTS,SMALL_NOW_CASTS} from "../src/levels/alchemist-workshop.js";
import {WANDERING_PIVOT_CASTS,MIRRORED_MECHANISM_CASTS} from "../src/levels/alchemist-pivots.js";
import {attachedObjects} from "../src/mechanisms/attached-pivots.js";
import {createPhysicsWorld} from "../src/physics/collision.js";
import {createPlayer,stepPlayer} from "../src/physics/platformer.js";
import {commitTranslation} from "../src/transformations/translation.js";
import {commitRotation} from "../src/transformations/rotation.js";
import {commitEnlargement} from "../src/transformations/enlargement.js";
import {commitReflection} from "../src/transformations/reflection.js";
import {referencePoints} from "../src/transformations/preview-math.js";
import {signedArea,deepFreeze} from "../src/geometry/world.js";
import {createAttemptHistory,recordCast} from "../src/core/attempt-history.js";
import {completedResult,starThresholds,starsForMoves} from "../src/core/level-results.js";
import {tutorialSituation,tutorialHint} from "../src/levels/tutorial-guidance.js";
const commits={translate:commitTranslation,rotate:commitRotation,enlarge:commitEnlargement,reflect:commitReflection};
const single=(s,type)=>[{...s,type}];
const walk=n=>[[n,1,0,0]];
// Reuse the exact successful recorded input streams from earlier chapter tests.
// A jump is pressed only on the first tick of its segment.
export const RECORDED_ROUTES=deepFreeze([
 [1,single(BROOK_SOLUTION,"translate"),[[215,1,0],[120,1,1],[400,1,0]]],
 [2,single(GATE_SOLUTION,"rotate"),walk(550)],
 [3,single(CHEESY_SOLUTION,"enlarge"),walk(900)],
 [4,single(BARREL_SOLUTION,"reflect"),[[175,1,0],[60,1,1],[40,0,0],[55,1,1],[140,1,0]]],
 [5,GARDEN_BRIDGE,[[215,1,0],[120,1,1],[650,1,0]]],
 [6,GARDEN_SECRET,[[60,1,1],[210,1,0],[60,1,1],[60,0,0],[120,1,1],[200,1,0]]],
 [7,LADDER_SOLUTION,[[295,1,0,0],[60,1,1,0],[60,0,0,0],[40,1,0,0],[1,0,1,0],[300,0,0,1],[1,1,1,0],[300,1,0,0]]],
 [8,ABOVE_SOLUTION,[[142,1,0],[90,1,1],[20,0,0],[90,1,1],[450,1,0]]],
 [9,HINGE_SOLUTION,[[245,1,0],[120,1,1],[600,1,0]]],
 [10,SQUEEZE_SOLUTION,[[345,1,0],[120,1,1],[600,1,0]]],
 [11,WEDGE_SOLUTION,walk(1000)],[12,KEY_SOLUTION,walk(1000)],
 [13,BRIDGE_BUILDERS_SOLUTION,[[455,1,0],[120,1,1],[800,1,0]]],
 [14,BROKEN_STAIRCASE_SOLUTION,[[410,1,0],[60,1,1],[75,0,0],[75,1,1],[55,1,0],[1,0,1],[290,0,0,1],[1,1,1],[350,1,0]]],
 [15,DOUBLE_TROUBLE_SOLUTION,[[100,1,0],[125,1,1],[150,1,0],[125,1,1],[450,1,0]]],
 [16,DIAGONAL_DOCK_SOLUTION,[[125,1,0],[120,1,1],[100,1,0],[125,1,1],[600,1,0]]],
 [17,WATERMILL_SOLUTION,[[365,1,0],[120,1,1],[125,1,0],[120,1,1],[400,1,0]]],
 [18,AROUND_THE_TOWER_SOLUTION,[[250,1,0],[120,1,1],[150,1,0],[120,1,1],[550,1,0]]]
].map(([number,casts,route])=>({number,casts,route})).concat([
 // Each segment list is executed AFTER its corresponding cast. Keep the
 // original route format for levels whose geometry is assembled at spawn.
 [19,BRING_IT_WITH_YOU_CASTS,[
  [[240,1,0],[100,1,1],[76,1,0],[160,1,1],[20,0,0]],
  [[57,1,0],[130,1,1],[49,1,0],[120,1,1],[400,1,0]]
 ]],
 [20,A_BRIDGE_AND_A_LADDER_CASTS,[
  [[250,1,0],[120,1,1],[115,1,0],[100,1,1],[25,0,0]],
  [],
  [[270,1,0],[25,0,0,1],[420,0,0,1],[1,1,1,0],[250,1,0]]
 ]]
].map(([number,casts,segments])=>({number,casts,segments,route:segments.flat()}))).concat([{number:21,casts:NO_GOING_BACK_CASTS,route:walk(1000)},{number:22,casts:LOCKED_PASSAGE_CASTS,route:walk(1000)},{number:23,casts:DOUBLE_SEAL_CASTS,route:walk(1000)},{number:24,casts:ARCHIVISTS_CHAIN_CASTS,route:walk(1000)},{number:25,casts:TOO_BIG_CASTS,route:[[180,1,0],[95,1,1],[120,1,1],[400,1,0]]},{number:26,casts:SMALL_NOW_CASTS,route:[[400,1,0],[110,1,1],[500,1,0]]},{number:27,casts:WANDERING_PIVOT_CASTS,route:[[300,1,0],[120,1,1],[500,1,0]]},{number:28,casts:MIRRORED_MECHANISM_CASTS,route:[[335,1,0],[120,1,1],[500,1,0]]}]));
export function replayRoute(world,route,start=createPlayer(world)){
 let player=start,ticks=0;
 for(const [n,move,jump,climb=0] of route){
  for(let i=0;i<n;i++){
   player=stepPlayer(world,player,{move,jump:Boolean(jump&&i===0),climb});ticks++;
   if(player.completed||player.blockedRespawn)return {player,ticks};
  }
 }
 return {player,ticks};
}
const near=(a,b)=>Math.abs(a-b)<=1e-6*Math.max(1,Math.abs(a),Math.abs(b));
function invariantErrors(before,after,cast){
 const original=referencePoints(before),image=new Map(referencePoints(after).map(p=>[p.id,p.point]));
 const errors=[],factor=cast.type==="enlarge"?cast.factor:1;
 if(image.size!==original.length||original.some(p=>!image.has(p.id)))return ["Reference identity changed"];
 for(let i=0;i<original.length;i++)for(let j=i+1;j<original.length;j++){
  const a=original[i].point,b=original[j].point,c=image.get(original[i].id),d=image.get(original[j].id);
  if(!near(Math.hypot(c[0]-d[0],c[1]-d[1]),factor*Math.hypot(a[0]-b[0],a[1]-b[1])))errors.push("Distance invariant: "+original[i].id+"/"+original[j].id);
 }
 const vertices=original.slice(0,before.vertices.length);
 const originalArea=signedArea(vertices.map(v=>v.point)),imageArea=signedArea(vertices.map(v=>image.get(v.id)));
 if(!near(imageArea,originalArea*factor**2*(cast.type==="reflect"?-1:1)))errors.push("Corresponding vertex signed-area invariant");
 return errors;
}
/** Bounded, reproducible exploration, not a general platformer or spell solver.
 * Walk right; once each chosen delay elapses, jump from ground at eight-tick
 * intervals. Stop at the first respawn. Record exact timing of any success. */
export function shortcutProbe(world,maxTicks=1000,start=createPlayer(world)){
 const successes=[];
 for(const delay of [0,60,120,180,240,300,360,420]){
  let p={...start};
  for(let tick=0;tick<maxTicks;tick++){
   p=stepPlayer(world,p,{move:1,jump:tick>=delay&&p.grounded&&tick%8===0});
   if(p.completed){successes.push({delay,ticks:tick+1});break;}
   if(p.respawns||p.blockedRespawn)break;
  }
 }
 return successes;
}
/** Shared chronological input stream for the workshop and future level fixtures. */
export function* campaignActions(fixture){
 for(const [i,cast] of fixture.casts.entries()){
  yield {kind:"cast",cast};
  if(fixture.segments)for(const segment of fixture.segments[i])yield {kind:"move",segment};
 }
 if(!fixture.segments)for(const segment of fixture.route)yield {kind:"move",segment};
}
/** Replays each cast at its actual physical position, not a fictional spawn.
 * Subsets omit casts but keep the recorded movement; bounded probes start at
 * the live intermediate pose. Neither technique is a complete puzzle solver. */
function timedReplay(fixture,initial,{mask=(1<<fixture.casts.length)-1,hints=false,onPrefix=()=>{}}={}){
 let world=initial,player=createPlayer(initial),history=createAttemptHistory(),ticks=0,hintCasts=0,legal=true;
 const errors=[];
 for(const [i,recorded] of fixture.casts.entries()){
  if(player.completed||player.blockedRespawn)break;
  if(mask&(1<<i)){
   let cast=recorded;
   if(hints){
    const snapshot=JSON.stringify(world.room),playerSnapshot=JSON.stringify(player),g=tutorialSituation(world.room,player);
    if(!g||g.ready||g.travel||!g.raw){errors.push("Missing worked hint at live cast "+(i+1));legal=false;break;}
    for(let stage=1;stage<=5;stage++){
     const h=tutorialHint(world.room,player,stage,g);
     if(h?.stage!==stage||!h.text)errors.push("Invalid live hint stage "+stage);
     if(stage===5&&!h?.text.includes("Enter these parameters yourself"))errors.push("Live worked hint not validated");
    }
    if(JSON.stringify(world.room)!==snapshot||JSON.stringify(player)!==playerSnapshot)errors.push("Hints changed game state");
    cast={objectId:g.config.objectId,type:g.config.type,...g.raw};hintCasts++;
   }
   const before=world.room.objects.find(o=>o.id===cast.objectId);
   const tx=commits[cast.type](world.room,player,cast.objectId,cast);
   if(!tx.ok){errors.push("Cast "+(i+1)+" rejected: "+tx.code);legal=false;break;}
   errors.push(...invariantErrors(before,tx.room.objects.find(o=>o.id===cast.objectId),cast));
   for(const part of attachedObjects(world.room,cast.objectId))errors.push(...invariantErrors(part,tx.room.objects.find(o=>o.id===part.id),cast));
   history=recordCast(history,world,player,null,tx.record);world=tx.physics;
   onPrefix({index:i,world,player});
  }
  const step=replayRoute(world,fixture.segments[i],player);player=step.player;ticks+=step.ticks;
 }
 return {world,player,history,ticks,hintCasts,errors,legal,result:completedResult(world.room,player,history)};
}
function auditInterleaved(fixture,level,initial,{probe}){
 const count=fixture.casts.length,fullMask=(1<<count)-1,thresholds=starThresholds(level.room),errors=[],partialRoutes=[],sampledShortcuts=[];
 const probeTicks=Math.max(1000,fixture.route.reduce((sum,s)=>sum+s[0],0));
 const initialReplay=timedReplay(fixture,initial,{mask:0});
 if(initialReplay.player.completed)errors.push("Recorded movement bypasses all spells");
 if(probe)for(const hit of shortcutProbe(initial,probeTicks))sampledShortcuts.push({casts:0,sequence:"none",...hit});
 const recorded=timedReplay(fixture,initial,{onPrefix:({index,world,player})=>{
  if(probe&&index<count-1)for(const hit of shortcutProbe(world,probeTicks,player))sampledShortcuts.push({casts:index+1,sequence:"live prefix "+(index+1),...hit});
 }});
 errors.push(...recorded.errors);
 if(!recorded.result||recorded.result.moves!==count||recorded.result.stars!==3||recorded.player.respawns)errors.push("Recorded interleaved route must complete at target moves with three stars and no returns");
 for(let mask=1;mask<fullMask;mask++){
  const run=timedReplay(fixture,initial,{mask});
  const indexes=fixture.casts.map((_,i)=>i).filter(i=>mask&(1<<i));
  partialRoutes.push({casts:indexes.length,sequence:"casts "+indexes.map(i=>i+1).join(","),legal:run.legal,completed:run.player.completed});
  if(run.player.completed)errors.push("Recorded movement succeeds with subset "+mask);
 }
 const hinted=timedReplay(fixture,initial,{hints:true});
 errors.push(...hinted.errors);
 if(!hinted.player.completed||hinted.player.respawns||hinted.hintCasts!==count||!tutorialSituation(hinted.world.room,hinted.player)?.ready)errors.push("Interleaved worked-hint route did not complete");
 if(thresholds.threeStar!==count||thresholds.twoStar!==count+2||starsForMoves(count,thresholds)!==3||starsForMoves(count+1,thresholds)!==2||starsForMoves(count+3,thresholds)!==1)errors.push("Unexpected star thresholds");
 return {number:level.number,id:level.id,title:level.title,math:level.math,puzzle:level.puzzle,moves:recorded.result?.moves??null,stars:recorded.result?.stars??null,respawns:recorded.player.respawns,ticks:recorded.ticks,hintCasts:hinted.hintCasts,interleaved:true,initialBypass:initialReplay.player.completed,partialRoutes,sampledShortcuts,errors};
}
export function auditLevel(fixture,{probe=false}={}){
 const level=LEVELS.find(l=>l.number===fixture.number);
 if(!level)throw Error("Missing released level "+fixture.number);
 const room=validateRoom(level.room),initial=createPhysicsWorld(room),spawn=createPlayer(initial);
 if(fixture.segments)return auditInterleaved(fixture,level,initial,{probe});
 const errors=[],sampledShortcuts=[],partialRoutes=[],thresholds=starThresholds(room);
 const probeTicks=Math.max(1000,fixture.route.reduce((n,segment)=>n+segment[0],0));
 let world=initial,history=createAttemptHistory();
 const initialReplay=replayRoute(initial,fixture.route).player;
 if(initialReplay.completed)errors.push("Recorded route bypasses all spells");
 if(probe)for(const hit of shortcutProbe(initial,probeTicks))sampledShortcuts.push({casts:0,sequence:"none",...hit});
 for(const [i,s] of fixture.casts.entries()){
  const before=world.room.objects.find(o=>o.id===s.objectId);
  const tx=commits[s.type](world.room,spawn,s.objectId,s);
  if(!tx.ok){errors.push("Recorded cast "+(i+1)+" rejected: "+tx.code);break;}
  errors.push(...invariantErrors(before,tx.room.objects.find(o=>o.id===s.objectId),s));
  for(const part of attachedObjects(world.room,s.objectId))errors.push(...invariantErrors(part,tx.room.objects.find(o=>o.id===part.id),s));
  history=recordCast(history,world,spawn,null,tx.record);world=tx.physics;
  if(i<fixture.casts.length-1){
   const result=replayRoute(world,fixture.route).player;
   partialRoutes.push({casts:i+1,completed:result.completed});
   if(result.completed)errors.push("Recorded route succeeds after only "+(i+1)+" cast(s)");
   if(probe)for(const hit of shortcutProbe(world,probeTicks))sampledShortcuts.push({casts:i+1,sequence:s.type,...hit});
  }
 }
 // Test every other proper ordered subset for two- and three-cast puzzles.
 // Prefixes were already tested above. Illegal subsets are not viable routes.
 if(fixture.casts.length>=2&&fixture.casts.length<=3){
  for(let mask=1;mask<(1<<fixture.casts.length)-1;mask++){
   if((mask&(mask+1))===0)continue;
   let partial=initial,legal=true;const subset=[];
   for(const [i,s] of fixture.casts.entries())if(mask&(1<<i)){
    const tx=commits[s.type](partial.room,spawn,s.objectId,s);
    if(!tx.ok){legal=false;break;}partial=tx.physics;subset.push(i+1);
   }
   if(!legal)continue;
   const p=replayRoute(partial,fixture.route).player,sequence="casts "+subset.join(",");
   partialRoutes.push({casts:subset.length,sequence,completed:p.completed});
   if(p.completed)errors.push("Recorded route succeeds with only "+sequence);
   if(probe)for(const hit of shortcutProbe(partial,probeTicks))sampledShortcuts.push({casts:subset.length,sequence,...hit});
  }
 }
 const {player,ticks}=replayRoute(world,fixture.route),result=completedResult(world.room,player,history);
 if(!result||player.respawns!==0||result.moves!==fixture.casts.length||result.stars!==3)errors.push("Recorded route must complete with target moves, three stars and zero respawns");
 if(thresholds.threeStar!==fixture.casts.length||thresholds.twoStar!==thresholds.threeStar+2)errors.push("Unexpected efficiency thresholds");
 if(starsForMoves(thresholds.threeStar,thresholds)!==3||starsForMoves(thresholds.threeStar+1,thresholds)!==2||starsForMoves(thresholds.twoStar+1,thresholds)!==1)errors.push("Star boundary error");
 // Independently follow the actual live worked hints, not the recorded inputs.
 let hinted=initial,hintCasts=0;
 for(let i=0;i<fixture.casts.length;i++){
  const snapshot=JSON.stringify(hinted.room),playerSnapshot=JSON.stringify(spawn),g=tutorialSituation(hinted.room);
  if(!g||g.ready||!g.raw){errors.push("Missing next live worked hint");break;}
  for(let stage=1;stage<=5;stage++){
   const h=tutorialHint(hinted.room,spawn,stage,g);
   if(h?.stage!==stage||!h.text)errors.push("Invalid hint stage "+stage);
   if(stage===5&&!h?.text.includes("Enter these parameters yourself"))errors.push("Worked hint not validated");
  }
  if(JSON.stringify(hinted.room)!==snapshot||JSON.stringify(spawn)!==playerSnapshot)errors.push("Hints changed game state");
  const tx=commits[g.config.type](hinted.room,spawn,g.config.objectId,g.raw);
  if(!tx.ok){errors.push("Hint rejected: "+tx.code);break;}
  hinted=tx.physics;hintCasts++;
 }
 const hintReplay=replayRoute(hinted,fixture.route).player;
 if(!hintReplay.completed||hintReplay.respawns||!tutorialSituation(hinted.room)?.ready)errors.push("Worked-hint route did not complete");
 return {number:level.number,id:level.id,title:level.title,math:level.math,puzzle:level.puzzle,moves:result?.moves??null,stars:result?.stars??null,respawns:player.respawns,ticks,hintCasts,initialBypass:initialReplay.completed,partialRoutes,sampledShortcuts,errors};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const report=RECORDED_ROUTES.map(f=>auditLevel(f,{probe:true}));
 for(const r of report)console.log(JSON.stringify(r));
 console.log("CAMPAIGN AUDIT: "+report.filter(r=>!r.errors.length).length+"/"+report.length+" recorded + hinted routes passed; "+report.reduce((n,r)=>n+r.sampledShortcuts.length,0)+" sampled shortcut hits.");
 if(report.some(r=>r.errors.length))process.exitCode=1;
 // New shortcut hits are evidence for review, not automatic proof of a broken
 // level: genuine alternative solutions must not be prohibited arbitrarily.
}
