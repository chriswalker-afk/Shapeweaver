import {deepFreeze,rectangle} from "../geometry/world.js";
import {previewObject} from "../core/object-engine.js";
import {playerBox} from "../physics/collision.js";
import {scaledVertices,enlargementSweepOverlaps} from "../geometry/enlargement-sweep.js";
import {attemptEnded,commitValidated} from "./spell-transaction.js";

/** Full positive-scale path validation. Every vertex follows a straight ray; rectangular
 * room bounds are convex, so initial and final containment implies path containment. */
export function previewEnlargement(room,player,id,raw){
  const final=previewObject(room,player,id,"enlarge",raw);
  const result=(ok,code,message)=>deepFreeze({...final,ok,code,message,scope:"enlargement-path"});
  if(!final.ok)return result(false,final.code,final.message);
  const object=room.objects.find(o=>o.id===id),{factor,centre}=final.request;
  const crosses=vertices=>enlargementSweepOverlaps(object.vertices,vertices,centre,factor);
  for(const s of [...room.terrain,...room.objects.filter(o=>o.id!==id&&!o.decorative)]){
    if(crosses(s.vertices))return result(false,"path-solid","The enlargement path intersects "+(s.label??s.id)+".");
  }
  for(const h of room.hazards)if(crosses(h.vertices))return result(false,"path-hazard","The enlargement path intersects a hazard.");
  if(player){
    const b=playerBox(player);
    if(crosses(rectangle(b.minX,b.minY,b.maxX-b.minX,b.maxY-b.minY)))return result(false,"path-player","The enlargement path crosses the apprentice. Move out of the way.");
  }
  return result(true,"enlargement-clear","The complete enlargement path and final position are clear. Apply to resize the object.");
}
export function commitEnlargement(room,player,id,raw){
  const ended=attemptEnded(player);if(ended)return ended;
  const preview=previewEnlargement(room,player,id,raw);if(!preview.ok)return preview;
  const {factor,centre}=preview.request;
  return commitValidated(room,player,id,preview,"Enlargement applied.",{centre:[...centre],factor},
    {type:"enlarge",factor,centre:[...centre]});
}
/** The object stays similar at every intermediate scale; the collision index is already final. */
export function enlargedFrame(room,transition,progress){
  const t=Math.max(0,Math.min(1,progress));if(t===1)return room;
  const factor=1+(transition.factor-1)*t;
  return {...room,objects:room.objects.map(o=>o.id!==transition.id?o:{...o,vertices:scaledVertices(transition.from,transition.centre,factor)})};
}
