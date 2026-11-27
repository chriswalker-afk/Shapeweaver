import {polygonBounds,signedArea} from "./world.js";
export const GEOMETRY_EPS=1e-7;
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const same=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<=GEOMETRY_EPS;
function onSegment(p,a,b){
  return Math.abs(cross(a,b,p))<=GEOMETRY_EPS&&p[0]>=Math.min(a[0],b[0])-GEOMETRY_EPS&&p[0]<=Math.max(a[0],b[0])+GEOMETRY_EPS&&p[1]>=Math.min(a[1],b[1])-GEOMETRY_EPS&&p[1]<=Math.max(a[1],b[1])+GEOMETRY_EPS;
}
function intersects(a,b,c,d){
  const u=cross(a,b,c),v=cross(a,b,d),w=cross(c,d,a),z=cross(c,d,b);
  return ((u>GEOMETRY_EPS&&v<-GEOMETRY_EPS||u<-GEOMETRY_EPS&&v>GEOMETRY_EPS)&&(w>GEOMETRY_EPS&&z<-GEOMETRY_EPS||w<-GEOMETRY_EPS&&z>GEOMETRY_EPS))||onSegment(c,a,b)||onSegment(d,a,b)||onSegment(a,c,d)||onSegment(b,c,d);
}
export function pointInPolygon(point,vertices){
  let inside=false;
  for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){
    const a=vertices[j],b=vertices[i];
    if(onSegment(point,a,b))return true;
    if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
export function pointPolygonDistance(p,vertices){
  if(pointInPolygon(p,vertices))return 0;
  let min=Infinity;
  for(let i=0;i<vertices.length;i++){
    const a=vertices[i],b=vertices[(i+1)%vertices.length],dx=b[0]-a[0],dy=b[1]-a[1];
    const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));
    min=Math.min(min,Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy));
  }
  return min;
}
/** Validate simple polygons and decompose into CCW triangles. No self-crossing or duplicate points. */
export function triangulate(vertices){
  polygonBounds(vertices);
  if(vertices.length>128||Math.abs(signedArea(vertices))<=GEOMETRY_EPS)throw new Error("Degenerate polygon");
  const n=vertices.length;
  for(let i=0;i<n;i++){
    if(same(vertices[i],vertices[(i+1)%n]))throw new Error("Duplicate polygon point");
    for(let j=i+1;j<n;j++){
      if(j===i+1||(i===0&&j===n-1))continue;
      if(intersects(vertices[i],vertices[(i+1)%n],vertices[j],vertices[(j+1)%n]))throw new Error("Self-intersecting polygon");
    }
  }
  const ring=vertices.map(p=>[...p]);
  if(signedArea(ring)<0)ring.reverse();
  // Remove straight-through collinear vertices for robust ear clipping.
  for(let i=0;ring.length>3&&i<ring.length;){
    const a=ring[(i+ring.length-1)%ring.length],b=ring[i],c=ring[(i+1)%ring.length];
    if(onSegment(b,a,c)){ring.splice(i,1);i=0;}else i++;
  }
  const out=[];
  const inTriangle=(p,a,b,c)=>cross(a,b,p)>=-GEOMETRY_EPS&&cross(b,c,p)>=-GEOMETRY_EPS&&cross(c,a,p)>=-GEOMETRY_EPS;
  while(ring.length>3){
    let found=false;
    for(let i=0;i<ring.length;i++){
      const ia=(i+ring.length-1)%ring.length,ic=(i+1)%ring.length,a=ring[ia],b=ring[i],c=ring[ic];
      if(cross(a,b,c)<=GEOMETRY_EPS||ring.some((p,j)=>j!==ia&&j!==i&&j!==ic&&inTriangle(p,a,b,c)))continue;
      out.push([a,b,c]);ring.splice(i,1);found=true;break;
    }
    if(!found)throw new Error("Could not triangulate polygon");
  }
  if(cross(...ring)<=GEOMETRY_EPS)throw new Error("Degenerate triangle");
  out.push(ring);return out;
}
function convexOverlap(a,b){
  for(const ring of [a,b])for(let i=0;i<ring.length;i++){
    const p=ring[i],q=ring[(i+1)%ring.length],dx=q[0]-p[0],dy=q[1]-p[1],len=Math.hypot(dx,dy);
    const project=v=>(-dy*v[0]+dx*v[1])/len;
    const x=a.map(project),y=b.map(project);
    if(Math.min(Math.max(...x),Math.max(...y))-Math.max(Math.min(...x),Math.min(...y))<=GEOMETRY_EPS)return false;
  }
  return true;
}
/** Positive-area collision only; shared edges and corners are legal contacts. */
export function polygonsOverlap(a,b){
  const x=polygonBounds(a),y=polygonBounds(b);
  if(Math.min(x.maxX,y.maxX)-Math.max(x.minX,y.minX)<=GEOMETRY_EPS||Math.min(x.maxY,y.maxY)-Math.max(x.minY,y.minY)<=GEOMETRY_EPS)return false;
  const ta=triangulate(a),tb=triangulate(b);return ta.some(t=>tb.some(u=>convexOverlap(t,u)));
}
