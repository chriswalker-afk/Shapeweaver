import {deepFreeze,rectangle} from "../geometry/world.js";
import {previewObject} from "../core/object-engine.js";
import {translationSweepOverlaps} from "../geometry/translation-sweep.js";
import {createPhysicsWorld,playerBox,blocked,inHazard} from "../physics/collision.js";

/** Full straight-line translation validation, layered on the shared final-pose validator. */
export function previewTranslation(room,player,id,raw){
  const final=previewObject(room,player,id,"translate",raw);
  const result=(ok,code,message)=>deepFreeze({...final,ok,code,message,scope:"translation-path"});
  if(!final.ok)return result(false,final.code,final.message);
  const object=room.objects.find(o=>o.id===id),{dx,dy}=final.request;
  const crosses=vertices=>translationSweepOverlaps(object.vertices,vertices,dx,dy);
  for(const s of [...room.terrain,...room.objects.filter(o=>o.id!==id&&!o.decorative)]){
    if(crosses(s.vertices))return result(false,"path-solid","The beam's travel path intersects "+(s.label??s.id)+".");
  }
  for(const h of room.hazards)if(crosses(h.vertices))return result(false,"path-hazard","The travel path intersects a hazard.");
  if(player){
    const b=playerBox(player);
    if(crosses(rectangle(b.minX,b.minY,b.maxX-b.minX,b.maxY-b.minY)))return result(false,"path-player","The travel path crosses the apprentice. Move out of the way.");
  }
  return result(true,"translation-clear","The complete translation path and final position are clear. Apply to move the object.");
}

/** Recompute from current room and player; never trust the previous ghost.
 * An unsuccessful transaction changes nothing. A successful one returns one immutable
 * new room and matching collision index. The caller swaps both together, once. */
export function commitTranslation(room,player,id,raw){
  if(player?.completed||player?.blockedRespawn)return {ok:false,code:"attempt-ended",message:"Reset to start another attempt."};
  const preview=previewTranslation(room,player,id,raw);
  if(!preview.ok)return preview;
  const before=room.objects.find(o=>o.id===id);
  const moved={...before,vertices:preview.geometry.vertices.map(p=>[...p])};
  if(before.hinge)moved.hinge=[...preview.geometry.hinge];
  const nextRoom=deepFreeze({...room,objects:room.objects.map(o=>o.id===id?moved:o)});
  const physics=createPhysicsWorld(nextRoom);
  if(player&&(blocked(physics,player)||inHazard(physics,player)))return {...preview,ok:false,code:"player-unsafe",message:"The apprentice would not be safe after this move."};
  return {ok:true,code:"applied",message:"Translation applied.",room:nextRoom,physics,
    transition:deepFreeze({id,from:before.vertices.map(p=>[...p]),dx:preview.request.dx,dy:preview.request.dy}),
    record:deepFreeze({objectId:id,type:"translate",dx:preview.request.dx,dy:preview.request.dy})};
}
/** Presentation only; physics always uses the committed final room. */
export function translatedFrame(room,transition,progress){
  const t=Math.max(0,Math.min(1,progress));
  if(t===1)return room;
  return {...room,objects:room.objects.map(o=>o.id!==transition.id?o:{...o,vertices:transition.from.map(([x,y])=>[x+transition.dx*t,y+transition.dy*t])})};
}
