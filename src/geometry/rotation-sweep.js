import {polygonsOverlap,GEOMETRY_EPS} from "./polygons.js";
const TAU=2*Math.PI,ANGLE_EPS=1e-12;

export function signedRadians(request){
  return request.angle*Math.PI/180*(request.direction==="clockwise"?-1:1);
}
export function rotatedVertices(vertices,centre,theta){
  const [cx,cy]=centre,c=Math.cos(theta),s=Math.sin(theta);
  return vertices.map(([x,y])=>[cx+(x-cx)*c-(y-cy)*s,cy+(x-cx)*s+(y-cy)*c]);
}
/** Roots of A cos(t)+B sin(t)=C on a bounded angular interval. */
function roots(A,B,C,lo,hi,out){
  const r=Math.hypot(A,B);
  if(r<=1e-14||Math.abs(C)>r+1e-12)return;
  const phi=Math.atan2(B,A),delta=Math.acos(Math.max(-1,Math.min(1,C/r)));
  for(const base of [phi-delta,phi+delta]){
    const first=Math.ceil((lo-base-ANGLE_EPS)/TAU),last=Math.floor((hi-base+ANGLE_EPS)/TAU);
    for(let k=first;k<=last;k++)out.push(Math.max(lo,Math.min(hi,base+k*TAU)));
  }
}
/** A polygon intersection can change only at a vertex/edge-line event. Enumerate both
 * moving-vertex/fixed-edge and fixed-vertex/moving-edge events (using inverse rotation).
 * On the open interval between adjacent events the intersection topology is constant.
 * Test events and interval interiors; pure boundary contact remains legal. This avoids
 * a fixed-angle sampling gap, even for very thin obstacles. */
export function rotationSweepOverlaps(moving,stationary,centre,theta){
  if(!Number.isFinite(theta)||Math.abs(theta)>TAU||centre.length!==2||!centre.every(Number.isFinite))throw new Error("Invalid rotation sweep");
  const lo=Math.min(0,theta),hi=Math.max(0,theta);
  const a=moving.map(([x,y])=>[x-centre[0],y-centre[1]]),b=stationary.map(([x,y])=>[x-centre[0],y-centre[1]]);
  const events=[lo,hi];
  function collect(points,edges,sign){
    for(let i=0;i<edges.length;i++){
      const p=edges[i],q=edges[(i+1)%edges.length],dx=q[0]-p[0],dy=q[1]-p[1],len=Math.hypot(dx,dy);
      if(len<=GEOMETRY_EPS)continue;
      const nx=-dy/len,ny=dx/len,C=nx*p[0]+ny*p[1];
      for(const [x,y] of points){
        roots(nx*x+ny*y,sign*(-nx*y+ny*x),C,lo,hi,events);
        // Include tolerance-offset lines used by the positive-area overlap test.
        roots(nx*x+ny*y,sign*(-nx*y+ny*x),C+GEOMETRY_EPS,lo,hi,events);
        roots(nx*x+ny*y,sign*(-nx*y+ny*x),C-GEOMETRY_EPS,lo,hi,events);
      }
    }
  }
  collect(a,b,1);collect(b,a,-1);
  events.sort((x,y)=>x-y);
  const unique=events.filter((v,i)=>i===0||v-events[i-1]>ANGLE_EPS);
  const overlaps=t=>polygonsOverlap(rotatedVertices(moving,centre,t),stationary);
  for(let i=0;i<unique.length;i++){
    if(overlaps(unique[i]))return true;
    if(i+1<unique.length&&overlaps((unique[i]+unique[i+1])/2))return true;
  }
  return false;
}
/** All vertex extrema along the requested signed arc, not just its endpoints. */
export function rotationSweepWithinBounds(vertices,centre,theta,bounds){
  const lo=Math.min(0,theta),hi=Math.max(0,theta),[cx,cy]=centre;
  for(const [x,y] of vertices){
    const dx=x-cx,dy=y-cy,phase=Math.atan2(dy,dx),r=Math.hypot(dx,dy);
    const angles=[lo,hi];
    const first=Math.ceil((lo+phase-ANGLE_EPS)/(Math.PI/2)),last=Math.floor((hi+phase+ANGLE_EPS)/(Math.PI/2));
    for(let k=first;k<=last;k++)angles.push(k*Math.PI/2-phase);
    for(const t of angles){
      const px=cx+r*Math.cos(phase+t),py=cy+r*Math.sin(phase+t);
      if(px<bounds.minX-GEOMETRY_EPS||px>bounds.maxX+GEOMETRY_EPS||py<bounds.minY-GEOMETRY_EPS||py>bounds.maxY+GEOMETRY_EPS)return false;
    }
  }
  return true;
}
