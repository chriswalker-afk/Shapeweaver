import {polygonBounds} from "../geometry/world.js";
import {GEOMETRY_EPS} from "../geometry/polygons.js";
export const mirrorRails=room=>room.objects.filter(o=>o.kind==="mirror-rail");
export function railMirrorValue(rail){
 const b=polygonBounds(rail.vertices);
 return Number(((b.minX+b.maxX)/2).toFixed(10));
}
export const mirrorRailFor=(room,object)=>object?.mirrorRailId===undefined?null:mirrorRails(room).find(o=>o.id===object.mirrorRailId)??null;
export const railEquation=rail=>"x = "+railMirrorValue(rail);
/** The brass slider moves only horizontally. A linked reflector must use the
 * current vertical line; unlinked reflectors keep all existing line choices. */
export function validateMirrors(room){
 for(const o of room.objects){
  if(o.kind==="mirror-rail"){
   const b=polygonBounds(o.vertices);
   if(o.decorative||o.support!=="enchanted"||o.permissions?.length!==1||o.permissions[0]!=="translate"||o.attachedTo!==undefined||o.hinge||o.fixedCentre||o.bearing||o.pressesPlates||o.mirrorRailId!==undefined||o.vertices.length!==4||!o.vertices.every(([x,y])=>(Math.abs(x-b.minX)<=GEOMETRY_EPS||Math.abs(x-b.maxX)<=GEOMETRY_EPS)&&(Math.abs(y-b.minY)<=GEOMETRY_EPS||Math.abs(y-b.maxY)<=GEOMETRY_EPS)))throw Error("Invalid mirror rail: "+o.id);
  }
  if(o.mirrorRailId!==undefined&&(typeof o.mirrorRailId!=="string"||!mirrorRailFor(room,o)||o.decorative||!o.permissions?.includes("reflect")))throw Error("Invalid movable mirror link: "+o.id);
 }
 return room;
}
