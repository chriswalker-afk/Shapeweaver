import {polygonBounds,boundsContain,deepFreeze} from "../geometry/world.js";
import {pointPolygonDistance,polygonsOverlap,triangulate,GEOMETRY_EPS} from "../geometry/polygons.js";
import {playerBox,polygonIntersectsBox} from "../physics/collision.js";
import {resolveMechanisms,obstructedGate} from "../mechanisms/pressure-plates.js";
import {TYPES,parsePreviewRequest,previewGeometry,referencePoints,isIdentity} from "../transformations/preview-math.js";

const name=o=>o.label??o.id;
const failure=(code,message,extra={})=>({ok:false,code,message,scope:"final-pose",...extra});
export function selectableObjects(room){return room.objects.filter(o=>!o.decorative&&Array.isArray(o.permissions)&&o.permissions.length>0);}
export function validateObjectDefinitions(room){
  for(const o of room.objects){
    if(o.decorative){if(o.permissions?.length)throw new Error("Decorative objects cannot be selected");continue;}
    triangulate(o.vertices);
    if(o.vertexIds!==undefined&&(!Array.isArray(o.vertexIds)||o.vertexIds.length!==o.vertices.length||new Set(o.vertexIds).size!==o.vertexIds.length||o.vertexIds.some(id=>typeof id!=="string"||!id.length)))throw new Error("Invalid vertex IDs: "+o.id);
    if(!Array.isArray(o.permissions)||new Set(o.permissions).size!==o.permissions.length||o.permissions.some(t=>!TYPES.includes(t)))throw new Error("Invalid permissions: "+o.id);
    if(!["supported","hinged","enchanted"].includes(o.support))throw new Error("Invalid support mode: "+o.id);
    if(o.support==="hinged"&&(!Array.isArray(o.hinge)||o.hinge.length!==2||!o.hinge.every(Number.isFinite)||!o.permissions.every(t=>t==="rotate")||pointPolygonDistance(o.hinge,o.vertices)>GEOMETRY_EPS))throw new Error("Invalid hinge: "+o.id);
    if(o.permissions.includes("enlarge")&&(!Array.isArray(o.scaleRange)||o.scaleRange.length!==2||!o.scaleRange.every(Number.isFinite)||o.scaleRange[0]<=0||o.scaleRange[1]<o.scaleRange[0]))throw new Error("Invalid scale range: "+o.id);
  }
  return room;
}
/** Nearest interior hit first, then a small CSS-pixel-derived tolerance for thin beams. */
export function hitObject(room,point,tolerance=0){
  if(!point||![point.x,point.y,tolerance].every(Number.isFinite)||tolerance<0)return null;
  if(point.x<room.bounds.minX||point.x>room.bounds.maxX||point.y<room.bounds.minY||point.y>room.bounds.maxY)return null;
  let result=null,distance=Infinity;
  for(const o of [...selectableObjects(room)].reverse()){
    const d=pointPolygonDistance([point.x,point.y],o.vertices);
    if(d<=tolerance&&d<distance){result=o;distance=d;}
  }
  return result;
}
function playerOnObject(object,player){
  if(!player)return false;
  const box=playerBox(player),probe={...box,minY:box.minY-.035,maxY:box.maxY-.035};
  return !polygonIntersectsBox(object.vertices,box)&&polygonIntersectsBox(object.vertices,probe);
}
/** Shared final-pose validator. Apply must revalidate through the chosen spell-specific
 * validator, which defines whether travel is continuous or a magical transfer. */
export function previewObject(room,player,id,type,raw){
  const object=selectableObjects(room).find(o=>o.id===id);
  if(!object)return failure("not-selectable","Choose an interactive object.");
  if(!object.permissions.includes(type))return failure("permission","That transformation is not permitted for "+name(object)+".");
  const request=parsePreviewRequest(type,raw);
  if(!request)return failure("parameters","Enter all required mathematical parameters.");
  if(object.support==="hinged"&&(request.type!=="rotate"||Math.hypot(request.centre[0]-object.hinge[0],request.centre[1]-object.hinge[1])>GEOMETRY_EPS))return failure("hinge","Use the fixed hinge as the centre of rotation.");
  if(type==="enlarge"&&(request.factor<object.scaleRange[0]||request.factor>object.scaleRange[1]))return failure("scale-limit","Scale factor must be between "+object.scaleRange[0]+" and "+object.scaleRange[1]+".");
  let geometry;
  try{
    geometry=previewGeometry(object,request);
    if(!geometry.vertices.every(p=>p.every(Number.isFinite)))return failure("geometry","The resulting coordinates are not finite.");
    triangulate(geometry.vertices);
  }catch{return failure("geometry","The resulting shape is degenerate or outside numeric limits.");}
  const extra={objectId:id,request,geometry};
  if(isIdentity(object,geometry))return failure("identity","This transformation does not change the object.",extra);
  const bounds=polygonBounds(geometry.vertices),b=room.bounds;
  if(!boundsContain({minX:b.minX-GEOMETRY_EPS,maxX:b.maxX+GEOMETRY_EPS,minY:b.minY-GEOMETRY_EPS,maxY:b.maxY+GEOMETRY_EPS},bounds))return failure("bounds","The preview extends outside the room.",extra);
  if(playerOnObject(object,player))return failure("player-supported","Move the apprentice off this object before transforming it.",extra);
  if(player&&polygonIntersectsBox(geometry.vertices,playerBox(player)))return failure("player-overlap","The preview would overlap the apprentice.",extra);
  const solids=[...room.terrain,...room.objects.filter(o=>o.id!==id&&!o.decorative)];
  for(const s of solids)if(polygonsOverlap(geometry.vertices,s.vertices))return failure("solid-overlap","The preview overlaps "+name(s)+".",extra);
  for(const h of room.hazards)if(polygonsOverlap(geometry.vertices,h.vertices))return failure("hazard-overlap","The preview overlaps a hazard.",extra);
  if(object.support==="supported"){
    const down=geometry.vertices.map(([x,y])=>[x,y-.002]);
    if(!solids.some(s=>polygonsOverlap(down,s.vertices)))return failure("unsupported","The preview has no support beneath it.",extra);
  }
  if(room.plates?.length){
    const candidate=resolveMechanisms({...room,objects:room.objects.map(o=>o.id===id?{...o,vertices:geometry.vertices}:o)});
    extra.mechanismEffects=candidate.objects.filter(g=>g.kind==="linked-gate"&&g.open!==room.objects.find(o=>o.id===g.id)?.open).map(g=>g.label+(g.open?" will open.":" will close."));
    if(obstructedGate(candidate))return failure("gate-obstructed","A linked gate would close on an object. Clear the gate first.",extra);
    if(player&&candidate.objects.some(o=>o.kind==="linked-gate"&&!o.open&&polygonIntersectsBox(o.vertices,playerBox(player))))return failure("gate-obstructed","A linked gate would close on the apprentice. Move clear first.",extra);
  }
  return {ok:true,code:"final-clear",scope:"final-pose",message:"Final position is clear. Travel path is not yet checked; Apply is unavailable.",...extra};
}
export function createObjectEngine(room){
  validateObjectDefinitions(room);
  return Object.freeze({
    objects:()=>selectableObjects(room),
    get:id=>selectableObjects(room).find(o=>o.id===id)??null,
    hit:(point,tolerance)=>hitObject(room,point,tolerance),
    references:id=>{const o=selectableObjects(room).find(o=>o.id===id);return o?referencePoints(o):[];},
    preview:(player,id,type,raw)=>deepFreeze(previewObject(room,player,id,type,raw))
  });
}
