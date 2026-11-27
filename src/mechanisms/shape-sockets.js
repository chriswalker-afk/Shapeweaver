import {boundsContain,polygonBounds,signedArea} from "../geometry/world.js";
import {triangulate,GEOMETRY_EPS,polygonsOverlap} from "../geometry/polygons.js";
/** Exact geometric fit, independent of starting vertex or vertex winding.
 * The socket is a non-solid inlaid outline; it does not alter the key or snap it. */
export function shapeFits(vertices,target){
 if(vertices.length!==target.length)return false;
 const close=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<=GEOMETRY_EPS;
 return target.some((_,offset)=>[1,-1].some(dir=>vertices.every((p,i)=>close(p,target[(offset+dir*i+target.length)%target.length]))));
}
export function shapeSocketFilled(room,socket){
 const key=room.objects.find(o=>o.id===socket.objectId&&!o.decorative);
 return Boolean(key&&shapeFits(key.vertices,socket.vertices));
}
export function validateShapeSockets(room){
 const ids=new Set([...room.terrain,...room.hazards,...room.objects,...(room.plates??[]),...(room.sockets??[]),...(room.ladders??[]),...(room.checkpoints??[])].map(o=>o.id));
 for(const s of room.shapeSockets??[]){
  if(typeof s.id!=="string"||ids.has(s.id)||!Array.isArray(s.vertices)||!boundsContain(room.bounds,polygonBounds(s.vertices))||signedArea(s.vertices)<=GEOMETRY_EPS||!room.objects.some(o=>o.id===s.objectId&&!o.decorative&&o.permissions?.length)||!room.objects.some(g=>g.id===s.gateId&&g.kind==="linked-gate"&&g.permissions?.length===0))throw Error("Invalid shape socket: "+s.id);
  triangulate(s.vertices);
  if(s.filled!==shapeSocketFilled(room,s))throw Error("Invalid shape socket state: "+s.id);
  if([...room.terrain,...room.hazards].some(o=>polygonsOverlap(s.vertices,o.vertices)))throw Error("Shape socket overlaps solid terrain or hazard: "+s.id);
  ids.add(s.id);
 }
 return room;
}
