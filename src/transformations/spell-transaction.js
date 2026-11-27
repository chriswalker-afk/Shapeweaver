import {deepFreeze} from "../geometry/world.js";
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
  const moved={...before,vertices:preview.geometry.vertices.map(p=>[...p])};
  if(before.hinge)moved.hinge=[...preview.geometry.hinge];
  // Keep vertex correspondence through winding reversal and subsequent transformations.
  if(preview.request.type==="reflect"||before.vertexIds)moved.vertexIds=[...preview.geometry.vertexIds];
  const nextRoom=deepFreeze(cloneData(resolveMechanisms({...room,objects:room.objects.map(o=>o.id===id?moved:o)})));
  const physics=createPhysicsWorld(nextRoom);
  if(player&&(blocked(physics,player)||inHazard(physics,player)))return {...preview,ok:false,code:"player-unsafe",message:"The apprentice would not be safe after this move."};
  return {ok:true,code:"applied",message,room:nextRoom,physics,
    transition:deepFreeze({id,from:before.vertices.map(p=>[...p]),...(preview.request.type==="reflect"?{fromIds:before.vertexIds?[...before.vertexIds]:undefined}:{}),...transition}),
    record:deepFreeze({objectId:id,...record})};
}
