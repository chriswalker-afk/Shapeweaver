import {polygonBounds,boundsContain,deepFreeze} from "../geometry/world.js";
import {pointPolygonDistance,polygonsOverlap,triangulate,GEOMETRY_EPS} from "../geometry/polygons.js";
import {playerBox,polygonIntersectsBox} from "../physics/collision.js";
import {resolveMechanisms,obstructedGate,multiPlateEffects} from "../mechanisms/pressure-plates.js";
import {ladderSegment,isSolidObject,isBridgeDeck} from "../mechanisms/transformable-ladders.js";
import {dockedSocket,samePoint} from "../mechanisms/hinge-sockets.js";
import {unsupportedBearing,validateBearingDefinition} from "../mechanisms/structural-bearings.js";
import {validateMirrors,mirrorRailFor,railMirrorValue,railEquation} from "../mechanisms/movable-mirrors.js";
import {attachedObjects,attachedImages,stationarySolids,applyCastGeometry,validateAttachments} from "../mechanisms/attached-pivots.js";
import {TYPES,parsePreviewRequest,previewGeometry,referencePoints,isIdentity} from "../transformations/preview-math.js";

const name=o=>o.label??o.id;
export const lockedSocket=(room,id)=>(room.shapeSockets??[]).find(s=>s.objectId===id&&s.locking&&s.filled);
const failure=(code,message,extra={})=>({ok:false,code,message,scope:"final-pose",...extra});
export function selectableObjects(room){return room.objects.filter(o=>!o.decorative&&!lockedSocket(room,o.id)&&Array.isArray(o.permissions)&&o.permissions.length>0);}
export function validateObjectDefinitions(room){
  for(const o of room.objects){
    validateBearingDefinition(o);
    if(o.decorative){if(o.permissions?.length)throw new Error("Decorative objects cannot be selected");continue;}
    triangulate(o.vertices);
    if(o.vertexIds!==undefined&&(!Array.isArray(o.vertexIds)||o.vertexIds.length!==o.vertices.length||new Set(o.vertexIds).size!==o.vertexIds.length||o.vertexIds.some(id=>typeof id!=="string"||!id.length)))throw new Error("Invalid vertex IDs: "+o.id);
    if(o.bridgeDeck!==undefined&&(o.kind!=="ladder"||o.bridgeDeck!==true||!o.permissions?.includes("rotate")||!o.permissions?.includes("translate")))throw Error("Invalid dual-purpose ladder: "+o.id);
    if(o.kind==="ladder"&&(o.vertices.length!==4||!ladderSegment(o)&&!ladderSegment({...o,vertices:o.vertices.map(([x,y])=>[-y,x])})))throw new Error("Invalid rectangular ladder: "+o.id);
    if(!Array.isArray(o.permissions)||new Set(o.permissions).size!==o.permissions.length||o.permissions.some(t=>!TYPES.includes(t)))throw new Error("Invalid permissions: "+o.id);
    if(!["supported","hinged","enchanted"].includes(o.support))throw new Error("Invalid support mode: "+o.id);
    if(o.support==="hinged"&&(!Array.isArray(o.hinge)||o.hinge.length!==2||!o.hinge.every(Number.isFinite)||!o.permissions.every(t=>t==="rotate")||pointPolygonDistance(o.hinge,o.vertices)>GEOMETRY_EPS))throw new Error("Invalid hinge: "+o.id);
    if((o.dockable||o.pivotOnly)&&(!Array.isArray(o.hinge)||o.hinge.length!==2||!o.hinge.every(Number.isFinite)||pointPolygonDistance(o.hinge,o.vertices)>GEOMETRY_EPS||!o.permissions.includes("rotate")||o.support==="hinged"||o.dockable&&(!o.permissions.includes("translate")||o.decorative)))throw new Error("Invalid mobile pivot: "+o.id);
    if(o.kind==="waterwheel"&&(o.support!=="hinged"||!o.hinge||o.permissions.length!==1||o.permissions[0]!=="rotate"))throw Error("Invalid waterwheel rotor: "+o.id);
    if(o.fixedCentre!==undefined&&(!Array.isArray(o.fixedCentre)||o.fixedCentre.length!==2||!o.fixedCentre.every(Number.isFinite)||o.support!=="enchanted"||o.vertexIds?.includes("Centre")||o.hinge||o.dockable||o.pivotOnly||o.permissions.length!==1||o.permissions[0]!=="rotate"||pointPolygonDistance(o.fixedCentre,o.vertices)<=GEOMETRY_EPS||o.fixedCentre[0]<room.bounds.minX||o.fixedCentre[0]>room.bounds.maxX||o.fixedCentre[1]<room.bounds.minY||o.fixedCentre[1]>room.bounds.maxY))throw new Error("Invalid external centre: "+o.id);
    if(o.permissions.includes("enlarge")&&(!Array.isArray(o.scaleRange)||o.scaleRange.length!==2||!o.scaleRange.every(Number.isFinite)||o.scaleRange[0]<=0||o.scaleRange[1]<o.scaleRange[0]))throw new Error("Invalid scale range: "+o.id);
  }
  validateAttachments(room);return validateMirrors(room);
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
  if(lockedSocket(room,id))return failure("socket-locked","This key is locked in its recess. Undo or Reset to release it.");
  const object=selectableObjects(room).find(o=>o.id===id);
  if(!object)return failure("not-selectable","Choose an interactive object.");
  if(!object.permissions.includes(type))return failure("permission","That transformation is not permitted for "+name(object)+".");
  const request=parsePreviewRequest(type,raw);
  if(!request)return failure("parameters","Enter all required mathematical parameters.");
  if(object.kind==="mirror-rail"&&(request.type!=="translate"||Math.abs(request.dy)>GEOMETRY_EPS))return failure("mirror-rail-axis","The mirror slider moves horizontally. Use a translation with vertical component zero.");
  const rail=mirrorRailFor(room,object);
  if(type==="reflect"&&rail&&(request.line.kind!=="x"||Math.abs(request.line.value-railMirrorValue(rail))>GEOMETRY_EPS))return failure("mirror-line","Use the current movable mirror line "+railEquation(rail)+". Translate the mirror slider to change it.");
  if(object.support==="hinged"&&(request.type!=="rotate"||Math.hypot(request.centre[0]-object.hinge[0],request.centre[1]-object.hinge[1])>GEOMETRY_EPS))return failure("hinge","Use the fixed hinge as the centre of rotation.");
  if(type==="rotate"&&object.fixedCentre&&!samePoint(request.centre,object.fixedCentre))return failure("external-centre","Use the marked external centre at its exact coordinates.");
  if(type==="rotate"&&object.dockable&&!dockedSocket(room,object))return failure("not-docked","Align the beam hinge with its socket using a translation before rotating.");
  if(type==="rotate"&&(object.dockable||object.pivotOnly)&&!samePoint(request.centre,object.hinge))return failure("hinge","Use the marked pivot H at its current coordinates as the centre of rotation.");
  if(type==="enlarge"&&(request.factor<object.scaleRange[0]||request.factor>object.scaleRange[1]))return failure("scale-limit","Scale factor must be between "+object.scaleRange[0]+" and "+object.scaleRange[1]+".");
  let geometry;
  try{
    geometry=previewGeometry(object,request);
    if(!geometry.vertices.every(p=>p.every(Number.isFinite)))return failure("geometry","The resulting coordinates are not finite.");
    triangulate(geometry.vertices);
  }catch{return failure("geometry","The resulting shape is degenerate or outside numeric limits.");}
  const children=attachedObjects(room,id),images=attachedImages(room,id,request);
  const extra={objectId:id,request,geometry,...(images.length?{attachedImages:images}:{})};
  if(children.some(o=>lockedSocket(room,o.id)))return failure("socket-locked","An attached part is locked in its recess. Undo or Reset to release it.",extra);
  if(isIdentity(object,geometry))return failure("identity","This transformation does not change the object.",extra);
  const bounds=polygonBounds(geometry.vertices),b=room.bounds;
  if(!boundsContain({minX:b.minX-GEOMETRY_EPS,maxX:b.maxX+GEOMETRY_EPS,minY:b.minY-GEOMETRY_EPS,maxY:b.maxY+GEOMETRY_EPS},bounds))return failure("bounds","The preview extends outside the room.",extra);
  const climb=ladderSegment(object);
  if(player&&climb&&player.climbing&&Math.abs(player.x-climb.x)<=climb.width/2+.39&&player.y>=climb.bottom-.06&&player.y<=climb.top+.025)return failure("player-supported","Climb off this ladder before transforming it.",extra);
  if(playerOnObject(object,player))return failure("player-supported","Move the apprentice off this object before transforming it.",extra);
  if(player&&polygonIntersectsBox(geometry.vertices,playerBox(player)))return failure("player-overlap","The preview would overlap the apprentice.",extra);
  const solids=stationarySolids(room,id);
  for(const s of solids)if(polygonsOverlap(geometry.vertices,s.vertices))return failure("solid-overlap","The preview overlaps "+name(s)+".",extra);
  for(const h of room.hazards)if(polygonsOverlap(geometry.vertices,h.vertices))return failure("hazard-overlap","The preview overlaps a hazard.",extra);
  if(object.support==="supported"){
    const down=geometry.vertices.map(([x,y])=>[x,y-.002]);
    if(!solids.some(s=>(!room.objects.includes(s)||isSolidObject(s))&&polygonsOverlap(down,s.vertices)))return failure("unsupported","The preview has no support beneath it.",extra);
  }
  for(const {id:childId,geometry:image} of images){
    const child=children.find(o=>o.id===childId);
    if(!boundsContain({minX:b.minX-GEOMETRY_EPS,maxX:b.maxX+GEOMETRY_EPS,minY:b.minY-GEOMETRY_EPS,maxY:b.maxY+GEOMETRY_EPS},polygonBounds(image.vertices)))return failure("bounds","The attached "+name(child)+" would leave the room.",extra);
    if(playerOnObject(child,player))return failure("player-supported","Move the apprentice off the attached "+name(child)+" before transforming it.",extra);
    if(player&&polygonIntersectsBox(image.vertices,playerBox(player)))return failure("player-overlap","The attached "+name(child)+" would overlap the apprentice.",extra);
    for(const s of solids)if(polygonsOverlap(image.vertices,s.vertices))return failure("solid-overlap","The attached "+name(child)+" would overlap "+name(s)+".",extra);
    for(const h of room.hazards)if(polygonsOverlap(image.vertices,h.vertices))return failure("hazard-overlap","The attached "+name(child)+" would overlap a hazard.",extra);
  }
  const candidate=resolveMechanisms({...room,objects:applyCastGeometry(room,id,extra)});
  if(images.length)extra.mechanismEffects=images.map(({id:childId,geometry:image})=>name(children.find(o=>o.id===childId))+" moves with the socket. New pivot H = ("+image.hinge.join(", ")+").");
  const unstable=unsupportedBearing(candidate);
  if(unstable)return failure("bearing-unsupported",unstable.id===id?"Both ends of this construction piece need support beneath them.":"This move would remove support from "+name(unstable)+". Move that piece first.",extra);
  if(object.bearing==="both-ends")extra.mechanismEffects=["Both bearing ends will be supported."];
  if(room.plates?.length||room.shapeSockets?.length){
    extra.mechanismEffects=[...(extra.mechanismEffects??[]),...(candidate.shapeSockets??[]).filter(s=>s.filled!==(room.shapeSockets??[]).find(p=>p.id===s.id)?.filled).map(s=>s.filled?"Key will fit "+(s.label??s.id)+"."+(s.locking?" It will lock in place until Undo or Reset.":""):"Key will leave "+(s.label??s.id)+".")];
    extra.mechanismEffects.push(...(candidate.plates??[]).filter(p=>p.latch&&p.latched&&!(room.plates??[]).find(q=>q.id===p.id)?.latched).map(p=>(p.label??p.id)+" will latch open; the weight can be reused."));
    extra.mechanismEffects.push(...multiPlateEffects(room,candidate));
    extra.mechanismEffects.push(...candidate.objects.filter(g=>g.kind==="linked-gate"&&g.open!==room.objects.find(o=>o.id===g.id)?.open).map(g=>g.label+(g.open?" will open.":" will close.")));
    if(obstructedGate(candidate))return failure("gate-obstructed","A linked gate would close on an object. Clear the gate first.",extra);
    if(player&&candidate.objects.some(o=>o.kind==="linked-gate"&&!o.open&&polygonIntersectsBox(o.vertices,playerBox(player))))return failure("gate-obstructed","A linked gate would close on the apprentice. Move clear first.",extra);
  }
  if(object.kind==="mirror-rail")extra.mechanismEffects=[...(extra.mechanismEffects??[]),"Mirror line will move from "+railEquation(object)+" to "+railEquation({...object,vertices:geometry.vertices})+"."];
  if(type==="reflect"&&rail)extra.mechanismEffects=[...(extra.mechanismEffects??[]),"Reflection uses the current linked mirror "+railEquation(rail)+"."];
  if(object.dockable){const socket=dockedSocket(room,object,geometry.hinge);extra.mechanismEffects=[...(extra.mechanismEffects??[]),socket?"Hinge will dock at "+(socket.label??socket.id)+". Rotation available.":"Hinge will be undocked. Rotation requires a socket."];}
  if(object.kind==="ladder"){const image={...object,vertices:geometry.vertices};extra.mechanismEffects=[...(extra.mechanismEffects??[]),ladderSegment(image)?"Ladder will be upright and climbable.":isBridgeDeck(image)?"Ladder will form a solid walkable bridge.":"Ladder will not be climbable in this orientation."];}
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
