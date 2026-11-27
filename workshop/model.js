// Authoring model only. This directory is deliberately excluded from dist.
import {rectangle,polygonBounds,boundsContain,deepFreeze} from "../src/geometry/world.js";
import {triangulate,polygonsOverlap} from "../src/geometry/polygons.js";
import {validateRoom} from "../src/levels/gatehouse-preview.js";
import {resolveMechanisms} from "../src/mechanisms/pressure-plates.js";
import {isSolidObject} from "../src/mechanisms/transformable-ladders.js";
import {createPhysicsWorld} from "../src/physics/collision.js";
import {createPlayer} from "../src/physics/platformer.js";
import {isSafePosition} from "../src/physics/recovery.js";

export const GROUPS=Object.freeze(["terrain","hazards","objects","ladders","checkpoints","decor","plates","sockets","shapeSockets"]);
export const copy=value=>JSON.parse(JSON.stringify(value));
const finite=n=>typeof n==="number"&&Number.isFinite(n)&&Math.abs(n)<=1000;
const point=p=>Array.isArray(p)&&p.length===2&&p.every(finite);
const xy=p=>p&&finite(p.x)&&finite(p.y);
const require=(ok,message)=>{if(!ok)throw Error(message);};
const polygonGroups=new Set(["terrain","hazards","objects","shapeSockets"]);
/** Structural checks allow temporarily unlinked mechanisms and invalid placements in a draft.
 * The stricter game validation runs before playtest, not on every drag. */
