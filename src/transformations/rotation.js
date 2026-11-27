import {deepFreeze,rectangle} from "../geometry/world.js";
import {previewObject} from "../core/object-engine.js";
import {playerBox} from "../physics/collision.js";
import {rotationSweepOverlaps,rotationSweepWithinBounds,rotatedVertices,signedRadians} from "../geometry/rotation-sweep.js";
import {attemptEnded,commitValidated} from "./spell-transaction.js";

/** Full signed arc, including room bounds, all solid geometry, hazards and the player.
 * Hinged objects have fixed centres; other permitted objects may use an external centre. */
export function previewRotation(room,player,id,raw){
  const final=previewObject(room,player,id,"rotate",raw);
  const result=(ok,code,message)=>deepFreeze({...final,ok,code,message,scope:"rotation-path"});
  if(!final.ok)return result(false,final.code,final.message);
  const object=room.objects.find(o=>o.id===id),request=final.request,theta=signedRadians(request),centre=request.centre;
  if(object.support==="hinged"&&(centre[0]!==object.hinge[0]||centre[1]!==object.hinge[1]))return result(false,"hinge","Enter the exact fixed hinge coordinates.");
  if(!rotationSweepWithinBounds(object.vertices,centre,theta,room.bounds))return result(false,"path-bounds","The rotation arc leaves the room.");
  const crosses=vertices=>rotationSweepOverlaps(object.vertices,vertices,centre,theta);
  for(const s of [...room.terrain,...room.objects.filter(o=>o.id!==id&&!o.decorative)]){
    if(crosses(s.vertices))return result(false,"path-solid","The rotation arc intersects "+(s.label??s.id)+". Try a different direction or angle.");
  }
  for(const h of room.hazards)if(crosses(h.vertices))return result(false,"path-hazard","The rotation arc intersects a hazard.");
  if(player){
    const b=playerBox(player);
    if(crosses(rectangle(b.minX,b.minY,b.maxX-b.minX,b.maxY-b.minY)))return result(false,"path-player","The rotation arc crosses the apprentice. Move out of the way.");
  }
  return result(true,"rotation-clear","The full rotation arc and final position are clear. Apply to turn the object.");
}
export function commitRotation(room,player,id,raw){
  const ended=attemptEnded(player);if(ended)return ended;
  const preview=previewRotation(room,player,id,raw);if(!preview.ok)return preview;
  const {angle,direction,centre}=preview.request;
  return commitValidated(room,player,id,preview,"Rotation applied.",{centre:[...centre],theta:signedRadians(preview.request)},
    {type:"rotate",angle,direction,centre:[...centre]});
}
/** Pure visual interpolation along the requested arc. Final quarter-turn uses exact geometry. */
export function rotatedFrame(room,transition,progress){
  const t=Math.max(0,Math.min(1,progress));if(t===1)return room;
  return {...room,objects:room.objects.map(o=>o.id!==transition.id?o:{...o,vertices:rotatedVertices(transition.from,transition.centre,transition.theta*t)})};
}
