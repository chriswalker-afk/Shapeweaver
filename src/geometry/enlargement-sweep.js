import {triangulate,convexOverlap} from "./polygons.js";

/** Positive homothety about an explicit centre. Used for continuous visual interpolation. */
export function scaledVertices(vertices,centre,factor){
  if(!Number.isFinite(factor)||factor<=0||centre.length!==2||!centre.every(Number.isFinite))throw new Error("Invalid enlargement");
  const [cx,cy]=centre;
  return vertices.map(([x,y])=>[cx+factor*(x-cx),cy+factor*(y-cy)]);
}
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function convexHull(points){
  const sorted=points.map(p=>[...p]).sort((a,b)=>a[0]-b[0]||a[1]-b[1])
    .filter((p,i,all)=>i===0||p[0]!==all[i-1][0]||p[1]!==all[i-1][1]);
  const half=pts=>{const h=[];for(const p of pts){while(h.length>=2&&cross(h.at(-2),h.at(-1),p)<=0)h.pop();h.push(p);}return h;};
  const a=half(sorted),b=half([...sorted].reverse());
  return [...a.slice(0,-1),...b.slice(0,-1)];
}
/** For a convex triangle, the union of its positive homotheties with factors between
 * 1 and k is exactly the convex hull of the two endpoint triangles:
 * any convex combination of endpoint points can be written as an intermediate
 * positive factor times a convex combination of the original points.
 * Triangulating first preserves concave gaps rather than filling the whole object hull.
 * SAT tests every swept hull against the obstacle triangles; no time sampling. */
export function enlargementSweepOverlaps(moving,stationary,centre,factor){
  const triangles=triangulate(moving),obstacles=triangulate(stationary);
  return triangles.some(triangle=>{
    const hull=convexHull([...triangle,...scaledVertices(triangle,centre,factor)]);
    return obstacles.some(obstacle=>convexOverlap(hull,obstacle));
  });
}