export function prepareDraft(value){
 require(value&&typeof value==="object"&&!Array.isArray(value),"Expected a room object");
 const r=copy(value);
 require(r.schemaVersion===1,"Room schemaVersion must be 1");
 require(typeof r.id==="string"&&r.id.length>0&&r.id.length<=100&&typeof r.title==="string"&&r.title.length>0,"Room needs an id and title");
 const b=r.bounds;
 require(b&&[b.minX,b.maxX,b.minY,b.maxY].every(finite)&&b.maxX>b.minX&&b.maxY>b.minY&&b.maxX-b.minX<=150&&b.maxY-b.minY<=100,"Bounds must be finite, ordered, at most 150 by 100");
 require(xy(r.spawn)&&xy(r.exit)&&finite(r.exit.width)&&finite(r.exit.height)&&r.exit.width>0&&r.exit.height>0,"Invalid spawn or portal geometry");
 require(Number.isInteger(r.chapter)&&r.chapter>=1&&r.chapter<=7,"Chapter must be 1–7");
 const ids=new Set();let count=0;
 for(const group of GROUPS){
  r[group]??=[];
  require(Array.isArray(r[group]),group+" must be an array");
  for(const [i,o] of r[group].entries()){
   require(o&&typeof o==="object"&&!Array.isArray(o),"Invalid "+group+" item");
   // Existing campaign decorations have no ID; assign stable editor IDs.
   if(group==="decor"&&!o.id)o.id="decor-"+(i+1);
   require(typeof o.id==="string"&&o.id.length>0&&o.id.length<=100&&!ids.has(o.id),"Duplicate or invalid item ID: "+o.id);
   ids.add(o.id);count++;
   if(polygonGroups.has(group))require(Array.isArray(o.vertices)&&o.vertices.length>=3&&o.vertices.length<=48&&o.vertices.every(point),"Invalid vertices: "+o.id);
   if(o.hinge!==undefined)require(point(o.hinge),"Invalid hinge: "+o.id);
   if(group==="ladders")require([o.x,o.width,o.bottom,o.top].every(finite)&&o.width>0&&o.top>o.bottom,"Invalid ladder: "+o.id);
   if(["checkpoints","decor","plates","sockets"].includes(group))require(xy(o),"Invalid point: "+o.id);
   if(group==="plates")require(finite(o.width)&&o.width>0&&finite(o.contact)&&o.contact>0&&o.contact<=o.width,"Invalid plate dimensions: "+o.id);
  }
 }
 require(count<=100,"Limit of 100 authored items");
 return r;
}
export function newDraft(){
 return prepareDraft({schemaVersion:1,id:"workshop-new",title:"Untitled workshop level",chapter:1,number:1,
 bounds:{minX:0,maxX:40,minY:0,maxY:14},spawn:{x:2,y:3},exit:{x:37,y:3,width:2.2,height:3.1},
 terrain:[{id:"floor",label:"Floor",material:"stone",grass:true,vertices:rectangle(0,0,40,3)}],hazards:[],objects:[]});
}
export function copyCampaignRoom(room){
 const r=copy(room);r.id="workshop-"+r.id;
 // Authoring does not invoke the level-specific campaign hint scripts.
 return prepareDraft(r);
}
export function itemEntries(room){
 return [{group:"spawn",id:"spawn",item:room.spawn},{group:"exit",id:"exit",item:room.exit},...GROUPS.flatMap(group=>room[group].map(item=>({group,id:item.id,item})))];
}
export function getItem(room,group,id){return group==="spawn"||group==="exit"?room[group]:room[group]?.find(o=>o.id===id)??null;}
export function itemBounds(group,o){
 if(o.vertices)return polygonBounds(o.vertices);
 if(group==="ladders")return {minX:o.x-o.width/2,maxX:o.x+o.width/2,minY:o.bottom,maxY:o.top};
 if(group==="plates")return {minX:o.x,maxX:o.x+o.width,minY:o.y-.15,maxY:o.y+.15};
 if(group==="exit")return {minX:o.x-o.width/2,maxX:o.x+o.width/2,minY:o.y,maxY:o.y+o.height};
 return {minX:o.x-.35,maxX:o.x+.35,minY:o.y-.35,maxY:o.y+.35};
}
export function replaceItem(room,group,id,value){
 const r=copy(room),o=copy(value);
 if(group==="spawn"||group==="exit")r[group]=o;
 else {const i=r[group]?.findIndex(v=>v.id===id)??-1;require(i>=0,"Select an existing item");require(o.id===id,"Item IDs are stable; create a new item to change its ID");r[group][i]=o;}
 return prepareDraft(r);
}
export function moveItem(room,group,id,dx,dy){
 require(finite(dx)&&finite(dy),"Invalid movement");const old=getItem(room,group,id);require(old,"Select an item");
 const o=copy(old),round=n=>Number(n.toFixed(8));
 if(o.vertices)o.vertices=o.vertices.map(([x,y])=>[round(x+dx),round(y+dy)]);
 if(o.hinge)o.hinge=[round(o.hinge[0]+dx),round(o.hinge[1]+dy)];
 if(finite(o.x))o.x=round(o.x+dx);
 if(finite(o.y))o.y=round(o.y+dy);
 if(group==="ladders"){o.bottom=round(o.bottom+dy);o.top=round(o.top+dy);}
 return replaceItem(room,group,id,o);
}
export function removeItem(room,group,id){
 require(GROUPS.includes(group),"Spawn and exit cannot be deleted");const r=copy(room);
 r[group]=r[group].filter(o=>o.id!==id);return prepareDraft(r);
}
export const PALETTE=Object.freeze([
 ["terrain","Terrain block"],["water","Water hazard"],["beam","Timber beam"],["gate","Hinged gate"],["crate","Step crate"],["barrel","Weighted barrel"],["ladder","Transformable ladder"],["static-ladder","Fixed ladder"],["wedge","Wedge"],["mushroom","Spring mushroom"],["key","L-shaped key"],["linked-gate","Linked gate"],["plate","Pressure plate"],["hinge-socket","Hinge socket"],["shape-socket","Shape socket"],["checkpoint","Checkpoint"],["fern","Fern"],["lantern","Lantern"]
]);
export function addTemplate(room,type,x,y){
 require(PALETTE.some(p=>p[0]===type)&&finite(x)&&finite(y),"Invalid palette placement");
 const r=copy(room),ids=new Set(itemEntries(r).map(e=>e.id));let i=1;while(ids.has(type+"-"+i))i++;
 const id=type+"-"+i,label=PALETTE.find(p=>p[0]===type)[1],rect=(w,h)=>rectangle(x,y,w,h);
 let group="objects",o={id,label,kind:type,material:"timber",vertices:rect(2,1),permissions:["translate"],support:"supported"};
 const gateId=r.objects.find(g=>g.kind==="linked-gate")?.id??"";
 switch(type){
 case "terrain":group="terrain";o={id,label,material:"stone",grass:true,vertices:rect(4,1)};break;
 case "water":group="hazards";o={id,kind:"water",vertices:rect(4,1)};break;
 case "beam":o.vertices=rect(6,.5);break;
 case "gate":Object.assign(o,{vertices:rect(.5,4),hinge:[x,y+4],permissions:["rotate"],support:"hinged"});break;
 case "crate":o.vertices=rect(2,2);break;
 case "barrel":Object.assign(o,{vertices:rect(2,2.5),permissions:["reflect","translate"],pressesPlates:true});break;
 case "ladder":Object.assign(o,{vertices:rect(4,.6),hinge:[x,y],permissions:["rotate"],support:"hinged"});break;
 case "static-ladder":group="ladders";o={id,x,width:.6,bottom:y,top:y+4};break;
 case "wedge":Object.assign(o,{material:"cheese",vertices:[[x,y],[x+4,y],[x+4,y+2]],permissions:["enlarge","reflect"],scaleRange:[.5,3]});break;
 case "mushroom":Object.assign(o,{material:"fungus",vertices:[[x+.8,y],[x+1.6,y],[x+1.6,y+.7],[x+2.4,y+.7],[x+2.4,y+1.3],[x,y+1.3],[x,y+.7],[x+.8,y+.7]],permissions:["enlarge"],scaleRange:[.5,2]});break;
 case "key":Object.assign(o,{material:"brass",vertices:[[x,y],[x+3,y],[x+3,y+1],[x+1,y+1],[x+1,y+3],[x,y+3]],permissions:["enlarge","rotate"],scaleRange:[.5,2],support:"enchanted"});break;
 case "linked-gate":Object.assign(o,{vertices:rect(1,7),permissions:[],support:"enchanted",open:false,decorative:false});break;
 case "plate":group="plates";o={id,x,y,width:2,contact:1.5,gateId,pressed:false};break;
 case "hinge-socket":group="sockets";o={id,label,x,y,objectId:r.objects.find(v=>v.dockable)?.id??""};break;
 case "shape-socket":group="shapeSockets";o={id,label,objectId:r.objects.find(v=>v.kind==="key")?.id??"",gateId,vertices:[[x,y],[x+3,y],[x+3,y+1],[x+1,y+1],[x+1,y+3],[x,y+3]],filled:false};break;
 case "checkpoint":group="checkpoints";o={id,x,y};break;
 case "fern":case "lantern":group="decor";o={id,kind:type,x,y};break;
 }
 r[group].push(o);return {room:prepareDraft(r),group,id};
}
/** Freeze a validated snapshot; derived gate states are recomputed, never trusted.
 * Edits may temporarily be invalid but cannot become verified playtest worlds. */
