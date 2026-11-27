import {polygonBounds} from "../geometry/world.js";
import {polygonsOverlap} from "../geometry/polygons.js";

const EPS=1e-7;
/** A weight must actually touch the plate along a horizontal bottom edge. */
export function platePressed(room,plate){
 return room.objects.some(o=>{
  if(o.decorative||!o.pressesPlates)return false;
  const b=polygonBounds(o.vertices);
  if(Math.abs(b.minY-plate.y)>EPS)return false;
  return o.vertices.some((a,i)=>{
   const c=o.vertices[(i+1)%o.vertices.length];
   return Math.abs(a[1]-plate.y)<EPS&&Math.abs(c[1]-plate.y)<EPS&&
    Math.min(Math.max(a[0],c[0]),plate.x+plate.width)-Math.max(Math.min(a[0],c[0]),plate.x)>=plate.contact-EPS;
  });
 });
}
/** Pure derived state. All linked plates must be held for a gate to open.
 * The immutable room snapshot carries open/closed state for undo/reset. */
export function resolveMechanisms(room){
 const plates=room.plates??[];
 if(!plates.length)return room;
 const pressed=plates.map(p=>({...p,pressed:platePressed(room,p)}));
 const objects=room.objects.map(o=>{
  const links=pressed.filter(p=>p.gateId===o.id);
  if(!links.length)return o;
  const open=links.every(p=>p.pressed);
  return {...o,open,decorative:open};
 });
 return {...room,plates:pressed,objects};
}
export function obstructedGate(room){
 return room.objects.find(g=>g.kind==="linked-gate"&&!g.open&&room.objects.some(o=>o.id!==g.id&&!o.decorative&&polygonsOverlap(g.vertices,o.vertices)))??null;
}
export function validateMechanisms(room){
 const ids=new Set([...room.terrain,...room.hazards,...room.objects,...(room.ladders??[]),...(room.checkpoints??[])].map(o=>o.id));
 for(const p of room.plates??[]){
  if(typeof p.id!=="string"||ids.has(p.id)||![p.x,p.y,p.width,p.contact].every(Number.isFinite)||p.width<=0||p.contact<=0||p.contact>p.width||p.x<room.bounds.minX||p.x+p.width>room.bounds.maxX||p.y<room.bounds.minY||p.y>room.bounds.maxY||!room.objects.some(o=>o.id===p.gateId&&o.kind==="linked-gate"&&o.permissions?.length===0))throw Error("Invalid pressure plate: "+p.id);
  ids.add(p.id);
 }
 for(const g of room.objects.filter(o=>o.kind==="linked-gate")){
  const linked=(room.plates??[]).filter(p=>p.gateId===g.id);
  if(!linked.length||g.open!==linked.every(p=>platePressed(room,p))||Boolean(g.decorative)!==g.open)throw Error("Invalid linked gate state: "+g.id);
 }
 if(obstructedGate(room))throw Error("A closed gate overlaps another object");
 return room;
}
