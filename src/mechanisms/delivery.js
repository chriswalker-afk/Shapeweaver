import {boundsContain,polygonBounds,signedArea} from "../geometry/world.js";
import {triangulate,polygonsOverlap,GEOMETRY_EPS} from "../geometry/polygons.js";
import {shapeFits} from "./shape-sockets.js";

// Delivery is a live geometric condition, not a persistent flag. Moving
// a delivered crystal away again makes the portal unavailable.
export function deliveryFilled(room,target){
 const crystal=room.objects.find(o=>o.id===target.objectId&&o.kind==="crystal"&&!o.decorative);
 return Boolean(crystal&&shapeFits(crystal.vertices,target.vertices));
}
export const deliveryReady=room=>(room?.deliveries??[]).every(target=>deliveryFilled(room,target));
export function deliveryEffects(before,after){
 const effects=[];
 for(const target of after.deliveries??[]){
  const was=(before.deliveries??[]).find(t=>t.id===target.id),filled=deliveryFilled(after,target);
  if(!was||filled!==deliveryFilled(before,was))effects.push(filled?"Crystal will fit "+(target.label??target.id)+".":"Crystal will leave "+(target.label??target.id)+".");
 }
 if(deliveryReady(before)!==deliveryReady(after))effects.push(deliveryReady(after)?"All deliveries satisfied; portal available.":"Delivery incomplete; portal requires the crystal.");
 return effects;
}
export function validateDeliveries(room){
 if(room.deliveries===undefined)return room;
 if(!Array.isArray(room.deliveries))throw Error("Invalid delivery targets");
 const ids=new Set([...room.terrain,...room.hazards,...room.objects,...(room.ladders??[]),...(room.checkpoints??[]),...(room.plates??[]),...(room.sockets??[]),...(room.shapeSockets??[]),...(room.decor??[])].map(o=>o.id)),used=new Set();
 for(const t of room.deliveries){
  const crystal=room.objects.find(o=>o.id===t?.objectId&&o.kind==="crystal"&&!o.decorative&&o.permissions?.length);
  if(!t||typeof t.id!=="string"||!t.id||ids.has(t.id)||!crystal||used.has(t.objectId)||!Array.isArray(t.vertices)||t.vertices.length!==crystal.vertices.length||!boundsContain(room.bounds,polygonBounds(t.vertices))||signedArea(t.vertices)<=GEOMETRY_EPS)
   throw Error("Invalid crystal delivery target: "+t?.id);
  triangulate(t.vertices);
  if([...room.terrain,...room.hazards].some(o=>polygonsOverlap(t.vertices,o.vertices)))throw Error("Delivery target overlaps solid terrain or hazard: "+t.id);
  ids.add(t.id);used.add(t.objectId);
 }
 return room;
}
