import {deepFreeze} from "../geometry/world.js";
import {previewObject} from "../core/object-engine.js";
import {attemptEnded,commitValidated} from "./spell-transaction.js";

/** Reflection is a magical transfer, not translation through intermediate positions.
 * Validate destination, support, object permissions and the apprentice; intervening
 * walls and hazards do not block it. No continuous swept solid exists during casting. */
export function previewReflection(room,player,id,raw){
  const final=previewObject(room,player,id,"reflect",raw);
  return deepFreeze({...final,scope:"reflection-destination",
    ...(final.ok?{code:"reflection-clear",message:"The reflected destination is clear and supported as required. Reflection can pass through barriers. Apply to reflect the object."}:{})});
}
export function commitReflection(room,player,id,raw){
  const ended=attemptEnded(player);if(ended)return ended;
  const preview=previewReflection(room,player,id,raw);if(!preview.ok)return preview;
  const {line}=preview.request;
  const tx=commitValidated(room,player,id,preview,"Reflection applied.",{line:{...line}},{type:"reflect",line:line.equation});
  return tx;
}
/** Fade away at source then reappear at the exact destination. Never draw a
 * squeezed intermediate polygon or a physical object moving through a wall. */
export function reflectedFrame(room,transition,progress){
  const t=Math.max(0,Math.min(1,progress));if(t===1)return room;
  return {...room,objects:room.objects.map(o=>{
    if(o.id!==transition.id)return o;
    if(t<.5)return {...o,vertices:transition.from,vertexIds:transition.fromIds??undefined,reflectionOpacity:1-2*t};
    return {...o,reflectionOpacity:2*t-1};
  })};
}