export function validateDraft(value){
 const draft=prepareDraft(value),room=resolveMechanisms(draft);
 validateRoom(room);
 for(const group of polygonGroups)for(const o of room[group])triangulate(o.vertices);
 for(const o of room.objects.filter(o=>!o.decorative)){
  const others=[...room.terrain,...room.objects.filter(v=>v.id!==o.id&&!v.decorative)];
  require(!others.some(v=>polygonsOverlap(o.vertices,v.vertices)),"Initial solid overlap: "+o.id);
  require(!room.hazards.some(v=>polygonsOverlap(o.vertices,v.vertices)),"Initial hazard overlap: "+o.id);
  if(o.support==="supported"){
   const down=o.vertices.map(([x,y])=>[x,y-.002]);
   require(others.some(v=>(room.terrain.includes(v)||isSolidObject(v))&&polygonsOverlap(down,v.vertices)),"Initial object has no support: "+o.id);
  }
 }
 for(const group of ["decor","plates","sockets","checkpoints","ladders"])for(const o of room[group])require(boundsContain(room.bounds,itemBounds(group,o))||group!=="ladders"&&group!=="plates"&&o.x>=room.bounds.minX&&o.x<=room.bounds.maxX&&o.y>=room.bounds.minY&&o.y<=room.bounds.maxY,"Item outside room: "+o.id);
 const world=createPhysicsWorld(room);createPlayer(world);
 require(isSafePosition(world,room.exit),"Exit feet must be clear, dry and supported");
 for(const c of room.checkpoints)require(isSafePosition(world,c),"Unsafe checkpoint: "+c.id);
 return deepFreeze(room);
}
