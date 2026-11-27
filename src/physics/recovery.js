import {blocked,inHazard,supported} from "./collision.js";

/** A recovery destination must be finite, clear, dry and grounded in this exact world. */
export function isSafePosition(world,p){
  return Boolean(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&!blocked(world,p)&&!inHazard(world,p)&&supported(world,p));
}
export function safeCheckpoint(world,id){
  const cp=world.checkpoints.find(c=>c.id===id);
  return isSafePosition(world,cp)?cp:null;
}
/** No teleport to an unvisited checkpoint or arbitrary point beyond an obstacle. */
export function returnDestination(world,player){
  const cp=safeCheckpoint(world,player.checkpoint);
  if(cp)return {point:cp,checkpoint:cp.id,kind:"checkpoint"};
  if(isSafePosition(world,world.room.spawn))return {point:world.room.spawn,checkpoint:null,kind:"spawn"};
  return null;
}
export function settledPlayer(world,previous,point,checkpoint,{event=null,respawns=previous.respawns,coyote=0}={}){
  if(!isSafePosition(world,point))return null;
  return {...previous,x:point.x,y:point.y,vx:0,vy:0,grounded:true,climbing:false,coyote,buffer:0,
    pose:"idle",phase:0,checkpoint:safeCheckpoint(world,checkpoint)?.id??null,respawns,
    completed:false,blockedRespawn:false,event};
}
export function returnToSafety(world,player,coyote=0){
  if(player.completed)return {ok:false,code:"attempt-ended",player};
  const destination=returnDestination(world,player);
  if(!destination)return {ok:false,code:"reset-required",player:{...player,vx:0,vy:0,coyote:0,buffer:0,grounded:false,climbing:false,blockedRespawn:true,event:"reset-required"}};
  const next=settledPlayer(world,player,destination.point,destination.checkpoint,{event:"respawn",respawns:player.respawns+1,coyote});
  return {ok:true,code:destination.kind,player:next};
}
