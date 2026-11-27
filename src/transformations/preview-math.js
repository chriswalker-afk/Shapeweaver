import {signedArea} from "../geometry/world.js";
import {GEOMETRY_EPS} from "../geometry/polygons.js";
export const TYPES=Object.freeze(["translate","rotate","enlarge","reflect"]);
const decimal=value=>{
  if(typeof value==="number")return Number.isFinite(value)?value:NaN;
  if(typeof value!=="string"||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim().replace(/\u2212/g,"-")))return NaN;
  return Number(value.trim().replace(/\u2212/g,"-"));
};
const clean=n=>Math.abs(n)<1e-10?0:Number(n.toFixed(10));
const point=(x,y)=>[clean(x),clean(y)];
const finite=(...values)=>values.every(Number.isFinite);
function scaleValue(value){
  if(typeof value==="string"){
    const fraction=value.trim().match(/^([+-]?\d+)\s*\/\s*(\d+)$/);
    if(fraction)return Number(fraction[1])/Number(fraction[2]);
  }
  return decimal(value);
}
export function parseMirrorLine(value){
  const s=String(value??"").trim().toLowerCase().replace(/\u2212/g,"-").replace(/\s/g,"");
  if(s==="y=x"||s==="y=-x")return {kind:s,equation:s};
  const m=s.match(/^([xy])=(.+)$/);if(!m)return null;
  const n=decimal(m[2]);return Number.isFinite(n)?{kind:m[1],value:n,equation:m[1]+" = "+n}:null;
}
export function parsePreviewRequest(type,raw={}){
  if(!raw||typeof raw!=="object")return null;
  if(type==="translate"){
    const dx=decimal(raw.dx),dy=decimal(raw.dy);
    return finite(dx,dy)?{type,dx,dy}:null;
  }
  if(type==="rotate"){
    const angle=decimal(raw.angle),cx=decimal(raw.cx),cy=decimal(raw.cy),direction=raw.direction;
    return [90,180,270].includes(angle)&&finite(cx,cy)&&["clockwise","anticlockwise"].includes(direction)?{type,angle,direction,centre:[cx,cy]}:null;
  }
  if(type==="enlarge"){
    const factor=scaleValue(raw.factor),cx=decimal(raw.cx),cy=decimal(raw.cy);
    return finite(factor,cx,cy)&&factor>0?{type,factor,centre:[cx,cy]}:null;
  }
  if(type==="reflect"){const line=parseMirrorLine(raw.line);return line?{type,line}:null;}
  return null;
}
export function transformPoint(p,request){
  const [x,y]=p;
  if(request.type==="translate")return point(x+request.dx,y+request.dy);
  if(request.type==="rotate"){
    const [cx,cy]=request.centre;let dx=x-cx,dy=y-cy;
    const turns=(request.angle/90*(request.direction==="clockwise"?-1:1)+4)%4;
    for(let i=0;i<turns;i++)[dx,dy]=[-dy,dx];
    return point(cx+dx,cy+dy);
  }
  if(request.type==="enlarge"){const [cx,cy]=request.centre;return point(cx+request.factor*(x-cx),cy+request.factor*(y-cy));}
  if(request.type==="reflect"){
    const l=request.line;
    if(l.kind==="x")return point(2*l.value-x,y);
    if(l.kind==="y")return point(x,2*l.value-y);
    if(l.kind==="y=x")return point(y,x);
    if(l.kind==="y=-x")return point(-y,-x);
  }
  throw new Error("Unsupported preview transform");
}
/** Preserve vertex IDs even when reflection reverses winding. */
export function referencePoints(object){
  return object.vertices.map((p,i)=>({id:object.vertexIds?.[i]??(i<26?String.fromCharCode(65+i):"V"+(i+1)),point:[...p]}))
    .concat(object.hinge?[{id:object.vertices.length>=8?"Hinge":"H",point:[...object.hinge]}]:[]);
}
export function previewGeometry(object,request){
  const points=referencePoints(object).map(ref=>({id:ref.id,point:transformPoint(ref.point,request)}));
  const vertices=points.slice(0,object.vertices.length).map(ref=>[...ref.point]);
  const vertexIds=points.slice(0,object.vertices.length).map(ref=>ref.id);
  if(signedArea(vertices)<0){vertices.reverse();vertexIds.reverse();}
  return {vertices,vertexIds,points,hinge:object.hinge?points.at(-1).point:null};
}
export function isIdentity(object,geometry){
  return referencePoints(object).every((ref,i)=>Math.hypot(ref.point[0]-geometry.points[i].point[0],ref.point[1]-geometry.points[i].point[1])<=GEOMETRY_EPS);
}
