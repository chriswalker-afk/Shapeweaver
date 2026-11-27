import {deepFreeze} from "../geometry/world.js";
import {createPhysicsWorld} from "../physics/collision.js";
import {isSafePosition,returnDestination,settledPlayer} from "../physics/recovery.js";

export function createAttemptHistory(){
  return deepFreeze({entries:[],stack:[]});
}
export function rememberSafePosition(world,player,last=null){
  if(!player.completed&&!player.blockedRespawn&&!player.climbing&&player.grounded&&isSafePosition(world,player))return Object.freeze({x:player.x,y:player.y});
  return last&&isSafePosition(world,last)?last:null;
}
/** Record only a successful commit. Room snapshots are immutable authored/committed rooms.
 * Each history entry retains its record even after undo; the stack contains only active casts. */
export function recordCast(history,world,player,lastSafe,record){
  const safe=rememberSafePosition(world,player,lastSafe);
  const point=safe??returnDestination(world,player)?.point??null;
  const index=history.entries.length;
  return deepFreeze({
    entries:[...history.entries,{record,undone:false}],
    stack:[...history.stack,{index,room:world.room,player:{...player},safePoint:point?{x:point.x,y:point.y}:null}]
  });
}
export function undoLastCast(history,currentPlayer){
  if(currentPlayer.completed)return {ok:false,code:"attempt-ended",message:"This attempt is complete. Reset to try again."};
  const snapshot=history.stack.at(-1);
  if(!snapshot)return {ok:false,code:"nothing-to-undo",message:"There is no applied transformation to undo."};
  const physics=createPhysicsWorld(snapshot.room);
  const fallback=returnDestination(physics,snapshot.player);
  const point=[snapshot.safePoint,fallback?.point].find(p=>isSafePosition(physics,p));
  if(!point)return {ok:false,code:"reset-required",message:"No safe position in the previous state. Reset to start a fresh attempt."};
  const player=settledPlayer(physics,snapshot.player,point,snapshot.player.checkpoint,{respawns:currentPlayer.respawns});
  const next=deepFreeze({
    entries:history.entries.map((entry,index)=>index===snapshot.index?{record:entry.record,undone:true}:entry),
    stack:history.stack.slice(0,-1)
  });
  return {ok:true,code:"undone",history:next,room:snapshot.room,physics,player,safePoint:{x:point.x,y:point.y},record:history.entries[snapshot.index].record};
}
export function attemptSummary(history,player){
  return {moves:history.entries.length,undos:history.entries.filter(e=>e.undone).length,activeMoves:history.stack.length,respawns:player.respawns,
    entries:history.entries.map(e=>({record:e.record,undone:e.undone}))};
}
