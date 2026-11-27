import {deepFreeze,rectangle} from "../geometry/world.js";
import {previewObject} from "../core/object-engine.js";
import {translationSweepOverlaps} from "../geometry/translation-sweep.js";
import {playerBox} from "../physics/collision.js";
import {attemptEnded,commitValidated} from "./spell-transaction.js";

/** Full straight-line translation validation, layered on the shared final-pose validator. */
export function previewTranslation(room,player,id,raw){
  const final=previewObject(room,player,id,"translate",raw);
  const result=(ok,code,message)=>deepFreeze({...final,ok,code,message,scope:"translation-path"});
  if(!final.ok)return result(false,final.code,final.message);
  const object=room.objects.find(o=>o.id===id),{dx,dy}=final.request;
  const crosses=vertices=>translationSweepOverlaps(object.vertices,vertices,dx,dy);
  for(const s of [...room.terrain,...room.objects.filter(o=>o.id!==id&&!o.decorative)]){
    if(crosses(s.vertices))return result(false,"path-solid","The object's travel path intersects "+(s.label??s.id)+".");
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
  const ended=attemptEnded(player);if(ended)return ended;
  const preview=previewTranslation(room,player,id,raw);if(!preview.ok)return preview;
  const {dx,dy}=preview.request;
  return commitValidated(room,player,id,preview,"Translation applied.",{dx,dy},{type:"translate",dx,dy});
}
/** Presentation only; physics always uses the committed final room. */
export function translatedFrame(room,transition,progress){
  const t=Math.max(0,Math.min(1,progress));
  if(t===1)return room;
  return {...room,objects:room.objects.map(o=>o.id!==transition.id?o:{...o,vertices:transition.from.map(([x,y])=>[x+transition.dx*t,y+transition.dy*t])})};
}
