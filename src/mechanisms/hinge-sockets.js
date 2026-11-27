import {boundsContain} from "../geometry/world.js";
import {pointPolygonDistance,GEOMETRY_EPS} from "../geometry/polygons.js";
export const samePoint=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&Math.hypot(a[0]-b[0],a[1]-b[1])<=GEOMETRY_EPS;
/** Docking is derived from actual hinge coordinates; it never snaps or charges a move.
 * A socket is a fixed world reference, not an invisible support or collision polygon. */
export function dockedSocket(room,object,hinge=object?.hinge){
 if(!object?.dockable||!hinge)return null;
 return (room.sockets??[]).find(s=>s.objectId===object.id&&samePoint(hinge,[s.x,s.y]))??null;
}
export function validateSockets(room){
 const ids=new Set([...room.terrain,...room.hazards,...room.objects,...(room.plates??[]),...(room.shapeSockets??[]),...(room.ladders??[]),...(room.checkpoints??[])].map(o=>o.id));
 for(const s of room.sockets??[]){
  if(typeof s.id!=="string"||ids.has(s.id)||![s.x,s.y].every(Number.isFinite)||!boundsContain(room.bounds,{minX:s.x,maxX:s.x,minY:s.y,maxY:s.y})||!room.objects.some(o=>o.id===s.objectId&&o.dockable))throw Error("Invalid hinge socket: "+s.id);
  if(!room.terrain.some(t=>pointPolygonDistance([s.x,s.y],t.vertices)<=GEOMETRY_EPS))throw Error("Hinge socket needs a terrain anchor: "+s.id);
  ids.add(s.id);
 }
 for(const o of room.objects){
  if(o.dockable&&!(room.sockets??[]).some(s=>s.objectId===o.id))throw Error("Missing hinge socket: "+o.id);
 }
 return room;
}
