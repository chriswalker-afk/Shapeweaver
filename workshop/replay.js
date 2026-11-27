import {validateDraft,copy} from "./model.js";
import {deepFreeze} from "../src/geometry/world.js";
import {createPhysicsWorld} from "../src/physics/collision.js";
import {createPlayer,stepPlayer,MOTION} from "../src/physics/platformer.js";
import {returnToSafety} from "../src/physics/recovery.js";
import {createAttemptHistory,recordCast,undoLastCast,rememberSafePosition,attemptSummary} from "../src/core/attempt-history.js";
import {previewTranslation,commitTranslation} from "../src/transformations/translation.js";
import {previewRotation,commitRotation} from "../src/transformations/rotation.js";
import {previewEnlargement,commitEnlargement} from "../src/transformations/enlargement.js";
import {previewReflection,commitReflection} from "../src/transformations/reflection.js";
export const LIMITS=Object.freeze({ticks:36000,actions:4000});
const previews={translate:previewTranslation,rotate:previewRotation,enlarge:previewEnlargement,reflect:previewReflection};
const commits={translate:commitTranslation,rotate:commitRotation,enlarge:commitEnlargement,reflect:commitReflection};
const spells=Object.keys(commits),axis=n=>[-1,0,1].includes(n);
const fail=message=>({ok:false,message});
function inputValid(input){return input&&axis(input.move)&&axis(input.climb)&&typeof input.jump==="boolean";}
function castFields(type,raw){
 if(!spells.includes(type)||!raw||typeof raw!=="object")throw Error("Invalid spell parameters");
 const fields={translate:["dx","dy"],rotate:["angle","direction","cx","cy"],enlarge:["factor","cx","cy"],reflect:["line"]}[type];
 return Object.fromEntries(fields.map(k=>{const v=raw[k];if(!(typeof v==="string"&&v.length<=80)&&!(typeof v==="number"&&Number.isFinite(v)))throw Error("Missing or invalid "+k);return [k,v];}));
}
/** Same 120 Hz game physics, full-path spell transactions and recovery history.
 * All successful actions are recorded in order, including movement between casts. */
export function createWorkshopSession(value){
 const initial=validateDraft(value);let world=createPhysicsWorld(initial),player=createPlayer(world),history=createAttemptHistory(),lastSafe=rememberSafePosition(world,player),ticks=0,actions=[];
 const ended=()=>player.completed||player.blockedRespawn;
 function capacity(){return actions.length<LIMITS.actions;}
 function step(input){
  if(!inputValid(input))return fail("Invalid movement input");
  if(ended())return fail("Attempt is finished or requires recovery");
  if(ticks>=LIMITS.ticks)return fail("Recording tick limit reached; restart the playtest");
  const previous=actions.at(-1);
  const extend=previous?.kind==="step"&&!input.jump&&previous.move===input.move&&previous.climb===input.climb;
  if(!extend&&!capacity())return fail("Recording action limit reached");
  if(extend)previous.ticks++;else actions.push({kind:"step",ticks:1,...input});
  player=stepPlayer(world,player,input);ticks++;lastSafe=rememberSafePosition(world,player,lastSafe);
  return {ok:true};
 }
 function preview(type,id,raw){
  if(ended())return fail("Attempt has ended; recover or restart");
  if(!spells.includes(type))return fail("Unknown spell");
  try{return previews[type](world.room,player,id,castFields(type,raw));}catch(e){return fail(e.message);}
 }
 function cast(type,id,raw){
  if(ended()||!capacity())return fail("Attempt ended or recording limit reached");
  if(!spells.includes(type))return fail("Unknown spell");
  try{
   const parameters=castFields(type,raw),tx=commits[type](world.room,player,id,parameters);
   if(!tx.ok)return tx;
   history=recordCast(history,world,player,lastSafe,tx.record);world=tx.physics;
   lastSafe=rememberSafePosition(world,player,lastSafe);actions.push({kind:"cast",type,objectId:id,parameters});
   return tx;
  }catch(e){return fail(e.message);}
 }
 function undo(){
  if(!capacity())return fail("Recording action limit reached");
  const u=undoLastCast(history,player);if(!u.ok)return u;
  world=u.physics;player=u.player;history=u.history;lastSafe=u.safePoint;actions.push({kind:"undo"});return {ok:true};
 }
 function recover(){
  if(!capacity()||player.completed)return fail("Attempt ended or recording limit reached");
  const r=returnToSafety(world,player,MOTION.coyote);
  // Failed return can set blockedRespawn, so record it too for exact replay.
  player=r.player;lastSafe=rememberSafePosition(world,player,lastSafe);actions.push({kind:"return"});
  return {ok:true,recovered:r.ok};
 }
 function summary(){const s=attemptSummary(history,player);return {completed:player.completed,moves:s.moves,undos:s.undos,respawns:player.respawns,ticks};}
 function bundle(){
  if(!player.completed)throw Error("Reach the portal before exporting a solution");
  const candidate={version:1,room:copy(initial),actions:copy(actions),result:summary()};
  const checked=verifyWorkshopBundle(candidate);
  if(!checked.ok)throw Error("Independent replay failed: "+checked.message);
  return deepFreeze(candidate);
 }
 return {step,preview,cast,undo,recover,summary,bundle,get room(){return world.room;},get player(){return {...player};},get actions(){return copy(actions);}};
}
/** Do not trust a stored 'verified' flag or final player position. Replay from spawn. */
export function verifyWorkshopBundle(value){
 try{
  if(!value||value.version!==1||!Array.isArray(value.actions)||value.actions.length===0||value.actions.length>LIMITS.actions)throw Error("Invalid replay bundle version or action count");
  let total=0;
  for(const a of value.actions){
   if(!a||!["step","cast","undo","return"].includes(a.kind))throw Error("Unknown replay action");
   if(a.kind==="step"){
    if(!inputValid(a)||!Number.isSafeInteger(a.ticks)||a.ticks<1)throw Error("Invalid step segment");
    total+=a.ticks;if(total>LIMITS.ticks)throw Error("Replay exceeds tick limit");
   }
   if(a.kind==="cast"){if(typeof a.objectId!=="string")throw Error("Invalid cast object");castFields(a.type,a.parameters);}
  }
  const session=createWorkshopSession(value.room);
  for(const [i,a] of value.actions.entries()){
   let r;
   if(a.kind==="step"){for(let j=0;j<a.ticks;j++){r=session.step({move:a.move,climb:a.climb,jump:a.jump&&j===0});if(!r.ok)break;}}
   else if(a.kind==="cast")r=session.cast(a.type,a.objectId,a.parameters);
   else if(a.kind==="undo")r=session.undo();
   else r=session.recover();
   if(!r?.ok)throw Error("Action "+(i+1)+" failed: "+(r?.message??r?.code??"rejected"));
  }
  const result=session.summary();if(!result.completed)throw Error("Replay did not reach the portal");
  if(value.result&&Object.keys(result).some(k=>value.result[k]!==result[k]))throw Error("Recorded result does not match replay");
  return {ok:true,result};
 }catch(e){return fail(e.message);}
}
