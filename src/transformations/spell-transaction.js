import {deepFreeze} from "../geometry/world.js";
import {applyCastGeometry} from "../mechanisms/attached-pivots.js";
import {resolveMechanisms} from "../mechanisms/pressure-plates.js";
import {createPhysicsWorld,blocked,inHazard} from "../physics/collision.js";
const cloneData=value=>Array.isArray(value)?value.map(cloneData):value&&typeof value==="object"?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,cloneData(v)])):value;

export function attemptEnded(player){
  return player?.completed||player?.blockedRespawn?{ok:false,code:"attempt-ended",message:"Reset to start another attempt."}:null;
}
/** Internal transaction boundary: callers must run the spell-specific full-path validator first. */
export function commitValidated(room,player,id,preview,message,transition,record){
  if(!preview.ok)return preview;
  const before=room.objects.find(o=>o.id===id);
  const attached=(preview.attachedImages??[]).map(({id:childId})=>room.objects.find(o=>o.id===childId));
  const nextRoom=deepFreeze(cloneData(resolveMechanisms({...room,objects:applyCastGeometry(room,id,preview)})));
  const physics=createPhysicsWorld(nextRoom);
  if(player&&(blocked(physics,player)||inHazard(physics,player)))return {...preview,ok:false,code:"player-unsafe",message:"The apprentice would not be safe after this move."};
  return {ok:true,code:"applied",message,room:nextRoom,physics,
    transition:deepFreeze({id,from:before.vertices.map(p=>[...p]),...(preview.request.type==="reflect"?{fromIds:before.vertexIds?[...before.vertexIds]:undefined,...(before.hinge?{fromHinge:[...before.hinge]}:{})}:{}),...(attached.length?{attached:attached.map(o=>({id:o.id,from:o.vertices.map(p=>[...p]),fromIds:o.vertexIds?[...o.vertexIds]:undefined,fromHinge:[...o.hinge]}))}:{}),...transition}),
    record:deepFreeze({objectId:id,...(attached.length?{attachedIds:attached.map(o=>o.id)}:{}),...record})};
}
