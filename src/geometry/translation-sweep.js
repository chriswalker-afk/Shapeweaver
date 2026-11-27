import {triangulate,GEOMETRY_EPS} from "./polygons.js";

/** Continuous separating-axis test for a convex piece translating along one straight segment.
 * Intersect the open time intervals in which projections overlap by positive depth.
 * Contact alone (including sliding along a shared edge) does not block the movement. */
function movingConvexOverlap(a,b,dx,dy){
  let enter=0,leave=1;
  for(const ring of [a,b])for(let i=0;i<ring.length;i++){
    const p=ring[i],q=ring[(i+1)%ring.length],ex=q[0]-p[0],ey=q[1]-p[1],len=Math.hypot(ex,ey);
    const nx=-ey/len,ny=ex/len,project=v=>nx*v[0]+ny*v[1];
    const pa=a.map(project),pb=b.map(project);
    const amin=Math.min(...pa),amax=Math.max(...pa),bmin=Math.min(...pb),bmax=Math.max(...pb);
    if(amax-amin<=GEOMETRY_EPS||bmax-bmin<=GEOMETRY_EPS)return false;
    const velocity=nx*dx+ny*dy;
    // bmin + eps < amax + velocity*t and amin + velocity*t < bmax - eps
    const lo=bmin+GEOMETRY_EPS-amax,hi=bmax-GEOMETRY_EPS-amin;
    if(Math.abs(velocity)<1e-12){if(!(lo<0&&0<hi))return false;continue;}
    const t1=lo/velocity,t2=hi/velocity;
    enter=Math.max(enter,Math.min(t1,t2));leave=Math.min(leave,Math.max(t1,t2));
    if(!(enter<leave))return false;
  }
  return enter<leave;
}
/** Triangulating simple polygons handles concave obstacles and moving objects.
 * No sampling interval, so thin walls cannot be skipped by a long translation. */
export function translationSweepOverlaps(moving,stationary,dx,dy){
  if(![dx,dy].every(Number.isFinite))throw new Error("Invalid translation vector");
  const a=triangulate(moving),b=triangulate(stationary);
  return a.some(t=>b.some(u=>movingConvexOverlap(t,u,dx,dy)));
}
