import {polygonBounds} from "../geometry/world.js";
import {polygonsOverlap} from "../geometry/polygons.js";
import {shapeSocketFilled,validateShapeSockets} from "./shape-sockets.js";

const EPS=1e-7;
export const plateHeld=(room,p)=>Boolean(p.latch&&p.latched)||platePressed(room,p);
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
/** Derive grouped pressure-plate contact for feedback and rendering. */
export function plateGroups(room){
 const groups=new Map();
 for(const plate of room.plates??[]){
  if(!groups.has(plate.gateId))groups.set(plate.gateId,[]);
  groups.get(plate.gateId).push({...plate,pressed:plateHeld(room,plate)});
 }
 return [...groups].map(([gateId,plates])=>({gateId,plates,held:plates.filter(p=>p.pressed).length,total:plates.length}));
}
/** A gate may require pressure AND a geometric key fit. Keep this derived
 * from the same contact predicates used by the actual gate transaction. */
export function mixedGateProgress(room,gateId){
 const plates=(room.plates??[]).filter(p=>p.gateId===gateId),slots=(room.shapeSockets??[]).filter(s=>s.gateId===gateId);
 if(!plates.length||!slots.length)return null;
 return {held:plates.filter(p=>plateHeld(room,p)).length+slots.filter(s=>shapeSocketFilled(room,s)).length,total:plates.length+slots.length};
}
export function multiPlateEffects(before,after){
 const previous=new Map(plateGroups(before).map(g=>[g.gateId,g])),effects=[];
 for(const group of plateGroups(after)){
  if(group.total<2)continue;
  const old=previous.get(group.gateId);
  const changed=group.plates.map((p,i)=>({p,i})).filter(({p})=>old?.plates.find(q=>q.id===p.id)?.pressed!==p.pressed);
  if(!changed.length)continue;
  for(const {p,i} of changed)effects.push((p.label??"Plate "+(i+1))+(p.pressed?" will be held.":" will be released."));
  effects.push(group.held+"/"+group.total+" linked plates will be held.");
 }
 for(const g of after.objects.filter(o=>o.kind==="linked-gate")){
  const progress=mixedGateProgress(after,g.id),old=mixedGateProgress(before,g.id);
  if(progress&&progress.held!==old?.held)effects.push((g.label??g.id)+": "+progress.held+"/"+progress.total+" linked conditions will be held.");
 }
 return effects;
}
/** Pure derived state. All linked plates must be held for a gate to open.
 * The immutable room snapshot carries open/closed state for undo/reset. */
export function resolveMechanisms(room){
 const plates=room.plates??[],sockets=room.shapeSockets??[];
 if(!plates.length&&!sockets.length)return room;
 const pressed=plates.map(p=>{const held=plateHeld(room,p);return {...p,pressed:held,...(p.latch?{latched:held}:{})};});
 const filled=sockets.map(s=>({...s,filled:shapeSocketFilled(room,s)}));
 const objects=room.objects.map(o=>{
  const links=pressed.filter(p=>p.gateId===o.id),keyLinks=filled.filter(s=>s.gateId===o.id);
  if(!links.length&&!keyLinks.length)return o;
  const open=links.every(p=>p.pressed)&&keyLinks.every(s=>s.filled);
  return {...o,open,decorative:open};
 });
 return {...room,...(room.plates?{plates:pressed}:{}),...(room.shapeSockets?{shapeSockets:filled}:{}),objects};
}
export function obstructedGate(room){
 return room.objects.find(g=>g.kind==="linked-gate"&&!g.open&&room.objects.some(o=>o.id!==g.id&&!o.decorative&&polygonsOverlap(g.vertices,o.vertices)))??null;
}
export function validateMechanisms(room){
 validateShapeSockets(room);
 const ids=new Set([...room.terrain,...room.hazards,...room.objects,...(room.ladders??[]),...(room.checkpoints??[])].map(o=>o.id));
 for(const p of room.plates??[]){
  if(typeof p.id!=="string"||ids.has(p.id)||![p.x,p.y,p.width,p.contact].every(Number.isFinite)||p.width<=0||p.contact<=0||p.contact>p.width||p.x<room.bounds.minX||p.x+p.width>room.bounds.maxX||p.y<room.bounds.minY||p.y>room.bounds.maxY||!room.objects.some(o=>o.id===p.gateId&&o.kind==="linked-gate"&&o.permissions?.length===0))throw Error("Invalid pressure plate: "+p.id);
  if(p.latch!==undefined&&p.latch!==true||p.latched!==undefined&&(!p.latch||typeof p.latched!=="boolean")||p.latch&&p.pressed!==plateHeld(room,p))throw Error("Invalid latch state: "+p.id);
  ids.add(p.id);
 }
 for(const g of room.objects.filter(o=>o.kind==="linked-gate")){
  const linked=(room.plates??[]).filter(p=>p.gateId===g.id),keyLinks=(room.shapeSockets??[]).filter(s=>s.gateId===g.id);
  if((!linked.length&&!keyLinks.length)||g.open!==(linked.every(p=>plateHeld(room,p))&&keyLinks.every(s=>shapeSocketFilled(room,s)))||Boolean(g.decorative)!==g.open)throw Error("Invalid linked gate state: "+g.id);
 }
 if(obstructedGate(room))throw Error("A closed gate overlaps another object");
 return room;
}
