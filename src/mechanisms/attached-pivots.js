import {pointPolygonDistance,polygonsOverlap,GEOMETRY_EPS} from "../geometry/polygons.js";
import {samePoint} from "./hinge-sockets.js";
import {previewGeometry} from "../transformations/preview-math.js";
const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
export const attachedObjects=(room,id)=>room.objects.filter(o=>o.attachedTo===id);
export const castMembers=(room,id)=>[room.objects.find(o=>o.id===id),...attachedObjects(room,id)].filter(Boolean);
export function stationarySolids(room,id){
 const moving=new Set(castMembers(room,id).map(o=>o.id));
 return [...room.terrain,...room.objects.filter(o=>!moving.has(o.id)&&!o.decorative)];
}
export function attachedImages(room,id,request){
 return attachedObjects(room,id).map(o=>({id:o.id,geometry:previewGeometry(o,request)}));
}
export function applyObjectGeometry(o,geometry,request){
 const moved={...o,vertices:geometry.vertices.map(p=>[...p])};
 if(o.hinge)moved.hinge=[...geometry.hinge];
 if(request.type==="reflect"||o.vertexIds)moved.vertexIds=[...geometry.vertexIds];
 return moved;
}
export function applyCastGeometry(room,id,preview){
 const images=new Map([[id,preview.geometry],...(preview.attachedImages??[]).map(a=>[a.id,a.geometry])]);
 return room.objects.map(o=>images.has(o.id)?applyObjectGeometry(o,images.get(o.id),preview.request):o);
}
/** One solid socket carrier and one rotate-only enchanted beam. Shared hinge
 * is exact; no cycles, nested groups, resizing or independent detachment. */
export function validateAttachments(room){
 for(const o of room.objects){
  if(o.kind==="pivot-carrier"){
   const children=attachedObjects(room,o.id);
   if(o.decorative||o.attachedTo!==undefined||o.support!=="enchanted"||!point(o.hinge)||pointPolygonDistance(o.hinge,o.vertices)>GEOMETRY_EPS||!o.permissions?.length||!o.permissions.every(t=>t==="translate"||t==="reflect")||o.pivotOnly||o.dockable||o.fixedCentre||children.length!==1)
    throw Error("Invalid movable socket: "+o.id);
  }
  if(o.attachedTo===undefined)continue;
  const parent=room.objects.find(p=>p.id===o.attachedTo);
  if(typeof o.attachedTo!=="string"||parent?.kind!=="pivot-carrier"||o.kind!=="beam"||o.decorative||o.support!=="enchanted"||o.bearing||!o.pivotOnly||o.dockable||o.fixedCentre||o.permissions?.length!==1||o.permissions[0]!=="rotate"||!samePoint(o.hinge,parent.hinge)||polygonsOverlap(o.vertices,parent.vertices))
   throw Error("Invalid pivot attachment: "+o.id);
 }
 return room;
}
