import {polygonBounds} from "../geometry/world.js";
const EPS=1e-7;
/** A transformable ladder's envelope is reserved for spell clearance, but is
 * permeable to the apprentice. Only an upright rectangular ladder is climbable.
 * Derive the climb segment from the current vertices; never keep a stale copy. */
export function ladderSegment(object){
 if(object?.kind!=="ladder"||object.decorative)return null;
 const b=polygonBounds(object.vertices),width=b.maxX-b.minX,height=b.maxY-b.minY;
 if(width<=EPS||height<2*width||object.vertices.length!==4)return null;
 if(!object.vertices.every(([x,y])=>(Math.abs(x-b.minX)<EPS||Math.abs(x-b.maxX)<EPS)&&(Math.abs(y-b.minY)<EPS||Math.abs(y-b.maxY)<EPS)))return null;
 return {id:object.id,x:(b.minX+b.maxX)/2,width,bottom:b.minY,top:b.maxY};
}
export function roomLadders(room){
 return [...(room.ladders??[]),...room.objects.map(ladderSegment).filter(Boolean)];
}
/** A dual-purpose ladder has a solid rectangular deck only while horizontal.
 * Ordinary ladders retain their permeable behaviour. The committed geometry,
 * not the animation frame or a cached state flag, determines the mode. */
export function isBridgeDeck(o){
 if(o?.kind!=="ladder"||o.bridgeDeck!==true||o.decorative||o.vertices.length!==4)return false;
 const b=polygonBounds(o.vertices),w=b.maxX-b.minX,h=b.maxY-b.minY;
 return h>EPS&&w>=2*h&&o.vertices.every(([x,y])=>(Math.abs(x-b.minX)<EPS||Math.abs(x-b.maxX)<EPS)&&(Math.abs(y-b.minY)<EPS||Math.abs(y-b.maxY)<EPS));
}
export const isSolidObject=o=>!o.decorative&&(o.kind!=="ladder"||isBridgeDeck(o));
