import {rectangle,polygonBounds} from "../geometry/world.js";
import {GEOMETRY_EPS,polygonsOverlap} from "../geometry/polygons.js";
import {isSolidObject} from "./transformable-ladders.js";

/** A construction piece is a rectangular, translation-only supported prop.
 * Each outer bearing region must contact real solid geometry underneath.
 * This is a deterministic support rule, not a dynamic load simulation. */
export function bearingPads(object){
 const b=polygonBounds(object.vertices),w=Math.min(.5,(b.maxX-b.minX)/4);
 return [rectangle(b.minX,b.minY-.002,w,.002),rectangle(b.maxX-w,b.minY-.002,w,.002)];
}
export function bearingStatus(room,object){
 const solids=[...room.terrain,...room.objects.filter(o=>o.id!==object.id&&isSolidObject(o))];
 return bearingPads(object).map(pad=>solids.some(s=>polygonsOverlap(pad,s.vertices)));
}
export function unsupportedBearing(room){
 return room.objects.find(o=>o.bearing==="both-ends"&&!o.decorative&&!bearingStatus(room,o).every(Boolean))??null;
}
export function validateBearingDefinition(o){
 if(o.bearing===undefined)return;
 const b=polygonBounds(o.vertices),near=(a,b)=>Math.abs(a-b)<=GEOMETRY_EPS;
 if(o.bearing!=="both-ends"||o.decorative||o.support!=="supported"||o.permissions?.length!==1||o.permissions[0]!=="translate"||o.vertices.length!==4||!o.vertices.every(([x,y])=>(near(x,b.minX)||near(x,b.maxX))&&(near(y,b.minY)||near(y,b.maxY))))throw Error("Invalid structural bearing definition: "+o.id);
}
export function validateBearings(room){
 for(const o of room.objects)validateBearingDefinition(o);
 const unsupported=unsupportedBearing(room);
 if(unsupported)throw Error("Both ends need initial support: "+unsupported.id);
 return room;
}
